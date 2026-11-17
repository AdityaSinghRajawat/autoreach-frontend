import {
  Activity,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  Gauge,
  Inbox,
  KeyRound,
  Layers,
  UserPlus,
  Mail,
  Megaphone,
  Rss,
  ShieldBan,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  keywords?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const candidateNavigation: NavSection[] = [
  {
    title: "Pipeline",
    items: [
      { label: "Home", to: "/", icon: Activity, end: true, keywords: "dashboard funnel activity" },
      { label: "Jobs", to: "/jobs", icon: BriefcaseBusiness, keywords: "matches" },
      { label: "Applications", to: "/applications", icon: ClipboardCheck },
    ],
  },
  {
    title: "Outreach",
    items: [
      { label: "Messages", to: "/outreach", icon: Inbox, end: true, keywords: "emails sent" },
      { label: "LinkedIn queue", to: "/outreach/linkedin", icon: UserPlus },
      {
        label: "Campaigns",
        to: "/outreach/campaigns",
        icon: Megaphone,
        keywords: "sequence steps",
      },
      { label: "Templates", to: "/outreach/templates", icon: Layers },
      { label: "Contacts", to: "/contacts", icon: UsersRound, keywords: "recruiters people" },
    ],
  },
  {
    title: "Setup",
    items: [
      { label: "Resumes", to: "/resumes", icon: FileText, keywords: "cv upload" },
      { label: "Profile", to: "/profile", icon: UserRound, keywords: "preferences application" },
      { label: "Mailboxes", to: "/mailboxes", icon: Mail, keywords: "smtp channel accounts" },
    ],
  },
];

export const adminNavigation: NavSection[] = [
  {
    title: "Admin",
    items: [
      { label: "Console", to: "/admin", icon: Gauge, end: true, keywords: "queues providers" },
      { label: "Job sources", to: "/admin/job-sources", icon: Rss, keywords: "boards polling" },
      { label: "API clients", to: "/admin/api-clients", icon: KeyRound, keywords: "keys ingest" },
      {
        label: "Suppressions",
        to: "/admin/suppressions",
        icon: ShieldBan,
        keywords: "unsubscribe",
      },
      { label: "All contacts", to: "/admin/contacts", icon: UsersRound, keywords: "signals" },
    ],
  },
];
