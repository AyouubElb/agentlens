import type { GradeValue, GradingFormValues, SubmitScoresBody } from "./schemas";

// Live display value; the server owns the authoritative rollup on submit.
export function overallScore(scores: GradeValue[]): number | null {
  const scored = scores.filter((s): s is GradeValue & { value: number } => s.value != null);
  if (scored.length === 0) return null;
  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) return null;
  return scored.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight;
}

export function allScored(scores: GradeValue[]): boolean {
  return scores.length > 0 && scores.every((s) => s.value != null);
}

// Empty justification is dropped so the server clears any stored note.
export function toSubmitBody(values: GradingFormValues): SubmitScoresBody {
  return {
    scores: values.scores.map((s) => {
      const justification = s.justification.trim();
      return {
        criterionId: s.criterionId,
        value: s.value as number,
        ...(justification ? { justification } : {}),
      };
    }),
  };
}
