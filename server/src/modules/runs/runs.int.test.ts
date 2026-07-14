import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb } from "../../test/db.js";

type InjectResponse = Awaited<ReturnType<FastifyInstance["inject"]>>;

let app: FastifyInstance;
let prisma: typeof import("../../db/client.js")["prisma"];
let closeDb: typeof import("../../db/client.js")["closeDb"];

const AGENTS = "/api/v1/agents";
const INGEST = "/api/v1/runs";
const validAgent = {
  name: "Support Bot",
  rubric: { name: "Answer quality", criteria: [{ name: "groundedness", description: "x", weight: 1 }] },
};
const validRun = {
  versionLabel: "v1",
  input: "What is the capital of France?",
  output: "Paris.",
  context: ["doc chunk about France", { source: "wiki", score: 0.9 }],
  metadata: { model: "gpt-x", latencyMs: 120 },
};

beforeAll(async () => {
  await startTestDb();
  ({ prisma, closeDb } = await import("../../db/client.js"));
  const { buildApp } = await import("../../app.js");
  app = buildApp();
  await app.ready();
}, 120_000);

afterEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await app?.close();
  await closeDb?.();
  await stopTestDb();
});

async function authCookie(suffix: string): Promise<string> {
  const user = { email: `u${suffix}@example.com`, username: `User${suffix}`, password: "Passw0rd" };
  await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: user });
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email: user.email, password: user.password },
  });
  return res.cookies.find((c) => c.name === "token")!.value;
}

function as(token: string, method: "GET" | "POST", url: string, payload?: unknown) {
  return app.inject({ method, url, cookies: { token }, payload: payload as object });
}

// Register a user, create an agent, issue a key; return the cookie, agentId, and plaintext key.
async function setupAgent(suffix: string): Promise<{ token: string; agentId: string; key: string }> {
  const token = await authCookie(suffix);
  const agentId = (await as(token, "POST", AGENTS, validAgent)).json().id;
  const key = (await as(token, "POST", `${AGENTS}/${agentId}/keys`, { name: "prod" })).json().key;
  return { token, agentId, key };
}

function ingest(key: string | null, body: unknown): Promise<InjectResponse> {
  const headers = key ? { authorization: `Bearer ${key}` } : {};
  return app.inject({ method: "POST", url: INGEST, headers, payload: body as object });
}

describe("ingest", () => {
  test("valid key → 201, run persisted unscored, version auto-created", async () => {
    const { key } = await setupAgent("1");
    const res = await ingest(key, validRun);
    expect(res.statusCode).toBe(201);
    expect(res.json().status).toBe("unscored");
    expect(await prisma.run.count()).toBe(1);
    expect(await prisma.agentVersion.count()).toBe(1);
  });

  test("same label reuses the version; new label creates another", async () => {
    const { key } = await setupAgent("1");
    await ingest(key, validRun);
    await ingest(key, { ...validRun, input: "second" });
    expect(await prisma.agentVersion.count()).toBe(1);
    await ingest(key, { ...validRun, versionLabel: "v2" });
    expect(await prisma.agentVersion.count()).toBe(2);
    expect(await prisma.run.count()).toBe(3);
  });

  test("missing key → 401; garbage key → 401; revoked key → 401", async () => {
    const { token, agentId, key } = await setupAgent("1");
    expect((await ingest(null, validRun)).statusCode).toBe(401);
    expect((await ingest("al_notreal", validRun)).statusCode).toBe(401);

    const kid = (await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json()[0].id;
    await app.inject({ method: "DELETE", url: `${AGENTS}/${agentId}/keys/${kid}`, cookies: { token } });
    expect((await ingest(key, validRun)).statusCode).toBe(401);
  });

  test("missing required fields → 400", async () => {
    const { key } = await setupAgent("1");
    expect((await ingest(key, { versionLabel: "v1", input: "x" })).statusCode).toBe(400);
  });

  test("arbitrary JSON context/metadata round-trips on detail read", async () => {
    const { token, key } = await setupAgent("1");
    const runId = (await ingest(key, validRun)).json().id;
    const detail = (await as(token, "GET", `/api/v1/runs/${runId}`)).json();
    expect(detail.context).toEqual(validRun.context);
    expect(detail.metadata).toEqual(validRun.metadata);
    expect(detail.versionLabel).toBe("v1");
  });
});

describe("run detail", () => {
  test("owner → 200; other user → 404; unauthenticated → 401", async () => {
    const { token, key } = await setupAgent("a");
    const other = await authCookie("b");
    const runId = (await ingest(key, validRun)).json().id;

    expect((await as(token, "GET", `/api/v1/runs/${runId}`)).statusCode).toBe(200);
    expect((await as(other, "GET", `/api/v1/runs/${runId}`)).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: `/api/v1/runs/${runId}` })).statusCode).toBe(401);
  });
});

describe("agent runs & versions reads", () => {
  test("list runs, filter by status, list/get versions; tenant-isolated", async () => {
    const { token, agentId, key } = await setupAgent("a");
    const other = await authCookie("b");
    await ingest(key, validRun);
    await ingest(key, { ...validRun, versionLabel: "v2" });

    const runs = (await as(token, "GET", `${AGENTS}/${agentId}/runs`)).json();
    expect(runs).toHaveLength(2);
    expect(
      (await as(token, "GET", `${AGENTS}/${agentId}/runs?status=unscored`)).json(),
    ).toHaveLength(2);
    expect((await as(token, "GET", `${AGENTS}/${agentId}/runs?status=scored`)).json()).toHaveLength(0);

    const versions = (await as(token, "GET", `${AGENTS}/${agentId}/versions`)).json();
    expect(versions).toHaveLength(2);
    expect((await as(token, "GET", `${AGENTS}/${agentId}/versions/v1`)).json().label).toBe("v1");
    expect((await as(token, "GET", `${AGENTS}/${agentId}/versions/nope`)).statusCode).toBe(404);

    // tenant isolation
    expect((await as(other, "GET", `${AGENTS}/${agentId}/runs`)).statusCode).toBe(404);
    expect((await as(other, "GET", `${AGENTS}/${agentId}/versions`)).statusCode).toBe(404);
    expect((await as(other, "GET", `${AGENTS}/${agentId}/versions/v1`)).statusCode).toBe(404);
  });
});
