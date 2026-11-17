import { MailCheck } from "lucide-react";
import { Link, useLocation } from "react-router";

import { buttonVariants } from "@/components/ui/buttonVariants";

import { AuthLayout } from "../components/AuthLayout";

interface CheckEmailState {
  email?: string;
  reason?: "verify" | "reset";
}

export function CheckEmailPage() {
  const state = (useLocation().state ?? {}) as CheckEmailState;
  const address = state.email ? <strong className="text-ink">{state.email}</strong> : "your inbox";
  const resetting = state.reason === "reset";

  return (
    <AuthLayout title="Check your email">
      <div className="flex flex-col gap-6">
        <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-ink-2">
          {resetting ? (
            <>If an account uses {address}, we've sent it a link to choose a new password.</>
          ) : (
            <>We've sent a verification link to {address}. Open it to activate your account.</>
          )}{" "}
          The link expires soon, so use it shortly. Nothing arrived? Check your spam folder.
        </p>
        <Link to="/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
