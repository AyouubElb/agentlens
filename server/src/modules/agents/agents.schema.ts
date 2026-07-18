import { z } from "zod";

const nameSchema = z.string().min(3).max(100);

const criterionInputSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  weight: z.number().positive(),
});

export const createAgentSchema = z.object({
  name: nameSchema,
  rubric: z.object({
    name: z.string().min(3),
    criteria: z.array(criterionInputSchema).min(1),
  }),
});

export const updateAgentSchema = z.object({ name: nameSchema });

export const updateRubricSchema = z.object({ name: z.string().min(3) });

export const createCriterionSchema = criterionInputSchema;

export const updateCriterionSchema = criterionInputSchema.partial();

export const createKeySchema = z.object({ name: z.string().min(3).max(50) });

export const idParam = z.object({ id: z.string() });
export const criterionParam = z.object({ id: z.string(), cid: z.string() });
export const keyParam = z.object({ id: z.string(), kid: z.string() });
export const versionLabelParam = z.object({ id: z.string(), label: z.string() });

export const runsQuery = z.object({ status: z.enum(["unscored", "scored"]).optional() });

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

export const criterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weight: z.number(),
});

export const rubricSchema = z.object({
  id: z.string(),
  name: z.string(),
  criteria: z.array(criterionSchema),
});

export const agentDetailSchema = agentSchema.extend({ rubric: rubricSchema });

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(),
  createdAt: z.date(),
  revokedAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  status: z.enum(["active", "revoked"]),
});

// The plaintext key is shown once, only in the creation response.
export const createdKeySchema = apiKeySchema.extend({ key: z.string() });

export const versionSchema = z.object({
  id: z.string(),
  label: z.string(),
  createdAt: z.date(),
});

export const runListItemSchema = z.object({
  id: z.string(),
  versionLabel: z.string(),
  input: z.string(),
  status: z.enum(["unscored", "scored"]),
  overallScore: z.number().nullable(),
  createdAt: z.date(),
});

export const okSchema = z.object({ ok: z.boolean() });

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
export type CreateCriterionInput = z.infer<typeof createCriterionSchema>;
export type UpdateCriterionInput = z.infer<typeof updateCriterionSchema>;
export type CreateKeyInput = z.infer<typeof createKeySchema>;
export type PublicAgent = z.infer<typeof agentSchema>;
export type PublicCriterion = z.infer<typeof criterionSchema>;
export type PublicRubric = z.infer<typeof rubricSchema>;
export type PublicAgentDetail = z.infer<typeof agentDetailSchema>;
export type PublicApiKey = z.infer<typeof apiKeySchema>;
export type CreatedApiKey = z.infer<typeof createdKeySchema>;
export type RunsQuery = z.infer<typeof runsQuery>;
export type PublicVersion = z.infer<typeof versionSchema>;
export type PublicRunListItem = z.infer<typeof runListItemSchema>;
