import { useForm, useFieldArray, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { useCreateAgent } from "./useAgents";
import { createAgentSchema, type CreateAgentFormValues } from "./schemas";

export function CreateAgentForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const create = useCreateAgent();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      rubric: { name: "", criteria: [{ name: "", description: "", weight: 1 }] },
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rubric.criteria" });

  async function onSubmit(values: CreateAgentFormValues) {
    // Resolver already parsed weight to a number; the schema's output type is what the API expects.
    const agent = await create.mutateAsync(createAgentSchema.parse(values)).catch(() => null);
    if (agent) onCreated();
  }

  return (
    <form id="create-agent-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col">
      <Input label="Agent name" help="3–100 characters" error={errors.name} {...register("name")} />

      <div className="mt-5 border-t border-hairline pt-[18px]">
        <div className="mb-3.5 text-sm font-bold">Rubric</div>
        <Input
          label="Rubric name"
          help="e.g. Answer quality"
          error={errors.rubric?.name}
          {...register("rubric.name")}
        />

        <div className="mb-2 mt-4 text-label font-semibold">Criteria</div>
        <div className="grid grid-cols-[1.1fr_1.6fr_62px_28px] gap-2 px-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-faint">
          <span>Name</span>
          <span>Description</span>
          <span>Weight</span>
          <span />
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1.1fr_1.6fr_62px_28px] items-start gap-2">
              <Input error={errors.rubric?.criteria?.[i]?.name} {...register(`rubric.criteria.${i}.name`)} />
              <Input
                error={errors.rubric?.criteria?.[i]?.description}
                {...register(`rubric.criteria.${i}.description`)}
              />
              <Input
                type="number"
                step="any"
                mono
                className="text-center"
                // z.coerce widens the field's error type to a Merge; the runtime shape is a FieldError.
                error={errors.rubric?.criteria?.[i]?.weight as FieldError | undefined}
                {...register(`rubric.criteria.${i}.weight`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove criterion"
                disabled={fields.length === 1}
                onClick={() => remove(i)}
                className="h-[38px] px-0"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>

        {errors.rubric?.criteria?.message && (
          <p className="mt-2 text-[11px] text-danger-text">{errors.rubric.criteria.message}</p>
        )}

        <button
          type="button"
          onClick={() => append({ name: "", description: "", weight: 1 })}
          className="mt-3 inline-flex items-center gap-1.5 text-label font-semibold text-accent hover:text-accent-hover"
        >
          <Plus size={14} />
          Add criterion
        </button>
        <div className="mt-1.5 text-caption text-text-faint">At least one criterion is required.</div>
      </div>

      <div className="mt-[22px] flex justify-end gap-2.5 border-t border-hairline pt-[18px]">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Create agent
        </Button>
      </div>
    </form>
  );
}
