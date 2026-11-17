import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useCreateJobSource, type NewJobSource } from "../api";
import { boardTypes, type BoardType } from "../boardTypes";

const jobSourceSchema = z
  .object({
    boardType: z.enum([
      "GREENHOUSE",
      "LEVER",
      "ASHBY",
      "SMARTRECRUITERS",
      "WORKDAY",
      "ADZUNA",
      "CAREER_PAGE",
    ]),
    boardToken: z.string().trim().min(1, "Required").max(500),
    companyName: z.string().trim().max(255),
    companyDomain: z.string().trim().max(255),
    searchQuery: z.string().trim().max(255),
    searchLocation: z.string().trim().max(255),
    region: z.enum(["GLOBAL", "EU"]),
  })
  .superRefine((values, context) => {
    if (values.boardType === "ADZUNA") {
      if (!values.searchQuery) {
        context.addIssue({
          code: "custom",
          path: ["searchQuery"],
          message: "Adzuna needs search terms",
        });
      }
      return;
    }
    if (!values.companyName) {
      context.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Enter the company name",
      });
    }
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(values.companyDomain)) {
      context.addIssue({
        code: "custom",
        path: ["companyDomain"],
        message: "Enter a domain like acme.com",
      });
    }
    if (values.boardType === "CAREER_PAGE" && !/^https:\/\//i.test(values.boardToken)) {
      context.addIssue({ code: "custom", path: ["boardToken"], message: "Enter an https:// URL" });
    }
  });

type JobSourceValues = z.infer<typeof jobSourceSchema>;

function toRequest(values: JobSourceValues): NewJobSource {
  if (values.boardType === "ADZUNA") {
    return {
      boardType: values.boardType,
      boardToken: values.boardToken,
      searchQuery: values.searchQuery,
      ...(values.searchLocation ? { searchLocation: values.searchLocation } : {}),
    };
  }

  return {
    boardType: values.boardType,
    boardToken: values.boardToken,
    companyName: values.companyName,
    companyDomain: values.companyDomain.toLowerCase(),
    ...(values.boardType === "LEVER" ? { region: values.region } : {}),
    ...(values.boardType === "CAREER_PAGE" && values.searchQuery
      ? { searchQuery: values.searchQuery }
      : {}),
  };
}

interface JobSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobSourceDialog({ open, onOpenChange }: JobSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          size="lg"
          title="Add a job board"
          description="It's polled on a schedule, and once right away."
        >
          <JobSourceForm onDone={() => onOpenChange(false)} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function JobSourceForm({ onDone }: { onDone: () => void }) {
  const create = useCreateJobSource();
  const form = useForm<JobSourceValues>({
    resolver: zodResolver(jobSourceSchema),
    defaultValues: {
      boardType: "GREENHOUSE",
      boardToken: "",
      companyName: "",
      companyDomain: "",
      searchQuery: "",
      searchLocation: "",
      region: "GLOBAL",
    },
  });
  const { errors } = form.formState;
  const boardType = useWatch({ control: form.control, name: "boardType" });
  const board = boardTypes[boardType];

  const onSubmit = form.handleSubmit((values) =>
    create.mutate(toRequest(values), {
      onSuccess: onDone,
      onError: (error) =>
        applyServerErrors(error, form.setError, [
          "boardToken",
          "companyName",
          "companyDomain",
          "searchQuery",
          "searchLocation",
        ]),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {create.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(create.error)}</FormAlert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Board type">
          <Select {...form.register("boardType")}>
            {(Object.keys(boardTypes) as BoardType[]).map((type) => (
              <option key={type} value={type}>
                {boardTypes[type].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={board.token}
          error={errors.boardToken?.message}
          hint={`For example ${board.example}`}
        >
          <Input {...form.register("boardToken")} />
        </Field>
        {boardType === "ADZUNA" ? (
          <>
            <Field label="Search terms" error={errors.searchQuery?.message}>
              <Input placeholder="e.g. golang engineer" {...form.register("searchQuery")} />
            </Field>
            <Field label="Location" error={errors.searchLocation?.message} hint="Optional">
              <Input placeholder="e.g. Bengaluru" {...form.register("searchLocation")} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Company name" error={errors.companyName?.message}>
              <Input {...form.register("companyName")} />
            </Field>
            <Field
              label="Company domain"
              error={errors.companyDomain?.message}
              hint="Used to find contacts."
            >
              <Input placeholder="acme.com" {...form.register("companyDomain")} />
            </Field>
          </>
        )}
        {boardType === "LEVER" ? (
          <Field label="Region">
            <Select {...form.register("region")}>
              <option value="GLOBAL">Global (jobs.lever.co)</option>
              <option value="EU">EU (jobs.eu.lever.co)</option>
            </Select>
          </Field>
        ) : null}
        {boardType === "CAREER_PAGE" ? (
          <Field
            label="Sitemap URL filter"
            error={errors.searchQuery?.message}
            hint="Optional. Only URLs containing this are read."
          >
            <Input placeholder="/jobs/" {...form.register("searchQuery")} />
          </Field>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Add and poll
        </Button>
      </div>
    </form>
  );
}
