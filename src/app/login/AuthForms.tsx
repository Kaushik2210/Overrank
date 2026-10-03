"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { requestPasswordResetAction, updatePasswordAction } from "@/lib/actions/auth";

export function ForgotPasswordForm({ linkExpired }: { linkExpired: boolean }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <div role="status" className="mt-6 rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
        If that email belongs to a faculty account, a reset link is on its way. It can take a minute, and it is worth checking spam.
      </div>
    );
  }

  return (
    <form
      noValidate
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        start(async () => {
          setErrors({});
          setFormError(undefined);
          const r = await requestPasswordResetAction({ email });
          if (r.ok) setSent(true);
          else {
            setErrors(r.fieldErrors ?? {});
            setFormError(r.fieldErrors ? undefined : r.error);
          }
        });
      }}
    >
      {linkExpired && (
        <p role="alert" className="rounded-md border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
          That link has expired or was already used. Request a new one.
        </p>
      )}
      <Field label="Faculty email" error={errors.email}>
        {({ id, describedBy, invalid }) => <Input id={id} name="email" type="email" autoComplete="email" aria-describedby={describedBy} invalid={invalid} data-autofocus />}
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Button loading={pending} className="w-full">
        Send reset link
      </Button>
      <Link href="/login" className="block h-11 text-center text-sm leading-[2.75rem] text-accent hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form
      noValidate
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setErrors({});
          setFormError(undefined);
          const r = await updatePasswordAction({ password: fd.get("password"), confirm: fd.get("confirm") });
          if (r.ok) {
            router.replace("/admin");
            router.refresh();
          } else {
            setErrors(r.fieldErrors ?? {});
            setFormError(r.fieldErrors ? undefined : r.error);
          }
        });
      }}
    >
      <Field label="New password" error={errors.password} hint="At least 10 characters.">
        {({ id, describedBy, invalid }) => <Input id={id} name="password" type="password" autoComplete="new-password" aria-describedby={describedBy} invalid={invalid} data-autofocus />}
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        {({ id, describedBy, invalid }) => <Input id={id} name="confirm" type="password" autoComplete="new-password" aria-describedby={describedBy} invalid={invalid} />}
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Button loading={pending} className="w-full">
        Save new password
      </Button>
    </form>
  );
}
