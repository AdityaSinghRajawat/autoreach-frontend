import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Link } from "react-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Input";
import type { CompanyContact } from "@/features/contacts/api";
import { useMailboxes } from "@/features/mailboxes/api";
import { applyServerErrors } from "@/lib/forms";

import { useCreateOutreach, useTemplates, type OutreachChannel, type Template } from "../api";
import { linkedinNoteLimit } from "../placeholders";
import { PlaceholderInput } from "./PlaceholderInput";

const composeSchema = z
  .object({
    email: z.boolean(),
    linkedinConnect: z.boolean(),
    linkedinDm: z.boolean(),
    channelAccountId: z.string(),
    subject: z.string().trim().max(500),
    emailBody: z.string().trim().max(20_000),
    linkedinNote: z
      .string()
      .trim()
      .max(linkedinNoteLimit, `Keep the note within ${linkedinNoteLimit} characters`),
  })
  .superRefine((values, context) => {
    if (!values.email && !values.linkedinConnect && !values.linkedinDm) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Choose at least one way to reach out",
      });
    }
    if (values.email && !values.channelAccountId) {
      context.addIssue({
        code: "custom",
        path: ["channelAccountId"],
        message: "Choose a mailbox to send from",
      });
    }
    if (values.email && !values.subject) {
      context.addIssue({ code: "custom", path: ["subject"], message: "Add a subject" });
    }
    if ((values.email || values.linkedinDm) && !values.emailBody) {
      context.addIssue({ code: "custom", path: ["emailBody"], message: "Write the message" });
    }
    if (values.linkedinConnect && !values.linkedinNote) {
      context.addIssue({ code: "custom", path: ["linkedinNote"], message: "Write a short note" });
    }
  });

type ComposeValues = z.infer<typeof composeSchema>;

interface ComposeOutreachDialogProps {
  candidateId: string;
  jobId: string;
  contact: CompanyContact | null;
  onOpenChange: (open: boolean) => void;
}

export function ComposeOutreachDialog({
  candidateId,
  jobId,
  contact,
  onOpenChange,
}: ComposeOutreachDialogProps) {
  return (
    <Dialog open={contact !== null} onOpenChange={onOpenChange}>
      {contact ? (
        <DialogContent
          size="lg"
          title={`Reach out to ${contact.fullName}`}
          description={`${contact.title} at ${contact.companyName}. Placeholders are filled in when the message is sent.`}
        >
          <ComposeForm
            key={contact.contactId}
            candidateId={candidateId}
            jobId={jobId}
            contact={contact}
            onDone={() => onOpenChange(false)}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

interface ComposeFormProps {
  candidateId: string;
  jobId: string;
  contact: CompanyContact;
  onDone: () => void;
}

function ComposeForm({ candidateId, jobId, contact, onDone }: ComposeFormProps) {
  const mailboxes = useMailboxes(candidateId);
  const templates = useTemplates(candidateId);
  const create = useCreateOutreach(candidateId);
  const activeMailboxes = mailboxes.data?.filter((mailbox) => mailbox.status === "ACTIVE") ?? [];
  const approved = templates.data?.filter((template) => template.status === "APPROVED") ?? [];
  const canEmail = Boolean(contact.workEmail) && contact.emailVerificationStatus !== "INVALID";
  const canLinkedin = Boolean(contact.linkedinUrl);

  const form = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      email: canEmail,
      linkedinConnect: !canEmail && canLinkedin,
      linkedinDm: false,
      channelAccountId: "",
      subject: "",
      emailBody: "",
      linkedinNote: "",
    },
  });
  const { errors } = form.formState;
  const [email, linkedinConnect, linkedinDm] = useWatch({
    control: form.control,
    name: ["email", "linkedinConnect", "linkedinDm"],
  });
  const firstMailboxId = activeMailboxes[0]?.accountId;

  useEffect(() => {
    if (firstMailboxId && !form.getValues("channelAccountId")) {
      form.setValue("channelAccountId", firstMailboxId);
    }
  }, [firstMailboxId, form]);

  const applyTemplate = (template: Template | undefined) => {
    if (!template) {
      return;
    }
    if (template.channel === "LINKEDIN_CONNECT") {
      form.setValue("linkedinNote", template.body, { shouldDirty: true });
    } else {
      form.setValue("emailBody", template.body, { shouldDirty: true });
      if (template.subject) {
        form.setValue("subject", template.subject, { shouldDirty: true });
      }
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    const channels: OutreachChannel[] = [];
    if (values.email) channels.push("EMAIL");
    if (values.linkedinConnect) channels.push("LINKEDIN_CONNECT");
    if (values.linkedinDm) channels.push("LINKEDIN_DM");

    create.mutate(
      {
        jobId,
        contactId: contact.contactId,
        channels,
        ...(values.email
          ? { subject: values.subject, channelAccountId: values.channelAccountId }
          : {}),
        ...(values.email || values.linkedinDm ? { emailBody: values.emailBody } : {}),
        ...(values.linkedinConnect ? { linkedinNote: values.linkedinNote } : {}),
      },
      {
        onSuccess: onDone,
        onError: (error) =>
          applyServerErrors(error, form.setError, ["subject", "emailBody", "linkedinNote"]),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {create.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(create.error)}</FormAlert>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Send as</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <Checkbox
            label="Email"
            description={canEmail ? contact.workEmail : "No usable email"}
            disabled={!canEmail}
            {...form.register("email")}
          />
          <Checkbox
            label="Connection request"
            description={canLinkedin ? "You send it on LinkedIn" : "No LinkedIn profile"}
            disabled={!canLinkedin}
            {...form.register("linkedinConnect")}
          />
          <Checkbox
            label="LinkedIn message"
            description={canLinkedin ? "After they accept" : "No LinkedIn profile"}
            disabled={!canLinkedin}
            {...form.register("linkedinDm")}
          />
        </div>
        {errors.email ? (
          <p role="alert" className="text-xs text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </fieldset>

      {approved.length > 0 ? (
        <Field label="Start from a template" hint="Only approved templates are listed.">
          <Select
            defaultValue=""
            onChange={(event) =>
              applyTemplate(approved.find((template) => template.templateId === event.target.value))
            }
          >
            <option value="">Write from scratch</option>
            {approved.map((template) => (
              <option key={template.templateId} value={template.templateId}>
                {template.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {email ? (
        activeMailboxes.length === 0 ? (
          <FormAlert>
            Email needs a verified mailbox.{" "}
            <Link to="/mailboxes" className="font-medium text-primary hover:underline">
              Connect one
            </Link>
          </FormAlert>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Send from" error={errors.channelAccountId?.message}>
              <Select {...form.register("channelAccountId")}>
                {activeMailboxes.map((mailbox) => (
                  <option key={mailbox.accountId} value={mailbox.accountId}>
                    {mailbox.emailAddress}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject" error={errors.subject?.message}>
              {(control) => (
                <Controller
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <PlaceholderInput
                      {...control}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              )}
            </Field>
          </div>
        )
      ) : null}

      {email || linkedinDm ? (
        <Field
          label={email ? "Message" : "LinkedIn message"}
          error={errors.emailBody?.message}
          hint={
            email && linkedinDm ? "Used for both the email and the LinkedIn message." : undefined
          }
        >
          {(control) => (
            <Controller
              control={form.control}
              name="emailBody"
              render={({ field }) => (
                <PlaceholderInput
                  {...control}
                  multiline
                  rows={8}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}
        </Field>
      ) : null}

      {linkedinConnect ? (
        <Field label="Connection note" error={errors.linkedinNote?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="linkedinNote"
              render={({ field }) => (
                <PlaceholderInput
                  {...control}
                  multiline
                  rows={3}
                  limit={linkedinNoteLimit}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}
        </Field>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Queue outreach
        </Button>
      </div>
    </form>
  );
}
