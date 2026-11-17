import createClient from "openapi-fetch";

import { env } from "@/config/env";

import { ApiError } from "./errors";
import type { paths } from "./schema";
import { readRefreshToken, useSession } from "./session";
import type { Page, PaginationMeta, Session } from "./types";

const refreshPath = "/api/v1/auth/refresh";

let pendingRefresh: Promise<boolean> | null = null;

// Concurrent 401s share one refresh, because the backend rotates the token and treats a second use
// of the old one as theft.
export function refreshSession(): Promise<boolean> {
  pendingRefresh ??= runRefresh().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}

async function runRefresh(): Promise<boolean> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    useSession.getState().signOut();

    return false;
  }

  try {
    const response = await fetch(env.apiOrigin + refreshPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    // Only a rejected token ends the session; rate limits and server errors leave it usable later.
    if (!response.ok) {
      if (response.status < 500 && response.status !== 429) {
        useSession.getState().signOut();
      }

      return false;
    }

    const body = (await response.json()) as { data: Session };
    useSession.getState().signIn(body.data);

    return true;
  } catch {
    return false;
  }
}

function withToken(request: Request): Request {
  const token = useSession.getState().accessToken;
  if (token) {
    request.headers.set("Authorization", `Bearer ${token}`);
  }

  return request;
}

async function authorizedFetch(request: Request): Promise<Response> {
  const retry = request.clone();
  const response = await fetch(withToken(request));

  if (response.status !== 401 || request.url.includes("/api/v1/auth/")) {
    return response;
  }

  if (!(await refreshSession())) {
    return response;
  }

  return fetch(withToken(retry));
}

export const api = createClient<paths>({ baseUrl: env.apiOrigin, fetch: authorizedFetch });

export const authorizedRequest = authorizedFetch;

interface ApiResult<Envelope> {
  data?: Envelope;
  error?: unknown;
  response: Response;
}

async function settle<Envelope>(
  pending: Promise<ApiResult<Envelope>>,
): Promise<ApiResult<Envelope>> {
  try {
    return await pending;
  } catch {
    throw ApiError.network();
  }
}

// unwrap returns the envelope's data, or throws an ApiError built from the error envelope.
export async function unwrap<Envelope>(
  pending: Promise<ApiResult<Envelope>>,
): Promise<Envelope extends { data: infer Data } ? Data : undefined> {
  const result = await settle(pending);
  if (!result.response.ok) {
    throw ApiError.fromEnvelope(result.response.status, result.error);
  }

  return (result.data as { data?: unknown } | undefined)?.data as Envelope extends {
    data: infer Data;
  }
    ? Data
    : undefined;
}

export async function unwrapPage<Envelope>(
  pending: Promise<ApiResult<Envelope>>,
): Promise<Page<Envelope extends { data: (infer Item)[] } ? Item : never>> {
  const result = await settle(pending);
  if (!result.response.ok) {
    throw ApiError.fromEnvelope(result.response.status, result.error);
  }

  const envelope = result.data as { data?: unknown[]; meta?: PaginationMeta } | undefined;

  return {
    items: (envelope?.data ?? []) as (Envelope extends { data: (infer Item)[] } ? Item : never)[],
    meta: envelope?.meta ?? {
      page: 1,
      perPage: envelope?.data?.length ?? 0,
      totalItems: 0,
      totalPages: 0,
    },
  };
}
