import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap } from "@/api/client";
import type { Schemas } from "@/api/types";

export type Mailbox = Schemas["ChannelAccount"];
export type NewMailbox = Schemas["CreateChannelAccountRequest"];

export const mailboxKeys = {
  list: (candidateId: string) => ["mailboxes", candidateId] as const,
};

export function useMailboxes(candidateId: string) {
  return useQuery({
    queryKey: mailboxKeys.list(candidateId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/candidates/{candidateId}/channel-accounts", {
          params: { path: { candidateId } },
        }),
      ),
  });
}

export function useConnectMailbox(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: NewMailbox) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/channel-accounts", {
          params: { path: { candidateId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mailboxKeys.list(candidateId) });
    },
  });
}

export function useVerifyMailbox(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      unwrap(
        api.POST("/api/v1/candidates/{candidateId}/channel-accounts/{accountId}/verify", {
          params: { path: { candidateId, accountId } },
        }),
      ),
    onSuccess: (mailbox) => {
      if (mailbox.status === "ACTIVE") {
        toast.success(`${mailbox.emailAddress} is connected and ready to send`);
      } else {
        toast.error(mailbox.lastError ?? "The mail server refused the login. Check the settings.");
      }
      void queryClient.invalidateQueries({ queryKey: mailboxKeys.list(candidateId) });
    },
  });
}

export function useDisconnectMailbox(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      unwrap(
        api.DELETE("/api/v1/candidates/{candidateId}/channel-accounts/{accountId}", {
          params: { path: { candidateId, accountId } },
        }),
      ),
    onSuccess: () => {
      toast.success("Mailbox disconnected");
      void queryClient.invalidateQueries({ queryKey: mailboxKeys.list(candidateId) });
    },
  });
}
