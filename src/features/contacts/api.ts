import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap, unwrapPage } from "@/api/client";
import type { Schemas } from "@/api/types";

export type CompanyContact = Schemas["CompanyContact"];

const perPage = 24;

export const contactKeys = {
  list: (candidateId: string, page: number) => ["contacts", candidateId, page] as const,
  forJob: (candidateId: string, jobId: string) => ["contacts", candidateId, "job", jobId] as const,
};

export function useCandidateContacts(candidateId: string, page: number) {
  return useQuery({
    queryKey: contactKeys.list(candidateId, page),
    queryFn: () =>
      unwrapPage(
        api.GET("/api/v1/candidates/{candidateId}/contacts", {
          params: { path: { candidateId }, query: { page, perPage } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useJobContacts(candidateId: string, jobId: string) {
  return useQuery({
    queryKey: contactKeys.forJob(candidateId, jobId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/jobs/{jobId}/contacts", {
          params: { path: { candidateId, jobId } },
        }),
      ),
  });
}

// Enrichment runs in the background; the contacts list is refetched a little later.
export function useEnrichContacts(candidateId: string, jobId: string) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/jobs/{jobId}/contacts/enrich", {
          params: { path: { candidateId, jobId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Looking for people at this company. New contacts appear here shortly.");
    },
  });
}
