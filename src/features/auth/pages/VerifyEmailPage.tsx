import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";

import { errorMessage } from "@/api/errors";
import { buttonVariants } from "@/components/ui/buttonVariants";

import { useVerifyEmail } from "../api";
import { AuthLayout } from "../components/AuthLayout";

export function VerifyEmailPage() {
  const token = useSearchParams()[0].get("token");
  const verifyEmail = useVerifyEmail();
  const { mutate } = verifyEmail;
  const sent = useRef(false);

  // A verification token is single-use, so it is sent once even under StrictMode's double effects.
  useEffect(() => {
    if (token && !sent.current) {
      sent.current = true;
      mutate(token);
    }
  }, [token, mutate]);

  if (!token || verifyEmail.isError) {
    return (
      <AuthLayout
        title="We couldn't verify your email"
        description={
          token
            ? `${errorMessage(verifyEmail.error)} The link may have expired or already been used.`
            : "The verification link is incomplete. Open it again from the email."
        }
      >
        <div className="flex flex-col gap-3">
          <TriangleAlert className="size-8 text-danger" aria-hidden />
          <Link to="/login" className={buttonVariants({ size: "lg" })}>
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (verifyEmail.isSuccess) {
    return (
      <AuthLayout
        title="Email verified"
        description="Your account is ready. Sign in to get started."
      >
        <div className="flex flex-col gap-6">
          <CircleCheck className="size-10 text-success" aria-hidden />
          <Link to="/login" className={buttonVariants({ size: "lg" })}>
            Sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verifying your email">
      <p role="status" className="flex items-center gap-2 text-sm text-ink-2">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        One moment…
      </p>
    </AuthLayout>
  );
}
