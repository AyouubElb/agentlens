import { useQuery } from "@tanstack/react-query";
import { runKeys } from "@/lib/constants/query-keys";
import { scoringApi } from "./scoring.api";
import type { RunStatus } from "./schemas";

export function useRuns(agentId: string, status?: RunStatus) {
  return useQuery({
    queryKey: runKeys.list(agentId, status),
    queryFn: () => scoringApi.listRuns(agentId, status),
  });
}
