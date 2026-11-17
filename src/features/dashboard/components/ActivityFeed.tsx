import { Radio } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelative } from "@/lib/format";

import { useActivity } from "../api";
import { activityLink, eventLooks } from "../activityText";

const toneClasses = {
  neutral: "bg-surface-2 text-ink-2",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  live: "bg-ember-soft text-ember",
};

export function ActivityFeed() {
  const activity = useActivity();
  const items = activity.data?.pages.flatMap((page) => page.items) ?? [];

  if (activity.isPending) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Loading activity">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14" />
        ))}
      </div>
    );
  }

  if (activity.isError) {
    return <ErrorState error={activity.error} onRetry={() => void activity.refetch()} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="Nothing has happened yet"
        description="Matches, applications and replies show up here the moment they happen."
      />
    );
  }

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const look = eventLooks[item.eventType];

            return (
              <motion.li
                key={item.eventId}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              >
                <Link
                  to={activityLink(item)}
                  className="-mx-2 flex items-start gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                      toneClasses[look.tone],
                    )}
                  >
                    <look.icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{look.verb(item)}</span>
                    <span className="block truncate text-sm text-ink-2">
                      {item.jobTitle} · {item.companyName}
                    </span>
                  </span>
                  <time
                    dateTime={item.occurredAt}
                    title={formatDateTime(item.occurredAt)}
                    className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-ink-3"
                  >
                    {formatRelative(item.occurredAt)}
                  </time>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {activity.hasNextPage ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-center"
          loading={activity.isFetchingNextPage}
          onClick={() => void activity.fetchNextPage()}
        >
          Show older activity
        </Button>
      ) : null}
    </div>
  );
}

export function StreamBadge({ status }: { status: "connecting" | "live" | "offline" }) {
  if (status === "live") {
    return (
      <Badge tone="live" className="relative">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-ember" />
          <span className="relative size-1.5 rounded-full bg-ember" />
        </span>
        Live
      </Badge>
    );
  }

  return <Badge tone="neutral">{status === "connecting" ? "Connecting…" : "Reconnecting…"}</Badge>;
}
