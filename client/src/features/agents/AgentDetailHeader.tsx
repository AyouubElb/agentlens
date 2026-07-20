import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ClipboardCheck } from "lucide-react";
import { ScoreChip } from "@/components/ui/ScoreChip";
import type { AgentDetail } from "./schemas";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-faint">
        {label}
      </span>
      {children}
    </div>
  );
}

const dash = <span className="text-text-faint">—</span>;

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-2 inline-flex items-center gap-2 font-mono text-code text-text-muted hover:text-text"
    >
      {id}
      <span className="text-text-faint">
        {copied ? <Check size={14} className="text-success-text" /> : <Copy size={14} />}
      </span>
    </button>
  );
}

// Header stats are placeholders — GET /agents/:id has no run/score aggregates yet (see CLAUDE.md).
export function AgentDetailHeader({ agent }: { agent: AgentDetail }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 px-4 pt-7 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">{agent.name}</h1>
        <CopyableId id={agent.id} />
      </div>

      <div className="flex flex-wrap items-center gap-6 sm:gap-9">
        <Stat label="runs">
          <span className="text-xl font-bold leading-none">{dash}</span>
        </Stat>
        <Stat label="unscored">
          <span className="text-xl font-bold leading-none">{dash}</span>
        </Stat>
        <Stat label="avg score">
          <ScoreChip score={undefined} size="md" />
        </Stat>
        <Link
          to="runs"
          className="inline-flex items-center gap-2 self-center rounded-md bg-accent px-4 py-[9px] text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
        >
          <ClipboardCheck size={16} />
          Score runs
        </Link>
      </div>
    </div>
  );
}
