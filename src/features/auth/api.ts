import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";
import { readRefreshToken, useSession } from "@/api/session";
import type { Session } from "@/api/types";

import type { ForgotPasswordValues, LoginValues, RegisterValues } from "./schemas";

export type RegisterOutcome = { kind: "signedIn"; session: Session } | { kind: "verifyEmail" };

export function useLogin() {
  const signIn = useSession((state) => state.signIn);

  return useMutation({
    meta: { silent: true },
    mutationFn: (values: LoginValues) => unwrap(api.POST("/api/v1/auth/login", { body: values })),
    onSuccess: signIn,
  });
}

export function useRegister() {
  const signIn = useSession((state) => state.signIn);

  return useMutation({
    meta: { silent: true },
    mutationFn: async (values: RegisterValues): Promise<RegisterOutcome> => {
      const data = await unwrap(api.POST("/api/v1/auth/register", { body: values }));

      return "accessToken" in data ? { kind: "signedIn", session: data } : { kind: "verifyEmail" };
    },
    onSuccess: (outcome) => {
      if (outcome.kind === "signedIn") {
        signIn(outcome.session);
      }
    },
  });
}

export function useLogout() {
  const signOut = useSession((state) => state.signOut);
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: async () => {
      const refreshToken = readRefreshToken();
      if (refreshToken) {
        await unwrap(api.POST("/api/v1/auth/logout", { body: { refreshToken } })).catch(
          () => undefined,
        );
      }
    },
    onSettled: () => {
      signOut();
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      unwrap(api.POST("/api/v1/auth/forgot-password", { body: values })),
  });
}

export function useResetPassword() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (values: { token: string; password: string }) =>
      unwrap(api.POST("/api/v1/auth/reset-password", { body: values })),
  });
}

export function useVerifyEmail() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (token: string) =>
      unwrap(api.POST("/api/v1/auth/verify-email", { body: { token } })),
  });
}
