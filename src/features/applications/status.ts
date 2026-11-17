import type { BadgeTone } from "@/components/ui/Badge";

import type { ApplicationStatus } from "./api";

export const applicationStatusLooks: Record<ApplicationStatus, { label: string; tone: BadgeTone }> =
  {
    QUEUED: { label: "Queued", tone: "neutral" },
    IN_PROGRESS: { label: "Preparing", tone: "primary" },
    ACTION_REQUIRED: { label: "Ready to submit", tone: "warning" },
    SUBMITTED: { label: "Submitted", tone: "success" },
    INTERVIEWING: { label: "Interviewing", tone: "live" },
    REJECTED: { label: "Closed", tone: "neutral" },
    FAILED: { label: "Failed", tone: "danger" },
  };
