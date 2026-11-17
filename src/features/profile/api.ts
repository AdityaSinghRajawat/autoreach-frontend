import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap } from "@/api/client";
import type { Schemas } from "@/api/types";

export type Candidate = Schemas["Candidate"];
export type CandidateUpdate = Schemas["UpdateCandidateRequest"];
export type ApplicationProfile = Schemas["ApplicationProfile"];

export const profileKeys = {
  candidate: (candidateId: string) => ["candidate", candidateId] as const,
  applicationProfile: (candidateId: string) =>
    ["candidate", candidateId, "applicationProfile"] as const,
};

export function candidateQuery(candidateId: string) {
  return queryOptions({
    queryKey: profileKeys.candidate(candidateId),
    queryFn: () =>
      unwrap(api.GET("/api/v1/candidates/{candidateId}", { params: { path: { candidateId } } })),
  });
}

export function useCandidate(candidateId: string) {
  return useQuery(candidateQuery(candidateId));
}

export function useUpdateCandidate(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CandidateUpdate) =>
      unwrap(
        api.PATCH("/api/v1/candidates/{candidateId}", { params: { path: { candidateId } }, body }),
      ),
    onSuccess: (candidate) => {
      queryClient.setQueryData(profileKeys.candidate(candidateId), candidate);
      toast.success("Preferences saved");
    },
  });
}

export function useApplicationProfile(candidateId: string) {
  return useQuery({
    queryKey: profileKeys.applicationProfile(candidateId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/application-profile", {
          params: { path: { candidateId } },
        }),
      ),
  });
}

export function useSaveApplicationProfile(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: ApplicationProfile) =>
      unwrap(
        api.PUT("/api/v1/candidates/{candidateId}/application-profile", {
          params: { path: { candidateId } },
          body,
        }),
      ),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.applicationProfile(candidateId), profile);
      toast.success("Application profile saved");
    },
  });
}
