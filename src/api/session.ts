import { create } from "zustand";

import type { Session, SessionUser } from "./types";

const refreshTokenKey = "autoreach.refreshToken";

type SessionStatus = "restoring" | "signedIn" | "signedOut";

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  user: SessionUser | null;
  signIn: (session: Session) => void;
  signOut: () => void;
  setUser: (user: SessionUser) => void;
}

// The access token stays in memory only; the rotating refresh token survives reloads.
export const useSession = create<SessionState>((set) => ({
  status: readRefreshToken() ? "restoring" : "signedOut",
  accessToken: null,
  user: null,
  signIn: (session) => {
    writeRefreshToken(session.refreshToken);
    set({ status: "signedIn", accessToken: session.accessToken, user: session.user });
  },
  signOut: () => {
    writeRefreshToken(null);
    set({ status: "signedOut", accessToken: null, user: null });
  },
  setUser: (user) => set({ user }),
}));

export function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(refreshTokenKey);
  } catch {
    return null;
  }
}

function writeRefreshToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(refreshTokenKey, token);
    } else {
      localStorage.removeItem(refreshTokenKey);
    }
  } catch {
    // Storage can be blocked; the session then lasts until the tab closes.
  }
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.roles.includes("ADMIN") ?? false;
}

// Only used under RequireCandidate, which guarantees the signed-in user has a candidate profile.
export function useCandidateId(): string {
  const candidateId = useSession((state) => state.user?.candidateId);
  if (!candidateId) {
    throw new Error("useCandidateId needs a signed-in candidate");
  }

  return candidateId;
}
