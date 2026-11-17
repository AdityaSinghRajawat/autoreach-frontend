import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useSaveApplicationProfile, type ApplicationProfile } from "../api";
import {
  applicationProfileFromForm,
  applicationProfileSchema,
  formFromApplicationProfile,
  type ApplicationProfileValues,
} from "../schemas";

interface ApplicationProfileFormProps {
  candidateId: string;
  profile: ApplicationProfile;
}

const serverFields = [
  "phone",
  "location",
  "currentCompany",
  "linkedinUrl",
  "githubUrl",
  "websiteUrl",
  "salaryExpectation",
  "noticePeriod",
  "howDidYouHear",
  "coverLetter",
] as const;

export function ApplicationProfileForm({ candidateId, profile }: ApplicationProfileFormProps) {
  const save = useSaveApplicationProfile(candidateId);
  const form = useForm<ApplicationProfileValues>({
    resolver: zodResolver(applicationProfileSchema),
    values: formFromApplicationProfile(profile),
    resetOptions: { keepDirtyValues: true },
  });
  const answers = useFieldArray({ control: form.control, name: "answers" });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    save.mutate(applicationProfileFromForm(values), {
      onSuccess: (saved) => form.reset(formFromApplicationProfile(saved)),
      onError: (error) => applyServerErrors(error, form.setError, serverFields),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {save.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(save.error)}</FormAlert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Contact and links</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" error={errors.phone?.message}>
            <Input type="tel" autoComplete="tel" {...form.register("phone")} />
          </Field>
          <Field label="Location" error={errors.location?.message} hint="City and country">
            <Input autoComplete="address-level2" {...form.register("location")} />
          </Field>
          <Field label="Current company" error={errors.currentCompany?.message}>
            <Input autoComplete="organization" {...form.register("currentCompany")} />
          </Field>
          <Field label="LinkedIn" error={errors.linkedinUrl?.message}>
            <Input type="url" {...form.register("linkedinUrl")} />
          </Field>
          <Field label="GitHub" error={errors.githubUrl?.message}>
            <Input type="url" {...form.register("githubUrl")} />
          </Field>
          <Field label="Website or portfolio" error={errors.websiteUrl?.message}>
            <Input type="url" autoComplete="url" {...form.register("websiteUrl")} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common questions</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Authorised to work in the job's country?">
            <Select {...form.register("workAuthorized")}>
              <option value="">Ask me each time</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Need visa sponsorship?">
            <Select {...form.register("requiresSponsorship")}>
              <option value="">Ask me each time</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Salary expectation" error={errors.salaryExpectation?.message}>
            <Input placeholder="e.g. 30 LPA, negotiable" {...form.register("salaryExpectation")} />
          </Field>
          <Field label="Notice period" error={errors.noticePeriod?.message}>
            <Input placeholder="e.g. 30 days" {...form.register("noticePeriod")} />
          </Field>
          <Field
            label="How did you hear about us?"
            error={errors.howDidYouHear?.message}
            className="sm:col-span-2"
          >
            <Input placeholder="e.g. Company careers page" {...form.register("howDidYouHear")} />
          </Field>
          <Field
            label="Cover letter"
            error={errors.coverLetter?.message}
            className="sm:col-span-2"
            hint="Used where a form asks for one. Keep it general; it's sent to every company."
          >
            <Textarea rows={8} {...form.register("coverLetter")} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Exact answers</CardTitle>
            <p className="mt-1 text-sm text-ink-2">
              For questions you see often. Write the question as forms word it.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => answers.append({ question: "", answer: "" })}
          >
            <Plus aria-hidden />
            Add answer
          </Button>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {answers.fields.length === 0 ? (
            <p className="text-sm text-ink-3">No exact answers yet.</p>
          ) : (
            answers.fields.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Field label="Question" error={errors.answers?.[index]?.question?.message}>
                  <Input {...form.register(`answers.${index}.question`)} />
                </Field>
                <Field label="Answer" error={errors.answers?.[index]?.answer?.message}>
                  <Input {...form.register(`answers.${index}.answer`)} />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end"
                  onClick={() => answers.remove(index)}
                  aria-label={`Remove answer ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!isDirty || save.isPending}
          onClick={() => form.reset(formFromApplicationProfile(profile))}
        >
          Discard changes
        </Button>
        <Button type="submit" loading={save.isPending} disabled={!isDirty}>
          Save answers
        </Button>
      </div>
    </form>
  );
}
