import { describe, expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  test("hash then verify the correct password → true", async () => {
    const hash = await hashPassword("Correct1Horse");
    expect(await verifyPassword(hash, "Correct1Horse")).toBe(true);
  });

  test("verify a wrong password → false", async () => {
    const hash = await hashPassword("Correct1Horse");
    expect(await verifyPassword(hash, "wrong-password")).toBe(false);
  });

  test("the hash is not the plaintext", async () => {
    const hash = await hashPassword("Correct1Horse");
    expect(hash).not.toContain("Correct1Horse");
  });
});
