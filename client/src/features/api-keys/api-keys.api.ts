import { apiClient } from "@/lib/api-client";
import type { ApiKey, CreatedApiKey, IssueKeyInput } from "./schemas";

export const apiKeysApi = {
  list: async (agentId: string): Promise<ApiKey[]> => {
    const { data } = await apiClient.get<ApiKey[]>(`/agents/${agentId}/keys`);
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
