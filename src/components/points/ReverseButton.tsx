"use client";

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { reverseTransactionAction } from "@/lib/actions/admin";

export function ReverseButton({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Undo2 className="size-4" /> Reverse
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Reverse this transaction?" description="History stays intact. A compensating entry is added so the student and team totals return to where they were.">
        <div className="space-y-4 p-5">
          <p className="rounded-md border border-line bg-bg-0/50 p-3 text-sm">{label}</p>
          <Field label="Reason for reversal">{({ id: fid }) => <Input id={fid} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Entered twice" data-autofocus />}</Field>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await reverseTransactionAction(id, note);
                  if (r.ok) {
                    toast({ kind: "success", title: "Transaction reversed" });
                    setOpen(false);
                    router.refresh();
                  } else toast({ kind: "error", title: "Could not reverse", body: r.error });
                })
              }
            >
              Reverse
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
