import { env } from "@/config/env";

import { authorizedRequest } from "./client";
import { ApiError } from "./errors";

export interface ServerEvent {
  id: string;
  event: string;
  data: string;
}

interface StreamOptions {
  path: string;
  lastEventId?: string | undefined;
  signal: AbortSignal;
  onOpen: () => void;
  onEvent: (event: ServerEvent) => void;
}

// EventSource can't send a bearer token, so the stream is read with fetch and parsed here.
// Resolves with the last event id when the server ends the stream, so the caller can resume.
export async function readEventStream({
  path,
  lastEventId,
  signal,
  onOpen,
  onEvent,
}: StreamOptions): Promise<string | undefined> {
  const headers = new Headers({ Accept: "text/event-stream" });
  if (lastEventId) {
    headers.set("Last-Event-ID", lastEventId);
  }

  const response = await authorizedRequest(new Request(env.apiOrigin + path, { headers, signal }));
  if (!response.ok || !response.body) {
    throw ApiError.fromEnvelope(response.status, await response.json().catch(() => undefined));
  }
  onOpen();

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let resumeId = lastEventId;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      return resumeId;
    }

    buffer += value.replaceAll("\r\n", "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const event = parseEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      if (event) {
        resumeId = event.id || resumeId;
        onEvent(event);
      }
    }
  }
}

function parseEvent(block: string): ServerEvent | null {
  const event: ServerEvent = { id: "", event: "message", data: "" };
  const data: string[] = [];

  for (const line of block.split("\n")) {
    if (line === "" || line.startsWith(":")) {
      continue;
    }
    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    const value = separator === -1 ? "" : line.slice(separator + 1).replace(/^ /, "");

    if (field === "id") {
      event.id = value;
    } else if (field === "event") {
      event.event = value;
    } else if (field === "data") {
      data.push(value);
    }
  }

  if (data.length === 0) {
    return null;
  }
  event.data = data.join("\n");

  return event;
}
