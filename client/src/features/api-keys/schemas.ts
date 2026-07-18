import { z } from "zod";

/* Mirrors server/src/modules/agents/agents.schema.ts (apiKey shapes). */

export const issueKeySchema = z.object({
  name: z.string().min(3, "At least 3 characters").max(50, "At most 50 characters"),
});

export type IssueKeyInput = z.infer<typeof issueKeySchema>;

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  status: "active" | "revoked";
}

// The plaintext key is returned once, only from the issue call.
export interface CreatedApiKey extends ApiKey {
  key: string;
}
