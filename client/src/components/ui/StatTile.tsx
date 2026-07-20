import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatTileProps {
  label: string;
  value: ReactNode;
  footnote?: ReactNode;
  accent?: boolean;
}

export function StatTile({ label, value, footnote, accent }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-surface p-[18px]",
        accent ? "border-accent" : "border-hairline",
      )}
    >
      <div className="text-label text-text-muted">{label}</div>
      <div
        className={cn(
          "mt-2 text-[34px] font-extrabold leading-none tracking-[-0.02em]",
          accent && "text-accent",
        )}
      >
        {value}
      </div>
      {footnote && <div className="mt-2 text-caption text-text-faint">{footnote}</div>}
    </div>
  );
}
