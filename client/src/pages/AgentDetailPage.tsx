import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/Tabs";
import { useAgent } from "@/features/agents/useAgents";
import { AgentDetailHeader } from "@/features/agents/AgentDetailHeader";
import { RubricPanel } from "@/features/agents/RubricPanel";
import { KeysPanel } from "@/features/api-keys/KeysPanel";
import { RunsPanel } from "@/features/scoring/RunsPanel";
import type { AgentDetail } from "@/features/agents/schemas";

const tabs = [
  { to: "rubric", label: "Rubric" },
  { to: "keys", label: "API keys" },
  { to: "runs", label: "Runs" },
];

export function AgentDetailPage() {
  const { id = "" } = useParams();
  const { data: agent, isPending, isError } = useAgent(id);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="mx-auto max-w-content p-8">
        <Alert>Agent not found.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content pb-8">
      <AgentDetailHeader agent={agent} />
      <div className="px-8 pt-5">
        <Tabs tabs={tabs} />
      </div>
      <div className="px-8 pt-6">
        <Outlet context={agent satisfies AgentDetail} />
      </div>
    </div>
  );
}

// Tab panels read the loaded agent from Outlet context — no duplicate fetch.
function useAgentContext() {
  return useOutletContext<AgentDetail>();
}

export function RubricTab() {
  return <RubricPanel rubric={useAgentContext().rubric} />;
}

export function KeysTab() {
  return <KeysPanel agentId={useAgentContext().id} />;
}

export function RunsTab() {
  return <RunsPanel agentId={useAgentContext().id} />;
}
