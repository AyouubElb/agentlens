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
  rubric: {
    name: "Answer quality",
    criteria: [
      { name: "groundedness", description: "Answer is supported by context", weight: 2 },
      { name: "relevance", description: "Answer addresses the question", weight: 1 },
    ],
  },
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

// Register + login a fresh user; return the session cookie for authenticated requests.
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

function createAgent(token: string): Promise<InjectResponse> {
  return as(token, "POST", AGENTS, validAgent);
}

describe("agents", () => {
  test("create → 201 with rubric + criteria embedded", async () => {
    const token = await authCookie("1");
    const res = await createAgent(token);
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe(validAgent.name);
    expect(body.rubric.name).toBe(validAgent.rubric.name);
    expect(body.rubric.criteria).toHaveLength(2);
  });

  test("create with empty criteria → 400", async () => {
    const token = await authCookie("1");
    const res = await as(token, "POST", AGENTS, {
      name: "Bad Agent",
      rubric: { name: "Empty", criteria: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  test("list is scoped to the owner", async () => {
    const a = await authCookie("a");
    const b = await authCookie("b");
    await createAgent(a);
    expect((await as(a, "GET", AGENTS)).json()).toHaveLength(1);
    expect((await as(b, "GET", AGENTS)).json()).toHaveLength(0);
  });

  test("get detail returns agent + rubric + criteria", async () => {
    const token = await authCookie("1");
    const id = (await createAgent(token)).json().id;
    const res = await as(token, "GET", `${AGENTS}/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.json().rubric.criteria).toHaveLength(2);
  });

  test("rename updates the name", async () => {
    const token = await authCookie("1");
    const id = (await createAgent(token)).json().id;
    const res = await as(token, "PATCH", `${AGENTS}/${id}`, { name: "Renamed Bot" });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Renamed Bot");
  });

  test("delete cascades rubric + criteria", async () => {
    const token = await authCookie("1");
    const id = (await createAgent(token)).json().id;
    expect((await as(token, "DELETE", `${AGENTS}/${id}`)).statusCode).toBe(200);
    expect((await as(token, "GET", `${AGENTS}/${id}`)).statusCode).toBe(404);
    expect(await prisma.rubric.count()).toBe(0);
    expect(await prisma.criterion.count()).toBe(0);
  });

  test("criterion add / edit / delete", async () => {
    const token = await authCookie("1");
    const id = (await createAgent(token)).json().id;

    const added = await as(token, "POST", `${AGENTS}/${id}/rubric/criteria`, {
      name: "conciseness",
      description: "No filler",
      weight: 1,
    });
    expect(added.statusCode).toBe(201);
    const cid = added.json().id;

    const edited = await as(token, "PATCH", `${AGENTS}/${id}/rubric/criteria/${cid}`, { weight: 3 });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().weight).toBe(3);

    expect(
      (await as(token, "DELETE", `${AGENTS}/${id}/rubric/criteria/${cid}`)).statusCode,
    ).toBe(200);
    expect((await as(token, "GET", `${AGENTS}/${id}/rubric`)).json().criteria).toHaveLength(2);
  });

  test("tenant isolation → 404 on another user's agent, rubric, and criterion", async () => {
    const a = await authCookie("a");
    const b = await authCookie("b");
    const created = (await createAgent(a)).json();
    const id = created.id;
    const cid = created.rubric.criteria[0].id;

    expect((await as(b, "GET", `${AGENTS}/${id}`)).statusCode).toBe(404);
    expect((await as(b, "PATCH", `${AGENTS}/${id}`, { name: "Hijacked" })).statusCode).toBe(404);
    expect((await as(b, "DELETE", `${AGENTS}/${id}`)).statusCode).toBe(404);
    expect((await as(b, "GET", `${AGENTS}/${id}/rubric`)).statusCode).toBe(404);
    expect((await as(b, "PATCH", `${AGENTS}/${id}/rubric`, { name: "Moved" })).statusCode).toBe(404);
    expect(
      (
        await as(b, "POST", `${AGENTS}/${id}/rubric/criteria`, {
          name: "sneaky",
          description: "x",
          weight: 1,
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (await as(b, "PATCH", `${AGENTS}/${id}/rubric/criteria/${cid}`, { weight: 9 })).statusCode,
    ).toBe(404);
    expect(
      (await as(b, "DELETE", `${AGENTS}/${id}/rubric/criteria/${cid}`)).statusCode,
    ).toBe(404);

    // A's data is untouched by B's attempts.
    expect((await as(a, "GET", `${AGENTS}/${id}`)).statusCode).toBe(200);
  });

  test("unauthenticated → 401", async () => {
    expect((await app.inject({ method: "GET", url: AGENTS })).statusCode).toBe(401);
  });
});
