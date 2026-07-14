import { describe, expect, test } from "vitest";
import { generateApiKey, hashApiKey } from "./apiKey.js";

describe("api key generation", () => {
  test("plaintext is al_-prefixed and prefix is its first 11 chars", () => {
    const { plaintext, prefix } = generateApiKey();
    expect(plaintext.startsWith("al_")).toBe(true);
    expect(prefix).toBe(plaintext.slice(0, 11));
  });

  test("keyHash equals hashApiKey(plaintext) and is not the plaintext", () => {
    const { plaintext, keyHash } = generateApiKey();
    expect(keyHash).toBe(hashApiKey(plaintext));
    expect(keyHash).not.toBe(plaintext);
  });

  test("two calls produce different keys", () => {
    expect(generateApiKey().plaintext).not.toBe(generateApiKey().plaintext);
  });

  test("hashApiKey is deterministic — same input, same hash (enables lookup)", () => {
    expect(hashApiKey("al_sample")).toBe(hashApiKey("al_sample"));
  });
});
