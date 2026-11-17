import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { envelope, errorEnvelope, server } from "@/test/server";

import { api, refreshSession, unwrap } from "./client";
import { ApiError } from "./errors";
import { useSession } from "./session";
import { readEventStream } from "./sse";

const user = { userId: "u1", email: "a@b.co", roles: ["CANDIDATE"], candidateId: "c1" };

function session(accessToken: string, refreshToken: string) {
  return { user, accessToken, refreshToken, tokenType: "Bearer" as const, expiresIn: 900 };
}

afterEach(() => useSession.getState().signOut());

describe("authorized requests", () => {
  it("refreshes once on a 401 and retries with the new token", async () => {
    useSession.getState().signIn(session("old", "refresh-1"));
    let refreshes = 0;
    server.use(
      http.get("*/api/v1/users/me", ({ request }) =>
        request.headers.get("Authorization") === "Bearer new"
          ? HttpResponse.json(envelope(user))
          : HttpResponse.json(errorEnvelope(401, "UNAUTHORIZED", "expired"), { status: 401 }),
      ),
      http.post("*/api/v1/auth/refresh", () => {
        refreshes += 1;
        return HttpResponse.json(envelope(session("new", "refresh-2")));
      }),
    );

    const [first, second] = await Promise.all([
      unwrap(api.GET("/api/v1/users/me")),
      unwrap(api.GET("/api/v1/users/me")),
    ]);

    expect(first.email).toBe("a@b.co");
    expect(second.email).toBe("a@b.co");
    expect(refreshes).toBe(1);
    expect(localStorage.getItem("autoreach.refreshToken")).toBe("refresh-2");
  });

  it("signs out when the refresh token is rejected", async () => {
    useSession.getState().signIn(session("old", "refresh-1"));
    server.use(
      http.post("*/api/v1/auth/refresh", () =>
        HttpResponse.json(errorEnvelope(401, "UNAUTHORIZED", "revoked"), { status: 401 }),
      ),
    );

    expect(await refreshSession()).toBe(false);
    expect(useSession.getState().status).toBe("signedOut");
  });

  it("keeps the session when refreshing is rate limited", async () => {
    useSession.getState().signIn(session("old", "refresh-1"));
    server.use(
      http.post("*/api/v1/auth/refresh", () =>
        HttpResponse.json(errorEnvelope(429, "RATE_LIMITED", "slow down"), { status: 429 }),
      ),
    );

    expect(await refreshSession()).toBe(false);
    expect(useSession.getState().status).toBe("signedIn");
    expect(localStorage.getItem("autoreach.refreshToken")).toBe("refresh-1");
  });

  it("turns error envelopes into ApiErrors with field details", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json(
          errorEnvelope(422, "VALIDATION_ERROR", "Check the form", [
            { field: "email", issue: "must be a valid email address" },
          ]),
          { status: 422 },
        ),
      ),
    );

    const error = await unwrap(
      api.POST("/api/v1/auth/login", { body: { email: "x", password: "y" } }),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).details[0]?.field).toBe("email");
  });
});

describe("readEventStream", () => {
  it("parses events split across chunks and returns the last id", async () => {
    const chunks = [
      ": keep-alive\n\nid: 1\nevent: activity\nda",
      'ta: {"eventId":"a"}\n\nid: 2\nevent: activity\ndata: {"eventId":"b"}\n\n',
    ];
    server.use(
      http.get("*/api/v1/dashboard/activity/stream", ({ request }) => {
        expect(request.headers.get("Last-Event-ID")).toBe("0");
        const body = new ReadableStream({
          start(controller) {
            for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
            controller.close();
          },
        });
        return new HttpResponse(body, { headers: { "Content-Type": "text/event-stream" } });
      }),
    );
    const events: string[] = [];
    let opened = false;

    const lastId = await readEventStream({
      path: "/api/v1/dashboard/activity/stream",
      lastEventId: "0",
      signal: new AbortController().signal,
      onOpen: () => {
        opened = true;
      },
      onEvent: (event) => events.push(`${event.event}:${event.data}`),
    });

    expect(opened).toBe(true);
    expect(events).toEqual(['activity:{"eventId":"a"}', 'activity:{"eventId":"b"}']);
    expect(lastId).toBe("2");
  });
});
