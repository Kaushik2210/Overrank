"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { previewSignInAction } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button loading={pending} className="w-full">
      Sign in
    </Button>
  );
}

export function PreviewSignInForm({ error }: { error: boolean }) {
  return (
    <form action={previewSignInAction} className="mt-6 space-y-4">
      <Field label="Student ID" error={error ? "We could not find that student ID." : undefined}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="studentId" inputMode="numeric" autoComplete="username" placeholder="2647101" aria-describedby={describedBy} invalid={invalid} required data-autofocus />
        )}
      </Field>
      <Submit />
    </form>
  );
}
