import {
  ArrowLeft,
  CalendarCheck,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Hand,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { useCandidateId } from "@/api/session";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageSkeleton } from "@/components/feedback/PageSkeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { ScoreMeter } from "@/components/ui/ScoreMeter";
import { formatDateTime, humanize } from "@/lib/format";

import {
  useApplication,
  useUpdateApplication,
  type ApplicationDetail,
  type ApplicationOutcome,
} from "../api";
import { ApplicationStatusBadge } from "../components/ApplicationStatusBadge";

export function ApplicationDetailPage() {
  const applicationId = useParams().applicationId ?? "";
  const candidateId = useCandidateId();
  const application = useApplication(candidateId, applicationId);

  if (application.isPending) {
    return <PageSkeleton />;
  }
  if (application.isError) {
    return (
      <ErrorState
        error={application.error}
        onRetry={() => void application.refetch()}
        title="This application didn't load"
      />
    );
  }

  const detail = application.data;

  return (
    <>
      <Link
        to="/applications"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-ink-2 hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Applications
      </Link>

      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <ScoreMeter score={detail.matchScore} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ApplicationStatusBadge status={detail.status} />
            <Badge>{humanize(detail.atsType)}</Badge>
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
            {detail.job?.jobTitle ?? "Job no longer available"}
          </h1>
          {detail.job ? (
            <p className="mt-1 text-ink-2">
              <Link to={`/jobs/${detail.job.jobId}`} className="hover:text-primary hover:underline">
                {detail.job.companyName}
              </Link>
              {detail.job.location ? ` · ${detail.job.location}` : ""}
            </p>
          ) : null}
        </div>
      </header>

      <NextStep candidateId={candidateId} application={detail} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <PreparedAnswers application={detail} />
        <Timeline application={detail} />
      </div>
    </>
  );
}

function NextStep({
  candidateId,
  application,
}: {
  candidateId: string;
  application: ApplicationDetail;
}) {
  const update = useUpdateApplication(candidateId, application.applicationId);
  const [confirming, setConfirming] = useState<ApplicationOutcome | null>(null);
  const openForm = (
    <a
      href={application.applyUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={buttonVariants({ variant: "secondary" })}
    >
      <ExternalLink aria-hidden />
      Open the application
    </a>
  );

  const prompts: Record<ApplicationOutcome, { title: string; description: string; label: string }> =
    {
      SUBMITTED: {
        title: "Mark as submitted?",
        description: "Only do this once the employer has your application.",
        label: "Mark submitted",
      },
      INTERVIEWING: {
        title: "Moving to interviews?",
        description: "The application counts toward your interviews on the Reach Path.",
        label: "Mark interviewing",
      },
      REJECTED: {
        title: "Close this application?",
        description: "Use this when the company says no or the role is filled.",
        label: "Close application",
      },
    };

  let callout: React.ReactNode = null;
  switch (application.status) {
    case "ACTION_REQUIRED":
      callout = (
        <Callout
          tone="warning"
          icon={Hand}
          title="Ready for you to submit"
          description="This employer's form can't be sent automatically. Your answers are prepared below: open the form, paste them in, submit, then mark it submitted here."
        >
          {openForm}
          <Button onClick={() => setConfirming("SUBMITTED")}>I submitted it</Button>
        </Callout>
      );
      break;
    case "FAILED":
      callout = (
        <Callout
          tone="danger"
          icon={CircleAlert}
          title="Submitting didn't work"
          description={application.failureReason ?? "The job board rejected the attempt."}
        >
          {openForm}
          <Button variant="secondary" onClick={() => setConfirming("SUBMITTED")}>
            I submitted it myself
          </Button>
        </Callout>
      );
      break;
    case "SUBMITTED":
      callout = (
        <Callout
          tone="success"
          icon={CircleCheck}
          title="Submitted"
          description={`${
            application.submittedAt ? `Sent ${formatDateTime(application.submittedAt)}. ` : ""
          }Heard back? Record it so your Reach Path stays accurate.`}
        >
          <Button onClick={() => setConfirming("INTERVIEWING")}>
            <CalendarCheck aria-hidden />
            Interviewing
          </Button>
          <Button variant="secondary" onClick={() => setConfirming("REJECTED")}>
            <XCircle aria-hidden />
            Not moving forward
          </Button>
        </Callout>
      );
      break;
    case "INTERVIEWING":
      callout = (
        <Callout
          tone="live"
          icon={CalendarCheck}
          title="Interviewing"
          description="Good luck. Close it here if it doesn't work out."
        >
          <Button variant="secondary" onClick={() => setConfirming("REJECTED")}>
            Close application
          </Button>
        </Callout>
      );
      break;
    default:
      callout = null;
  }

  const prompt = confirming ? prompts[confirming] : null;

  return (
    <>
      {callout}
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={prompt?.title ?? ""}
        description={prompt?.description ?? ""}
        confirmLabel={prompt?.label ?? "Confirm"}
        destructive={confirming === "REJECTED"}
        pending={update.isPending}
        onConfirm={() =>
          confirming && update.mutate(confirming, { onSuccess: () => setConfirming(null) })
        }
      />
    </>
  );
}

const calloutTones = {
  warning: "border-warning/40 bg-warning-soft",
  danger: "border-danger/40 bg-danger-soft",
  success: "border-success/40 bg-success-soft",
  live: "border-ember/40 bg-ember-soft",
};

interface CalloutProps {
  tone: keyof typeof calloutTones;
  icon: typeof Hand;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Callout({ tone, icon: Icon, title, description, children }: CalloutProps) {
  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center ${calloutTones[tone]}`}
    >
      <Icon className="size-6 shrink-0" aria-hidden />
      <div className="flex-1">
        <h2 className="font-sans text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-2">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function PreparedAnswers({ application }: { application: ApplicationDetail }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Prepared answers</CardTitle>
          <p className="mt-1 text-sm text-ink-2">Filled in from your profile and resume.</p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {application.missingAnswers.length > 0 ? (
          <div className="rounded-lg border border-warning/40 bg-warning-soft p-4">
            <p className="text-sm font-medium">Questions without an answer</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink-2">
              {application.missingAnswers.map((missing) => (
                <li key={missing.fieldName}>{missing.label}</li>
              ))}
            </ul>
            <Link
              to="/profile?tab=answers"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Add answers to your profile
            </Link>
          </div>
        ) : null}
        {application.preparedAnswers.length === 0 ? (
          <p className="text-sm text-ink-3">
            {application.status === "QUEUED" || application.status === "IN_PROGRESS"
              ? "Answers are being prepared…"
              : "No answers were needed."}
          </p>
        ) : (
          <dl className="divide-y divide-border">
            {application.preparedAnswers.map((answer) => {
              const value = answer.values?.length ? answer.values.join(", ") : answer.value;

              return (
                <div
                  key={answer.fieldName}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-ink-3">{answer.label}</dt>
                    <dd className="mt-0.5 text-sm break-words whitespace-pre-line">
                      {value || "—"}
                    </dd>
                  </div>
                  {value ? <CopyButton value={value} label="Copy" variant="ghost" /> : null}
                </div>
              );
            })}
          </dl>
        )}
      </CardBody>
    </Card>
  );
}

function Timeline({ application }: { application: ApplicationDetail }) {
  const entries = [...application.executionLogs].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardBody>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-3">Nothing has happened yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
            {entries.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="relative">
                <span
                  className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-primary"
                  aria-hidden
                />
                <p className="text-sm font-medium">{humanize(entry.step)}</p>
                {entry.detail ? <p className="text-sm text-ink-2">{entry.detail}</p> : null}
                <time dateTime={entry.at} className="text-xs text-ink-3">
                  {formatDateTime(entry.at)}
                </time>
              </li>
            ))}
          </ol>
        )}
        {application.externalConfirmation ? (
          <p className="mt-4 rounded-md bg-surface-2 px-3 py-2 font-mono text-xs break-all">
            Confirmation: {application.externalConfirmation}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
