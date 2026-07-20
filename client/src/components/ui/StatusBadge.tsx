import { cn } from "@/lib/cn";

type Tone = "success" | "muted";

const tones: Record<Tone, { pill: string; dot: string }> = {
  success: {
    pill: "bg-success-tint border-success text-success-text",
    dot: "bg-success-text",
  },
  muted: {
    pill: "bg-raised border-border-muted text-text-muted",
    dot: "bg-text-faint",
  },
};

export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const { pill, dot } = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-caption font-semibold",
        pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
