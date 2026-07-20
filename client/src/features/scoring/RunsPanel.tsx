import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { Pager } from "@/components/ui/Pager";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, type Column } from "@/components/ui/Table";
import { TableCard } from "@/components/ui/TableCard";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { useRuns } from "./useRuns";
import type { RunListItem, RunStatus } from "./schemas";

const filters: { label: string; value: RunStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Unscored", value: "unscored" },
  { label: "Scored", value: "scored" },
];

const columns: Column<RunListItem>[] = [
  { header: "Run", className: "w-36", render: (r) => <span className="font-mono text-code">{r.id}</span> },
  {
    header: "Version",
    className: "w-28",
    render: (r) => (
      <span className="rounded-sm border border-hairline bg-raised px-2 py-0.5 font-mono text-caption text-text-muted">
        {r.versionLabel}
      </span>
    ),
  },
  {
    header: "Input",
    render: (r) => (
      <span className="block max-w-xs truncate text-text" title={r.input}>
        {r.input}
      </span>
    ),
  },
  {
    header: "Status",
    render: (r) =>
      r.status === "scored" ? (
        <StatusBadge tone="success" label="Scored" />
      ) : (
        <StatusBadge tone="muted" label="Unscored" />
      ),
  },
  { header: "Score", className: "w-20", render: (r) => <ScoreChip score={r.overallScore} /> },
  {
    header: "Received",
    align: "right",
    className: "w-32",
    render: (r) => <span className="whitespace-nowrap text-text-muted">{formatRelativeTime(r.createdAt)}</span>,
  },
];

export function RunsPanel({ agentId }: { agentId: string }) {
  const [status, setStatus] = useState<RunStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useRuns(agentId, status, page);
  const navigate = useNavigate();

  // Changing the filter resets to the first page — page 3 of "all" rarely maps to page 3 of "unscored".
  const changeStatus = (value: RunStatus | undefined) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <TableCard
      title="Runs"
      subtitle="Runs pushed by this agent, newest first."
      action={
        <div className="flex gap-1 rounded-md border border-hairline bg-surface p-1">
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => changeStatus(f.value)}
              className={cn(
                "rounded-sm px-3 py-1 text-label font-semibold transition-colors",
                status === f.value ? "bg-raised text-text" : "text-text-muted hover:text-text",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
    >
      {isError ? (
        <div className="p-5">
          <Alert>Couldn't load runs.</Alert>
        </div>
      ) : isPending ? (
        <div className="flex flex-col gap-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8" delay={i * 0.08} />
          ))}
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            rows={data.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/runs/${r.id}`)}
            empty="No runs yet. Once this agent pushes runs, they'll appear here."
          />
          {data.total > data.limit && (
            <div className="border-t border-hairline px-5 py-3">
              <Pager page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </TableCard>
  );
}
