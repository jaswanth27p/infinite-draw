"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

interface BalanceResponse {
  balance: number;
}

interface CheckoutResponse {
  url: string;
}

export function useCredits() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const balanceQuery = useQuery<BalanceResponse>({
    queryKey: ["credits", "balance"],
    queryFn: () => apiClient("/credits/balance"),
  });

  const checkout = useMutation({
    mutationFn: (amountRupees: number) =>
      apiClient("/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountRupees }),
      }) as Promise<CheckoutResponse>,
  });

  return {
    balance: balanceQuery.data?.balance ?? 0,
    isLoadingBalance: balanceQuery.isLoading,
    refetchBalance: () => queryClient.invalidateQueries({ queryKey: ["credits", "balance"] }),
    startCheckout: (amountRupees: number) => checkout.mutateAsync(amountRupees),
    isStartingCheckout: checkout.isPending,
  };
}
