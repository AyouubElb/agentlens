// Weighted average of per-criterion scores: Σ(value·weight) / Σ(weight).
export function weightedOverall(scores: { value: number; weight: number }[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) throw new Error("Total weight must be positive");
  const weighted = scores.reduce((sum, s) => sum + s.value * s.weight, 0);
  return weighted / totalWeight;
}
