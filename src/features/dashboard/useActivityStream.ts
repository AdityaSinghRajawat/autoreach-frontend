import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { readEventStream } from "@/api/sse";

import { dashboardKeys, type ActivityItem, type ActivityPage } from "./api";

export type StreamStatus = "connecting" | "live" | "offline";

const firstRetryMs = 1_000;
const maxRetryMs = 30_000;
const countsRefreshDelayMs = 1_500;

// Keeps the activity feed live: new events go to the top of the cached feed, and the counts that
// they change are refetched shortly after (batched, so a burst triggers one refetch).
export function useActivityStream(onEvent?: (item: ActivityItem) => void): StreamStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const controller = new AbortController();
    let lastEventId: string | undefined;
    let retryMs = firstRetryMs;
    let countsTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshCounts = () => {
      clearTimeout(countsTimer);
      countsTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.funnel() });
        void queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
      }, countsRefreshDelayMs);
    };

    const addToFeed = (item: ActivityItem) => {
      queryClient.setQueryData<InfiniteData<ActivityPage, string | undefined>>(
        dashboardKeys.activity(),
        (feed) => {
          const firstPage = feed?.pages[0];
          if (
            !feed ||
            !firstPage ||
            feed.pages.some((page) => page.items.some((known) => known.eventId === item.eventId))
          ) {
            return feed;
          }

          return {
            ...feed,
            pages: [{ ...firstPage, items: [item, ...firstPage.items] }, ...feed.pages.slice(1)],
          };
        },
      );
    };

    const run = async () => {
      while (!controller.signal.aborted) {
        try {
          lastEventId = await readEventStream({
            path: "/api/v1/dashboard/activity/stream",
            lastEventId,
            signal: controller.signal,
            onOpen: () => {
              retryMs = firstRetryMs;
              setStatus("live");
            },
            onEvent: (event) => {
              if (event.event !== "activity") {
                return;
              }
              const item = JSON.parse(event.data) as ActivityItem;
              addToFeed(item);
              refreshCounts();
              onEventRef.current?.(item);
            },
          });
        } catch {
          if (controller.signal.aborted) {
            return;
          }
          setStatus("offline");
          await wait(retryMs, controller.signal);
          retryMs = Math.min(retryMs * 2, maxRetryMs);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
      clearTimeout(countsTimer);
    };
  }, [queryClient]);

  return status;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
