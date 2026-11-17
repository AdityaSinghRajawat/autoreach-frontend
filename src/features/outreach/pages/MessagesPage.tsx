import { Inbox } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { FilterChips } from "@/components/ui/FilterChips";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelative } from "@/lib/format";
import { usePageParam, useSearchParam } from "@/lib/useSearchParam";

import {
  useCancelOutreach,
  useOutreachMessages,
  type OutreachMessageDetail,
  type OutreachStatus,
} from "../api";
import { OutreachStatusBadge } from "../components/OutreachStatusBadge";
import { channelLabels } from "../placeholders";
import { channelIcons, isCancellable } from "../status";

const filters: { value: OutreachStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "PENDING", label: "Scheduled" },
  { value: "SENT", label: "Sent" },
  { value: "REPLIED", label: "Replied" },
  { value: "ACTION_REQUIRED", label: "Your turn" },
  { value: "BOUNCED", label: "Bounced" },
  { value: "FAILED", label: "Failed" },
  { value: "PAUSED", label: "Paused" },
  { value: "CANCELLED", label: "Cancelled" },
];

function parseStatus(value: string | null): OutreachStatus | null {
  return filters.find((filter) => filter.value === value)?.value ?? null;
}

export function MessagesPage() {
  const candidateId = useCandidateId();
  const [page, setPage] = usePageParam();
  const [statusParam, setStatus] = useSearchParam("status");
  const status = parseStatus(statusParam);
  const messages = useOutreachMessages(candidateId, status, page);
  const cancel = useCancelOutreach(candidateId);
  const [open, setOpen] = useState<OutreachMessageDetail | null>(null);
  const [cancelling, setCancelling] = useState<OutreachMessageDetail | null>(null);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Every email and LinkedIn step sent or scheduled on your behalf."
        actions={
          <Link to="/outreach/linkedin" className={buttonVariants({ variant: "secondary" })}>
            Open LinkedIn queue
          </Link>
        }
      />
      <FilterChips label="Filter by status" options={filters} value={status} onChange={setStatus} />

      {messages.isPending ? (
        <ListSkeleton rows={6} />
      ) : messages.isError ? (
        <ErrorState error={messages.error} onRetry={() => void messages.refetch()} />
      ) : messages.data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status ? "Nothing with this status" : "No messages yet"}
          description={
            status
              ? "Try another filter."
              : "Reach out from a matched job, or turn on automatic outreach with an active campaign."
          }
        />
      ) : (
        <>
          <ul
            className={cn(
              "divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface transition-opacity",
              messages.isPlaceholderData && "opacity-60",
            )}
          >
            {messages.data.items.map((message) => {
              const Icon = channelIcons[message.channel];
              const when = message.sentAt ?? message.scheduledAt;

              return (
                <li
                  key={message.outreachId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2">
                    <Icon className="size-4" aria-label={channelLabels[message.channel]} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(message)}
                    className="min-w-0 flex-1 rounded-md text-left"
                  >
                    <span className="block truncate text-sm font-medium">
                      {message.contact?.fullName ?? "Removed contact"}
                      <span className="font-normal text-ink-3">
                        {message.contact ? ` · ${message.contact.companyName}` : ""}
                      </span>
                    </span>
                    <span className="block truncate text-sm text-ink-2">
                      {message.subject ?? message.linkedinNote ?? message.bodyContent}
                    </span>
                  </button>
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <OutreachStatusBadge status={message.status} />
                    <time
                      dateTime={when}
                      title={formatDateTime(when)}
                      className="text-xs text-ink-3"
                    >
                      {formatRelative(when)}
                    </time>
                  </div>
                  {isCancellable(message.status) ? (
                    <Button variant="ghost" size="sm" onClick={() => setCancelling(message)}>
                      Cancel
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <Pagination meta={messages.data.meta} onPageChange={setPage} noun="messages" />
        </>
      )}

      <MessageDialog message={open} onClose={() => setOpen(null)} />

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(next) => !next && setCancelling(null)}
        title="Cancel this message?"
        description="It won't be sent. Later steps to the same person still go out unless you cancel them too."
        confirmLabel="Cancel message"
        destructive
        pending={cancel.isPending}
        onConfirm={() =>
          cancelling &&
          cancel.mutate(cancelling.outreachId, { onSuccess: () => setCancelling(null) })
        }
      />
    </>
  );
}

function MessageDialog({
  message,
  onClose,
}: {
  message: OutreachMessageDetail | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={message !== null} onOpenChange={(next) => !next && onClose()}>
      {message ? (
        <DialogContent
          size="lg"
          title={message.subject ?? channelLabels[message.channel]}
          description={
            message.contact
              ? `To ${message.contact.fullName}, ${message.contact.title} at ${message.contact.companyName}`
              : undefined
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
              <OutreachStatusBadge status={message.status} />
              <span>Step {message.stepNumber}</span>
              <span>·</span>
              <span>
                {message.sentAt
                  ? `Sent ${formatDateTime(message.sentAt)}`
                  : `Scheduled ${formatDateTime(message.scheduledAt)}`}
              </span>
            </div>
            {message.failureReason ? (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-sm">{message.failureReason}</p>
            ) : null}
            {message.linkedinNote ? (
              <blockquote className="rounded-md border-l-2 border-primary bg-surface-2 px-4 py-3 text-sm whitespace-pre-line">
                {message.linkedinNote}
              </blockquote>
            ) : null}
            {message.bodyContent ? (
              <div className="rounded-md border border-border px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
                {message.bodyContent}
              </div>
            ) : null}
            <Link
              to={`/jobs/${message.jobId}`}
              className="text-sm text-primary hover:underline"
              onClick={onClose}
            >
              View the job
            </Link>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
