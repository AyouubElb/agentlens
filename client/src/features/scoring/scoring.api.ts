import { apiClient } from "@/lib/api-client";
import type { RunListItem, RunStatus } from "./schemas";

export const scoringApi = {
  listRuns: async (agentId: string, status?: RunStatus): Promise<RunListItem[]> => {
    const { data } = await apiClient.get<RunListItem[]>(`/agents/${agentId}/runs`, {
      params: status ? { status } : undefined,
    });
    return data;
  },
};
