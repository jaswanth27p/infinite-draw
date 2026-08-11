"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useApiClient() {
  const { getToken } = useAuth();

  return useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }

      return res.json();
    },
    [getToken],
  );
}
