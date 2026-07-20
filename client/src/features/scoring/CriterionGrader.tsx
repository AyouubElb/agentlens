import type { TextareaHTMLAttributes } from "react";
import { Textarea } from "@/components/ui/form";
import { ScoreSelector } from "./ScoreSelector";

interface CriterionGraderProps {
  name: string;
  description: string;
  weight: number;
  value: number | null;
  onValueChange: (value: number) => void;
  justificationProps: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export function CriterionGrader({
  name,
  description,
  weight,
  value,
  onValueChange,
  justificationProps,
}: CriterionGraderProps) {
  return (
    <div className="border-t border-hairline p-[18px]">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{name}</span>
        <span className="font-mono text-caption text-text-faint">weight {weight}</span>
      </div>
      <p className="mb-3 text-[13px] leading-snug text-text-muted">{description}</p>
      <ScoreSelector name={name} value={value} onChange={onValueChange} />
      <div className="mt-3">
        <Textarea rows={2} placeholder="Note what drove this score…" {...justificationProps} />
      </div>
    </div>
  );
}
