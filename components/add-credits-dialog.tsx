"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";

const PRESET_AMOUNTS = [100, 250, 500, 1000];
const MIN_AMOUNT = 100;

export function AddCreditsDialog({
  balance,
  trigger,
}: {
  balance: number;
  trigger: React.ReactNode;
}) {
  const { startCheckout, isStartingCheckout } = useCredits();
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handlePay(amountRupees: number) {
    setError(null);
    try {
      const { url } = await startCheckout(amountRupees);
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = url;
    } catch {
      setError("Something went wrong starting checkout — try again.");
    }
  }

  function handleCustomPay() {
    const amount = Number(customAmount);
    if (!Number.isInteger(amount) || amount < MIN_AMOUNT) {
      setError(`Enter a whole-rupee amount of at least ₹${MIN_AMOUNT}.`);
      return;
    }
    void handlePay(amount);
  }

  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add credits</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Current balance: ₹{balance}</p>

        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              disabled={isStartingCheckout}
              onClick={() => void handlePay(amount)}
            >
              ₹{amount}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t pt-4">
          <Input
            type="number"
            min={MIN_AMOUNT}
            step={1}
            placeholder={`Custom amount (min ₹${MIN_AMOUNT})`}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
          <Button disabled={isStartingCheckout || !customAmount} onClick={handleCustomPay}>
            Pay
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
