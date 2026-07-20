import type { paths } from "./api-types";

/* Clean response-type aliases from the generated OpenAPI types, so features import readable names
   instead of indexing `paths[...]`. Regenerate with `npm run gen:api` when the server contract changes. */

type JSON200<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer R } } };
}
  ? R
  : never;

type JSON201<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  responses: { 201: { content: { "application/json": infer R } } };
}
  ? R
  : never;

type JSONBody<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  requestBody: { content: { "application/json": infer B } };
}
  ? B
  : never;

type ArrayItem<T> = T extends readonly (infer U)[] ? U : never;

// Every list endpoint returns this envelope; ItemOf pulls the row type back out.
export type Paginated<T> = { items: T[]; page: number; limit: number; total: number };
type ItemOf<T> = T extends { items: readonly (infer U)[] } ? U : never;

export type User = JSON200<"/api/v1/auth/me", "get">;

export type Agent = ItemOf<JSON200<"/api/v1/agents/", "get">>;
export type AgentDetail = JSON201<"/api/v1/agents/", "post">;
export type Rubric = AgentDetail["rubric"];
export type Criterion = ArrayItem<Rubric["criteria"]>;

export type ApiKey = ItemOf<JSON200<"/api/v1/agents/{id}/keys", "get">>;
export type CreatedApiKey = JSON201<"/api/v1/agents/{id}/keys", "post">;

export type RunListItem = ItemOf<JSON200<"/api/v1/agents/{id}/runs", "get">>;
export type RunStatus = RunListItem["status"];

// Cross-agent scoring queue row (carries agent identity for the "Agent" column).
export type GlobalRunListItem = ItemOf<JSON200<"/api/v1/runs/", "get">>;

// Dropdown options for the queue's filter bar.
export type QueueFacets = JSON200<"/api/v1/runs/facets", "get">;

// Evaluation page: run detail + one gradeable row per rubric criterion.
export type RunDetail = JSON200<"/api/v1/runs/{id}", "get">;
export type CriterionScore = ArrayItem<RunDetail["criteria"]>;
export type SubmitScoresBody = JSONBody<"/api/v1/runs/{id}/scores", "post">;
export type ScoredRun = JSON200<"/api/v1/runs/{id}/scores", "post">;
