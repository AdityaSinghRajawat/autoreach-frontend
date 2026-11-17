import { Mail, MessageCircle, UserPlus, type LucideIcon } from "lucide-react";

import type { BadgeTone } from "@/components/ui/Badge";

import type { OutreachChannel, OutreachStatus, Template } from "./api";

export const outreachStatusLooks: Record<OutreachStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Scheduled", tone: "neutral" },
  SENDING: { label: "Sending", tone: "primary" },
  ACTION_REQUIRED: { label: "Your turn", tone: "warning" },
  SENT: { label: "Sent", tone: "primary" },
  ACCEPTED: { label: "Accepted", tone: "success" },
  REPLIED: { label: "Replied", tone: "live" },
  FAILED: { label: "Failed", tone: "danger" },
  BOUNCED: { label: "Bounced", tone: "danger" },
  PAUSED: { label: "Paused", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const channelIcons: Record<OutreachChannel, LucideIcon> = {
  EMAIL: Mail,
  LINKEDIN_CONNECT: UserPlus,
  LINKEDIN_DM: MessageCircle,
};

export const templateStatusLooks: Record<Template["status"], { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  APPROVED: { label: "Approved", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export function isCancellable(status: OutreachStatus): boolean {
  return status === "PENDING" || status === "PAUSED";
}
