// Response types are generated from the server's OpenAPI spec (see lib/types/api).
export type { GlobalRunListItem, QueueFacets, RunListItem, RunStatus } from "@/lib/types/api";

export type QueueSort = "newest" | "oldest";

// The scoring-queue filter state — mirrors the optional params on GET /runs.
export interface QueueParams {
  agentId?: string;
  agentName?: string;
  versionLabel?: string;
  sort: QueueSort;
  page: number;
}
