"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface FileShare {
  id: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  user: { id: string; name: string | null; email: string };
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
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
    mutationFn: ({ userId, role }: { userId: string; role: "VIEWER" | "COMMENTER" | "EDITOR" }) =>
      apiClient(`/files/${fileId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      }),
    onSuccess: invalidateShares,
  });

  const sharesKey = ["file", fileId, "shares"];

  const updateRole = useMutation({
    mutationFn: ({ shareId, role }: { shareId: string; role: "VIEWER" | "COMMENTER" | "EDITOR" }) =>
      apiClient(`/files/${fileId}/shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),
    onMutate: async ({ shareId, role }) => {
      await queryClient.cancelQueries({ queryKey: sharesKey });
      const previous = queryClient.getQueryData<FileShare[]>(sharesKey);
      queryClient.setQueryData<FileShare[]>(sharesKey, (shares) =>
        shares?.map((share) => (share.id === shareId ? { ...share, role } : share)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(sharesKey, context.previous);
    },
    onSettled: invalidateShares,
  });

  const remove = useMutation({
    mutationFn: (shareId: string) =>
      apiClient(`/files/${fileId}/shares/${shareId}`, { method: "DELETE" }),
    onMutate: async (shareId) => {
      await queryClient.cancelQueries({ queryKey: sharesKey });
      const previous = queryClient.getQueryData<FileShare[]>(sharesKey);
      queryClient.setQueryData<FileShare[]>(sharesKey, (shares) =>
        shares?.filter((share) => share.id !== shareId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(sharesKey, context.previous);
    },
    onSettled: invalidateShares,
  });

  const fileKey = ["file", fileId];

  const updateGeneralAccess = useMutation({
    mutationFn: (body: { generalAccess: "RESTRICTED" | "ANYONE"; generalAccessRole?: "VIEWER" | "COMMENTER" | "EDITOR" }) =>
      apiClient(`/files/${fileId}/general-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: fileKey, exact: true });
      const previous = queryClient.getQueryData<Record<string, unknown>>(fileKey);
      queryClient.setQueryData<Record<string, unknown>>(fileKey, (file) =>
        file ? { ...file, ...body } : file,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(fileKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: fileKey, exact: true }),
  });

  return { sharesQuery, invite, updateRole, remove, updateGeneralAccess };
}

export function useUserSearch(fileId: string, query: string) {
  const apiClient = useApiClient();
  return useQuery<UserSearchResult[]>({
    queryKey: ["file", fileId, "shares", "search", query],
    queryFn: () => apiClient(`/files/${fileId}/shares/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 3,
  });
}
