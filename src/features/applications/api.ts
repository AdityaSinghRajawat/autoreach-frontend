import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap, unwrapPage } from "@/api/client";
import type { Schemas } from "@/api/types";

export type Application = Schemas["Application"];
export type ApplicationDetail = Schemas["ApplicationDetail"];
export type ApplicationStatus = Application["status"];
export type ApplicationOutcome = Schemas["UpdateApplicationRequest"]["status"];

const perPage = 20;
const inFlightPollMs = 4_000;

export const applicationKeys = {
  all: (candidateId: string) => ["applications", candidateId] as const,
  list: (candidateId: string, status: ApplicationStatus | null, page: number) =>
    ["applications", candidateId, "list", status, page] as const,
  detail: (candidateId: string, applicationId: string) =>
    ["applications", candidateId, "detail", applicationId] as const,
};

export function isInFlight(status: ApplicationStatus): boolean {
  return status === "QUEUED" || status === "IN_PROGRESS";
}

export function useApplications(
  candidateId: string,
  status: ApplicationStatus | null,
  page: number,
) {
  return useQuery({
    queryKey: applicationKeys.list(candidateId, status, page),
    queryFn: () =>
      unwrapPage(
        api.GET("/api/v1/candidates/{candidateId}/applications", {
          params: {
            path: { candidateId },
            query: { page, perPage, ...(status ? { status } : {}) },
          },
        }),
      ),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some((item) => isInFlight(item.status)) ? inFlightPollMs : false,
  });
}

export function useApplication(candidateId: string, applicationId: string) {
  return useQuery({
    queryKey: applicationKeys.detail(candidateId, applicationId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/applications/{applicationId}", {
          params: { path: { candidateId, applicationId } },
        }),
      ),
    refetchInterval: (query) =>
      query.state.data && isInFlight(query.state.data.status) ? inFlightPollMs : false,
  });
}

export function useCreateApplication(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/applications", {
          params: { path: { candidateId } },
          body: { jobId },
        }),
      ),
    onSuccess: () => {
      toast.success("Application queued. Answers are being prepared.");
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all(candidateId) });
      void queryClient.invalidateQueries({ queryKey: ["jobs", candidateId] });
    },
  });
}

export function useUpdateApplication(candidateId: string, applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ApplicationOutcome) =>
      unwrap(
        api.PATCH("/api/v1/candidates/{candidateId}/applications/{applicationId}", {
          params: { path: { candidateId, applicationId } },
          body: { status },
        }),
      ),
    onSuccess: () => {
      toast.success("Application updated");
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all(candidateId) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
