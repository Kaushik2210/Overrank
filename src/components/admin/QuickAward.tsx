"use client";

import { Plus } from "lucide-react";
import { useAdmin } from "./AdminShell";
import { Button } from "@/components/ui/Button";

export function QuickAward({ label = "Award points" }: { label?: string }) {
  const { openAward } = useAdmin();
  return (
    <Button onClick={() => openAward()}>
      <Plus className="size-4" /> {label}
    </Button>
  );
}
