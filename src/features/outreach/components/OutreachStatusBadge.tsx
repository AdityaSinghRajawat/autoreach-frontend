import { Badge } from "@/components/ui/Badge";

import type { OutreachStatus } from "../api";
import { outreachStatusLooks } from "../status";

export function OutreachStatusBadge({ status }: { status: OutreachStatus }) {
  const look = outreachStatusLooks[status];

  return (
    <Badge tone={look.tone} dot>
      {look.label}
    </Badge>
  );
}
