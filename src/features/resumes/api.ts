import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap } from "@/api/client";
import type { Schemas } from "@/api/types";

export type Resume = Schemas["Resume"];

const processingPollMs = 3_000;

export const resumeKeys = {
  list: (candidateId: string) => ["resumes", candidateId] as const,
};

export function isProcessing(resume: Resume): boolean {
  return resume.status === "UPLOADED" || resume.status === "PARSED";
}

export function useResumes(candidateId: string) {
  return useQuery({
    queryKey: resumeKeys.list(candidateId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/resumes", { params: { path: { candidateId } } }),
      ),
    // Parsing and embedding run in the background; poll until every resume settles.
    refetchInterval: (query) => (query.state.data?.some(isProcessing) ? processingPollMs : false),
  });
}

export function useUploadResume(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/resumes", {
          params: { path: { candidateId } },
          body: { file: file as unknown as string },
          bodySerializer: () => {
            const form = new FormData();
            form.append("file", file);

            return form;
          },
        }),
      ),
    onSuccess: (result) => {
      toast.success(`${result.resume.fileName} uploaded. Reading it now.`);
      void queryClient.invalidateQueries({ queryKey: resumeKeys.list(candidateId) });
    },
  });
}

export function useActivateResume(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resumeId: string) =>
      unwrap(
        api.PATCH("/api/v1/candidates/{candidateId}/resumes/{resumeId}", {
          params: { path: { candidateId, resumeId } },
          body: { isActive: true },
        }),
      ),
    onSuccess: (resume) => {
      toast.success(`Matching now uses ${resume.fileName}`);
      void queryClient.invalidateQueries({ queryKey: resumeKeys.list(candidateId) });
    },
  });
}

export function useDeleteResume(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resumeId: string) =>
      unwrap(
        api.DELETE("/api/v1/candidates/{candidateId}/resumes/{resumeId}", {
          params: { path: { candidateId, resumeId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Resume deleted");
      void queryClient.invalidateQueries({ queryKey: resumeKeys.list(candidateId) });
    },
  });
}
