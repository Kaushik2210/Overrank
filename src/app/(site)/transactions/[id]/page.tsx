import { LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TransactionDetail } from "@/components/points/TransactionDetail";
import { ReverseButton } from "@/components/points/ReverseButton";
import { Button } from "@/components/ui/Button";
import { evidenceHref } from "@/lib/storage";
import { requireSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Transaction" };
export const dynamic = "force-dynamic";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tx = await getRepo().getTransaction(id);
  // students may only open their own transactions
  if (!tx || (session.role === "student" && tx.studentId !== session.studentId)) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6">
      <Link href={session.role === "student" ? "/dashboard" : "/admin/points"} className="text-sm text-dim hover:text-ink">
        &larr; Back
      </Link>
      <h1 className="mt-4 mb-8 font-display text-3xl font-bold sm:text-4xl">Transaction detail</h1>
      <TransactionDetail tx={tx} evidenceHref={await evidenceHref(tx.evidenceUrl)} />
      {session.role !== "student" && tx.status === "active" && !tx.reversesId && (
        <div className="mt-6">
          <ReverseButton id={tx.id} label={`${tx.studentName}: ${tx.reason} (${tx.amount > 0 ? "+" : ""}${tx.amount})`} />
        </div>
      )}
      {session.role === "student" && tx.status === "active" && !tx.reversesId && (
        <div className="mt-6">
          <Button href={`/disputes?tx=${tx.id}`} variant="outline">
            <LifeBuoy className="size-4" /> Dispute this transaction
          </Button>
        </div>
      )}
    </div>
  );
}
