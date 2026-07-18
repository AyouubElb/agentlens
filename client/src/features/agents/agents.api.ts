import { apiClient } from "@/lib/api-client";
import type { Agent, AgentDetail, CreateAgentInput } from "./schemas";

export const agentsApi = {
  list: async (): Promise<Agent[]> => {
    const { data } = await apiClient.get<Agent[]>("/agents");
    return data;
  },

  get: async (id: string): Promise<AgentDetail> => {
    const { data } = await apiClient.get<AgentDetail>(`/agents/${id}`);
    return data;
  },

  create: async (body: CreateAgentInput): Promise<AgentDetail> => {
    const { data } = await apiClient.post<AgentDetail>("/agents", body);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/agents/${id}`);
  },
};
