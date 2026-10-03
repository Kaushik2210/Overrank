"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { createDisputeAction, createSuggestionAction } from "@/lib/actions/feedback";
import { disputeSchema, suggestionSchema, type DisputeInput, type SuggestionInput } from "@/lib/validators";
import { signed } from "@/lib/utils";
import type { Category, PointTransaction } from "@/lib/data/types";

function EvidenceInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [name, setName] = useState("");
  return (
    <Field label="Evidence (optional)" hint="PNG, JPG, WebP or PDF, up to 5 MB.">
      {({ id, describedBy }) => (
        <label htmlFor={id} className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-line-strong bg-bg-2/50 px-3.5 text-sm text-dim transition-colors hover:border-accent hover:text-ink focus-within:border-accent">
          <Paperclip className="size-4" aria-hidden />
          <span className="truncate">{name || "Attach a file"}</span>
          <input ref={inputRef} id={id} name="evidence" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" aria-describedby={describedBy} className="sr-only" onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
        </label>
      )}
    </Field>
  );
}

function useSubmit<T extends Record<string, unknown>>(action: (fd: FormData) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>, success: string, setError: (k: keyof T & string, m: string) => void, reset: () => void) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();
  const { toast } = useToast();
  const submit = (values: T, fileRef: React.RefObject<HTMLInputElement | null>) =>
    start(async () => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(values)) fd.set(k, String(v));
      const file = fileRef.current;
      if (file?.files?.[0]) fd.set("evidence", file.files[0]);
      const r = await action(fd);
      if (r.ok) {
        setStatus("success");
        toast({ kind: "success", title: success });
        reset();
        if (file) file.value = "";
        router.refresh();
        window.setTimeout(() => setStatus("idle"), 1800);
      } else {
        setStatus("error");
        for (const [k, m] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof T & string, m);
        toast({ kind: "error", title: "Could not submit", body: r.error });
        window.setTimeout(() => setStatus("idle"), 1800);
      }
    });
  return { pending, status, submit };
}

export function SuggestionForm({ categories }: { categories: Category[] }) {
  const file = useRef<HTMLInputElement>(null);
  const f = useForm<SuggestionInput>({ resolver: zodResolver(suggestionSchema) as unknown as Resolver<SuggestionInput>, defaultValues: { activity: "", description: "", categoryId: "", suggestedPoints: 10 } });
  const { pending, status, submit } = useSubmit<SuggestionInput>(createSuggestionAction, "Suggestion sent to faculty", (k, m) => f.setError(k, { message: m }), () => f.reset());
  const e = f.formState.errors;
  return (
    <form onSubmit={(e) => f.handleSubmit((v) => submit(v, file))(e)} className="glass space-y-4 rounded-xl p-5 sm:p-6" noValidate>
      <Field label="Activity" error={e.activity?.message}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} placeholder="Won the inter-college quiz" {...f.register("activity")} />}
      </Field>
      <Field label="What happened" error={e.description?.message}>
        {({ id, describedBy, invalid }) => <Textarea id={id} aria-describedby={describedBy} invalid={invalid} placeholder="Dates, your role, the result..." {...f.register("description")} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" error={e.categoryId?.message}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} aria-describedby={describedBy} invalid={invalid} {...f.register("categoryId")}>
              <option value="">Choose...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Suggested points" error={e.suggestedPoints?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="number" inputMode="numeric" aria-describedby={describedBy} invalid={invalid} {...f.register("suggestedPoints", { valueAsNumber: true })} />}
        </Field>
      </div>
      <EvidenceInput inputRef={file} />
      <Button loading={pending} status={status} className="w-full sm:w-auto">
        Submit suggestion
      </Button>
    </form>
  );
}

export function DisputeForm({ transactions, defaultTx }: { transactions: PointTransaction[]; defaultTx?: string }) {
  const file = useRef<HTMLInputElement>(null);
  const f = useForm<DisputeInput>({ resolver: zodResolver(disputeSchema) as unknown as Resolver<DisputeInput>, defaultValues: { transactionId: defaultTx ?? "", reason: "" } });
  const { pending, status, submit } = useSubmit<DisputeInput>(createDisputeAction, "Dispute filed", (k, m) => f.setError(k, { message: m }), () => f.reset({ transactionId: "", reason: "" }));
  const e = f.formState.errors;
  return (
    <form onSubmit={(e) => f.handleSubmit((v) => submit(v, file))(e)} className="glass space-y-4 rounded-xl p-5 sm:p-6" noValidate>
      <Field label="Transaction" error={e.transactionId?.message}>
        {({ id, describedBy, invalid }) => (
          <Select id={id} aria-describedby={describedBy} invalid={invalid} {...f.register("transactionId")}>
            <option value="">Choose a transaction...</option>
            {transactions.map((t) => (
              <option key={t.id} value={t.id}>
                {signed(t.amount)} · {t.reason.slice(0, 46)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="What is wrong?" error={e.reason?.message}>
        {({ id, describedBy, invalid }) => <Textarea id={id} aria-describedby={describedBy} invalid={invalid} placeholder="I was not at this event because..." {...f.register("reason")} />}
      </Field>
      <EvidenceInput inputRef={file} />
      <Button loading={pending} status={status} className="w-full sm:w-auto">
        File dispute
      </Button>
    </form>
  );
}
