"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";
import { AddCreditsDialog } from "@/components/add-credits-dialog";

export function CreditsBalance() {
  const { balance, isLoadingBalance } = useCredits();

  if (isLoadingBalance) return null;

  return (
    <AddCreditsDialog
      balance={balance}
      trigger={
        <Button variant="outline" size="sm">
          <Wallet className="size-4" />₹{balance}
        </Button>
      }
    />
  );
}
