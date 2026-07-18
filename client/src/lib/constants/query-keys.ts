export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const agentKeys = {
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: () => [...agentKeys.lists()] as const,
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

export const keyKeys = {
  all: ["api-keys"] as const,
  list: (agentId: string) => [...keyKeys.all, "list", agentId] as const,
};

export const runKeys = {
  all: ["runs"] as const,
  list: (agentId: string, status?: string) =>
    [...runKeys.all, "list", agentId, status ?? "all"] as const,
};
