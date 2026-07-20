import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PagerProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

// A fixed-width window of page numbers around `page`, clamped to [1, totalPages].
function pageRange(page: number, totalPages: number, span = 5): number[] {
  if (totalPages <= 0) return [];
  const size = Math.min(span, totalPages);
  let start = page - Math.floor(size / 2);
  start = Math.max(1, Math.min(start, totalPages - size + 1));
  return Array.from({ length: size }, (_, i) => start + i);
}

// Drives any paginated list: "Rows X–Y of total" + Prev / numbered pages / Next.
export function Pager({ page, limit, total, onPageChange }: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const go = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <span className="text-caption text-text-faint">
        {total === 0 ? "No rows" : `Rows ${from}–${to} of ${total}`}
      </span>

      <div className="flex items-center gap-1.5">
        <PagerButton onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={14} />
          Prev
        </PagerButton>

        {pageRange(page, totalPages).map((p) => (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            className={cn(
              "h-8 min-w-8 rounded-md border px-2 font-mono text-caption tabular-nums transition-colors",
              p === page
                ? "border-accent-border bg-accent-tint font-bold text-accent"
                : "border-hairline bg-surface text-text-muted hover:border-border-muted hover:text-text",
            )}
          >
            {p}
          </button>
        ))}

        <PagerButton onClick={() => go(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          Next
          <ChevronRight size={14} />
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 text-caption font-semibold text-text",
        "transition-colors hover:border-border-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline",
        className,
      )}
      {...props}
    />
  );
}
