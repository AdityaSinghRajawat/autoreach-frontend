import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Eraser, Search, UserSearch } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { CompanyContact } from "@/features/contacts/api";
import { ContactCard } from "@/features/contacts/components/ContactCard";
import { formatDateTime, humanize } from "@/lib/format";

import {
  useAdminContacts,
  useApplySignal,
  useContactSignals,
  useEraseContact,
  type ContactSearch,
} from "../api";

const searchSchema = z.object({
  term: z
    .string()
    .trim()
    .min(1, "Enter an email address or LinkedIn profile URL")
    .refine(
      (value) => z.email().safeParse(value).success || /linkedin\.com\//i.test(value),
      "Enter an email address or a linkedin.com profile URL",
    ),
});

function toSearch(term: string): ContactSearch {
  return term.includes("@") ? { email: term.toLowerCase() } : { linkedinUrl: term };
}

export function AdminContactsPage() {
  const [search, setSearch] = useState<ContactSearch | null>(null);
  const contacts = useAdminContacts(search);
  const erase = useEraseContact();
  const [erasing, setErasing] = useState<CompanyContact | null>(null);
  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { term: "" },
  });

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Find what AutoReach holds about a person, review what candidates reported about them, and erase their data on request."
      />
      <form
        onSubmit={form.handleSubmit(({ term }) => setSearch(toSearch(term)))}
        noValidate
        className="mb-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-start"
      >
        <Field
          label="Email or LinkedIn URL"
          error={form.formState.errors.term?.message}
          className="flex-1"
        >
          <Input
            placeholder="person@acme.com or https://linkedin.com/in/…"
            {...form.register("term")}
          />
        </Field>
        <Button type="submit" className="sm:mt-6.5">
          <Search aria-hidden />
          Look up
        </Button>
      </form>

      {search === null ? (
        <EmptyState
          icon={UserSearch}
          title="Search for a person"
          description="Use this for data requests: every record matching the address or profile is listed."
        />
      ) : contacts.isPending ? (
        <ListSkeleton rows={2} rowClassName="h-40" />
      ) : contacts.isError ? (
        <ErrorState error={contacts.error} onRetry={() => void contacts.refetch()} />
      ) : contacts.data.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="No records"
          description="AutoReach holds nothing for that address or profile."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {contacts.data.map((contact) => (
            <div key={contact.contactId} className="flex flex-col gap-2">
              <ContactCard
                contact={contact}
                showCompany
                action={
                  contact.anonymizedAt ? null : (
                    <Button variant="ghost" size="sm" onClick={() => setErasing(contact)}>
                      <Eraser aria-hidden />
                      Erase
                    </Button>
                  )
                }
              />
              <Signals contactId={contact.contactId} />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={erasing !== null}
        onOpenChange={(open) => !open && setErasing(null)}
        title={`Erase ${erasing?.fullName ?? "this contact"}?`}
        description="Their personal details are removed for good and the address is suppressed so no candidate contacts them again. Outreach history is kept without their details."
        confirmLabel="Erase contact"
        destructive
        pending={erase.isPending}
        onConfirm={() =>
          erasing && erase.mutate(erasing.contactId, { onSuccess: () => setErasing(null) })
        }
      />
    </>
  );
}

function Signals({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const signals = useContactSignals(contactId, open);
  const apply = useApplySignal(contactId);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm text-ink-2 hover:text-ink"
      >
        Candidate reports
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-3">
          {signals.isPending ? (
            <ListSkeleton rows={2} rowClassName="h-10" />
          ) : signals.isError ? (
            <ErrorState error={signals.error} onRetry={() => void signals.refetch()} />
          ) : signals.data.length === 0 ? (
            <p className="text-sm text-ink-3">
              No candidate has reported anything about this contact.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {signals.data.map((signal) => (
                <li key={signal.signalId} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Badge tone={signal.signalType === "BOUNCED" ? "danger" : "success"}>
                    {humanize(signal.signalType)}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">
                    {signal.address || "LinkedIn"} · {formatDateTime(signal.occurredAt)}
                  </span>
                  {signal.appliedAt ? (
                    <span className="text-xs text-ink-3">
                      Applied {formatDateTime(signal.appliedAt)}
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={apply.isPending && apply.variables === signal.signalId}
                      onClick={() =>
                        apply.mutate(signal.signalId, { onSuccess: () => void signals.refetch() })
                      }
                    >
                      Apply
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
