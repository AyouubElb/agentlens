import { z } from "zod";

/* Mirrors server/src/modules/agents/agents.schema.ts; the server re-validates. */

const criterionInputSchema = z.object({
  name: z.string().min(3, "At least 3 characters"),
  description: z.string(),
  weight: z.coerce.number().positive("Must be greater than 0"),
});

export const createAgentSchema = z.object({
  name: z.string().min(3, "At least 3 characters").max(100, "At most 100 characters"),
  rubric: z.object({
    name: z.string().min(3, "At least 3 characters"),
    criteria: z.array(criterionInputSchema).min(1, "At least one criterion is required"),
  }),
});

// z.coerce splits the types: fields hold strings (input), the api sends numbers (output).
export type CreateAgentFormValues = z.input<typeof createAgentSchema>;
export type CreateAgentInput = z.output<typeof createAgentSchema>;

// Response types are generated from the server's OpenAPI spec (see lib/types/api).
export type { Agent, Criterion, Rubric, AgentDetail } from "@/lib/types/api";
