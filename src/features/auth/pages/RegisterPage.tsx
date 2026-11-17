import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, PasswordInput } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useRegister } from "../api";
import { AuthLayout } from "../components/AuthLayout";
import { registerSchema, type RegisterValues } from "../schemas";

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    register.mutate(values, {
      // A signed-in outcome is routed by the PublicOnly guard; only a pending one needs this.
      onSuccess: (outcome) => {
        if (outcome.kind === "verifyEmail") {
          navigate("/check-email", { replace: true, state: { email: values.email } });
        }
      },
      onError: (error) =>
        applyServerErrors(error, form.setError, ["fullName", "email", "password"]),
    });
  });

  return (
    <AuthLayout
      title="Create your account"
      description="Upload a resume and AutoReach starts matching jobs for you."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {register.isError && !Object.keys(errors).length ? (
          <FormAlert>{errorMessage(register.error)}</FormAlert>
        ) : null}
        <Field label="Full name" error={errors.fullName?.message}>
          <Input autoComplete="name" {...form.register("fullName")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 10 characters.">
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Button type="submit" size="lg" loading={register.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
