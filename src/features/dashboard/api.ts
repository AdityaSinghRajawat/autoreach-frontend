import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";
import type { Schemas } from "@/api/types";

export type ActivityItem = Schemas["ActivityItem"];
export type ActivityPage = Schemas["ActivityPage"];
export type FunnelStage = Schemas["Funnel"]["stages"][number];
export type Metrics = Schemas["CandidateMetrics"]["metrics"];

const activityPageSize = 20;

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: (candidateId: string) => ["dashboard", "metrics", candidateId] as const,
  funnel: () => ["dashboard", "funnel"] as const,
  activity: () => ["dashboard", "activity"] as const,
};

export function useMetrics(candidateId: string) {
  return useQuery({
    queryKey: dashboardKeys.metrics(candidateId),
    queryFn: async () =>
      (
        await unwrap(
          api.GET("/api/v1/candidates/{candidateId}/metrics", {
            params: { path: { candidateId } },
          }),
        )
      ).metrics,
  });
}

export function useFunnel() {
  return useQuery({
    queryKey: dashboardKeys.funnel(),
    queryFn: async () => (await unwrap(api.GET("/api/v1/dashboard/funnel"))).stages,
  });
}

export function useActivity() {
  return useInfiniteQuery({
    queryKey: dashboardKeys.activity(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET("/api/v1/dashboard/activity", {
          params: {
            query: { limit: activityPageSize, ...(pageParam ? { before: pageParam } : {}) },
          },
        }),
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
