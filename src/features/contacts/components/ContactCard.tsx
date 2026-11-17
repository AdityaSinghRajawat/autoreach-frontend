import { ExternalLink, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatRelative, humanize } from "@/lib/format";

import type { CompanyContact } from "../api";

const emailLooks: Record<
  CompanyContact["emailVerificationStatus"],
  { label: string; tone: BadgeTone }
> = {
  VERIFIED: { label: "Email verified", tone: "success" },
  UNVERIFIED: { label: "Email unverified", tone: "neutral" },
  RISKY: { label: "Email risky", tone: "warning" },
  INVALID: { label: "Email invalid", tone: "danger" },
};

interface ContactCardProps {
  contact: CompanyContact;
  showCompany?: boolean;
  action?: ReactNode;
}

export function ContactCard({ contact, showCompany = false, action }: ContactCardProps) {
  if (contact.anonymizedAt) {
    return (
      <Card className="flex items-center gap-3 p-4 text-sm text-ink-3">
        <UserRound className="size-4" aria-hidden />
        Details removed under the data retention policy.
      </Card>
    );
  }

  const email = emailLooks[contact.emailVerificationStatus];
  const initials = contact.fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary uppercase"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{contact.fullName}</p>
          <p className="truncate text-sm text-ink-2">
            {contact.title}
            {showCompany ? ` · ${contact.companyName}` : ""}
          </p>
        </div>
        <Badge tone="primary">{humanize(contact.roleType)}</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {contact.workEmail ? (
          <Badge tone={contact.emailConfirmedAt ? "success" : email.tone}>
            {contact.emailConfirmedAt ? <ShieldCheck className="size-3" aria-hidden /> : null}
            {contact.emailConfirmedAt ? "Email confirmed by reply" : email.label}
          </Badge>
        ) : (
          <Badge>No email</Badge>
        )}
        {contact.linkedinConfirmedAt ? <Badge tone="success">Connected on LinkedIn</Badge> : null}
        {contact.lastInteractionAt ? (
          <Badge tone="live">Replied {formatRelative(contact.lastInteractionAt)}</Badge>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 text-sm">
        {contact.workEmail ? (
          <a
            href={`mailto:${contact.workEmail}`}
            className="inline-flex min-w-0 items-center gap-1.5 text-ink-2 hover:text-primary"
          >
            <Mail className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{contact.workEmail}</span>
          </a>
        ) : null}
        {contact.linkedinUrl ? (
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-ink-2 hover:text-primary"
          >
            <ExternalLink className="size-4" aria-hidden />
            LinkedIn
          </a>
        ) : null}
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
    </Card>
  );
}
