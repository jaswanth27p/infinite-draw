"use client";

import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";

export default function DashboardPage() {
  const apiClient = useApiClient();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    apiClient("/me")
      .then((data: { userId: string }) => {
        setUserId(data.userId);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [apiClient]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-16">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      {status === "loading" && <p>Checking backend connection…</p>}
      {status === "ok" && <p>Connected as {userId}</p>}
      {status === "error" && <p className="text-red-500">Could not reach backend.</p>}
    </main>
  );
}
