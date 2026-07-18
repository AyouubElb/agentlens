/* Mirrors server/src/modules/agents/agents.schema.ts (runListItemSchema). */

export type RunStatus = "unscored" | "scored";

export interface RunListItem {
  id: string;
  versionLabel: string;
  input: string;
  status: RunStatus;
  overallScore: number | null;
  createdAt: string;
}
