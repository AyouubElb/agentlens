import { SquarePen } from "lucide-react";
import { Table, type Column } from "@/components/ui/Table";
import { TableCard } from "@/components/ui/TableCard";
import type { Criterion, Rubric } from "./schemas";

const columns: Column<Criterion>[] = [
  { header: "Criterion", className: "w-[26%]", render: (c) => <span className="font-semibold">{c.name}</span> },
  { header: "Description", render: (c) => <span className="text-text-muted">{c.description}</span> },
  {
    header: "Weight",
    align: "right",
    className: "w-24",
    render: (c) => (
      <span className="rounded-sm border border-hairline bg-raised px-2.5 py-1 font-mono text-code text-text">
        ×{c.weight}
      </span>
    ),
  },
];

export function RubricPanel({ rubric }: { rubric: Rubric }) {
  const total = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <TableCard
      title={rubric.name}
      subtitle={`${rubric.criteria.length} criteria · weights sum to ${total}`}
      action={
        // Editing is a later slice; the button is present per design but inert.
        <button
          type="button"
          disabled
          title="Rubric editing coming soon"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-hairline bg-surface px-3.5 py-[9px] text-label font-semibold text-text-muted opacity-50"
        >
          <SquarePen size={15} />
          Edit rubric
        </button>
      }
    >
      <Table columns={columns} rows={rubric.criteria} rowKey={(c) => c.id} />
    </TableCard>
  );
}
