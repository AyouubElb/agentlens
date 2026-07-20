import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Band = 1 | 2 | 3 | 4 | 5;

const idle: Record<Band, string> = {
  1: "text-score-1 border-score-1/30 hover:border-score-1/60",
  2: "text-score-2 border-score-2/30 hover:border-score-2/60",
  3: "text-score-3 border-score-3/30 hover:border-score-3/60",
  4: "text-score-4 border-score-4/30 hover:border-score-4/60",
  5: "text-score-5 border-score-5/30 hover:border-score-5/60",
};

// score-3 (amber) takes dark ink; the rest take white.
const active: Record<Band, string> = {
  1: "bg-score-1 border-score-1 text-white",
  2: "bg-score-2 border-score-2 text-white",
  3: "bg-score-3 border-score-3 text-score-ink",
  4: "bg-score-4 border-score-4 text-white",
  5: "bg-score-5 border-score-5 text-white",
};

interface ScoreSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  name?: string;
}

export function ScoreSelector({ value, onChange, name }: ScoreSelectorProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={name}>
      {([1, 2, 3, 4, 5] as Band[]).map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={String(n)}
            onClick={() => onChange(n)}
            className={cn(
              "flex h-[42px] flex-1 items-center justify-center gap-1 rounded-md border bg-raised font-mono text-[15px] font-bold transition-colors",
              selected ? active[n] : idle[n],
            )}
          >
            {selected && <Check size={13} strokeWidth={3} />}
            {n}
          </button>
        );
      })}
    </div>
  );
}
