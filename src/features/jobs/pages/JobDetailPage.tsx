import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Search,
  Send,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageSkeleton } from "@/components/feedback/PageSkeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreMeter } from "@/components/ui/ScoreMeter";
import type { ApplicationStatus } from "@/features/applications/api";
import { useCreateApplication } from "@/features/applications/api";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { useEnrichContacts, useJobContacts, type CompanyContact } from "@/features/contacts/api";
import { ContactCard } from "@/features/contacts/components/ContactCard";
import { ComposeOutreachDialog } from "@/features/outreach/components/ComposeOutreachDialog";
import { formatDate, humanize } from "@/lib/format";

import { useJob, type JobPosting } from "../api";
import { JobDescription } from "../components/JobDescription";

interface JobLinkState {
  matchScore?: number;
  applicationStatus?: ApplicationStatus | null;
}

function salaryRange(job: JobPosting): string | null {
  if (job.salaryMin == null && job.salaryMax == null) {
    return null;
  }
  const format = new Intl.NumberFormat(undefined, {
    style: job.salaryCurrency ? "currency" : "decimal",
    currency: job.salaryCurrency ?? undefined,
    maximumFractionDigits: 0,
  });
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${format.format(job.salaryMin)} – ${format.format(job.salaryMax)}`;
  }

  return format.format((job.salaryMin ?? job.salaryMax) as number);
}

export function JobDetailPage() {
  const jobId = useParams().jobId ?? "";
  const linkState = (useLocation().state ?? {}) as JobLinkState;
  const candidateId = useCandidateId();
  const job = useJob(jobId);
  const apply = useCreateApplication(candidateId);
  const [applied, setApplied] = useState(false);
  const applicationStatus = linkState.applicationStatus ?? null;

  if (job.isPending) {
    return <PageSkeleton />;
  }
  if (job.isError) {
    return (
      <ErrorState
        error={job.error}
        onRetry={() => void job.refetch()}
        title="This job didn't load"
      />
    );
  }

  const posting = job.data;
  const salary = salaryRange(posting);

  return (
    <>
      <Link
        to="/jobs"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-ink-2 hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Matched jobs
      </Link>

      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        {linkState.matchScore !== undefined ? (
          <ScoreMeter score={linkState.matchScore} size="lg" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {posting.status !== "ACTIVE" ? (
              <Badge tone="warning">{humanize(posting.status)}</Badge>
            ) : null}
            <Badge>{humanize(posting.source)}</Badge>
            {applicationStatus ? <ApplicationStatusBadge status={applicationStatus} /> : null}
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
            {posting.jobTitle}
          </h1>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
            <Meta icon={Building2} label="Company">
              {posting.companyName}
            </Meta>
            {posting.location ? (
              <Meta icon={MapPin} label="Location">
                {posting.location}
              </Meta>
            ) : null}
            {salary ? (
              <Meta icon={Wallet} label="Salary">
                {salary}
              </Meta>
            ) : null}
            <Meta icon={CalendarDays} label="Posted">
              {formatDate(posting.postedAt ?? posting.createdAt)}
            </Meta>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
          {applicationStatus || applied ? (
            <Link to="/applications" className={buttonVariants({ variant: "secondary" })}>
              View application
            </Link>
          ) : (
            <Button
              loading={apply.isPending}
              disabled={posting.status !== "ACTIVE"}
              onClick={() => apply.mutate(posting.jobId, { onSuccess: () => setApplied(true) })}
            >
              <Send aria-hidden />
              Apply with AutoReach
            </Button>
          )}
          <a
            href={posting.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: "secondary" })}
          >
            <ExternalLink aria-hidden />
            Open posting
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>About the role</CardTitle>
          </CardHeader>
          <CardBody>
            <JobDescription description={posting.jobDescription} />
          </CardBody>
        </Card>
        <JobContacts candidateId={candidateId} jobId={posting.jobId} />
      </div>
    </>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <dt className="sr-only">{label}</dt>
      <Icon className="size-4 text-ink-3" aria-hidden />
      <dd>{children}</dd>
    </div>
  );
}

function JobContacts({ candidateId, jobId }: { candidateId: string; jobId: string }) {
  const contacts = useJobContacts(candidateId, jobId);
  const enrich = useEnrichContacts(candidateId, jobId);
  const [composeFor, setComposeFor] = useState<CompanyContact | null>(null);

  return (
    <section aria-labelledby="job-contacts" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="job-contacts" className="font-sans text-base font-semibold">
          People to reach
        </h2>
        <Button
          variant="secondary"
          size="sm"
          loading={enrich.isPending}
          disabled={enrich.isSuccess}
          onClick={() =>
            enrich.mutate(undefined, {
              onSuccess: () => setTimeout(() => void contacts.refetch(), 8_000),
            })
          }
        >
          <Search aria-hidden />
          {enrich.isSuccess ? "Searching…" : "Find people"}
        </Button>
      </div>

      {contacts.isPending ? (
        <ListSkeleton rows={3} rowClassName="h-36" />
      ) : contacts.isError ? (
        <ErrorState error={contacts.error} onRetry={() => void contacts.refetch()} />
      ) : contacts.data.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No one found yet"
          description="Find people looks up recruiters and hiring managers at this company."
        />
      ) : (
        contacts.data.map((contact) => (
          <ContactCard
            key={contact.contactId}
            contact={contact}
            action={
              contact.anonymizedAt ? null : (
                <Button size="sm" onClick={() => setComposeFor(contact)}>
                  <Send aria-hidden />
                  Reach out
                </Button>
              )
            }
          />
        ))
      )}

      <ComposeOutreachDialog
        candidateId={candidateId}
        jobId={jobId}
        contact={composeFor}
        onOpenChange={(open) => !open && setComposeFor(null)}
      />
    </section>
  );
}
