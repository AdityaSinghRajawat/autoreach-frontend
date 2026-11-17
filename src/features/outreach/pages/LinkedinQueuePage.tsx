import { CheckCheck, ExternalLink, Info, MessageSquareReply, Send, UserCheck } from "lucide-react";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatRelative } from "@/lib/format";
import { usePageParam, useSearchParam } from "@/lib/useSearchParam";

import {
  useConfirmLinkedin,
  useOutreachMessages,
  type LinkedinOutcome,
  type OutreachMessageDetail,
} from "../api";
import { channelLabels } from "../placeholders";

export function LinkedinQueuePage() {
  const [tab, setTab] = useSearchParam("tab");
  const current = tab === "sent" ? "sent" : "todo";

  return (
    <>
      <PageHeader
        title="LinkedIn queue"
        description="AutoReach writes the note; you send it from your own LinkedIn account, then tell us what happened."
      />
      <div className="mb-6 flex gap-3 rounded-lg border border-border bg-surface-2/60 p-4 text-sm text-ink-2">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          LinkedIn doesn't allow automation, so nothing here is sent for you. Copy the note, open
          the profile, send it yourself, and mark it done. Follow-up messages wait until a request
          is accepted.
        </p>
      </div>
      <Tabs value={current} onValueChange={(value) => setTab(value === "todo" ? null : value)}>
        <TabsList>
          <TabsTrigger value="todo">To send</TabsTrigger>
          <TabsTrigger value="sent">Waiting on a reply</TabsTrigger>
        </TabsList>
        <TabsContent value="todo">
          <QueueList status="ACTION_REQUIRED" />
        </TabsContent>
        <TabsContent value="sent">
          <QueueList status="SENT" />
        </TabsContent>
      </Tabs>
    </>
  );
}

function QueueList({ status }: { status: "ACTION_REQUIRED" | "SENT" }) {
  const candidateId = useCandidateId();
  const [page, setPage] = usePageParam();
  const messages = useOutreachMessages(candidateId, status, page);
  const confirm = useConfirmLinkedin(candidateId);

  if (messages.isPending) {
    return <ListSkeleton rows={3} rowClassName="h-44" />;
  }
  if (messages.isError) {
    return <ErrorState error={messages.error} onRetry={() => void messages.refetch()} />;
  }

  const items = messages.data.items.filter((message) => message.channel !== "EMAIL");
  if (items.length === 0) {
    return (
      <EmptyState
        icon={CheckCheck}
        title={status === "ACTION_REQUIRED" ? "You're all caught up" : "Nothing waiting"}
        description={
          status === "ACTION_REQUIRED"
            ? "New LinkedIn steps show up here when a campaign or a reach-out needs them."
            : "Requests and messages you've sent appear here until someone accepts or replies."
        }
      />
    );
  }

  const record = (message: OutreachMessageDetail, outcome: LinkedinOutcome) =>
    confirm.mutate({ outreachId: message.outreachId, status: outcome });
  const busy = (message: OutreachMessageDetail, outcome: LinkedinOutcome) =>
    confirm.isPending &&
    confirm.variables.outreachId === message.outreachId &&
    confirm.variables.status === outcome;

  return (
    <>
      <div className="flex flex-col gap-4">
        {items.map((message) => {
          const text =
            message.channel === "LINKEDIN_CONNECT"
              ? (message.linkedinNote ?? "")
              : message.bodyContent;

          return (
            <Card key={message.outreachId} className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{message.contact?.fullName ?? "Removed contact"}</p>
                  <p className="text-sm text-ink-2">
                    {message.contact
                      ? `${message.contact.title} at ${message.contact.companyName}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="primary">{channelLabels[message.channel]}</Badge>
                  <span className="text-xs text-ink-3">
                    {formatRelative(message.sentAt ?? message.scheduledAt)}
                  </span>
                </div>
              </div>

              {text ? (
                <blockquote className="rounded-md border-l-2 border-primary bg-surface-2 px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
                  {text}
                </blockquote>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {text ? <CopyButton value={text} label="Copy text" /> : null}
                {message.contact?.linkedinUrl ? (
                  <a
                    href={message.contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    <ExternalLink aria-hidden />
                    Open profile
                  </a>
                ) : null}
                <span className="hidden flex-1 sm:block" />
                {status === "ACTION_REQUIRED" ? (
                  <Button
                    size="sm"
                    loading={busy(message, "SENT")}
                    onClick={() => record(message, "SENT")}
                  >
                    <Send aria-hidden />I sent it
                  </Button>
                ) : null}
                {message.channel === "LINKEDIN_CONNECT" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy(message, "ACCEPTED")}
                    onClick={() => record(message, "ACCEPTED")}
                  >
                    <UserCheck aria-hidden />
                    Accepted
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busy(message, "REPLIED")}
                  onClick={() => record(message, "REPLIED")}
                >
                  <MessageSquareReply aria-hidden />
                  They replied
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Pagination meta={messages.data.meta} onPageChange={setPage} />
    </>
  );
}
