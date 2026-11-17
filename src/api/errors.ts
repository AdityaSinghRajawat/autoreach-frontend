import type { ErrorDetail } from "./types";

interface ErrorEnvelope {
  statusCode?: number;
  error?: { code?: string; message?: string; details?: ErrorDetail[] };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetail[];

  constructor(status: number, code: string, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static fromEnvelope(status: number, body: unknown): ApiError {
    const envelope = (body ?? {}) as ErrorEnvelope;

    return new ApiError(
      envelope.statusCode ?? status,
      envelope.error?.code ?? "UNKNOWN_ERROR",
      envelope.error?.message ?? "Something went wrong. Please try again.",
      envelope.error?.details ?? [],
    );
  }

  static network(): ApiError {
    return new ApiError(
      0,
      "NETWORK_ERROR",
      "Can't reach AutoReach. Check your connection and try again.",
    );
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
