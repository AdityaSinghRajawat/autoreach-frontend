import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface ControlProps {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  className?: string;
  // A render function suits controls nested in wrappers, such as react-hook-form's Controller.
  children: ReactElement<Partial<ControlProps>> | ((control: ControlProps) => ReactElement);
}

// Wires the label, hint and error message to the single control, so screen readers announce them.
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const controlProps: ControlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? messageId : undefined,
  };
  const control =
    typeof children === "function"
      ? children(controlProps)
      : isValidElement(children)
        ? cloneElement(children, controlProps)
        : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {control}
      {error ? (
        <p id={messageId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
