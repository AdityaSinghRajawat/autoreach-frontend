import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useResetPassword } from "../api";
import { AuthLayout } from "../components/AuthLayout";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";

export function ResetPasswordPage() {
  const token = useSearchParams()[0].get("token");
  const resetPassword = useResetPassword();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  if (!token) {
    return <InvalidLink />;
  }

  if (resetPassword.isSuccess) {
    return (
      <AuthLayout
        title="Password changed"
        description="You've been signed out everywhere. Sign in with your new password."
      >
        <Link to="/login" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Sign in
        </Link>
      </AuthLayout>
    );
  }

  const onSubmit = form.handleSubmit(({ password }) => {
    resetPassword.mutate(
      { token, password },
      { onError: (error) => applyServerErrors(error, form.setError, ["password"]) },
    );
  });

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {resetPassword.isError && !Object.keys(errors).length ? (
          <FormAlert>
            {errorMessage(resetPassword.error)}{" "}
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Request a new link
            </Link>
          </FormAlert>
        ) : null}
        <Field label="New password" error={errors.password?.message} hint="At least 10 characters.">
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>
        <Button type="submit" size="lg" loading={resetPassword.isPending}>
          Change password
        </Button>
      </form>
    </AuthLayout>
  );
}

function InvalidLink() {
  return (
    <AuthLayout
      title="This link doesn't work"
      description="The reset link is incomplete. Request a new one and open it from the email."
    >
      <Link to="/forgot-password" className={buttonVariants({ size: "lg", className: "w-full" })}>
        Request a new link
      </Link>
    </AuthLayout>
  );
}
