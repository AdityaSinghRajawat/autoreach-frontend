import { Mail, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatRelative } from "@/lib/format";

import { useDisconnectMailbox, useMailboxes, useVerifyMailbox, type Mailbox } from "../api";
import { ConnectMailboxDialog } from "../components/ConnectMailboxDialog";

const statusLooks: Record<Mailbox["status"], { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Ready to send", tone: "success" },
  UNVERIFIED: { label: "Not tested", tone: "warning" },
  FAILED: { label: "Can't sign in", tone: "danger" },
};

export function MailboxesPage() {
  const candidateId = useCandidateId();
  const mailboxes = useMailboxes(candidateId);
  const verify = useVerifyMailbox(candidateId);
  const disconnect = useDisconnectMailbox(candidateId);
  const [connecting, setConnecting] = useState(false);
  const [removing, setRemoving] = useState<Mailbox | null>(null);

  return (
    <>
      <PageHeader
        title="Mailboxes"
        description="The addresses your emails are sent from. Replies to them are detected automatically."
        actions={
          <Button onClick={() => setConnecting(true)}>
            <Plus aria-hidden />
            Connect mailbox
          </Button>
        }
      />

      {mailboxes.isPending ? (
        <ListSkeleton rows={2} rowClassName="h-28" />
      ) : mailboxes.isError ? (
        <ErrorState error={mailboxes.error} onRetry={() => void mailboxes.refetch()} />
      ) : mailboxes.data.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No mailbox connected"
          description="Connect the address you want recruiters to see. Gmail, Outlook and any provider with SMTP and IMAP work."
          action={
            <Button variant="secondary" onClick={() => setConnecting(true)}>
              Connect a mailbox
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mailboxes.data.map((mailbox) => {
            const look = statusLooks[mailbox.status];
            const testing = verify.isPending && verify.variables === mailbox.accountId;

            return (
              <Card key={mailbox.accountId} className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Mail className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{mailbox.emailAddress}</p>
                    <p className="truncate text-sm text-ink-3">
                      {mailbox.displayName ? `${mailbox.displayName} · ` : ""}
                      {mailbox.smtpHost}
                    </p>
                  </div>
                  <Badge tone={look.tone} dot>
                    {look.label}
                  </Badge>
                </div>
                {mailbox.status === "FAILED" && mailbox.lastError ? (
                  <p className="rounded-md bg-danger-soft px-3 py-2 text-sm">{mailbox.lastError}</p>
                ) : null}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-ink-3">Daily limit</dt>
                    <dd className="font-mono font-medium">{mailbox.dailyLimit} emails</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">Last tested</dt>
                    <dd>
                      {mailbox.lastVerifiedAt ? formatRelative(mailbox.lastVerifiedAt) : "Never"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={testing}
                    onClick={() => verify.mutate(mailbox.accountId)}
                  >
                    <RefreshCw aria-hidden />
                    Test connection
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRemoving(mailbox)}>
                    <Trash2 aria-hidden />
                    Disconnect
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConnectMailboxDialog
        candidateId={candidateId}
        open={connecting}
        onOpenChange={setConnecting}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Disconnect ${removing?.emailAddress ?? "mailbox"}?`}
        description="Messages waiting to be sent from it are cancelled, and replies to it are no longer tracked."
        confirmLabel="Disconnect"
        destructive
        pending={disconnect.isPending}
        onConfirm={() =>
          removing && disconnect.mutate(removing.accountId, { onSuccess: () => setRemoving(null) })
        }
      />
    </>
  );
}
