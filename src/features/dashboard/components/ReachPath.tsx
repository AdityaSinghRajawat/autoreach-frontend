import { motion } from "motion/react";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatCompact, formatNumber } from "@/lib/format";

import type { FunnelStage } from "../api";

const stationLabels: Record<FunnelStage["stage"], { label: string; hint: string }> = {
  JOBS_SCRAPED: { label: "Found", hint: "Jobs collected from your sources" },
  JOBS_MATCHED: { label: "Matched", hint: "Scored above your match threshold" },
  APPLICATIONS_SUBMITTED: { label: "Applied", hint: "Applications submitted" },
  COLD_EMAILS_SENT: { label: "Emailed", hint: "Cold emails sent to contacts" },
  LINKEDIN_REQUESTS_SENT: { label: "LinkedIn", hint: "Connection requests you sent" },
  RECRUITER_RESPONSES: { label: "Replies", hint: "People who wrote back" },
  INTERVIEWS: { label: "Interviews", hint: "Applications at interview stage" },
};

interface ReachPathProps {
  stages: FunnelStage[] | undefined;
  pulsingStage: FunnelStage["stage"] | null;
}

// The funnel drawn as one track: stations light up once something reaches them, and a live
// event pulses the station it moved.
export function ReachPath({ stages, pulsingStage }: ReachPathProps) {
  if (!stages) {
    return <Skeleton className="h-40" />;
  }

  const reached = stages.reduce((last, stage, index) => (stage.count > 0 ? index : last), -1);
  const progress = stages.length > 1 ? Math.max(reached, 0) / (stages.length - 1) : 0;

  return (
    <ol className="relative grid gap-0 lg:grid-cols-7" aria-label="Reach Path">
      <span
        className="absolute top-3 bottom-3 left-[11px] w-0.5 rounded-full bg-track lg:top-[11px] lg:right-[calc(100%/14)] lg:bottom-auto lg:left-[calc(100%/14)] lg:h-0.5 lg:w-auto"
        aria-hidden
      />
      <motion.span
        className="absolute top-3 left-[11px] w-0.5 origin-top rounded-full bg-gradient-to-b from-primary to-ember lg:hidden"
        style={{ bottom: `calc(${(1 - progress) * 100}% + 12px)` }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        aria-hidden
      />
      <motion.span
        className="absolute top-[11px] left-[calc(100%/14)] hidden h-0.5 origin-left rounded-full bg-gradient-to-r from-primary to-ember lg:block"
        style={{ width: `calc(${progress} * (100% - 100% / 7))` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        aria-hidden
      />
      {stages.map((stage, index) => {
        const look = stationLabels[stage.stage];
        const lit = stage.count > 0;
        const pulsing = pulsingStage === stage.stage;

        return (
          <motion.li
            key={stage.stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, type: "spring", stiffness: 300, damping: 28 }}
            className="relative flex items-start gap-4 pb-5 last:pb-0 lg:flex-col lg:items-center lg:gap-3 lg:pb-0 lg:text-center"
          >
            <span className="relative z-10 grid size-6 shrink-0 place-items-center">
              {pulsing ? (
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full bg-ember"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "size-3.5 rounded-full border-2 transition-colors duration-500",
                  pulsing
                    ? "border-ember bg-ember"
                    : lit
                      ? "border-primary bg-primary"
                      : "border-border-strong bg-surface",
                )}
                aria-hidden
              />
            </span>
            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3 lg:flex-col lg:items-center lg:gap-0.5">
              <span className="text-sm text-ink-2" title={look.hint}>
                {look.label}
              </span>
              <span
                className={cn(
                  "font-mono text-xl font-semibold tabular lg:text-2xl",
                  lit ? "text-ink" : "text-ink-3",
                )}
                title={formatNumber(stage.count)}
              >
                {formatCompact(stage.count)}
              </span>
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
