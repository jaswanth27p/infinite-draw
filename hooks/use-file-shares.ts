"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface FileShare {
  id: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  user: { name: string | null; email: string };
}

export function useFileShares(fileId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const sharesQuery = useQuery<FileShare[]>({
    queryKey: ["file", fileId, "shares"],
    queryFn: () => apiClient(`/files/${fileId}/shares`),
  });

  function invalidateShares() {
    return queryClient.invalidateQueries({ queryKey: ["file", fileId, "shares"] });
  }

  const invite = useMutation({
    mutationFn: ({ email, role }: { email: string; role: "VIEWER" | "COMMENTER" | "EDITOR" }) =>
      apiClient(`/files/${fileId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      }),
    onSuccess: invalidateShares,
  });

  const updateRole = useMutation({
    mutationFn: ({ shareId, role }: { shareId: string; role: "VIEWER" | "COMMENTER" | "EDITOR" }) =>
      apiClient(`/files/${fileId}/shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),
    onSuccess: invalidateShares,
  });

  const remove = useMutation({
    mutationFn: (shareId: string) =>
      apiClient(`/files/${fileId}/shares/${shareId}`, { method: "DELETE" }),
    onSuccess: invalidateShares,
  });

  const updateGeneralAccess = useMutation({
    mutationFn: (body: { generalAccess: "RESTRICTED" | "ANYONE"; generalAccessRole?: "VIEWER" | "COMMENTER" | "EDITOR" }) =>
      apiClient(`/files/${fileId}/general-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["file", fileId], exact: true }),
  });

  return { sharesQuery, invite, updateRole, remove, updateGeneralAccess };
}
