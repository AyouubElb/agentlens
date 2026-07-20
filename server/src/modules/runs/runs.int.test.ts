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

    const kid = (await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json().items[0].id;
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

  test("ingest stamps the key's lastUsedAt (null until first use)", async () => {
    const { token, agentId, key } = await setupAgent("1");
    expect((await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json().items[0].lastUsedAt).toBeNull();
    await ingest(key, validRun);
    expect((await as(token, "GET", `${AGENTS}/${agentId}/keys`)).json().items[0].lastUsedAt).not.toBeNull();
  });

  test("run list includes the run input", async () => {
    const { token, agentId, key } = await setupAgent("1");
    await ingest(key, validRun);
    const list = (await as(token, "GET", `${AGENTS}/${agentId}/runs`)).json();
    expect(list.items[0].input).toBe(validRun.input);
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

// A 2-criterion agent (weights 2 and 1) to exercise real weighting.
const scoringAgent = {
  name: "Scored Bot",
  rubric: {
    name: "Quality",
    criteria: [
      { name: "groundedness", description: "supported by context", weight: 2 },
      { name: "relevance", description: "answers the question", weight: 1 },
    ],
  },
};

async function setupScoringRun(
  suffix: string,
): Promise<{ token: string; agentId: string; runId: string; cids: string[] }> {
  const token = await authCookie(suffix);
  const agentId = (await as(token, "POST", AGENTS, scoringAgent)).json().id;
  const key = (await as(token, "POST", `${AGENTS}/${agentId}/keys`, { name: "prod" })).json().key;
  const runId = (await ingest(key, validRun)).json().id;
  const detail = (await as(token, "GET", `/api/v1/runs/${runId}`)).json();
  const cids = detail.criteria.map((c: { id: string }) => c.id);
  return { token, agentId, runId, cids };
}

describe("scoring", () => {
  test("score all criteria → 200, run scored, weighted overall correct", async () => {
    const { token, runId, cids } = await setupScoringRun("1");
    const res = await as(token, "POST", `/api/v1/runs/${runId}/scores`, {
      scores: [
        { criterionId: cids[0], value: 4 },
        { criterionId: cids[1], value: 5 },
      ],
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("scored");
    expect(res.json().overallScore).toBeCloseTo(13 / 3); // (4*2 + 5*1)/3

    const detail = (await as(token, "GET", `/api/v1/runs/${runId}`)).json();
    expect(detail.status).toBe("scored");
    expect(detail.overallScore).toBeCloseTo(13 / 3);
    const scored = detail.criteria.find((c: { id: string }) => c.id === cids[0]);
    expect(scored.score.value).toBe(4);
  });

  test("missing a criterion / unknown id / duplicate → 400, run stays unscored", async () => {
    const { token, runId, cids } = await setupScoringRun("1");
    const partial = await as(token, "POST", `/api/v1/runs/${runId}/scores`, {
      scores: [{ criterionId: cids[0], value: 4 }],
    });
    expect(partial.statusCode).toBe(400);

    const unknown = await as(token, "POST", `/api/v1/runs/${runId}/scores`, {
      scores: [
        { criterionId: cids[0], value: 4 },
        { criterionId: "nope", value: 5 },
      ],
    });
    expect(unknown.statusCode).toBe(400);

    const dup = await as(token, "POST", `/api/v1/runs/${runId}/scores`, {
      scores: [
        { criterionId: cids[0], value: 4 },
        { criterionId: cids[0], value: 5 },
      ],
    });
    expect(dup.statusCode).toBe(400);

    expect((await as(token, "GET", `/api/v1/runs/${runId}`)).json().status).toBe("unscored");
  });

  test("value out of range → 400", async () => {
    const { token, runId, cids } = await setupScoringRun("1");
    const res = await as(token, "POST", `/api/v1/runs/${runId}/scores`, {
      scores: [
        { criterionId: cids[0], value: 6 },
        { criterionId: cids[1], value: 3 },
      ],
    });
    expect(res.statusCode).toBe(400);
  });

  test("re-score updates in place — overall recomputes, score rows stay == criteria count", async () => {
    const { token, runId, cids } = await setupScoringRun("1");
    const body = (v0: number, v1: number) => ({
      scores: [
        { criterionId: cids[0], value: v0 },
        { criterionId: cids[1], value: v1 },
      ],
    });
    await as(token, "POST", `/api/v1/runs/${runId}/scores`, body(4, 5));
    const second = await as(token, "POST", `/api/v1/runs/${runId}/scores`, body(2, 2));
    expect(second.json().overallScore).toBeCloseTo(2); // (2*2 + 2*1)/3
    expect(await prisma.score.count({ where: { runId } })).toBe(2);
  });

  test("tenant isolation → 404; unauthenticated → 401", async () => {
    const { runId, cids } = await setupScoringRun("a");
    const other = await authCookie("b");
    const body = { scores: [{ criterionId: cids[0], value: 4 }, { criterionId: cids[1], value: 5 }] };
    expect((await as(other, "POST", `/api/v1/runs/${runId}/scores`, body)).statusCode).toBe(404);
    expect(
      (await app.inject({ method: "POST", url: `/api/v1/runs/${runId}/scores`, payload: body })).statusCode,
    ).toBe(401);
  });
});

describe("global scoring queue (GET /api/v1/runs)", () => {
  test("aggregates the caller's runs across agents, newest-first, with agent identity", async () => {
    const token = await authCookie("a");
    const a1 = (await as(token, "POST", AGENTS, { ...validAgent, name: "Agent One" })).json().id;
    const a2 = (await as(token, "POST", AGENTS, { ...validAgent, name: "Agent Two" })).json().id;
    const k1 = (await as(token, "POST", `${AGENTS}/${a1}/keys`, { name: "prod" })).json().key;
    const k2 = (await as(token, "POST", `${AGENTS}/${a2}/keys`, { name: "prod" })).json().key;
    await ingest(k1, { ...validRun, input: "first" });
    await ingest(k2, { ...validRun, input: "second" });

    const page = (await as(token, "GET", INGEST)).json();
    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(2);
    // newest-first — "second" was ingested last
    expect(page.items[0].input).toBe("second");
    expect(page.items[0].agentName).toBe("Agent Two");
    expect(page.items[0]).toMatchObject({ agentId: a2, versionLabel: "v1", status: "unscored" });
  });

  test("tenant-isolated — only the caller's runs; unauthenticated → 401", async () => {
    const { key } = await setupAgent("a");
    await ingest(key, validRun);
    const other = await authCookie("b");

    expect((await as(other, "GET", INGEST)).json().total).toBe(0);
    expect((await app.inject({ method: "GET", url: INGEST })).statusCode).toBe(401);
  });

  test("filters by status; defaults to unscored (the queue is a worklist)", async () => {
    const { token, agentId, runId, cids } = await setupScoringRun("a");
    const key = (await as(token, "POST", `${AGENTS}/${agentId}/keys`, { name: "second-key" })).json().key;
    await ingest(key, { ...validRun, input: "still unscored" });
    await as(token, "POST", `/api/v1/runs/${runId}/scores`, {
      scores: [{ criterionId: cids[0], value: 4 }, { criterionId: cids[1], value: 5 }],
    });

    expect((await as(token, "GET", `${INGEST}?status=scored`)).json().total).toBe(1);
    expect((await as(token, "GET", `${INGEST}?status=unscored`)).json().total).toBe(1);
    // No status param → unscored only (not all 2).
    const dflt = (await as(token, "GET", INGEST)).json();
    expect(dflt.total).toBe(1);
    expect(dflt.items[0].status).toBe("unscored");
  });

  test("filters by agentId and agentName (case-insensitive contains)", async () => {
    const token = await authCookie("a");
    const a1 = (await as(token, "POST", AGENTS, { ...validAgent, name: "Support Copilot" })).json().id;
    const a2 = (await as(token, "POST", AGENTS, { ...validAgent, name: "SQL Analyst" })).json().id;
    const k1 = (await as(token, "POST", `${AGENTS}/${a1}/keys`, { name: "prod" })).json().key;
    const k2 = (await as(token, "POST", `${AGENTS}/${a2}/keys`, { name: "prod" })).json().key;
    await ingest(k1, validRun);
    await ingest(k2, validRun);

    const byId = (await as(token, "GET", `${INGEST}?agentId=${a1}`)).json();
    expect(byId.total).toBe(1);
    expect(byId.items[0].agentId).toBe(a1);

    const byName = (await as(token, "GET", `${INGEST}?agentName=sql`)).json();
    expect(byName.total).toBe(1);
    expect(byName.items[0].agentName).toBe("SQL Analyst");
  });

  test("filters by versionLabel", async () => {
    const { token, key } = await setupAgent("a");
    await ingest(key, { ...validRun, versionLabel: "v1" });
    await ingest(key, { ...validRun, versionLabel: "v2" });
    await ingest(key, { ...validRun, versionLabel: "v2" });

    expect((await as(token, "GET", `${INGEST}?versionLabel=v2`)).json().total).toBe(2);
    expect((await as(token, "GET", `${INGEST}?versionLabel=v1`)).json().total).toBe(1);
  });

  test("sort=oldest reverses the default newest-first order", async () => {
    const { token, key } = await setupAgent("a");
    for (let i = 0; i < 3; i++) await ingest(key, { ...validRun, input: `run ${i}` });

    const newest = (await as(token, "GET", INGEST)).json();
    expect(newest.items.map((r: { input: string }) => r.input)).toEqual(["run 2", "run 1", "run 0"]);

    const oldest = (await as(token, "GET", `${INGEST}?sort=oldest`)).json();
    expect(oldest.items.map((r: { input: string }) => r.input)).toEqual(["run 0", "run 1", "run 2"]);
  });

  test("paginates — page/limit slice the ordered list, total is the full count", async () => {
    const { token, key } = await setupAgent("a");
    for (let i = 0; i < 5; i++) await ingest(key, { ...validRun, input: `run ${i}` });

    const p1 = (await as(token, "GET", `${INGEST}?page=1&limit=2`)).json();
    expect(p1).toMatchObject({ page: 1, limit: 2, total: 5 });
    expect(p1.items).toHaveLength(2);
    expect(p1.items[0].input).toBe("run 4"); // newest first

    const p2 = (await as(token, "GET", `${INGEST}?page=2&limit=2`)).json();
    expect(p2.items.map((r: { input: string }) => r.input)).toEqual(["run 2", "run 1"]);

    const p3 = (await as(token, "GET", `${INGEST}?page=3&limit=2`)).json();
    expect(p3.items).toHaveLength(1);
    expect(p3.items[0].input).toBe("run 0");
  });

  test("rejects invalid page params → 400", async () => {
    const { token } = await setupAgent("a");
    expect((await as(token, "GET", `${INGEST}?page=0`)).statusCode).toBe(400);
    expect((await as(token, "GET", `${INGEST}?limit=999`)).statusCode).toBe(400);
  });
});

describe("scoring-queue facets (GET /api/v1/runs/facets)", () => {
  test("returns the caller's agents + distinct version labels; tenant-isolated", async () => {
    const token = await authCookie("a");
    const a1 = (await as(token, "POST", AGENTS, { ...validAgent, name: "Alpha" })).json().id;
    const a2 = (await as(token, "POST", AGENTS, { ...validAgent, name: "Beta" })).json().id;
    const k1 = (await as(token, "POST", `${AGENTS}/${a1}/keys`, { name: "prod" })).json().key;
    const k2 = (await as(token, "POST", `${AGENTS}/${a2}/keys`, { name: "prod" })).json().key;
    await ingest(k1, { ...validRun, versionLabel: "v1" });
    await ingest(k1, { ...validRun, versionLabel: "v2" });
    await ingest(k2, { ...validRun, versionLabel: "v2" }); // same label, different agent → distinct once

    const facets = (await as(token, "GET", `${INGEST}/facets`)).json();
    expect(facets.agents.map((a: { name: string }) => a.name)).toEqual(["Alpha", "Beta"]);
    expect(facets.versions).toEqual(["v1", "v2"]);

    // Another user sees none of it.
    const other = await authCookie("b");
    const empty = (await as(other, "GET", `${INGEST}/facets`)).json();
    expect(empty.agents).toEqual([]);
    expect(empty.versions).toEqual([]);
  });

  test("unauthenticated → 401", async () => {
    expect((await app.inject({ method: "GET", url: `${INGEST}/facets` })).statusCode).toBe(401);
  });
});

describe("agent runs & versions reads", () => {
  test("list runs, filter by status, list/get versions; tenant-isolated", async () => {
    const { token, agentId, key } = await setupAgent("a");
    const other = await authCookie("b");
    await ingest(key, validRun);
    await ingest(key, { ...validRun, versionLabel: "v2" });

    const runs = (await as(token, "GET", `${AGENTS}/${agentId}/runs`)).json();
    expect(runs.items).toHaveLength(2);
    expect(runs.total).toBe(2);
    expect(
      (await as(token, "GET", `${AGENTS}/${agentId}/runs?status=unscored`)).json().items,
    ).toHaveLength(2);
    expect(
      (await as(token, "GET", `${AGENTS}/${agentId}/runs?status=scored`)).json().items,
    ).toHaveLength(0);

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
