import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pager } from "@/components/ui/Pager";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { useAgents } from "@/features/agents/useAgents";
import { AgentCard } from "@/features/agents/AgentCard";
import { AgentsEmptyState } from "@/features/agents/AgentsEmptyState";
import { CreateAgentForm } from "@/features/agents/CreateAgentForm";

function countLabel(n: number) {
  if (n === 0) return "No agents yet.";
  return `${n} agent${n === 1 ? "" : "s"} collecting runs.`;
}

const grid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

export function AgentsPage() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useAgents(page);
  const [createOpen, setCreateOpen] = useState(false);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  const agents = data?.items;
  const isEmpty = data?.total === 0;

  return (
    <div className="mx-auto flex min-h-full max-w-content flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">Agents</h1>
          <p className="mt-1 text-body text-text-muted">
            {isPending ? "Loading…" : countLabel(data?.total ?? 0)}
          </p>
        </div>
        {!isEmpty && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New agent
          </Button>
        )}
      </div>

      {isError ? (
        <Alert>Couldn't load agents. Refresh to try again.</Alert>
      ) : isPending ? (
        <div className={grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[168px] rounded-md" delay={i * 0.08} />
          ))}
        </div>
      ) : isEmpty ? (
        <AgentsEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <>
          <div className={grid}>
            {agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
          {data && <Pager page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />}
        </>
      )}

      <Modal open={createOpen} onClose={closeCreate} title="New agent">
        <CreateAgentForm onCreated={closeCreate} onCancel={closeCreate} />
      </Modal>
    </div>
  );
}
