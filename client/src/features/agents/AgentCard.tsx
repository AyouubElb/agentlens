import { Link } from "react-router-dom";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Agent } from "./schemas";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-faint">
        {label}
      </span>
      <span className="text-[15px] font-bold leading-none">{children}</span>
    </div>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  const { runs, unscored, avgScore } = agent;

  return (
    <Link
      to={`/agents/${agent.id}`}
      className={cn(
        "flex min-h-[168px] flex-col rounded-md border border-hairline bg-surface p-[18px]",
        "transition-colors hover:border-border-muted hover:bg-raised",
      )}
    >
      <div className="text-sm font-semibold">{agent.name}</div>

      <div className="flex-1" />

      <div className="mt-3 flex items-end gap-6 border-t border-hairline pt-4">
        <Stat label="runs">{runs}</Stat>
        <Stat label="unscored">
          {unscored > 0 ? (
            <span className="inline-flex rounded-sm border border-warning/40 bg-warning-tint px-2 py-px text-[13px] font-bold text-warning-text">
              {unscored}
            </span>
          ) : (
            unscored
          )}
        </Stat>
        <Stat label="avg">
          <ScoreChip score={avgScore} size="md" />
        </Stat>
      </div>

      <div className="mt-3.5 text-caption text-text-faint">Created {formatDate(agent.createdAt)}</div>
    </Link>
  );
}
