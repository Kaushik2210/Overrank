"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { signInAction } from "@/lib/actions/auth";

export function AdminLoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      setErrors({});
      setFormError(undefined);
      const r = await signInAction({ email: fd.get("email"), password: fd.get("password") });
      if (r.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setErrors(r.fieldErrors ?? {});
        setFormError(r.fieldErrors ? undefined : r.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <Field label="Email" error={errors.email}>
        {({ id, describedBy, invalid }) => <Input id={id} name="email" type="email" autoComplete="username" aria-describedby={describedBy} invalid={invalid} data-autofocus />}
      </Field>
      <Field label="Password" error={errors.password}>
        {({ id, describedBy, invalid }) => <Input id={id} name="password" type="password" autoComplete="current-password" aria-describedby={describedBy} invalid={invalid} />}
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Button loading={pending} className="w-full">
        Sign in
      </Button>
      <Link href="/forgot-password" className="block h-11 text-center text-sm leading-[2.75rem] text-accent hover:underline">
        Forgot your password?
      </Link>
    </form>
  );
}
