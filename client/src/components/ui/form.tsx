import { useId, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-caption font-semibold text-text-muted", className)} {...props} />
  );
}

export function FieldHelp({
  children,
  tone = "muted",
  ...props
}: {
  children: ReactNode;
  tone?: "muted" | "danger";
  id?: string;
}) {
  return (
    <p
      className={cn("text-[11px]", tone === "danger" ? "text-danger-text" : "text-text-faint")}
      {...props}
    >
      {children}
    </p>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  help?: ReactNode;
  error?: FieldError;
  mono?: boolean;
}

export function Input({ label, help, error, mono, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const message = error?.message ?? help;
  const messageId = message ? `${inputId}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn(
          "h-[38px] w-full rounded-md border bg-input px-2.5 text-[13px] text-text",
          "placeholder:text-text-faint focus:outline-none",
          mono && "font-mono",
          error
            ? "border-danger shadow-ring-danger"
            : "border-border-input focus:border-accent focus:shadow-ring-accent",
          "disabled:cursor-not-allowed disabled:opacity-45",
          className,
        )}
        {...props}
      />
      {message && (
        <FieldHelp id={messageId} tone={error ? "danger" : "muted"}>
          {message}
        </FieldHelp>
      )}
    </div>
  );
}
