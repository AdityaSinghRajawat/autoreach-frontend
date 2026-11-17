import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, unwrap } from "@/api/client";
import { useSession } from "@/api/session";
import type { Schemas } from "@/api/types";

export type DataExport = Schemas["UserDataExport"];

// Changing the password or deleting the account ends every session on the server, so this one ends too.
function useEndSession() {
  const signOut = useSession((state) => state.signOut);
  const queryClient = useQueryClient();

  return () => {
    signOut();
    queryClient.clear();
  };
}

export function useChangePassword() {
  const endSession = useEndSession();

  return useMutation({
    meta: { silent: true },
    mutationFn: (body: Schemas["ChangePasswordRequest"]) =>
      unwrap(api.PUT("/api/v1/users/me/password", { body })),
    onSuccess: () => {
      toast.success("Password changed. Sign in again with your new password.");
      endSession();
    },
  });
}

export function useRequestEmailChange() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: Schemas["ChangeEmailRequest"]) =>
      unwrap(api.POST("/api/v1/users/me/email", { body })),
  });
}

export function useConfirmEmailChange() {
  const setUser = useSession((state) => state.setUser);

  return useMutation({
    meta: { silent: true },
    mutationFn: async (body: Schemas["ConfirmEmailChangeRequest"]) => {
      await unwrap(api.POST("/api/v1/users/me/email/confirm", { body }));

      return unwrap(api.GET("/api/v1/users/me"));
    },
    onSuccess: setUser,
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const data = await unwrap(api.GET("/api/v1/users/me/export"));
      downloadJson(data, `autoreach-export-${new Date().toISOString().slice(0, 10)}.json`);

      return data;
    },
  });
}

export function useDeleteAccount() {
  const endSession = useEndSession();

  return useMutation({
    meta: { silent: true },
    mutationFn: (password: string) =>
      unwrap(api.DELETE("/api/v1/users/me", { body: { password } })),
    onSuccess: () => {
      toast.success("Your account and its data have been deleted.");
      endSession();
    },
  });
}

function downloadJson(data: unknown, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
