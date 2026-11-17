import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FormAlertProps {
  tone?: "danger" | "success";
  children: ReactNode;
  className?: string;
}

export function FormAlert({ tone = "danger", children, className }: FormAlertProps) {
  const Icon = tone === "danger" ? CircleAlert : CircleCheck;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-md px-3 py-2.5 text-sm",
        tone === "danger" ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="text-ink">{children}</div>
    </div>
  );
}
