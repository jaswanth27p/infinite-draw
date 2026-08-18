"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { reconcileElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, Collaborator, SocketId } from "@excalidraw/excalidraw/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const CURSOR_THROTTLE_MS = 33;
const FULL_RESYNC_INTERVAL_MS = 20_000;

type Role = "OWNER" | "EDITOR" | "VIEWER";

interface PointerPayload {
  pointer: { x: number; y: number; tool: "pointer" | "laser" };
  button: "down" | "up";
}

export function useCollab(
  fileId: string,
  role: Role,
  onRemoteSceneUpdate: (elements: readonly ExcalidrawElement[]) => void,
  getAppState?: () => AppState | undefined,
) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [collaborators, setCollaborators] = useState<Map<SocketId, Collaborator>>(new Map());
  const [connectionError, setConnectionError] = useState(false);

  const broadcastedVersionsRef = useRef<Map<string, number>>(new Map());
  const localElementsRef = useRef<readonly ExcalidrawElement[]>([]);
  const knownCollaboratorIdsRef = useRef<Set<string>>(new Set());
  const onRemoteSceneUpdateRef = useRef(onRemoteSceneUpdate);
  // eslint-disable-next-line react-hooks/refs
  onRemoteSceneUpdateRef.current = onRemoteSceneUpdate;
  const getAppStateRef = useRef(getAppState);
  // eslint-disable-next-line react-hooks/refs
  getAppStateRef.current = getAppState;
  const roleRef = useRef(role);
  // eslint-disable-next-line react-hooks/refs
  roleRef.current = role;
  // Sent as-is with every mouse-location broadcast so peers can label this
  // user's cursor — cosmetic only, the server never reads or validates it.
  const usernameRef = useRef<string | null>(null);
  // eslint-disable-next-line react-hooks/refs
  usernameRef.current = user?.fullName ?? null;
  const pointerThrottleRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    pending: PointerPayload | null;
  }>({ timer: null, pending: null });

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;
    let resyncInterval: ReturnType<typeof setInterval> | null = null;

    function reconcileAndApply(remoteElements: readonly ExcalidrawElement[]) {
      const reconciled = reconcileElements(
        localElementsRef.current as never,
        remoteElements as never,
        (getAppStateRef.current?.() ?? {}) as AppState,
      );
      localElementsRef.current = reconciled;
      for (const el of reconciled) {
        broadcastedVersionsRef.current.set(el.id, el.version);
      }
      onRemoteSceneUpdateRef.current(reconciled);
    }

    async function connect() {
      if (cancelled) return;

      // `auth` must be a FUNCTION (not a static object) so Socket.IO calls
      // it again — minting a fresh Clerk token — on every connection
      // attempt, not just the first. Clerk session tokens are short-lived
      // (~60s); with a static `{ token }` object, every auto-reconnect
      // after the first ~60s would replay the original (by then expired)
      // token and get rejected by the server's auth guard.
      socket = io(WS_URL, {
        auth: (cb) => {
          getToken().then(
            (token) => cb({ token }),
            () => cb({ token: null }),
          );
        },
      });
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        console.error("[collab] connect error", err);
        if (!cancelled) setConnectionError(true);
      });
      // Nest emits this for a rejected WsException (e.g. auth failure,
      // stale/revoked file access) — without this listener those failures
      // are entirely silent, the canvas just quietly stops collaborating.
      socket.on("exception", (err) => {
        console.error("[collab] server exception", err);
      });
      socket.on("disconnect", (reason) => {
        console.error("[collab] disconnected", reason);
      });

      socket.on("connect", () => {
        setConnectionError(false);
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

        const stillPresent = new Set(payload.collaborators);
        setCollaboratorIds(payload.collaborators.filter((id) => id !== socket!.id));
        setCollaborators((prev) => {
          const next = new Map(prev);
          for (const id of next.keys()) {
            if (!stillPresent.has(id)) next.delete(id);
          }
          return next;
        });
      });

      socket.on("scene-init", (payload: { elements: ExcalidrawElement[] }) => {
        if (!cancelled) reconcileAndApply(payload.elements);
      });
      socket.on("scene-update", (payload: { elements: ExcalidrawElement[] }) => {
        if (!cancelled) reconcileAndApply(payload.elements);
      });

      socket.on(
        "mouse-location",
        (payload: {
          socketId: string;
          pointer: { x: number; y: number };
          button: "up" | "down";
          selectedElementIds: Record<string, boolean>;
          username: string | null;
        }) => {
          if (cancelled) return;
          const socketId = payload.socketId as SocketId;
          setCollaborators((prev) => {
            const next = new Map(prev);
            next.set(socketId, {
              ...next.get(socketId),
              pointer: { x: payload.pointer.x, y: payload.pointer.y, tool: "pointer" },
              button: payload.button,
              selectedElementIds: payload.selectedElementIds,
              username: payload.username,
              socketId,
            } as Collaborator);
            return next;
          });
        },
      );
      socket.on(
        "idle-status",
        (payload: { socketId: string; userState: "active" | "idle" | "away" }) => {
          if (cancelled) return;
          const socketId = payload.socketId as SocketId;
          setCollaborators((prev) => {
            const next = new Map(prev);
            next.set(socketId, {
              ...next.get(socketId),
              socketId,
              userState: payload.userState as unknown as Collaborator["userState"],
            } as Collaborator);
            return next;
          });
        },
      );

      resyncInterval = setInterval(() => {
        if (
          socket?.connected &&
          roleRef.current !== "VIEWER" &&
          localElementsRef.current.length > 0
        ) {
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

  const broadcastPointer = useCallback(
    (payload: PointerPayload) => {
      if (roleRef.current === "VIEWER") return;
      const state = pointerThrottleRef.current;
      state.pending = payload;
      if (state.timer) return;
      state.timer = setTimeout(() => {
        state.timer = null;
        if (state.pending && socketRef.current?.connected) {
          socketRef.current.emit("mouse-location", {
            fileId,
            pointer: { x: state.pending.pointer.x, y: state.pending.pointer.y },
            button: state.pending.button,
            selectedElementIds: {},
            username: usernameRef.current,
          });
        }
      }, CURSOR_THROTTLE_MS);
    },
    [fileId],
  );

  return { collaboratorIds, collaborators, broadcastElements, broadcastPointer, connectionError };
}
