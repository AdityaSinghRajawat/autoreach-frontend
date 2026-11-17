import { ChevronRight, Gauge, Mail, PauseCircle, Sparkles } from "lucide-react";
import { Link } from "react-router";

import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent, humanize } from "@/lib/format";

import { useProviders, useQueues, type QueueSummary } from "../api";
import { queueLabels } from "../queueLabels";

export function AdminConsolePage() {
  const queues = useQueues();
  const providers = useProviders();

  return (
    <>
      <PageHeader
        eyebrow={
          <Badge tone="primary">
            <Gauge className="size-3" aria-hidden />
            Admin
          </Badge>
        }
        title="Console"
        description="Background work and the providers it depends on. Refreshes every few seconds."
      />

      <section aria-labelledby="queues-title">
        <h2 id="queues-title" className="mb-3 font-sans text-base font-semibold">
          Queues
        </h2>
        {queues.isPending ? (
          <ListSkeleton rows={2} rowClassName="h-36" />
        ) : queues.isError ? (
          <ErrorState error={queues.error} onRetry={() => void queues.refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {queues.data.map((queue) => (
              <QueueCard key={queue.queue} queue={queue} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="providers-title" className="mt-8">
        <h2 id="providers-title" className="mb-3 font-sans text-base font-semibold">
          Providers
        </h2>
        {providers.isPending ? (
          <ListSkeleton rows={1} rowClassName="h-48" />
        ) : providers.isError ? (
          <ErrorState error={providers.error} onRetry={() => void providers.refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden />
                  Contact enrichment today
                </CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-5">
                {providers.data.enrichment.map((provider) => (
                  <div key={provider.code}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        {humanize(provider.code)}
                        {provider.configured ? null : <Badge>Not configured</Badge>}
                      </span>
                      <span className="font-mono text-xs text-ink-2 tabular">
                        {formatNumber(provider.creditsUsedToday)} /{" "}
                        {formatNumber(provider.dailyCreditLimit)} credits
                      </span>
                    </div>
                    <Meter
                      value={provider.creditsUsedToday}
                      max={provider.dailyCreditLimit}
                      label={`${provider.code} credits used today`}
                    />
                    <p className="mt-1 text-xs text-ink-3">
                      Up to {provider.rateLimit} calls every {provider.rateWindowSeconds}s
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" aria-hidden />
                  Email deliverability
                </CardTitle>
              </CardHeader>
              <CardBody>
                <p className="font-mono text-4xl font-semibold tabular">
                  {providers.data.email.deliverabilityPercentage === null
                    ? "—"
                    : formatPercent(providers.data.email.deliverabilityPercentage, 1)}
                </p>
                <p className="mt-2 text-sm text-ink-2">
                  {formatNumber(providers.data.email.sent)} sent,{" "}
                  {formatNumber(providers.data.email.bounced)} bounced in the last{" "}
                  {providers.data.email.windowDays} days
                </p>
              </CardBody>
            </Card>
          </div>
        )}
      </section>
    </>
  );
}

function QueueCard({ queue }: { queue: QueueSummary }) {
  const label = queueLabels[queue.queue];
  const backlog = queue.pending + queue.scheduled + queue.retry;

  return (
    <Link
      to={`/admin/queues/${queue.queue}`}
      className="group flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium group-hover:text-primary">{label.title}</p>
          <p className="text-xs text-ink-3">{label.detail}</p>
        </div>
        {queue.paused ? (
          <Badge tone="warning">
            <PauseCircle className="size-3" aria-hidden />
            Paused
          </Badge>
        ) : queue.active > 0 ? (
          <Badge tone="live" dot>
            Working
          </Badge>
        ) : (
          <Badge dot>Idle</Badge>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Waiting" value={backlog} />
        <Stat label="Done today" value={queue.processedToday} />
        <Stat label="Dead" value={queue.dead} alert={queue.dead > 0} />
      </dl>
      <div className="flex items-center justify-between text-xs text-ink-3">
        <span>
          {queue.failedToday > 0
            ? `${formatNumber(queue.failedToday)} failed today`
            : "No failures today"}
          {queue.latencySeconds > 0 ? ` · oldest ${Math.round(queue.latencySeconds)}s` : ""}
        </span>
        <ChevronRight className="size-4" aria-hidden />
      </div>
    </Link>
  );
}

function Stat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-md bg-surface-2 px-2 py-2">
      <dt className="text-[11px] text-ink-3">{label}</dt>
      <dd className={cn("font-mono text-lg font-semibold tabular", alert && "text-danger")}>
        {formatNumber(value)}
      </dd>
    </div>
  );
}
