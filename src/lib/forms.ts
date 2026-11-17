import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { isApiError } from "@/api/errors";

// Puts the backend's 422 field details onto the matching inputs; reports whether any matched.
export function applyServerErrors<Values extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<Values>,
  fields: readonly Path<Values>[],
): boolean {
  if (!isApiError(error) || error.details.length === 0) {
    return false;
  }

  let applied = false;

  for (const detail of error.details) {
    const field = fields.find((name) => name.toLowerCase() === detail.field.toLowerCase());
    if (field) {
      setError(field, { type: "server", message: detail.issue });
      applied = true;
    }
  }

  return applied;
}
