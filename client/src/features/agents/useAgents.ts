import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentKeys } from "@/lib/constants/query-keys";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { agentsApi } from "./agents.api";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: agentsApi.list,
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
