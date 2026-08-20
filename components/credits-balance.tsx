"use client";

import { useEffect, useRef } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";
import { AddCreditsDialog } from "@/components/add-credits-dialog";

// Polls a few times after a successful Stripe redirect, since the webhook
// that actually credits the balance can land a moment after the browser's
// own redirect does — plain window.location.search (not Next's
// useSearchParams) keeps this a one-off mount-time check with no Suspense
// boundary required, since this component is mounted in the root layout
// for every route.
function useRefetchOnCheckoutReturn(refetchBalance: () => void) {
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    let attempts = 0;
    const interval = setInterval(() => {
      refetchBalance();
      attempts += 1;
      if (attempts >= 5) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function CreditsBalance() {
  const { balance, isLoadingBalance, refetchBalance } = useCredits();
  useRefetchOnCheckoutReturn(refetchBalance);

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
