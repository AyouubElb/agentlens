import { z } from "zod";

/* Mirrors server/src/modules/agents/agents.schema.ts (apiKey shapes). */

export const issueKeySchema = z.object({
  name: z.string().min(3, "At least 3 characters").max(50, "At most 50 characters"),
});

export type IssueKeyInput = z.infer<typeof issueKeySchema>;

// Response types are generated from the server's OpenAPI spec (see lib/types/api).
// CreatedApiKey carries the one-time plaintext `key`, returned only from the issue call.
export type { ApiKey, CreatedApiKey } from "@/lib/types/api";
