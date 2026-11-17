import { WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";

import { refreshSession } from "@/api/client";
import { isAdmin, useSession } from "@/api/session";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { safeNextPath } from "@/lib/navigation";

// Restores the session from the stored refresh token once, before any guarded page renders.
export function SessionGate() {
  const status = useSession((state) => state.status);
  const [unreachable, setUnreachable] = useState(false);

  const restore = useCallback(() => {
    // A refresh the server rejected signs out; still restoring means the request never landed.
    void refreshSession().then(() => {
      setUnreachable(useSession.getState().status === "restoring");
    });
  }, []);

  useEffect(() => {
    if (useSession.getState().status === "restoring") {
      restore();
    }
  }, [restore]);

  const retry = () => {
    setUnreachable(false);
    restore();
  };

  if (status !== "restoring") {
    return <Outlet />;
  }

  return (
    <div className="grid min-h-full place-items-center px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo showWordmark={false} className="[&_svg]:size-12" />
        {unreachable ? (
          <>
            <div role="alert" className="flex flex-col items-center gap-2">
              <WifiOff className="size-5 text-ink-3" aria-hidden />
              <p className="text-sm text-ink-2">
                AutoReach isn't responding right now. Try again in a moment.
              </p>
            </div>
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </>
        ) : (
          <p role="status" className="text-sm text-ink-3">
            Opening your workspace…
          </p>
        )}
      </div>
    </div>
  );
}

export function RequireAuth() {
  const status = useSession((state) => state.status);
  const location = useLocation();

  if (status === "signedOut") {
    const next = encodeURIComponent(location.pathname + location.search);

    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}

// Signing in re-renders this guard, so it (not the sign-in page) sends the user on to ?next=.
export function PublicOnly() {
  const status = useSession((state) => state.status);
  const [searchParams] = useSearchParams();

  return status === "signedIn" ? (
    <Navigate to={safeNextPath(searchParams.get("next"))} replace />
  ) : (
    <Outlet />
  );
}

// Candidate pages need a candidate profile; an admin without one is sent to the console.
export function RequireCandidate() {
  const user = useSession((state) => state.user);

  if (!user?.candidateId) {
    return <Navigate to={isAdmin(user) ? "/admin" : "/settings"} replace />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const user = useSession((state) => state.user);

  return isAdmin(user) ? <Outlet /> : <Navigate to="/" replace />;
}
