import { LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

import type { ApplicationStatus } from "../api";
import { applicationStatusLooks } from "../status";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const look = applicationStatusLooks[status];
  const working = status === "QUEUED" || status === "IN_PROGRESS";

  return (
    <Badge tone={look.tone} dot={!working}>
      {working ? <LoaderCircle className="size-3 animate-spin" aria-hidden /> : null}
      {look.label}
    </Badge>
  );
}
