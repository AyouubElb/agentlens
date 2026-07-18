import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb } from "../../test/db.js";

type InjectResponse = Awaited<ReturnType<FastifyInstance["inject"]>>;

let app: FastifyInstance;
let prisma: typeof import("../../db/client.js")["prisma"];
let closeDb: typeof import("../../db/client.js")["closeDb"];

const AGENTS = "/api/v1/agents";
const validAgent = {
  name: "Support Bot",
  rubric: { name: "Answer quality", criteria: [{ name: "groundedness", description: "x", weight: 1 }] },
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

function as(
  token: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  payload?: unknown,
) {
  return app.inject({ method, url, cookies: { token }, payload: payload as object });
}

async function newAgent(token: string): Promise<string> {
  return (await as(token, "POST", AGENTS, validAgent)).json().id;
}

function issueKey(token: string, agentId: string, name = "prod"): Promise<InjectResponse> {
  return as(token, "POST", `${AGENTS}/${agentId}/keys`, { name });
}

describe("api keys", () => {
  test("issue → 201 with one-time plaintext key, prefix, active status", async () => {
    const token = await authCookie("1");
    const agentId = await newAgent(token);
    const res = await issueKey(token, agentId);
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.key.startsWith("al_")).toBe(true);
    expect(body.prefix).toBe(body.key.slice(0, 11));
    expect(body.status).toBe("active");
    expect(body.revokedAt).toBeNull();
    expect(body.lastUsedAt).toBeNull();
  });

  test("list never leaks plaintext or keyHash", async () => {
    const token = await authCookie("1");
    const agentId = await newAgent(token);
    await issueKey(token, agentId);
    const item = (await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json()[0];
    expect(item).not.toHaveProperty("key");
    expect(item).not.toHaveProperty("keyHash");
  });

  test("multiple active keys coexist, newest-first", async () => {
    const token = await authCookie("1");
    const agentId = await newAgent(token);
    await issueKey(token, agentId, "one");
    await issueKey(token, agentId, "two");
    await issueKey(token, agentId, "three");
    const list = (await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json();
    expect(list).toHaveLength(3);
    expect(list.every((k: { status: string }) => k.status === "active")).toBe(true);
    expect(list[0].name).toBe("three");
  });

  test("revoke → 200; key then shows revoked status + revokedAt", async () => {
    const token = await authCookie("1");
    const agentId = await newAgent(token);
    const kid = (await issueKey(token, agentId)).json().id;
    expect((await as(token, "DELETE", `${AGENTS}/${agentId}/keys/${kid}`)).statusCode).toBe(200);
    const item = (await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json()[0];
    expect(item.status).toBe("revoked");
    expect(item.revokedAt).not.toBeNull();
  });

  test("revoking twice → 404 the second time", async () => {
    const token = await authCookie("1");
    const agentId = await newAgent(token);
    const kid = (await issueKey(token, agentId)).json().id;
    expect((await as(token, "DELETE", `${AGENTS}/${agentId}/keys/${kid}`)).statusCode).toBe(200);
    expect((await as(token, "DELETE", `${AGENTS}/${agentId}/keys/${kid}`)).statusCode).toBe(404);
  });

  test("tenant isolation → 404 on another user's agent keys", async () => {
    const a = await authCookie("a");
    const b = await authCookie("b");
    const agentId = await newAgent(a);
    const kid = (await issueKey(a, agentId)).json().id;

    expect((await issueKey(b, agentId)).statusCode).toBe(404);
    expect((await as(b, "GET", `${AGENTS}/${agentId}/keys`)).statusCode).toBe(404);
    expect((await as(b, "DELETE", `${AGENTS}/${agentId}/keys/${kid}`)).statusCode).toBe(404);

    // A's key is untouched by B's attempts.
    expect((await as(a, "GET", `${AGENTS}/${agentId}/keys`)).json()[0].status).toBe("active");
  });

  test("unauthenticated → 401", async () => {
    const token = await authCookie("1");
    const agentId = await newAgent(token);
    expect((await app.inject({ method: "GET", url: `${AGENTS}/${agentId}/keys` })).statusCode).toBe(401);
  });
});
