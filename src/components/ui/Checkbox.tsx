import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ label, description, className, disabled, ...props }: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-primary-soft/50",
        disabled && "cursor-not-allowed opacity-50 hover:border-border",
        className,
      )}
    >
      <input
        type="checkbox"
        disabled={disabled}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description ? <span className="text-xs text-ink-3">{description}</span> : null}
      </span>
    </label>
  );
}
