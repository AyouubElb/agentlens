import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  header: ReactNode;
  align?: "left" | "right";
  /* Tailwind width/grow hint for this column's cells, e.g. "w-40" or "flex-1". */
  className?: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}

export function Table<T>({ columns, rows, rowKey, onRowClick, empty }: TableProps<T>) {
  if (rows.length === 0 && empty) {
    return <div className="px-5 py-14 text-center text-sm text-text-muted">{empty}</div>;
  }

  const alignOf = (c: Column<T>) => (c.align === "right" ? "text-right" : "text-left");

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-bg">
          {columns.map((c, i) => (
            <th
              key={i}
              className={cn(
                "px-4 py-3 font-mono text-[11px] font-normal uppercase tracking-[0.06em] text-text-faint",
                alignOf(c),
                c.className,
              )}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "border-t border-hairline",
              onRowClick && "cursor-pointer transition-colors hover:bg-raised",
            )}
          >
            {columns.map((c, i) => (
              <td key={i} className={cn("px-4 py-3.5 text-sm", alignOf(c), c.className)}>
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
