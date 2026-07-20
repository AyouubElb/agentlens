import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/lib/types/api";
import type { ApiKey, CreatedApiKey, IssueKeyInput } from "./schemas";

export const apiKeysApi = {
  list: async (agentId: string, page: number): Promise<Paginated<ApiKey>> => {
    const { data } = await apiClient.get<Paginated<ApiKey>>(`/agents/${agentId}/keys`, {
      params: { page },
    });
    return data;
  },

  issue: async (agentId: string, body: IssueKeyInput): Promise<CreatedApiKey> => {
    const { data } = await apiClient.post<CreatedApiKey>(`/agents/${agentId}/keys`, body);
    return data;
  },

  revoke: async (agentId: string, keyId: string): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}/keys/${keyId}`);
  },
};
