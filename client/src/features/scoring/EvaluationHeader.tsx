import { ScoreChip } from "@/components/ui/ScoreChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { RunDetail } from "./schemas";

export function EvaluationHeader({ run }: { run: RunDetail }) {
  const scored = run.status === "scored";
  return (
    <div className="border-b border-hairline px-8 pb-6 pt-7">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="mb-3 text-[24px] font-extrabold tracking-[-0.01em]">Evaluate run</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[15px]">{run.id}</span>
            <span className="rounded-sm border border-hairline bg-raised px-2 py-0.5 font-mono text-caption text-text-muted">
              {run.versionLabel}
            </span>
            <StatusBadge tone={scored ? "success" : "muted"} label={scored ? "Scored" : "Unscored"} />
            <span className="text-caption text-text-faint">Submitted {formatDateTime(run.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-faint">Overall</span>
          {run.overallScore != null ? (
            <span className="inline-flex items-baseline gap-2">
              <ScoreChip score={run.overallScore} size="md" />
              <span className="font-mono text-caption text-text-faint">/ 5.0</span>
            </span>
          ) : (
            <span className="font-mono text-[22px] text-text-faint">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
