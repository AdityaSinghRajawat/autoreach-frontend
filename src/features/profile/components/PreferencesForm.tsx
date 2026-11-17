import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { applyServerErrors } from "@/lib/forms";

import { useUpdateCandidate, type Candidate } from "../api";
import {
  preferencesFromCandidate,
  preferencesSchema,
  preferencesToUpdate,
  type PreferencesValues,
} from "../schemas";

interface PreferencesFormProps {
  candidate: Candidate;
}

export function PreferencesForm({ candidate }: PreferencesFormProps) {
  const update = useUpdateCandidate(candidate.candidateId);
  const timeZones = useMemo(() => {
    const zones = Intl.supportedValuesOf("timeZone");

    return zones.includes(candidate.timezone) ? zones : [candidate.timezone, ...zones];
  }, [candidate.timezone]);
  const form = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    values: preferencesFromCandidate(candidate),
    resetOptions: { keepDirtyValues: true },
  });
  const { errors, isDirty } = form.formState;
  const minMatchScore = useWatch({ control: form.control, name: "minMatchScore" });

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(preferencesToUpdate(values), {
      onSuccess: (saved) => form.reset(preferencesFromCandidate(saved)),
      onError: (error) =>
        applyServerErrors(error, form.setError, ["fullName", "linkedinProfileUrl", "timezone"]),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.fullName?.message}>
            <Input autoComplete="name" {...form.register("fullName")} />
          </Field>
          <Field
            label="Time zone"
            error={errors.timezone?.message}
            hint="Outreach is sent during working hours here."
          >
            <Select {...form.register("timezone")}>
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="LinkedIn profile"
            error={errors.linkedinProfileUrl?.message}
            className="sm:col-span-2"
            hint="Shown to contacts in your outreach. Leave empty to remove it."
          >
            <Input
              type="url"
              placeholder="https://www.linkedin.com/in/you"
              {...form.register("linkedinProfileUrl")}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-6">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="min-match-score" className="text-sm font-medium">
                Minimum match score
              </label>
              <span className="font-mono text-lg font-semibold text-primary tabular">
                {Math.round(minMatchScore * 100)}%
              </span>
            </div>
            <p id="min-match-score-hint" className="mt-1 text-xs text-ink-3">
              Jobs scoring below this aren't shown or acted on. Higher means fewer, closer matches.
            </p>
            <input
              id="min-match-score"
              type="range"
              min={0}
              max={1}
              step={0.01}
              aria-describedby="min-match-score-hint"
              className="mt-3 w-full accent-[var(--primary)]"
              {...form.register("minMatchScore", { valueAsNumber: true })}
            />
          </div>

          <ToggleRow
            title="Apply automatically"
            description="When a match clears your score, AutoReach prepares and submits the application where the job board allows it."
          >
            <Controller
              control={form.control}
              name="autoApplyEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Apply automatically"
                />
              )}
            />
          </ToggleRow>
          <ToggleRow
            title="Reach out automatically"
            description="Emails contacts at matched companies using your campaigns. LinkedIn is never automated; those steps wait in your queue."
          >
            <Controller
              control={form.control}
              name="autoOutreachEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Reach out automatically"
                />
              )}
            />
          </ToggleRow>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!isDirty || update.isPending}
          onClick={() => form.reset(preferencesFromCandidate(candidate))}
        >
          Discard changes
        </Button>
        <Button type="submit" loading={update.isPending} disabled={!isDirty}>
          Save preferences
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-border pt-5 first:border-0 first:pt-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-xl text-xs text-ink-3">{description}</p>
      </div>
      {children}
    </div>
  );
}
