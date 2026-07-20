import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentKeys } from "@/lib/constants/query-keys";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { agentsApi } from "./agents.api";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAgents(page: number) {
  return useQuery({
    queryKey: agentKeys.list(page),
    queryFn: () => agentsApi.list(page),
    placeholderData: keepPreviousData,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => agentsApi.get(id),
    enabled: id !== "",
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agentsApi.create,
    onSuccess: (agent) => {
      toast.success("Agent created", `${agent.name} is ready to collect runs.`);
      qc.invalidateQueries({ queryKey: agentKeys.lists() });
    },
    onError: (error) => toast.error("Couldn't create agent", message(error, "Please try again.")),
  });
}
