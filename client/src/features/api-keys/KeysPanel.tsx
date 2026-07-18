import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, type Column } from "@/components/ui/Table";
import { TableCard } from "@/components/ui/TableCard";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { useApiKeys, useRevokeKey } from "./useApiKeys";
import { IssueKeyModal } from "./IssueKeyModal";
import type { ApiKey } from "./schemas";

export function KeysPanel({ agentId }: { agentId: string }) {
  const { data: keys, isPending, isError } = useApiKeys(agentId);
  const revoke = useRevokeKey(agentId);
  const [issueOpen, setIssueOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const columns: Column<ApiKey>[] = [
    { header: "Label", className: "w-[22%]", render: (k) => <span className="font-semibold">{k.name}</span> },
    { header: "Key", render: (k) => <span className="font-mono text-code text-text-muted">{k.prefix}…</span> },
    {
      header: "Status",
      render: (k) =>
        k.status === "active" ? (
          <StatusBadge tone="success" label="Active" />
        ) : (
          <StatusBadge tone="muted" label="Revoked" />
        ),
    },
    {
      header: "Last used",
      render: (k) => (
        <span className="text-text-muted">{k.lastUsedAt ? formatRelativeTime(k.lastUsedAt) : "never"}</span>
      ),
    },
    { header: "Created", render: (k) => <span className="text-text-muted">{formatDate(k.createdAt)}</span> },
    {
      header: "",
      align: "right",
      className: "w-40",
      render: (k) =>
        k.status !== "active" ? null : confirmId === k.id ? (
          <span className="inline-flex gap-2">
            <Button
              variant="danger"
              size="sm"
              loading={revoke.isPending}
              onClick={() => revoke.mutate(k.id, { onSettled: () => setConfirmId(null) })}
            >
              Confirm
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setConfirmId(k.id)}>
            Revoke
          </Button>
        ),
    },
  ];

  return (
    <>
      <TableCard
        title="API keys"
        subtitle="Keys authorize pushing runs to this agent."
        action={
          <Button onClick={() => setIssueOpen(true)}>
            <Plus size={16} />
            Issue key
          </Button>
        }
      >
        {isError ? (
          <div className="p-5">
            <Alert>Couldn't load API keys.</Alert>
          </div>
        ) : isPending ? (
          <div className="flex flex-col gap-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8" delay={i * 0.08} />
            ))}
          </div>
        ) : (
          <Table
            columns={columns}
            rows={keys}
            rowKey={(k) => k.id}
            empty="No API keys yet. Issue one to start pushing runs."
          />
        )}
      </TableCard>

      <IssueKeyModal agentId={agentId} open={issueOpen} onClose={() => setIssueOpen(false)} />
    </>
  );
}
