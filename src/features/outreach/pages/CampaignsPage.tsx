import { Archive, Megaphone, Pause, Pencil, Play, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useMailboxes } from "@/features/mailboxes/api";
import { cn } from "@/lib/cn";

import { useCampaigns, useTemplates, useUpdateCampaign, type Campaign } from "../api";
import { CampaignDialog } from "../components/CampaignDialog";
import { channelIcons } from "../status";

const campaignLooks: Record<Campaign["status"], { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Running", tone: "live" },
  PAUSED: { label: "Paused", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export function CampaignsPage() {
  const candidateId = useCandidateId();
  const campaigns = useCampaigns(candidateId);
  const templates = useTemplates(candidateId);
  const mailboxes = useMailboxes(candidateId);
  const update = useUpdateCampaign(candidateId);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState<Campaign | null>(null);
  const templateById = new Map(templates.data?.map((template) => [template.templateId, template]));
  const mailboxById = new Map(mailboxes.data?.map((mailbox) => [mailbox.accountId, mailbox]));

  const setStatus = (campaign: Campaign, status: Campaign["status"], onDone?: () => void) =>
    update.mutate(
      { campaignId: campaign.campaignId, body: { status } },
      {
        onSuccess: () => {
          toast.success(
            status === "ACTIVE"
              ? `${campaign.name} is running`
              : status === "PAUSED"
                ? `${campaign.name} paused`
                : `${campaign.name} archived`,
          );
          onDone?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const ordered = [...(campaigns.data ?? [])].sort(
    (a, b) => Number(a.status === "ARCHIVED") - Number(b.status === "ARCHIVED"),
  );

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="The sequence automatic outreach follows. One campaign runs at a time."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            New campaign
          </Button>
        }
      />

      {campaigns.isPending ? (
        <ListSkeleton rows={2} rowClassName="h-40" />
      ) : campaigns.isError ? (
        <ErrorState error={campaigns.error} onRetry={() => void campaigns.refetch()} />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="A campaign strings approved templates together, for example an email, a LinkedIn note, then a follow-up a few days later."
          action={
            <Button variant="secondary" onClick={() => setCreating(true)}>
              Create a campaign
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {ordered.map((campaign) => {
            const look = campaignLooks[campaign.status];
            const busy = update.isPending && update.variables.campaignId === campaign.campaignId;
            const mailbox = campaign.channelAccountId
              ? mailboxById.get(campaign.channelAccountId)
              : undefined;
            let day = 0;

            return (
              <Card
                key={campaign.campaignId}
                className={cn("p-5", campaign.status === "ARCHIVED" && "opacity-70")}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans text-base font-semibold">{campaign.name}</h3>
                      <Badge tone={look.tone} dot>
                        {look.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-3">
                      {campaign.steps.length} {campaign.steps.length === 1 ? "step" : "steps"}
                      {mailbox ? ` · emails from ${mailbox.emailAddress}` : ""}
                    </p>
                  </div>
                  {campaign.status !== "ARCHIVED" ? (
                    <div className="flex flex-wrap gap-2">
                      {campaign.status === "ACTIVE" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busy}
                          onClick={() => setStatus(campaign, "PAUSED")}
                        >
                          <Pause aria-hidden />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() => setStatus(campaign, "ACTIVE")}
                        >
                          <Play aria-hidden />
                          Run
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(campaign)}>
                        <Pencil aria-hidden />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setArchiving(campaign)}>
                        <Archive aria-hidden />
                        Archive
                      </Button>
                    </div>
                  ) : null}
                </div>

                <ol className="mt-5 flex flex-col gap-0 sm:flex-row sm:items-stretch sm:overflow-x-auto">
                  {campaign.steps.map((step, index) => {
                    day += step.delayDays;
                    const template = templateById.get(step.templateId);
                    const Icon = template ? channelIcons[template.channel] : Megaphone;

                    return (
                      <li
                        key={step.stepNumber}
                        className="flex items-center gap-0 sm:min-w-44 sm:flex-1"
                      >
                        <div className="flex flex-1 items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-primary">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-mono text-[11px] text-ink-3 uppercase">
                              Day {day}
                            </span>
                            <span className="block truncate text-sm font-medium">
                              {template?.name ?? "Deleted template"}
                            </span>
                          </span>
                        </div>
                        {index < campaign.steps.length - 1 ? (
                          <span
                            className="mx-1 hidden h-px w-4 shrink-0 bg-border-strong sm:block"
                            aria-hidden
                          />
                        ) : null}
                        {index < campaign.steps.length - 1 ? (
                          <span
                            className="ml-7 block h-3 w-px bg-border-strong sm:hidden"
                            aria-hidden
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </Card>
            );
          })}
        </div>
      )}

      <CampaignDialog
        candidateId={candidateId}
        open={creating || editing !== null}
        campaign={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(open) => !open && setArchiving(null)}
        title={`Archive ${archiving?.name ?? "campaign"}?`}
        description="It stops for good. Messages already sent stay in your history."
        confirmLabel="Archive"
        destructive
        pending={update.isPending}
        onConfirm={() => archiving && setStatus(archiving, "ARCHIVED", () => setArchiving(null))}
      />
    </>
  );
}
