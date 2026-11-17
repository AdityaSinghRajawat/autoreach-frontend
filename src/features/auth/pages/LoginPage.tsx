import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router";

import { errorMessage } from "@/api/errors";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, PasswordInput } from "@/components/ui/Input";
import { applyServerErrors } from "@/lib/forms";

import { useLogin } from "../api";
import { AuthLayout } from "../components/AuthLayout";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginPage() {
  const { search } = useLocation();
  const login = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onError: (error) => applyServerErrors(error, form.setError, ["email", "password"]),
    });
  });

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up where your search left off."
      footer={
        <>
          New to AutoReach?{" "}
          <Link to={`/register${search}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {login.isError && !Object.keys(errors).length ? (
          <FormAlert>{errorMessage(login.error)}</FormAlert>
        ) : null}
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...form.register("password")} />
        </Field>
        <Link
          to="/forgot-password"
          className="-mt-2 w-fit self-end text-sm text-ink-2 hover:text-primary hover:underline"
        >
          Forgot your password?
        </Link>
        <Button type="submit" size="lg" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
