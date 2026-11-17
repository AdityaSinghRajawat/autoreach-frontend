import { TriangleAlert } from "lucide-react";

import { errorMessage } from "@/api/errors";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = "This didn't load" }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg bg-danger-soft px-6 py-10 text-center"
    >
      <TriangleAlert className="size-6 text-danger" aria-hidden />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-ink-2">{errorMessage(error)}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
