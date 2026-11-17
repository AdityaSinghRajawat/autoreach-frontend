import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, ShieldBan, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormAlert } from "@/components/feedback/FormAlert";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { formatDate, humanize } from "@/lib/format";
import { applyServerErrors } from "@/lib/forms";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { usePageParam, useSearchParam } from "@/lib/useSearchParam";

import {
  useCreateSuppression,
  useDeleteSuppression,
  useSuppressions,
  type Suppression,
} from "../api";

const reasonTones: Record<Suppression["reason"], BadgeTone> = {
  BOUNCED: "danger",
  UNSUBSCRIBED: "warning",
  COMPLAINT: "danger",
  MANUAL: "neutral",
  ERASED: "primary",
};

export function SuppressionsPage() {
  const [page, setPage] = usePageParam();
  const [queryParam, setQueryParam] = useSearchParam("q");
  const [search, setSearch] = useState(queryParam ?? "");
  const debounced = useDebouncedValue(search.trim());
  const suppressions = useSuppressions(queryParam ?? "", page);
  const remove = useDeleteSuppression();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Suppression | null>(null);

  useEffect(() => {
    if (debounced !== (queryParam ?? "")) {
      setQueryParam(debounced || null);
    }
  }, [debounced, queryParam, setQueryParam]);

  return (
    <>
      <PageHeader
        title="Suppressions"
        description="Addresses and domains that never receive outreach: bounces, unsubscribes, complaints and manual blocks."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            Block address
          </Button>
        }
      />
      <div className="relative mb-5 max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search addresses or domains"
          aria-label="Search suppressions"
          className="pl-9"
        />
      </div>

      {suppressions.isPending ? (
        <ListSkeleton rows={6} rowClassName="h-12" />
      ) : suppressions.isError ? (
        <ErrorState error={suppressions.error} onRetry={() => void suppressions.refetch()} />
      ) : suppressions.data.items.length === 0 ? (
        <EmptyState
          icon={ShieldBan}
          title={queryParam ? "No matches" : "Nothing is suppressed"}
          description={
            queryParam
              ? "Try a different search."
              : "Bounces and unsubscribes are added here automatically."
          }
        />
      ) : (
        <>
          <div className={cn("transition-opacity", suppressions.isPlaceholderData && "opacity-60")}>
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Address or domain</TableHeader>
                  <TableHeader>Reason</TableHeader>
                  <TableHeader>Applies to</TableHeader>
                  <TableHeader>Added</TableHeader>
                  <TableHeader>
                    <span className="sr-only">Actions</span>
                  </TableHeader>
                </tr>
              </TableHead>
              <tbody>
                {suppressions.data.items.map((entry) => (
                  <TableRow key={entry.suppressionId}>
                    <TableCell>
                      <span className="font-mono text-sm break-all">{entry.value}</span>
                      <span className="ml-2 text-xs text-ink-3">{humanize(entry.entryType)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge tone={reasonTones[entry.reason]}>{humanize(entry.reason)}</Badge>
                    </TableCell>
                    <TableCell className="text-ink-2">
                      {entry.candidateId ? (
                        <span className="font-mono text-xs">{entry.candidateId.slice(0, 8)}…</span>
                      ) : (
                        "Everyone"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink-2">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemoving(entry)}
                        aria-label={`Remove ${entry.value}`}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
          <Pagination meta={suppressions.data.meta} onPageChange={setPage} noun="entries" />
        </>
      )}

      <AddSuppressionDialog open={adding} onOpenChange={setAdding} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Allow outreach to ${removing?.value ?? "this address"} again?`}
        description={
          removing?.reason === "UNSUBSCRIBED" ||
          removing?.reason === "COMPLAINT" ||
          removing?.reason === "ERASED"
            ? "This person asked not to be contacted. Only remove it if they've clearly asked to hear from us again."
            : "Candidates will be able to reach this address again."
        }
        confirmLabel="Remove block"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          removing && remove.mutate(removing.suppressionId, { onSuccess: () => setRemoving(null) })
        }
      />
    </>
  );
}

const suppressionSchema = z
  .object({
    entryType: z.enum(["EMAIL", "DOMAIN"]),
    value: z.string().trim().min(1, "Required").max(255),
    candidateId: z.union([z.literal(""), z.uuid("Enter a candidate ID, or leave empty")]),
  })
  .superRefine((values, context) => {
    const valid =
      values.entryType === "EMAIL"
        ? z.email().safeParse(values.value).success
        : /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(values.value);
    if (!valid) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message:
          values.entryType === "EMAIL"
            ? "Enter a valid email address"
            : "Enter a domain like acme.com",
      });
    }
  });

function AddSuppressionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent title="Block outreach" description="Pending messages to it are cancelled.">
          <AddSuppressionForm onDone={() => onOpenChange(false)} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function AddSuppressionForm({ onDone }: { onDone: () => void }) {
  const create = useCreateSuppression();
  const form = useForm<z.infer<typeof suppressionSchema>>({
    resolver: zodResolver(suppressionSchema),
    defaultValues: { entryType: "EMAIL", value: "", candidateId: "" },
  });
  const { errors } = form.formState;
  const entryType = useWatch({ control: form.control, name: "entryType" });

  const onSubmit = form.handleSubmit(({ candidateId, ...values }) =>
    create.mutate(
      { ...values, value: values.value.toLowerCase(), ...(candidateId ? { candidateId } : {}) },
      {
        onSuccess: onDone,
        onError: (error) => applyServerErrors(error, form.setError, ["value", "candidateId"]),
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {create.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(create.error)}</FormAlert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Type">
          <Select {...form.register("entryType")}>
            <option value="EMAIL">Email address</option>
            <option value="DOMAIN">Whole domain</option>
          </Select>
        </Field>
        <Field
          label={entryType === "EMAIL" ? "Email address" : "Domain"}
          error={errors.value?.message}
        >
          <Input
            placeholder={entryType === "EMAIL" ? "person@acme.com" : "acme.com"}
            {...form.register("value")}
          />
        </Field>
      </div>
      <Field
        label="Only for candidate"
        error={errors.candidateId?.message}
        hint="Optional. Leave empty to block it for everyone."
      >
        <Input placeholder="Candidate ID" className="font-mono" {...form.register("candidateId")} />
      </Field>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Block
        </Button>
      </div>
    </form>
  );
}
