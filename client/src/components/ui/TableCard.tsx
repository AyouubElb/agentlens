import type { ReactNode } from "react";

interface TableCardProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

// Card shell shared by the rubric / keys / runs lists: a header strip over a Table.
export function TableCard({ title, subtitle, action, children }: TableCardProps) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-[18px]">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="mt-0.5 text-label text-text-muted">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
