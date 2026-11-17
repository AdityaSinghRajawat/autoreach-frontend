import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap, unwrapPage } from "@/api/client";
import type { Schemas } from "@/api/types";

export type QueueSummary = Schemas["QueueSummary"];
export type QueueName = QueueSummary["queue"];
export type DeadTask = Schemas["DeadTask"];
export type ProviderStatus = Schemas["ProviderStatus"];
export type JobSource = Schemas["JobSource"];
export type NewJobSource = Schemas["CreateJobSourceRequest"];
export type JobSourceUpdate = Schemas["UpdateJobSourceRequest"];
export type ApiClient = Schemas["ApiClient"];
export type Suppression = Schemas["SuppressionEntry"];
export type NewSuppression = Schemas["CreateSuppressionRequest"];
export type ContactSignal = Schemas["ContactSignal"];

export const queueNames: QueueName[] = [
  "embedding_queue",
  "matching_queue",
  "enrichment_queue",
  "outreach_queue",
  "application_queue",
];

const livePollMs = 10_000;
const perPage = 25;

export const adminKeys = {
  queues: ["admin", "queues"] as const,
  deadTasks: (queue: QueueName, page: number) => ["admin", "queues", queue, "dead", page] as const,
  providers: ["admin", "providers"] as const,
  jobSources: ["admin", "jobSources"] as const,
  apiClients: ["admin", "apiClients"] as const,
  suppressions: ["admin", "suppressions"] as const,
  suppressionList: (query: string, page: number) => ["admin", "suppressions", query, page] as const,
  contacts: (search: ContactSearch | null) => ["admin", "contacts", search] as const,
  signals: (contactId: string) => ["admin", "contacts", contactId, "signals"] as const,
};

export function useQueues() {
  return useQuery({
    queryKey: adminKeys.queues,
    queryFn: () => unwrap(api.GET("/api/v1/admin/queues")),
    refetchInterval: livePollMs,
  });
}

export function useProviders() {
  return useQuery({
    queryKey: adminKeys.providers,
    queryFn: () => unwrap(api.GET("/api/v1/admin/providers")),
    refetchInterval: livePollMs * 3,
  });
}

export function useDeadTasks(queue: QueueName, page: number) {
  return useQuery({
    queryKey: adminKeys.deadTasks(queue, page),
    queryFn: () =>
      unwrapPage(
        api.GET("/api/v1/admin/queues/{queue}/dead", {
          params: { path: { queue }, query: { page, perPage } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useRetryDeadTask(queue: QueueName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      unwrap(
        api.POST("/api/v1/admin/queues/{queue}/dead/{taskId}/retry", {
          params: { path: { queue, taskId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Task sent back to the queue");
      void queryClient.invalidateQueries({ queryKey: adminKeys.queues });
    },
  });
}

export function useJobSources() {
  return useQuery({
    queryKey: adminKeys.jobSources,
    queryFn: () => unwrap(api.GET("/api/v1/admin/job-sources")),
  });
}

export function useCreateJobSource() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: NewJobSource) => unwrap(api.POST("/api/v1/admin/job-sources", { body })),
    onSuccess: () => {
      toast.success("Job board added. The first poll has started.");
      void queryClient.invalidateQueries({ queryKey: adminKeys.jobSources });
    },
  });
}

export function useUpdateJobSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, body }: { sourceId: string; body: JobSourceUpdate }) =>
      unwrap(
        api.PATCH("/api/v1/admin/job-sources/{sourceId}", { params: { path: { sourceId } }, body }),
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.jobSources }),
  });
}

export function usePollJobSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) =>
      unwrap(
        api.POST("/api/v1/admin/job-sources/{sourceId}/poll", { params: { path: { sourceId } } }),
      ),
    onSuccess: (result) => {
      toast.success(
        `Fetched ${result.fetched}: ${result.ingested} new or updated, ${result.closed} closed, ${result.skipped} skipped`,
      );
      void queryClient.invalidateQueries({ queryKey: adminKeys.jobSources });
    },
  });
}

export function useDeleteJobSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) =>
      unwrap(
        api.DELETE("/api/v1/admin/job-sources/{sourceId}", { params: { path: { sourceId } } }),
      ),
    onSuccess: () => {
      toast.success("Job board removed. Its jobs are kept.");
      void queryClient.invalidateQueries({ queryKey: adminKeys.jobSources });
    },
  });
}

export function useApiClients() {
  return useQuery({
    queryKey: adminKeys.apiClients,
    queryFn: () => unwrap(api.GET("/api/v1/admin/api-clients")),
  });
}

export function useCreateApiClient() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (name: string) =>
      unwrap(api.POST("/api/v1/admin/api-clients", { body: { name, scopes: ["job:ingest:any"] } })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.apiClients }),
  });
}

export function useRevokeApiClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) =>
      unwrap(
        api.DELETE("/api/v1/admin/api-clients/{clientId}", { params: { path: { clientId } } }),
      ),
    onSuccess: () => {
      toast.success("API key revoked");
      void queryClient.invalidateQueries({ queryKey: adminKeys.apiClients });
    },
  });
}

export function useSuppressions(query: string, page: number) {
  return useQuery({
    queryKey: adminKeys.suppressionList(query, page),
    queryFn: () =>
      unwrapPage(
        api.GET("/api/v1/admin/suppressions", {
          params: { query: { page, perPage, ...(query ? { q: query } : {}) } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSuppression() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: NewSuppression) => unwrap(api.POST("/api/v1/admin/suppressions", { body })),
    onSuccess: (entry) => {
      toast.success(`Outreach to ${entry.value} is blocked`);
      void queryClient.invalidateQueries({ queryKey: adminKeys.suppressions });
    },
  });
}

export function useDeleteSuppression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suppressionId: string) =>
      unwrap(
        api.DELETE("/api/v1/admin/suppressions/{suppressionId}", {
          params: { path: { suppressionId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Suppression removed");
      void queryClient.invalidateQueries({ queryKey: adminKeys.suppressions });
    },
  });
}

export type ContactSearch = { email: string } | { linkedinUrl: string };

export function useAdminContacts(search: ContactSearch | null) {
  return useQuery({
    queryKey: adminKeys.contacts(search),
    queryFn: () => unwrap(api.GET("/api/v1/admin/contacts", { params: { query: search ?? {} } })),
    enabled: search !== null,
  });
}

export function useEraseContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) =>
      unwrap(api.DELETE("/api/v1/admin/contacts/{contactId}", { params: { path: { contactId } } })),
    onSuccess: () => {
      toast.success("Contact erased. Their address is suppressed so they aren't contacted again.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
    },
  });
}

export function useContactSignals(contactId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.signals(contactId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/admin/contacts/{contactId}/signals", { params: { path: { contactId } } }),
      ),
    enabled,
  });
}

export function useApplySignal(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (signalId: string) =>
      unwrap(
        api.POST("/api/v1/admin/contacts/{contactId}/signals/{signalId}/apply", {
          params: { path: { contactId, signalId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Report applied to the contact");
      void queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
    },
  });
}
