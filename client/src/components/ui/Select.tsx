import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

// A compact dropdown for the filter bar: a labelled trigger + a popover list that closes on outside click.
export function Select({ label, value, options, onChange, disabled, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-[38px] items-center gap-2 rounded-md border border-hairline bg-surface px-3 text-[13px] transition-colors",
          "hover:border-border-muted disabled:cursor-not-allowed disabled:opacity-45",
        )}
      >
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-text">{selected?.label ?? "All"}</span>
        <ChevronDown size={14} className="text-text-faint" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 max-h-72 w-48 overflow-auto rounded-md border border-hairline bg-raised p-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-[13px] transition-colors",
                o.value === value ? "bg-accent-tint text-accent" : "text-text hover:bg-surface",
              )}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
