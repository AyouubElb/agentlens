import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { CriterionGrader } from "./CriterionGrader";
import { useSubmitScores } from "./useRuns";
import { allScored, overallScore, toSubmitBody } from "./grading";
import { gradingSchema, type GradingFormValues, type RunDetail } from "./schemas";

function toDefaults(run: RunDetail): GradingFormValues {
  return {
    scores: run.criteria.map((c) => ({
      criterionId: c.id,
      weight: c.weight,
      value: c.score?.value ?? null,
      justification: c.score?.justification ?? "",
    })),
  };
}

export function GradingForm({ run }: { run: RunDetail }) {
  const submit = useSubmitScores(run.id);
  const { control, register, handleSubmit } = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: toDefaults(run),
  });
  const { fields } = useFieldArray({ control, name: "scores" });

  // Live subscription drives the running overall + N/M counter as selectors change.
  const scores = useWatch({ control, name: "scores" });
  const overall = overallScore(scores);
  const done = scores.filter((s) => s.value != null).length;
  const complete = allScored(scores);

  const onSubmit = (values: GradingFormValues) => submit.mutate(toSubmitBody(values));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="sticky top-6 overflow-hidden rounded-md border border-hairline bg-surface"
    >
      <div className="flex items-center justify-between border-b border-hairline p-[18px]">
        <span className="text-base font-bold">Score against rubric</span>
        <span className={complete ? "font-mono text-caption text-success-text" : "font-mono text-caption text-text-muted"}>
          {done} / {fields.length}
        </span>
      </div>

      {fields.map((field, i) => {
        const criterion = run.criteria[i];
        return (
          <Controller
            key={field.id}
            control={control}
            name={`scores.${i}.value`}
            render={({ field: valueField }) => (
              <CriterionGrader
                name={criterion.name}
                description={criterion.description}
                weight={criterion.weight}
                value={valueField.value}
                onValueChange={valueField.onChange}
                justificationProps={register(`scores.${i}.justification`)}
              />
            )}
          />
        );
      })}

      <div className="border-t border-hairline bg-bg p-[18px]">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold">Overall</span>
          <span className="inline-flex items-baseline gap-1.5">
            <ScoreChip score={overall} size="md" />
            <span className="font-mono text-caption text-text-faint">/ 5.0</span>
          </span>
        </div>

        <Button type="submit" className="w-full" loading={submit.isPending} disabled={!complete}>
          {run.status === "scored" ? "Update scores" : "Submit scores"}
        </Button>

        {!complete && (
          <p className="mt-2.5 flex items-center gap-1.5 text-caption text-text-faint">
            <Info size={14} />
            Score every criterion to submit.
          </p>
        )}
      </div>
    </form>
  );
}
