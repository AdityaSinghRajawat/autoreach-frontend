import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, PasswordInput, Select } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useConnectMailbox, useVerifyMailbox } from "../api";

const security = z.enum(["TLS", "STARTTLS", "NONE"]);
const port = z.number({ error: "Enter a port" }).int().min(1).max(65_535);

const mailboxSchema = z.object({
  emailAddress: z.email("Enter a valid email address").max(255),
  displayName: z.string().trim().max(255),
  username: z.string().trim().min(1, "Enter the login, usually your email address").max(255),
  password: z.string().min(1, "Enter the password or app password").max(1024),
  smtpHost: z.string().trim().min(1, "Enter the SMTP server"),
  smtpPort: port,
  smtpSecurity: security,
  imapHost: z.string().trim().min(1, "Enter the IMAP server"),
  imapPort: port,
  imapSecurity: security,
  dailyLimit: z.number({ error: "Enter a number" }).int().min(1).max(500),
});

type MailboxValues = z.infer<typeof mailboxSchema>;

type ServerSettings = Pick<
  MailboxValues,
  "smtpHost" | "smtpPort" | "smtpSecurity" | "imapHost" | "imapPort" | "imapSecurity"
>;

const gmailSettings: ServerSettings = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 465,
  smtpSecurity: "TLS",
  imapHost: "imap.gmail.com",
  imapPort: 993,
  imapSecurity: "TLS",
};

const presets: { id: string; label: string; hint: string; settings: ServerSettings }[] = [
  {
    id: "gmail",
    label: "Gmail / Google Workspace",
    hint: "Use an app password from your Google account's security settings.",
    settings: gmailSettings,
  },
  {
    id: "outlook",
    label: "Outlook / Microsoft 365",
    hint: "Your admin may need to allow SMTP AUTH for the mailbox.",
    settings: {
      smtpHost: "smtp.office365.com",
      smtpPort: 587,
      smtpSecurity: "STARTTLS",
      imapHost: "outlook.office365.com",
      imapPort: 993,
      imapSecurity: "TLS",
    },
  },
  {
    id: "zoho",
    label: "Zoho Mail",
    hint: "Use an app-specific password if two-factor sign-in is on.",
    settings: {
      smtpHost: "smtp.zoho.com",
      smtpPort: 465,
      smtpSecurity: "TLS",
      imapHost: "imap.zoho.com",
      imapPort: 993,
      imapSecurity: "TLS",
    },
  },
];

interface ConnectMailboxDialogProps {
  candidateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectMailboxDialog({
  candidateId,
  open,
  onOpenChange,
}: ConnectMailboxDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          size="lg"
          title="Connect a mailbox"
          description="AutoReach sends from this address and watches its inbox for replies. The password is encrypted and never shown again."
        >
          <ConnectForm candidateId={candidateId} onDone={() => onOpenChange(false)} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function ConnectForm({ candidateId, onDone }: { candidateId: string; onDone: () => void }) {
  const connect = useConnectMailbox(candidateId);
  const verify = useVerifyMailbox(candidateId);
  const form = useForm<MailboxValues>({
    resolver: zodResolver(mailboxSchema),
    defaultValues: {
      emailAddress: "",
      displayName: "",
      username: "",
      password: "",
      ...gmailSettings,
      dailyLimit: 30,
    },
  });
  const { errors } = form.formState;

  const applyPreset = (id: string) => {
    const preset = presets.find((candidate) => candidate.id === id);
    if (preset) {
      for (const [key, value] of Object.entries(preset.settings)) {
        form.setValue(key as keyof ServerSettings, value as never, { shouldDirty: true });
      }
    }
  };

  const onSubmit = form.handleSubmit(({ displayName, ...values }) => {
    connect.mutate(
      { ...values, displayName: displayName || null },
      {
        onSuccess: (mailbox) => {
          verify.mutate(mailbox.accountId);
          onDone();
        },
        onError: (error) =>
          applyServerErrors(error, form.setError, [
            "emailAddress",
            "username",
            "password",
            "smtpHost",
            "smtpPort",
            "smtpSecurity",
            "imapHost",
            "imapPort",
            "imapSecurity",
            "dailyLimit",
          ]),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {connect.isError && !Object.keys(errors).length ? (
        <FormAlert>{errorMessage(connect.error)}</FormAlert>
      ) : null}

      <Field label="Provider" hint="Fills in the server settings below. You can still change them.">
        <Select defaultValue="gmail" onChange={(event) => applyPreset(event.target.value)}>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Other (enter settings by hand)</option>
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email address" error={errors.emailAddress?.message}>
          <Input type="email" autoComplete="email" {...form.register("emailAddress")} />
        </Field>
        <Field
          label="Sender name"
          error={errors.displayName?.message}
          hint="Optional. Shown in the From line."
        >
          <Input autoComplete="name" {...form.register("displayName")} />
        </Field>
        <Field label="Login" error={errors.username?.message}>
          <Input autoComplete="username" {...form.register("username")} />
        </Field>
        <Field label="Password or app password" error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </Field>
      </div>

      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
          Server settings
        </summary>
        <div className="grid gap-5 border-t border-border p-4 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label="SMTP server" error={errors.smtpHost?.message}>
            <Input {...form.register("smtpHost")} />
          </Field>
          <Field label="Port" error={errors.smtpPort?.message}>
            <Input
              type="number"
              inputMode="numeric"
              {...form.register("smtpPort", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Security">
            <Select {...form.register("smtpSecurity")}>
              <option value="TLS">TLS</option>
              <option value="STARTTLS">STARTTLS</option>
              <option value="NONE">None</option>
            </Select>
          </Field>
          <Field label="IMAP server" error={errors.imapHost?.message}>
            <Input {...form.register("imapHost")} />
          </Field>
          <Field label="Port" error={errors.imapPort?.message}>
            <Input
              type="number"
              inputMode="numeric"
              {...form.register("imapPort", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Security">
            <Select {...form.register("imapSecurity")}>
              <option value="TLS">TLS</option>
              <option value="STARTTLS">STARTTLS</option>
              <option value="NONE">None</option>
            </Select>
          </Field>
        </div>
      </details>

      <Field
        label="Daily sending limit"
        error={errors.dailyLimit?.message}
        hint="Keeps new mailboxes out of spam folders. The server caps this at its own maximum."
      >
        <Input
          type="number"
          min={1}
          inputMode="numeric"
          className="w-32"
          {...form.register("dailyLimit", { valueAsNumber: true })}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={connect.isPending}>
          Connect and test
        </Button>
      </div>
    </form>
  );
}
