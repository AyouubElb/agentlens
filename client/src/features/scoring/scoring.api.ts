import { apiClient } from "@/lib/api-client";
import type { GlobalRunListItem, Paginated } from "@/lib/types/api";
import type {
  QueueFacets,
  QueueParams,
  RunDetail,
  RunListItem,
  RunStatus,
  ScoredRun,
  SubmitScoresBody,
} from "./schemas";

export const scoringApi = {
  listRuns: async (
    agentId: string,
    status: RunStatus | undefined,
    page: number,
  ): Promise<Paginated<RunListItem>> => {
    const { data } = await apiClient.get<Paginated<RunListItem>>(`/agents/${agentId}/runs`, {
      params: { page, ...(status ? { status } : {}) },
    });
    return data;
  },

  // The cross-agent scoring queue (unscored by server default). Empty filters are omitted.
  listQueue: async ({
    agentId,
    agentName,
    versionLabel,
    sort,
    page,
  }: QueueParams): Promise<Paginated<GlobalRunListItem>> => {
    const { data } = await apiClient.get<Paginated<GlobalRunListItem>>("/runs", {
      params: {
        page,
        sort,
        ...(agentId ? { agentId } : {}),
        ...(agentName ? { agentName } : {}),
        ...(versionLabel ? { versionLabel } : {}),
      },
    });
    return data;
  },

  getFacets: async (): Promise<QueueFacets> => {
    const { data } = await apiClient.get<QueueFacets>("/runs/facets");
    return data;
  },

  getRun: async (id: string): Promise<RunDetail> => {
    const { data } = await apiClient.get<RunDetail>(`/runs/${id}`);
    return data;
  },

  submitScores: async (id: string, body: SubmitScoresBody): Promise<ScoredRun> => {
    const { data } = await apiClient.post<ScoredRun>(`/runs/${id}/scores`, body);
    return data;
  },
};
