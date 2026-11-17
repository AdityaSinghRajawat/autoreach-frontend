import { Handshake, MessageSquareReply, Send, UsersRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCandidateId } from "@/api/session";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { useCandidate } from "@/features/profile/api";
import { formatNumber, formatPercent } from "@/lib/format";

import { useFunnel, useMetrics, type ActivityItem, type FunnelStage } from "../api";
import { stationForEvent } from "../activityText";
import { ActivityFeed, StreamBadge } from "../components/ActivityFeed";
import { GettingStarted } from "../components/GettingStarted";
import { ReachPath } from "../components/ReachPath";
import { useActivityStream } from "../useActivityStream";

const pulseMs = 2_400;

function greeting(hour = new Date().getHours()): string {
  if (hour < 12) {
    return "Good morning";
  }

  return hour < 18 ? "Good afternoon" : "Good evening";
}

export function HomePage() {
  const candidateId = useCandidateId();
  const candidate = useCandidate(candidateId);
  const metrics = useMetrics(candidateId);
  const funnel = useFunnel();
  const [pulsingStage, setPulsingStage] = useState<FunnelStage["stage"] | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onLiveEvent = useCallback((item: ActivityItem) => {
    const stage = stationForEvent(item);
    if (!stage) {
      return;
    }
    clearTimeout(pulseTimer.current);
    setPulsingStage(stage);
    pulseTimer.current = setTimeout(() => setPulsingStage(null), pulseMs);
  }, []);

  useEffect(() => () => clearTimeout(pulseTimer.current), []);

  const streamStatus = useActivityStream(onLiveEvent);
  const firstName = candidate.data?.fullName.split(" ")[0];
  const values = metrics.data;

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={firstName ? `Here's your reach, ${firstName}` : "Here's your reach"}
        description="Every job, application and conversation, from first match to interview."
      />

      <GettingStarted candidateId={candidateId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          accent
          label="Response rate"
          icon={MessageSquareReply}
          loading={metrics.isPending}
          value={values ? formatPercent(values.responseRatePercentage, 1) : "—"}
          detail={
            values ? `${formatNumber(values.recruiterResponses)} replies to your emails` : undefined
          }
        />
        <StatTile
          label="Contacts found"
          icon={UsersRound}
          loading={metrics.isPending}
          value={values ? formatNumber(values.contactsDiscovered) : "—"}
          detail="People linked to your matches"
        />
        <StatTile
          label="Emails sent"
          icon={Send}
          loading={metrics.isPending}
          value={values ? formatNumber(values.coldEmailsSent) : "—"}
          detail="Through your mailboxes"
        />
        <StatTile
          label="LinkedIn accepted"
          icon={Handshake}
          loading={metrics.isPending}
          value={values ? formatNumber(values.linkedinConnectionsAccepted) : "—"}
          detail={
            values ? `of ${formatNumber(values.linkedinRequestsSent)} requests sent` : undefined
          }
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Reach Path</CardTitle>
            <p className="mt-1 text-sm text-ink-2">Where your search stands right now.</p>
          </div>
        </CardHeader>
        <CardBody className="pt-6 lg:pt-8">
          {funnel.isError ? (
            <ErrorState error={funnel.error} onRetry={() => void funnel.refetch()} />
          ) : (
            <ReachPath stages={funnel.data} pulsingStage={pulsingStage} />
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Activity</CardTitle>
            <p className="mt-1 text-sm text-ink-2">Newest first, updated as it happens.</p>
          </div>
          <StreamBadge status={streamStatus} />
        </CardHeader>
        <CardBody>
          <ActivityFeed />
        </CardBody>
      </Card>
    </>
  );
}
