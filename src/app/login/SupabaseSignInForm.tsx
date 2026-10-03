"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { claimAccountAction, signInAction } from "@/lib/actions/auth";

type Mode = "signin" | "first";

export function SupabaseSignInForm() {
  const [mode, setMode] = useState<Mode>("signin");
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
      const r =
        mode === "signin"
          ? await signInAction({ identifier: fd.get("identifier"), password: fd.get("password") })
          : await claimAccountAction({ studentId: fd.get("studentId"), code: fd.get("code"), password: fd.get("password") });
      if (r.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setErrors(r.fieldErrors ?? {});
        setFormError(r.fieldErrors ? undefined : r.error);
      }
    });
  };

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="space-y-4" noValidate key={mode}>
        {mode === "signin" ? (
          <>
            <Field label="Student ID or email" error={errors.identifier}>
              {({ id, describedBy, invalid }) => <Input id={id} name="identifier" autoComplete="username" aria-describedby={describedBy} invalid={invalid} data-autofocus />}
            </Field>
            <Field label="Password" error={errors.password}>
              {({ id, describedBy, invalid }) => <Input id={id} name="password" type="password" autoComplete="current-password" aria-describedby={describedBy} invalid={invalid} />}
            </Field>
          </>
        ) : (
          <>
            <p className="rounded-md border border-line bg-bg-0/50 p-3 text-sm text-dim">First time here? Enter the one-time code your faculty gave you, then choose your own password.</p>
            <Field label="Student ID" error={errors.studentId}>
              {({ id, describedBy, invalid }) => <Input id={id} name="studentId" inputMode="numeric" autoComplete="username" aria-describedby={describedBy} invalid={invalid} data-autofocus />}
            </Field>
            <Field label="One-time code" error={errors.code}>
              {({ id, describedBy, invalid }) => <Input id={id} name="code" placeholder="K7QM-2XPD" autoComplete="one-time-code" aria-describedby={describedBy} invalid={invalid} />}
            </Field>
            <Field label="New password" error={errors.password} hint="At least 10 characters.">
              {({ id, describedBy, invalid }) => <Input id={id} name="password" type="password" autoComplete="new-password" aria-describedby={describedBy} invalid={invalid} />}
            </Field>
          </>
        )}
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <Button loading={pending} className="w-full">
          {mode === "signin" ? "Sign in" : "Set password and sign in"}
        </Button>
      </form>
      <button type="button" onClick={() => (setMode(mode === "signin" ? "first" : "signin"), setErrors({}), setFormError(undefined))} className="mt-4 h-11 w-full text-sm text-accent hover:underline">
        {mode === "signin" ? "First time? Use your one-time code" : "I already have a password"}
      </button>
    </div>
  );
}
