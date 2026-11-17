import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap, unwrapPage } from "@/api/client";
import type { Schemas } from "@/api/types";

export type OutreachMessage = Schemas["OutreachMessage"];
export type OutreachMessageDetail = Schemas["OutreachMessageDetail"];
export type OutreachStatus = OutreachMessage["status"];
export type OutreachChannel = OutreachMessage["channel"];
export type NewOutreach = Schemas["CreateOutreachMessagesRequest"];
export type LinkedinOutcome = Schemas["ConfirmOutreachMessageRequest"]["status"];
export type Template = Schemas["OutreachTemplate"];
export type NewTemplate = Schemas["CreateTemplateRequest"];
export type TemplateUpdate = Schemas["UpdateTemplateRequest"];
export type Campaign = Schemas["OutreachCampaign"];
export type NewCampaign = Schemas["CreateCampaignRequest"];
export type CampaignUpdate = Schemas["UpdateCampaignRequest"];

const perPage = 20;

export const outreachKeys = {
  messages: (candidateId: string) => ["outreach", candidateId, "messages"] as const,
  messageList: (candidateId: string, status: OutreachStatus | null, page: number) =>
    ["outreach", candidateId, "messages", status, page] as const,
  templates: (candidateId: string) => ["outreach", candidateId, "templates"] as const,
  campaigns: (candidateId: string) => ["outreach", candidateId, "campaigns"] as const,
};

export function useOutreachMessages(
  candidateId: string,
  status: OutreachStatus | null,
  page: number,
) {
  return useQuery({
    queryKey: outreachKeys.messageList(candidateId, status, page),
    queryFn: () =>
      unwrapPage(
        api.GET("/api/v1/candidates/{candidateId}/outreach-messages", {
          params: {
            path: { candidateId },
            query: { page, perPage, ...(status ? { status } : {}) },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCreateOutreach(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: NewOutreach) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/outreach-messages", {
          params: { path: { candidateId } },
          body,
        }),
      ),
    onSuccess: ({ messages }) => {
      const linkedin = messages.some((message) => message.channel !== "EMAIL");
      toast.success(
        linkedin
          ? "Queued. LinkedIn steps are waiting in your LinkedIn queue."
          : "Email queued to send",
      );
      void queryClient.invalidateQueries({ queryKey: outreachKeys.messages(candidateId) });
    },
  });
}

export function useCancelOutreach(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outreachId: string) =>
      unwrap(
        api.PATCH("/api/v1/candidates/{candidateId}/outreach-messages/{outreachId}", {
          params: { path: { candidateId, outreachId } },
          body: { status: "CANCELLED" },
        }),
      ),
    onSuccess: () => {
      toast.success("Message cancelled");
      void queryClient.invalidateQueries({ queryKey: outreachKeys.messages(candidateId) });
    },
  });
}

export function useConfirmLinkedin(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ outreachId, status }: { outreachId: string; status: LinkedinOutcome }) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/outreach-messages/{outreachId}/confirm", {
          params: { path: { candidateId, outreachId } },
          body: { status },
        }),
      ),
    onSuccess: (_message, { status }) => {
      const notes: Record<LinkedinOutcome, string> = {
        SENT: "Marked as sent",
        ACCEPTED: "Marked as accepted. Follow-up messages can go out now.",
        REPLIED: "Marked as replied. Remaining steps to this person are paused.",
      };
      toast.success(notes[status]);
      void queryClient.invalidateQueries({ queryKey: outreachKeys.messages(candidateId) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useTemplates(candidateId: string) {
  return useQuery({
    queryKey: outreachKeys.templates(candidateId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/outreach-templates", {
          params: { path: { candidateId } },
        }),
      ),
  });
}

export function useCreateTemplate(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: NewTemplate) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/outreach-templates", {
          params: { path: { candidateId } },
          body,
        }),
      ),
    onSuccess: () => {
      toast.success("Template saved as a draft");
      void queryClient.invalidateQueries({ queryKey: outreachKeys.templates(candidateId) });
    },
  });
}

export function useUpdateTemplate(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ templateId, body }: { templateId: string; body: TemplateUpdate }) =>
      unwrap(
        api.PATCH("/api/v1/candidates/{candidateId}/outreach-templates/{templateId}", {
          params: { path: { candidateId, templateId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.templates(candidateId) });
    },
  });
}

export function useDeleteTemplate(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      unwrap(
        api.DELETE("/api/v1/candidates/{candidateId}/outreach-templates/{templateId}", {
          params: { path: { candidateId, templateId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Template deleted");
      void queryClient.invalidateQueries({ queryKey: outreachKeys.templates(candidateId) });
    },
  });
}

export function useCampaigns(candidateId: string) {
  return useQuery({
    queryKey: outreachKeys.campaigns(candidateId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/outreach-campaigns", {
          params: { path: { candidateId } },
        }),
      ),
  });
}

export function useCreateCampaign(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: NewCampaign) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/outreach-campaigns", {
          params: { path: { candidateId } },
          body,
        }),
      ),
    onSuccess: () => {
      toast.success("Campaign created");
      void queryClient.invalidateQueries({ queryKey: outreachKeys.campaigns(candidateId) });
    },
  });
}

export function useUpdateCampaign(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ campaignId, body }: { campaignId: string; body: CampaignUpdate }) =>
      unwrap(
        api.PATCH("/api/v1/candidates/{candidateId}/outreach-campaigns/{campaignId}", {
          params: { path: { candidateId, campaignId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.campaigns(candidateId) });
    },
  });
}
