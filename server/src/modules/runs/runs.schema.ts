import { z } from "zod";

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
});

export const runIdParam = z.object({ id: z.string() });

export type IngestRunInput = z.infer<typeof ingestRunSchema>;
export type IngestAck = z.infer<typeof ingestAckSchema>;
export type RunDetail = z.infer<typeof runDetailSchema>;
