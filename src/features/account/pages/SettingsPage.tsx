import { zodResolver } from "@hookform/resolvers/zod";
import { Download, MailCheck, ShieldAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { errorMessage, isApiError } from "@/api/errors";
import { isAdmin, useSession } from "@/api/session";
import { FormAlert } from "@/components/feedback/FormAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Input, PasswordInput } from "@/components/ui/Input";
import { humanize } from "@/lib/format";

import { useChangePassword, useDeleteAccount, useExportData, useRequestEmailChange } from "../api";

export function SettingsPage() {
  const user = useSession((state) => state.user);

  return (
    <>
      <PageHeader title="Account settings" description="Your sign-in details and your data." />
      <div className="flex flex-col gap-6">
        <Section title="Account">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-3">Email</dt>
              <dd className="mt-0.5 font-medium break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Roles</dt>
              <dd className="mt-1 flex gap-1.5">
                {user?.roles.map((role) => (
                  <Badge key={role} tone={role === "ADMIN" ? "primary" : "neutral"}>
                    {humanize(role)}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Section>
        <Section title="Password" description="Changing it signs you out on every device.">
          <ChangePasswordForm />
        </Section>
        <Section
          title="Email address"
          description="We send a confirmation link to the new address. Nothing changes until you open it."
        >
          <ChangeEmailForm />
        </Section>
        <Section
          title="Your data"
          description="Download everything AutoReach stores about you, as JSON."
        >
          <ExportData />
        </Section>
        <Section
          title="Delete account"
          description="Removes your profile, resumes, mailboxes, messages and applications for good."
          danger
        >
          <DeleteAccount admin={isAdmin(user)} />
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className={danger ? "border-danger/40" : undefined}>
      <CardBody className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div>
          <h2 className={`font-sans text-base font-semibold ${danger ? "text-danger" : ""}`}>
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
        </div>
        <div>{children}</div>
      </CardBody>
    </Card>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword: z.string().min(10, "Use at least 10 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password you haven't been using",
  });

function ChangePasswordForm() {
  const change = useChangePassword();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(({ currentPassword, newPassword }) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        onError: (error) => {
          if (isApiError(error) && error.status === 403) {
            form.setError("currentPassword", { message: "That isn't your current password" });
          }
        },
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
      {change.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(change.error)}</FormAlert>
      ) : null}
      <Field label="Current password" error={errors.currentPassword?.message}>
        <PasswordInput autoComplete="current-password" {...form.register("currentPassword")} />
      </Field>
      <Field
        label="New password"
        error={errors.newPassword?.message}
        hint="At least 10 characters."
      >
        <PasswordInput autoComplete="new-password" {...form.register("newPassword")} />
      </Field>
      <Field label="Confirm new password" error={errors.confirmPassword?.message}>
        <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" className="self-start" loading={change.isPending}>
        Change password
      </Button>
    </form>
  );
}

const emailSchema = z.object({
  newEmail: z.email("Enter a valid email address").max(255),
  password: z.string().min(1, "Enter your password").max(128),
});

function ChangeEmailForm() {
  const request = useRequestEmailChange();
  const currentEmail = useSession((state) => state.user?.email);
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: "", password: "" },
  });
  const { errors } = form.formState;

  if (request.isSuccess) {
    return (
      <FormAlert tone="success">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <MailCheck className="size-4" aria-hidden />
          Check {request.variables.newEmail}
        </span>
        <p className="mt-1 text-ink-2">
          Open the link we sent there while signed in to finish the change. If that address already
          has an account, nothing is sent.
        </p>
      </FormAlert>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    if (values.newEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      form.setError("newEmail", { message: "That's already your email address" });
      return;
    }
    request.mutate(values, {
      onError: (error) => {
        if (isApiError(error) && error.status === 403) {
          form.setError("password", { message: "That password isn't right" });
        }
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
      {request.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(request.error)}</FormAlert>
      ) : null}
      <Field label="New email" error={errors.newEmail?.message}>
        <Input type="email" autoComplete="email" {...form.register("newEmail")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <PasswordInput autoComplete="current-password" {...form.register("password")} />
      </Field>
      <Button type="submit" className="self-start" loading={request.isPending}>
        Send confirmation link
      </Button>
    </form>
  );
}

function ExportData() {
  const exportData = useExportData();

  return (
    <Button variant="secondary" loading={exportData.isPending} onClick={() => exportData.mutate()}>
      <Download aria-hidden />
      Download my data
    </Button>
  );
}

function DeleteAccount({ admin }: { admin: boolean }) {
  const remove = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const wrongPassword = isApiError(remove.error) && remove.error.status === 403;

  if (admin) {
    return (
      <p className="flex items-start gap-2 text-sm text-ink-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        Administrator accounts can't delete themselves. Ask another administrator to remove the role
        first.
      </p>
    );
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setPassword("");
            remove.reset();
          }
        }}
        title="Delete your account?"
        description="This can't be undone. Download your data first if you want a copy."
        confirmLabel="Delete everything"
        destructive
        pending={remove.isPending}
        onConfirm={() => password && remove.mutate(password)}
      >
        <Field
          label="Enter your password to confirm"
          error={
            wrongPassword
              ? "That password isn't right"
              : remove.isError
                ? errorMessage(remove.error)
                : undefined
          }
        >
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
