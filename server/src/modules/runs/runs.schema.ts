import { z } from "zod";
import { pageQuery, paginated } from "../../shared/pagination/pagination.js";

// context/metadata are opaque JSON — AgentLens stores and displays them, never interprets them.
export const ingestRunSchema = z.object({
  versionLabel: z.string().min(1),
  input: z.string(),
  output: z.string(),
  context: z.json().optional(),
  metadata: z.json().optional(),
});

const statusSchema = z.enum(["unscored", "scored"]);

export const ingestAckSchema = z.object({
  id: z.string(),
  status: statusSchema,
  createdAt: z.date(),
});

// A gradeable row on the evaluation page: the criterion + its current score (null if unscored).
export const criterionScoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weight: z.number(),
  score: z
    .object({ value: z.number(), justification: z.string().nullable() })
    .nullable(),
});

export const runDetailSchema = z.object({
  id: z.string(),
  versionLabel: z.string(),
  input: z.string(),
  output: z.string(),
  context: z.json().nullable(),
  metadata: z.json().nullable(),
  status: statusSchema,
  overallScore: z.number().nullable(),
  createdAt: z.date(),
  criteria: z.array(criterionScoreSchema),
});

export const scoreInputSchema = z.object({
  criterionId: z.string(),
  value: z.number().int().min(1).max(5),
  justification: z.string().optional(),
});

export const submitScoresSchema = z.object({
  scores: z.array(scoreInputSchema).min(1),
});

export const scoredRunSchema = z.object({
  id: z.string(),
  status: statusSchema,
  overallScore: z.number(),
});

export const runIdParam = z.object({ id: z.string() });

// The cross-agent scoring queue: a run list item carrying its agent's identity for the "Agent" column.
export const globalRunListItemSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  versionLabel: z.string(),
  input: z.string(),
  status: statusSchema,
  overallScore: z.number().nullable(),
  createdAt: z.date(),
});

// The queue is an unscored worklist by default; callers may still request scored explicitly.
export const globalRunsQuery = pageQuery.extend({
  status: statusSchema.optional(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  versionLabel: z.string().optional(),
  sort: z.enum(["oldest", "newest"]).default("newest"),
});
export const globalRunPageSchema = paginated(globalRunListItemSchema);

// Dropdown options for the scoring-queue filter bar.
export const queueFacetsSchema = z.object({
  agents: z.array(z.object({ id: z.string(), name: z.string() })),
  versions: z.array(z.string()),
});

export type IngestRunInput = z.infer<typeof ingestRunSchema>;
export type IngestAck = z.infer<typeof ingestAckSchema>;
export type RunDetail = z.infer<typeof runDetailSchema>;
export type SubmitScoresInput = z.infer<typeof submitScoresSchema>;
export type ScoredRun = z.infer<typeof scoredRunSchema>;
export type GlobalRunsQuery = z.infer<typeof globalRunsQuery>;
export type GlobalRunListItem = z.infer<typeof globalRunListItemSchema>;
export type QueueFacets = z.infer<typeof queueFacetsSchema>;
