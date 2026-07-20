import type { ReactNode } from "react";
import { JsonView } from "./JsonView";
import type { RunDetail } from "./schemas";

function Card({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface">
      <div className="flex items-center gap-2.5 border-b border-hairline px-[18px] py-3">
        <span className="text-sm font-semibold">{title}</span>
        {meta}
      </div>
      {children}
    </div>
  );
}

function Prose({ children }: { children: string }) {
  return <p className="whitespace-pre-wrap px-[18px] py-4 text-sm leading-relaxed text-text">{children}</p>;
}

export function RunPanel({ run }: { run: RunDetail }) {
  const chunks = Array.isArray(run.context) ? run.context.length : null;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Card title="Input">
        <Prose>{run.input}</Prose>
      </Card>
      <Card title="Output">
        <Prose>{run.output}</Prose>
      </Card>
      <Card
        title="Context"
        meta={chunks != null && <span className="font-mono text-caption text-text-faint">{chunks} chunks</span>}
      >
        <JsonView value={run.context} preferTable={false} />
      </Card>
      <Card title="Metadata">
        <JsonView value={run.metadata} preferTable />
      </Card>
    </div>
  );
}
