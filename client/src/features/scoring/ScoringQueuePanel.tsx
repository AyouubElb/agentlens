import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { Pager } from "@/components/ui/Pager";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { TableCard } from "@/components/ui/TableCard";
import { cn } from "@/lib/cn";
import { formatWaiting, isStale } from "@/lib/format";
import { useQueue, useQueueFacets } from "./useRuns";
import type { GlobalRunListItem, QueueParams, QueueSort } from "./schemas";

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const columns: Column<GlobalRunListItem>[] = [
  { header: "Agent", className: "w-40", render: (r) => <span className="font-semibold">{r.agentName}</span> },
  { header: "Run", className: "w-32", render: (r) => <span className="font-mono text-code text-text-muted">{r.id}</span> },
  {
    header: "Version",
    className: "w-24",
    render: (r) => (
      <span className="rounded-sm border border-hairline bg-raised px-2 py-0.5 font-mono text-caption text-text-muted">
        {r.versionLabel}
      </span>
    ),
  },
  {
    header: "Input",
    render: (r) => (
      <span className="block max-w-md truncate text-text" title={r.input}>
        {r.input}
      </span>
    ),
  },
  {
    header: "Waiting",
    className: "w-24",
    render: (r) => (
      <span className={cn("whitespace-nowrap", isStale(r.createdAt) ? "text-warning-text" : "text-text-muted")}>
        {formatWaiting(r.createdAt)}
      </span>
    ),
  },
  {
    header: "",
    align: "right",
    className: "w-24",
    render: () => (
      <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
        Score
        <ArrowRight size={14} />
      </span>
    ),
  },
];

export function ScoringQueuePanel() {
  const [agentId, setAgentId] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [sort, setSort] = useState<QueueSort>("newest");
  const [search, setSearch] = useState(""); // immediate input value
  const [agentName, setAgentName] = useState(""); // debounced query value
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Debounce the agent-name search so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setAgentName(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: QueueParams = { agentId, agentName, versionLabel, sort, page };
  const { data, isPending, isError } = useQueue(params);
  const { data: facets } = useQueueFacets();

  const agentOptions = useMemo(
    () => [{ value: "", label: "All agents" }, ...(facets?.agents ?? []).map((a) => ({ value: a.id, label: a.name }))],
    [facets],
  );
  const versionOptions = useMemo(
    () => [{ value: "", label: "All versions" }, ...(facets?.versions ?? []).map((v) => ({ value: v, label: v }))],
    [facets],
  );

  // A filter change lands on a different result set, so restart from page 1.
  const onAgent = (v: string) => {
    setAgentId(v);
    setPage(1);
  };
  const onVersion = (v: string) => {
    setVersionLabel(v);
    setPage(1);
  };
  const onSort = (v: string) => {
    setSort(v as QueueSort);
    setPage(1);
  };

  return (
    <TableCard
      title="Runs to score"
      subtitle="Runs waiting for a human score, across every agent."
      action={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 sm:flex-none">
            <Search size={15} className="text-text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agent…"
              className="w-full bg-transparent py-2 text-[13px] text-text placeholder:text-text-faint focus:outline-none sm:w-44"
            />
          </div>
          <Select label="Agent" value={agentId} options={agentOptions} onChange={onAgent} />
          <Select label="Version" value={versionLabel} options={versionOptions} onChange={onVersion} />
          <Select label="Sort" value={sort} options={sortOptions} onChange={onSort} />
        </div>
      }
    >
      {isError ? (
        <div className="p-5">
          <Alert>Couldn't load the scoring queue.</Alert>
        </div>
      ) : isPending ? (
        <div className="flex flex-col gap-3 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8" delay={i * 0.06} />
          ))}
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            rows={data.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/runs/${r.id}`)}
            empty="Queue cleared. New runs appear here as your agents push them."
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
