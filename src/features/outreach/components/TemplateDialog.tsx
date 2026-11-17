import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useCreateTemplate, useUpdateTemplate, type OutreachChannel, type Template } from "../api";
import { channelLabels, linkedinNoteLimit } from "../placeholders";
import { PlaceholderInput } from "./PlaceholderInput";

const templateSchema = z
  .object({
    name: z.string().trim().min(1, "Name the template").max(255),
    channel: z.enum(["EMAIL", "LINKEDIN_CONNECT", "LINKEDIN_DM"]),
    subject: z.string().trim().max(500),
    body: z.string().trim().min(1, "Write the message").max(20_000),
  })
  .superRefine((values, context) => {
    if (values.channel === "EMAIL" && !values.subject) {
      context.addIssue({ code: "custom", path: ["subject"], message: "Emails need a subject" });
    }
    if (values.channel === "LINKEDIN_CONNECT" && values.body.length > linkedinNoteLimit) {
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: `Connection notes are limited to ${linkedinNoteLimit} characters`,
      });
    }
  });

type TemplateValues = z.infer<typeof templateSchema>;

interface TemplateDialogProps {
  candidateId: string;
  open: boolean;
  template: Template | null;
  onOpenChange: (open: boolean) => void;
}

export function TemplateDialog({ candidateId, open, template, onOpenChange }: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          size="lg"
          title={template ? "Edit template" : "New template"}
          description={
            template?.status === "APPROVED"
              ? "Changing the text returns it to draft, so campaigns stop using it until you approve it again."
              : "Templates start as drafts. Approve one to use it in campaigns."
          }
        >
          <TemplateForm
            candidateId={candidateId}
            template={template}
            onDone={() => onOpenChange(false)}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

interface TemplateFormProps {
  candidateId: string;
  template: Template | null;
  onDone: () => void;
}

function TemplateForm({ candidateId, template, onDone }: TemplateFormProps) {
  const create = useCreateTemplate(candidateId);
  const update = useUpdateTemplate(candidateId);
  const mutation = template ? update : create;
  const form = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? "",
      channel: template?.channel ?? "EMAIL",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
    },
  });
  const { errors } = form.formState;
  const channel = useWatch({ control: form.control, name: "channel" });

  const onSubmit = form.handleSubmit((values) => {
    const subject = values.channel === "EMAIL" ? values.subject : null;
    const onError = (error: Error) =>
      applyServerErrors(error, form.setError, ["name", "subject", "body"]);

    if (template) {
      update.mutate(
        {
          templateId: template.templateId,
          body: { name: values.name, subject, body: values.body },
        },
        { onSuccess: onDone, onError },
      );
    } else {
      create.mutate(
        { name: values.name, channel: values.channel, subject, body: values.body },
        { onSuccess: onDone, onError },
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {mutation.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(mutation.error)}</FormAlert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message} hint="Only you see this.">
          <Input {...form.register("name")} />
        </Field>
        <Field label="Channel" hint={template ? "Can't be changed after creation." : undefined}>
          <Select disabled={template !== null} {...form.register("channel")}>
            {(Object.keys(channelLabels) as OutreachChannel[]).map((value) => (
              <option key={value} value={value}>
                {channelLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {channel === "EMAIL" ? (
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
      ) : null}
      <Field
        label={channel === "LINKEDIN_CONNECT" ? "Connection note" : "Message"}
        error={errors.body?.message}
      >
        {(control) => (
          <Controller
            control={form.control}
            name="body"
            render={({ field }) => (
              <PlaceholderInput
                {...control}
                multiline
                rows={channel === "LINKEDIN_CONNECT" ? 4 : 10}
                limit={channel === "LINKEDIN_CONNECT" ? linkedinNoteLimit : undefined}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        )}
      </Field>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {template ? "Save changes" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
