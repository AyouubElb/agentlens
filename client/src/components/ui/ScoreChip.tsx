import { cn } from "@/lib/cn";

type Band = 1 | 2 | 3 | 4 | 5;

// Each band draws from its score-N token: colored text/border over a faint tint of the same hue.
const bands: Record<Band, string> = {
  1: "text-score-1 border-score-1 bg-score-1/[0.14]",
  2: "text-score-2 border-score-2 bg-score-2/[0.14]",
  3: "text-score-3 border-score-3 bg-score-3/[0.14]",
  4: "text-score-4 border-score-4 bg-score-4/[0.14]",
  5: "text-score-5 border-score-5 bg-score-5/[0.16]",
};

interface ScoreChipProps {
  score: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function ScoreChip({ score, size = "sm", className }: ScoreChipProps) {
  if (score == null) return <span className="text-text-faint">—</span>;

  const band = Math.max(1, Math.min(5, Math.round(score))) as Band;

  return (
    <span
      className={cn(
        "inline-flex items-baseline rounded-sm border font-mono font-bold tabular-nums",
        size === "md" ? "px-2 py-0.5 text-[14px]" : "px-1.5 py-px text-[13px]",
        bands[band],
        className,
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
