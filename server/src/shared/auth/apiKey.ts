import { createHash, randomBytes } from "node:crypto";

// SHA-256 (deterministic) so a key can be looked up by hash; the key's own entropy is the security.
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function generateApiKey(): { plaintext: string; prefix: string; keyHash: string } {
  const plaintext = `al_${randomBytes(32).toString("base64url")}`;
  return { plaintext, prefix: plaintext.slice(0, 11), keyHash: hashApiKey(plaintext) };
}
