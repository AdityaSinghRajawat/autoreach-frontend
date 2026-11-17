import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api, unwrap, unwrapPage } from "@/api/client";
import type { Schemas } from "@/api/types";

export type MatchedJob = Schemas["MatchedJob"];
export type JobPosting = Schemas["JobPosting"];

const perPage = 20;

export const jobKeys = {
  all: (candidateId: string) => ["jobs", candidateId] as const,
  list: (candidateId: string, page: number, minScore: number | null) =>
    ["jobs", candidateId, "list", page, minScore] as const,
  detail: (jobId: string) => ["job", jobId] as const,
};

export function useMatchedJobs(candidateId: string, page: number, minScore: number | null) {
  return useQuery({
    queryKey: jobKeys.list(candidateId, page, minScore),
    queryFn: () =>
      unwrapPage(
        api.GET("/api/v1/candidates/{candidateId}/jobs", {
          params: {
            path: { candidateId },
            query: { page, perPage, ...(minScore === null ? {} : { minScore }) },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => unwrap(api.GET("/api/v1/jobs/{jobId}", { params: { path: { jobId } } })),
    staleTime: 5 * 60_000,
  });
}
