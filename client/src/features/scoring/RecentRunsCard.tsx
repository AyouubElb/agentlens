import { Link, useNavigate } from "react-router-dom";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, type Column } from "@/components/ui/Table";
import { TableCard } from "@/components/ui/TableCard";
import { formatRelativeTime } from "@/lib/format";
import type { GlobalRunListItem } from "@/lib/types/api";

// Run id / Version / Received drop below lg so tablet + narrow show Agent · Status · Score only.
const columns: Column<GlobalRunListItem>[] = [
  {
    header: "Run",
    className: "hidden w-32 lg:table-cell",
    render: (r) => <span className="font-mono text-code">{r.id}</span>,
  },
  {
    header: "Agent",
    render: (r) => (
      <span className="block max-w-[180px] truncate font-semibold text-text" title={r.agentName}>
        {r.agentName}
      </span>
    ),
  },
  {
    header: "Version",
    className: "hidden w-24 lg:table-cell",
    render: (r) => (
      <span className="rounded-sm border border-hairline bg-raised px-2 py-0.5 font-mono text-caption text-text-muted">
        {r.versionLabel}
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
  { header: "Score", className: "w-16", render: (r) => <ScoreChip score={r.overallScore} /> },
  {
    header: "Received",
    align: "right",
    className: "hidden w-28 lg:table-cell",
    render: (r) => <span className="whitespace-nowrap text-text-muted">{formatRelativeTime(r.createdAt)}</span>,
  },
];

// Below sm the table gives way to stacked cards: agent + version·time, score/status on the right.
function RunCard({ run, onClick }: { run: GlobalRunListItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-raised"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-text">{run.agentName}</div>
        <div className="mt-0.5 font-mono text-caption text-text-faint">
          {run.versionLabel} · {formatRelativeTime(run.createdAt)}
        </div>
      </div>
      {run.status === "scored" ? (
        <ScoreChip score={run.overallScore} />
      ) : (
        <StatusBadge tone="muted" label="Unscored" />
      )}
    </button>
  );
}

export function RecentRunsCard({ runs }: { runs: GlobalRunListItem[] }) {
  const navigate = useNavigate();
  return (
    <TableCard
      title="Recent runs"
      action={
        <Link to="/scoring" className="text-label font-semibold text-accent hover:text-accent-hover">
          View all
        </Link>
      }
    >
      <div className="hidden sm:block">
        <Table
          columns={columns}
          rows={runs}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/runs/${r.id}`)}
          empty="No runs yet. Once an agent pushes runs, they'll appear here."
        />
      </div>

      <div className="sm:hidden">
        {runs.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-text-muted">
            No runs yet. Once an agent pushes runs, they'll appear here.
          </div>
        ) : (
          runs.map((r) => <RunCard key={r.id} run={r} onClick={() => navigate(`/runs/${r.id}`)} />)
        )}
      </div>
    </TableCard>
  );
}
