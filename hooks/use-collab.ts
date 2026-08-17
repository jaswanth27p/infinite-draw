"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { reconcileElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const FULL_RESYNC_INTERVAL_MS = 20_000;

type Role = "OWNER" | "EDITOR" | "VIEWER";

export function useCollab(
  fileId: string,
  role: Role,
  onRemoteSceneUpdate: (elements: readonly ExcalidrawElement[]) => void,
) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  const broadcastedVersionsRef = useRef<Map<string, number>>(new Map());
  const localElementsRef = useRef<readonly ExcalidrawElement[]>([]);
  const knownCollaboratorIdsRef = useRef<Set<string>>(new Set());
  const onRemoteSceneUpdateRef = useRef(onRemoteSceneUpdate);
  // eslint-disable-next-line react-hooks/refs
  onRemoteSceneUpdateRef.current = onRemoteSceneUpdate;
  const roleRef = useRef(role);
  // eslint-disable-next-line react-hooks/refs
  roleRef.current = role;

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;
    let resyncInterval: ReturnType<typeof setInterval> | null = null;

    function reconcileAndApply(remoteElements: readonly ExcalidrawElement[]) {
      const reconciled = reconcileElements(
        localElementsRef.current as never,
        remoteElements as never,
        {} as AppState,
      );
      localElementsRef.current = reconciled;
      onRemoteSceneUpdateRef.current(reconciled);
    }

    async function connect() {
      const token = await getToken();
      if (cancelled) return;

      socket = io(WS_URL, { auth: { token } });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket!.emit(
          "join-room",
          { fileId },
          (response: { event: "room-init"; data: { collaborators: string[] } }) => {
            if (cancelled) return;
            knownCollaboratorIdsRef.current = new Set(response.data.collaborators);
            setCollaboratorIds(response.data.collaborators.filter((id) => id !== socket!.id));
          },
        );
      });

      socket.on("room-user-change", (payload: { collaborators: string[] }) => {
        if (cancelled) return;

        const newIds = payload.collaborators.filter(
          (id) => id !== socket!.id && !knownCollaboratorIdsRef.current.has(id),
        );
        knownCollaboratorIdsRef.current = new Set(payload.collaborators);

        if (
          newIds.length > 0 &&
          roleRef.current !== "VIEWER" &&
          localElementsRef.current.length > 0
        ) {
          socket!.emit("scene-init", { fileId, elements: localElementsRef.current });
        }

        setCollaboratorIds(payload.collaborators.filter((id) => id !== socket!.id));
      });

      socket.on("scene-init", (payload: { elements: ExcalidrawElement[] }) => {
        if (!cancelled) reconcileAndApply(payload.elements);
      });
      socket.on("scene-update", (payload: { elements: ExcalidrawElement[] }) => {
        if (!cancelled) reconcileAndApply(payload.elements);
      });

      resyncInterval = setInterval(() => {
        if (socket?.connected && localElementsRef.current.length > 0) {
          socket.emit("scene-update", { fileId, elements: localElementsRef.current });
        }
      }, FULL_RESYNC_INTERVAL_MS);
    }

    void connect();

    return () => {
      cancelled = true;
      if (resyncInterval) clearInterval(resyncInterval);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [fileId, getToken]);

  const broadcastElements = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      localElementsRef.current = elements;
      if (roleRef.current === "VIEWER") return;

      const changed = elements.filter((el) => {
        const lastBroadcast = broadcastedVersionsRef.current.get(el.id);
        return lastBroadcast === undefined || el.version > lastBroadcast;
      });
      if (changed.length === 0) return;

      for (const el of changed) {
        broadcastedVersionsRef.current.set(el.id, el.version);
      }
      socketRef.current?.emit("scene-update", { fileId, elements: changed });
    },
    [fileId],
  );

  return { collaboratorIds, broadcastElements };
}
