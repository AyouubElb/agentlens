import { z } from "zod";

// Response types are generated from the server's OpenAPI spec (see lib/types/api).
export type {
  CriterionScore,
  GlobalRunListItem,
  QueueFacets,
  RunDetail,
  RunListItem,
  RunStatus,
  ScoredRun,
  SubmitScoresBody,
} from "@/lib/types/api";

export type QueueSort = "newest" | "oldest";

// The scoring-queue filter state — mirrors the optional params on GET /runs.
export interface QueueParams {
  agentId?: string;
  agentName?: string;
  versionLabel?: string;
  sort: QueueSort;
  page: number;
}

/* Grading form — mirrors POST /runs/:id/scores; the server re-validates and owns the rollup.
   value is null until the reviewer picks a score, which gates submit. */
const gradeSchema = z.object({
  criterionId: z.string(),
  weight: z.number(),
  value: z.number().int().min(1).max(5).nullable(),
  justification: z.string(),
});

export const gradingSchema = z.object({ scores: z.array(gradeSchema) });

export type GradeValue = z.infer<typeof gradeSchema>;
export type GradingFormValues = z.infer<typeof gradingSchema>;
