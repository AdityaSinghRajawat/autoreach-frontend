import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { useMailboxes } from "@/features/mailboxes/api";
import { applyServerErrors } from "@/lib/forms";

import { useCreateCampaign, useTemplates, useUpdateCampaign, type Campaign } from "../api";
import { channelLabels } from "../placeholders";

const maxSteps = 5;

const campaignSchema = z.object({
  name: z.string().trim().min(1, "Name the campaign").max(255),
  channelAccountId: z.string(),
  steps: z
    .array(
      z.object({
        templateId: z.string().min(1, "Choose a template"),
        delayDays: z
          .number({ error: "Enter a number of days" })
          .int()
          .min(0)
          .max(60, "At most 60 days"),
      }),
    )
    .min(1)
    .max(maxSteps),
});

type CampaignValues = z.infer<typeof campaignSchema>;

interface CampaignDialogProps {
  candidateId: string;
  open: boolean;
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDialog({ candidateId, open, campaign, onOpenChange }: CampaignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          size="lg"
          title={campaign ? "Edit campaign" : "New campaign"}
          description="A sequence of up to five steps. Each contact gets only the steps they can be reached on."
        >
          <CampaignForm
            candidateId={candidateId}
            campaign={campaign}
            onDone={() => onOpenChange(false)}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

interface CampaignFormProps {
  candidateId: string;
  campaign: Campaign | null;
  onDone: () => void;
}

function CampaignForm({ candidateId, campaign, onDone }: CampaignFormProps) {
  const templates = useTemplates(candidateId);
  const mailboxes = useMailboxes(candidateId);
  const create = useCreateCampaign(candidateId);
  const update = useUpdateCampaign(candidateId);
  const mutation = campaign ? update : create;
  const usable =
    templates.data?.filter(
      (template) =>
        template.status === "APPROVED" ||
        campaign?.steps.some((step) => step.templateId === template.templateId),
    ) ?? [];
  const activeMailboxes = mailboxes.data?.filter((mailbox) => mailbox.status === "ACTIVE") ?? [];

  const form = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name ?? "",
      channelAccountId: campaign?.channelAccountId ?? "",
      steps: campaign?.steps.map(({ templateId, delayDays }) => ({ templateId, delayDays })) ?? [
        { templateId: "", delayDays: 0 },
      ],
    },
  });
  const steps = useFieldArray({ control: form.control, name: "steps" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    const onError = (error: Error) => applyServerErrors(error, form.setError, ["name"]);
    const channelAccountId = values.channelAccountId || undefined;

    if (campaign) {
      update.mutate(
        {
          campaignId: campaign.campaignId,
          body: {
            name: values.name,
            steps: values.steps,
            ...(channelAccountId ? { channelAccountId } : {}),
          },
        },
        { onSuccess: onDone, onError },
      );
    } else {
      create.mutate(
        {
          name: values.name,
          steps: values.steps,
          status: "PAUSED",
          channelAccountId: channelAccountId ?? null,
        },
        { onSuccess: onDone, onError },
      );
    }
  });

  if (templates.isSuccess && usable.length === 0) {
    return (
      <FormAlert>
        Campaigns use approved templates, and you don't have any yet.{" "}
        <Link
          to="/outreach/templates"
          className="font-medium text-primary hover:underline"
          onClick={onDone}
        >
          Write and approve one
        </Link>
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {mutation.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(mutation.error)}</FormAlert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field
          label="Send emails from"
          hint={activeMailboxes.length ? undefined : "Connect a mailbox to send email steps."}
        >
          <Select {...form.register("channelAccountId")}>
            <option value="">Choose when sending</option>
            {activeMailboxes.map((mailbox) => (
              <option key={mailbox.accountId} value={mailbox.accountId}>
                {mailbox.emailAddress}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Steps</legend>
        {steps.fields.map((step, index) => (
          <div key={step.id}>
            {index > 0 ? (
              <div className="flex justify-center py-1 text-ink-3" aria-hidden>
                <ArrowDown className="size-4" />
              </div>
            ) : null}
            <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[auto_1fr_8rem_auto] sm:items-end">
              <span className="grid size-8 place-items-center rounded-full bg-primary-soft font-mono text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <Field label="Template" error={errors.steps?.[index]?.templateId?.message}>
                <Select {...form.register(`steps.${index}.templateId`)}>
                  <option value="">Choose…</option>
                  {usable.map((template) => (
                    <option key={template.templateId} value={template.templateId}>
                      {template.name} · {channelLabels[template.channel]}
                      {template.status === "APPROVED" ? "" : " (not approved)"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={index === 0 ? "Send after (days)" : "Wait (days)"}
                error={errors.steps?.[index]?.delayDays?.message}
              >
                <Input
                  type="number"
                  min={0}
                  max={60}
                  inputMode="numeric"
                  {...form.register(`steps.${index}.delayDays`, { valueAsNumber: true })}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={steps.fields.length === 1}
                onClick={() => steps.remove(index)}
                aria-label={`Remove step ${index + 1}`}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        {steps.fields.length < maxSteps ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2 self-start"
            onClick={() => steps.append({ templateId: "", delayDays: 3 })}
          >
            <Plus aria-hidden />
            Add step
          </Button>
        ) : null}
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {campaign ? "Save changes" : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}
