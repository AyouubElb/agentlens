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

type ArrayItem<T> = T extends readonly (infer U)[] ? U : never;

export type User = JSON200<"/api/v1/auth/me", "get">;

export type Agent = ArrayItem<JSON200<"/api/v1/agents/", "get">>;
export type AgentDetail = JSON201<"/api/v1/agents/", "post">;
export type Rubric = AgentDetail["rubric"];
export type Criterion = ArrayItem<Rubric["criteria"]>;

export type ApiKey = ArrayItem<JSON200<"/api/v1/agents/{id}/keys", "get">>;
export type CreatedApiKey = JSON201<"/api/v1/agents/{id}/keys", "post">;

export type RunListItem = ArrayItem<JSON200<"/api/v1/agents/{id}/runs", "get">>;
export type RunStatus = RunListItem["status"];
