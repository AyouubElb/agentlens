import { Check, X, Circle } from "lucide-react";
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/cn";
import { passwordRules } from "./schemas";

/* Shows the rules under the field. Before submit (no error) they're neutral; after a failed
   submit, each rule reads as met or unmet against the attempted value. */
export function PasswordChecklist({ error, value }: { error?: FieldError; value: string }) {
  const submitted = Boolean(error);

  return (
    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
      {passwordRules.map(({ label, test }) => {
        const met = test(value);
        return (
          <div key={label} className="flex items-center gap-1.5">
            {!submitted ? (
              <Circle size={13} strokeWidth={2.4} className="shrink-0 text-text-faint" />
            ) : met ? (
              <Check size={13} strokeWidth={3} className="shrink-0 text-success" />
            ) : (
              <X size={13} strokeWidth={3} className="shrink-0 text-danger-text" />
            )}
            <span
              className={cn(
                "text-caption",
                !submitted ? "text-text-faint" : met ? "text-success" : "text-danger-text",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
