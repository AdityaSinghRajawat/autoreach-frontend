import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormAlert } from "@/components/feedback/FormAlert";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { formatDate, formatRelative } from "@/lib/format";

import { useApiClients, useCreateApiClient, useRevokeApiClient, type ApiClient } from "../api";

export function ApiClientsPage() {
  const clients = useApiClients();
  const revoke = useRevokeApiClient();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiClient | null>(null);

  return (
    <>
      <PageHeader
        title="API clients"
        description="Keys for scrapers and integrations that push jobs into AutoReach through the ingest API."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            New key
          </Button>
        }
      />

      {clients.isPending ? (
        <ListSkeleton rows={3} rowClassName="h-14" />
      ) : clients.isError ? (
        <ErrorState error={clients.error} onRetry={() => void clients.refetch()} />
      ) : clients.data.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API keys"
          description="Create one for each scraper, so you can revoke them separately."
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Name</TableHeader>
              <TableHeader>Key</TableHeader>
              <TableHeader>Last used</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>
                <span className="sr-only">Actions</span>
              </TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {clients.data.map((client) => (
              <TableRow
                key={client.clientId}
                className={client.revokedAt ? "opacity-60" : undefined}
              >
                <TableCell>
                  <span className="font-medium">{client.name}</span>
                  {client.revokedAt ? (
                    <Badge tone="danger" className="ml-2">
                      Revoked
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs">{client.keyPrefix}…</TableCell>
                <TableCell className="whitespace-nowrap text-ink-2">
                  {client.lastUsedAt ? formatRelative(client.lastUsedAt) : "Never"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-ink-2">
                  {formatDate(client.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {client.revokedAt ? null : (
                    <Button variant="ghost" size="sm" onClick={() => setRevoking(client)}>
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      <CreateKeyDialog open={creating} onOpenChange={setCreating} />

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={`Revoke ${revoking?.name ?? "this key"}?`}
        description="Anything using it stops working immediately. This can't be undone."
        confirmLabel="Revoke key"
        destructive
        pending={revoke.isPending}
        onConfirm={() =>
          revoking && revoke.mutate(revoking.clientId, { onSuccess: () => setRevoking(null) })
        }
      />
    </>
  );
}

const keySchema = z.object({ name: z.string().trim().min(1, "Name the key").max(100) });

function CreateKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateApiClient();
  const form = useForm<z.infer<typeof keySchema>>({
    resolver: zodResolver(keySchema),
    defaultValues: { name: "" },
  });

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      form.reset();
      create.reset();
    }
  };

  const onSubmit = form.handleSubmit(({ name }) => create.mutate(name));

  return (
    <Dialog open={open} onOpenChange={close}>
      {open ? (
        <DialogContent
          title={create.isSuccess ? "Copy your key now" : "New API key"}
          description={create.isSuccess ? undefined : "Keys can ingest jobs for any candidate."}
        >
          {create.isSuccess ? (
            <div className="flex flex-col gap-4">
              <p className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                This is the only time the full key is shown. Store it somewhere safe.
              </p>
              <code className="block rounded-md bg-surface-2 p-3 font-mono text-sm break-all">
                {create.data.apiKey}
              </code>
              <div className="flex justify-end gap-2">
                <CopyButton
                  value={create.data.apiKey}
                  label="Copy key"
                  variant="primary"
                  size="md"
                />
                <Button variant="secondary" onClick={() => close(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              {create.isError ? <FormAlert>{errorMessage(create.error)}</FormAlert> : null}
              <Field
                label="Name"
                error={form.formState.errors.name?.message}
                hint="e.g. the scraper or team that uses it"
              >
                <Input {...form.register("name")} />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => close(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={create.isPending}>
                  Create key
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
