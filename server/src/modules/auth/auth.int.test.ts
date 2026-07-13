import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb } from "../../test/db.js";

type InjectResponse = Awaited<ReturnType<FastifyInstance["inject"]>>;
type ResCookie = InjectResponse["cookies"][number];

function findCookie(res: InjectResponse, name: string): ResCookie | undefined {
  return res.cookies.find((c: ResCookie) => c.name === name);
}

let app: FastifyInstance;
let prisma: typeof import("../../db/client.js")["prisma"];
let closeDb: typeof import("../../db/client.js")["closeDb"];

const REGISTER = "/api/v1/auth/register";
const LOGIN = "/api/v1/auth/login";
const validUser = { email: "user@example.com", username: "User", password: "Passw0rd" };

// Import app + prisma only after DATABASE_URL points at the container (they bind env at load).
beforeAll(async () => {
  await startTestDb();
  ({ prisma, closeDb } = await import("../../db/client.js"));
  ({ app } = await buildReadyApp());
}, 120_000);

afterEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await app?.close();
  await closeDb?.();
  await stopTestDb();
});

async function buildReadyApp() {
  const { buildApp } = await import("../../app.js");
  const instance = buildApp();
  await instance.ready();
  return { app: instance };
}

function register(body: unknown) {
  return app.inject({ method: "POST", url: REGISTER, payload: body as object });
}
function login(body: unknown) {
  return app.inject({ method: "POST", url: LOGIN, payload: body as object });
}

describe("auth", () => {
  test("register → 201, persists user, never returns passwordHash", async () => {
    const res = await register(validUser);
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.email).toBe(validUser.email);
    expect(body).not.toHaveProperty("passwordHash");
    expect(await prisma.user.findUnique({ where: { email: validUser.email } })).not.toBeNull();
  });

  test("duplicate email → 409", async () => {
    await register(validUser);
    expect((await register(validUser)).statusCode).toBe(409);
  });

  test("weak password → 400", async () => {
    const res = await register({ ...validUser, password: "weak" });
    expect(res.statusCode).toBe(400);
  });

  test("login with correct credentials → 200 + sets token cookie", async () => {
    await register(validUser);
    const res = await login({ email: validUser.email, password: validUser.password });
    expect(res.statusCode).toBe(200);
    expect(findCookie(res, "token")?.value).toBeTruthy();
  });

  test("wrong password and unknown email → same generic 401 (no enumeration)", async () => {
    await register(validUser);
    const wrong = await login({ email: validUser.email, password: "WrongPass9" });
    const unknown = await login({ email: "nobody@example.com", password: "WrongPass9" });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json().message).toBe(unknown.json().message);
  });

  test("/me with cookie → 200; without → 401", async () => {
    await register(validUser);
    const loginRes = await login({ email: validUser.email, password: validUser.password });
    const cookie = findCookie(loginRes, "token")!;

    const withCookie = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      cookies: { token: cookie.value },
    });
    expect(withCookie.statusCode).toBe(200);
    expect(withCookie.json().email).toBe(validUser.email);

    const without = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(without.statusCode).toBe(401);
  });

  test("logout → 200 clears the token cookie", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/logout" });
    expect(res.statusCode).toBe(200);
    expect(findCookie(res, "token")?.value).toBe("");
  });
});
