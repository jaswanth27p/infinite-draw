"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Carries the response's numeric status as a real property, not just baked
// into the message string — callers that need to distinguish e.g. 403
// ("account not provisioned yet") from 404 ("not found") should check
// `error.status` instead of string-matching `error.message`.
export class ApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`API request failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

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
        throw new ApiError(res.status);
      }

      // A 204 has nothing to parse — calling
      // res.json() on an empty body throws "Unexpected end of JSON input",
      // which would otherwise make every no-content endpoint's caller hit
      // onError instead of onSuccess even though the request genuinely
      // succeeded.
      if (res.status === 204) {
        return undefined;
      }
      return res.json();
    },
    [getToken],
  );
}
