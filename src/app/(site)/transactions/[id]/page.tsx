import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReverseButton } from "@/components/points/ReverseButton";
import { TransactionDetail } from "@/components/points/TransactionDetail";
import { requireStaff } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { evidenceHref } from "@/lib/storage";

export const metadata: Metadata = { title: "Transaction", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const tx = await getRepo().getTransaction(id);
  if (!tx) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6">
      <Link href="/admin/points" className="text-sm text-dim hover:text-ink">
        &larr; Back to the ledger
      </Link>
      <h1 className="mt-4 mb-8 font-display text-3xl font-bold sm:text-4xl">Transaction detail</h1>
      <TransactionDetail tx={tx} evidenceHref={await evidenceHref(tx.evidenceUrl)} />
      {tx.status === "active" && !tx.reversesId && (
        <div className="mt-6">
          <ReverseButton id={tx.id} label={`${tx.studentName}: ${tx.reason} (${tx.amount > 0 ? "+" : ""}${tx.amount})`} />
        </div>
      )}
    </div>
  );
}
