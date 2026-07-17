import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, passwordRules } from "./schemas";

describe("registerSchema", () => {
  const valid = { email: "a@b.co", username: "ayoub", password: "Sup3rPass" };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["short", "Ab3"],
    ["no uppercase", "sup3rpass"],
    ["no lowercase", "SUP3RPASS"],
    ["no number", "SuperPass"],
  ])("rejects password: %s", (_label, password) => {
    expect(registerSchema.safeParse({ ...valid, password }).success).toBe(false);
  });

  it("rejects a bad email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("rejects an over-long username", () => {
    expect(registerSchema.safeParse({ ...valid, username: "x".repeat(51) }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("passwordRules", () => {
  it("all rules pass for a compliant password", () => {
    expect(passwordRules.every((r) => r.test("Sup3rPass"))).toBe(true);
  });

  it("stays in sync with the schema — a value the rules accept, the schema accepts", () => {
    const ok = "Abcd1234";
    expect(passwordRules.every((r) => r.test(ok))).toBe(true);
    expect(
      registerSchema.safeParse({ email: "a@b.co", username: "u", password: ok }).success,
    ).toBe(true);
  });
});
