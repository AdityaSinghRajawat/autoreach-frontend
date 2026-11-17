import {
  BadgeCheck,
  CalendarCheck,
  CircleSlash,
  ClipboardCheck,
  Hand,
  MailOpen,
  MailWarning,
  MessageSquareReply,
  MousePointerClick,
  Send,
  Sparkles,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { BadgeTone } from "@/components/ui/Badge";

import type { ActivityItem, FunnelStage } from "./api";

type EventType = ActivityItem["eventType"];

interface EventLook {
  icon: LucideIcon;
  tone: BadgeTone;
  verb: (item: ActivityItem) => string;
}

const person = (item: ActivityItem) => item.contactName ?? "A contact";
const linkedin = (item: ActivityItem) => item.channel?.startsWith("LINKEDIN") ?? false;

export const eventLooks: Record<EventType, EventLook> = {
  JOB_MATCHED: { icon: Sparkles, tone: "primary", verb: () => "New match" },
  APPLICATION_SUBMITTED: { icon: ClipboardCheck, tone: "success", verb: () => "Applied" },
  APPLICATION_ACTION_REQUIRED: {
    icon: Hand,
    tone: "warning",
    verb: () => "Ready for you to submit",
  },
  APPLICATION_INTERVIEWING: { icon: CalendarCheck, tone: "success", verb: () => "Interviewing" },
  APPLICATION_REJECTED: { icon: XCircle, tone: "neutral", verb: () => "Not moving forward" },
  OUTREACH_SENT: {
    icon: Send,
    tone: "primary",
    verb: (item) =>
      linkedin(item) ? `LinkedIn request to ${person(item)}` : `Emailed ${person(item)}`,
  },
  OUTREACH_OPENED: {
    icon: MailOpen,
    tone: "neutral",
    verb: (item) => `${person(item)} opened your email`,
  },
  OUTREACH_CLICKED: {
    icon: MousePointerClick,
    tone: "primary",
    verb: (item) => `${person(item)} clicked a link`,
  },
  OUTREACH_BOUNCED: {
    icon: MailWarning,
    tone: "danger",
    verb: (item) => `Email to ${person(item)} bounced`,
  },
  OUTREACH_REPLIED: {
    icon: MessageSquareReply,
    tone: "live",
    verb: (item) => `${person(item)} replied`,
  },
  OUTREACH_AUTO_REPLIED: {
    icon: BadgeCheck,
    tone: "neutral",
    verb: (item) => `Auto-reply from ${person(item)}`,
  },
  OUTREACH_UNSUBSCRIBED: {
    icon: CircleSlash,
    tone: "neutral",
    verb: (item) => `${person(item)} opted out`,
  },
  OUTREACH_ACCEPTED: {
    icon: UserCheck,
    tone: "success",
    verb: (item) => `${person(item)} accepted your request`,
  },
};

// Which Reach Path station a live event moves, so the path can pulse there.
export function stationForEvent(item: ActivityItem): FunnelStage["stage"] | null {
  switch (item.eventType) {
    case "JOB_MATCHED":
      return "JOBS_MATCHED";
    case "APPLICATION_SUBMITTED":
      return "APPLICATIONS_SUBMITTED";
    case "APPLICATION_INTERVIEWING":
      return "INTERVIEWS";
    case "OUTREACH_SENT":
      return linkedin(item) ? "LINKEDIN_REQUESTS_SENT" : "COLD_EMAILS_SENT";
    case "OUTREACH_REPLIED":
      return "RECRUITER_RESPONSES";
    default:
      return null;
  }
}

export function activityLink(item: ActivityItem): string {
  return item.applicationId ? `/applications/${item.applicationId}` : `/jobs/${item.jobId}`;
}
