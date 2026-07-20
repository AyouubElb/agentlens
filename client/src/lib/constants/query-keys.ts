export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const agentKeys = {
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: (page: number) => [...agentKeys.lists(), page] as const,
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

export const keyKeys = {
  all: ["api-keys"] as const,
  lists: (agentId: string) => [...keyKeys.all, "list", agentId] as const,
  list: (agentId: string, page: number) => [...keyKeys.lists(agentId), page] as const,
};

export const runKeys = {
  all: ["runs"] as const,
  // Per-agent runs (agent-detail Runs tab).
  lists: (agentId: string) => [...runKeys.all, "list", agentId] as const,
  list: (agentId: string, status: string | undefined, page: number) =>
    [...runKeys.lists(agentId), status ?? "all", page] as const,
  // Cross-agent scoring queue (params is the filter object; serialized into the key).
  queue: (params: object) => [...runKeys.all, "queue", params] as const,
  facets: () => [...runKeys.all, "facets"] as const,
  detail: (id: string) => [...runKeys.all, "detail", id] as const,
};
