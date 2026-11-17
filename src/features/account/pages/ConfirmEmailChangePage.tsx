import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";

import { errorMessage } from "@/api/errors";
import { buttonVariants } from "@/components/ui/buttonVariants";

import { useConfirmEmailChange } from "../api";

export function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const confirm = useConfirmEmailChange();
  const { mutate } = confirm;
  const sent = useRef(false);

  // The link works once, so it is confirmed once even under StrictMode's double effects.
  useEffect(() => {
    if (token && email && !sent.current) {
      sent.current = true;
      mutate({ token, email });
    }
  }, [token, email, mutate]);

  let icon = <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />;
  let title = "Changing your email…";
  let description = "One moment.";

  if (!token || !email) {
    icon = <TriangleAlert className="size-8 text-danger" aria-hidden />;
    title = "This link is incomplete";
    description = "Open the link again from the email we sent.";
  } else if (confirm.isError) {
    icon = <TriangleAlert className="size-8 text-danger" aria-hidden />;
    title = "We couldn't change your email";
    description = `${errorMessage(confirm.error)} The link may have expired, been used, or belong to another account.`;
  } else if (confirm.isSuccess) {
    icon = <CircleCheck className="size-8 text-success" aria-hidden />;
    title = "Email changed";
    description = `You now sign in with ${confirm.data.email}.`;
  }

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div role="status" className="flex max-w-md flex-col items-center gap-4 text-center">
        {icon}
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-ink-2">{description}</p>
        {confirm.isPending ? null : (
          <Link to="/settings" className={buttonVariants({ variant: "secondary" })}>
            Back to settings
          </Link>
        )}
      </div>
    </div>
  );
}
