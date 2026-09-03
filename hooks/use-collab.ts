"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { reconcileElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, Collaborator, SocketId } from "@excalidraw/excalidraw/types";
import { useApiClient } from "@/lib/api-client";
import { useFileSocket } from "@/hooks/file-socket-context";

const CURSOR_THROTTLE_MS = 33;
const FULL_RESYNC_INTERVAL_MS = 20_000;

type Role = "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";

interface PointerPayload {
  pointer: { x: number; y: number; tool: "pointer" | "laser" };
  button: "down" | "up";
}

export interface ChatMessage {
  id: string;
  fileId: string;
  authorId: string;
  authorName: string;
  body: string;
  mentionedUserIds: string[];
  createdAt: string;
}

interface MessagesPage {
  items: ChatMessage[];
  nextCursor: string | null;
}

export function useCollab(
  fileId: string,
  role: Role,
  onRemoteSceneUpdate: (elements: readonly ExcalidrawElement[]) => void,
  getAppState?: () => AppState | undefined,
) {
  const { user } = useUser();
  const { socket, connectionError } = useFileSocket();
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [collaborators, setCollaborators] = useState<Map<SocketId, Collaborator>>(new Map());
  const apiClient = useApiClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [ownMessageIds, setOwnMessageIds] = useState<Set<string>>(new Set());
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [prevFileId, setPrevFileId] = useState(fileId);
  if (fileId !== prevFileId) {
    setPrevFileId(fileId);
    setMessages([]);
    setNextCursor(null);
    setOwnMessageIds(new Set());
  }

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
  const usernameRef = useRef<string | null>(null);
  // eslint-disable-next-line react-hooks/refs
  usernameRef.current = user?.fullName ?? null;
  const pointerThrottleRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    pending: PointerPayload | null;
  }>({ timer: null, pending: null });

  // Subscribes this hook's listeners onto the shared connection from
  // FileSocketProvider — the socket itself is opened/closed by the
  // provider, not here. join-room stays here rather than in the provider:
  // it's this hook's own room-membership bookkeeping (collaboratorIds,
  // the scene-init decision below), and useVoice has no need for it —
  // voice roster membership is tracked entirely separately server-side.
  useEffect(() => {
    if (!socket) return;
    let cancelled = false;
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

    function handleConnect() {
      socket!.emit(
        "join-room",
        { fileId },
        (response: { event: "room-init"; data: { collaborators: string[] } }) => {
          if (cancelled) return;
          knownCollaboratorIdsRef.current = new Set(response.data.collaborators);
          setCollaboratorIds(response.data.collaborators.filter((id) => id !== socket!.id));
        },
      );
    }

    function handleRoomUserChange(payload: { collaborators: string[] }) {
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
    }

    function handleSceneInit(payload: { elements: ExcalidrawElement[] }) {
      if (!cancelled) reconcileAndApply(payload.elements);
    }
    function handleSceneUpdate(payload: { elements: ExcalidrawElement[] }) {
      if (!cancelled) reconcileAndApply(payload.elements);
    }

    function handleMouseLocation(payload: {
      socketId: string;
      pointer: { x: number; y: number };
      button: "up" | "down";
      selectedElementIds: Record<string, boolean>;
      username: string | null;
    }) {
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
    }

    function handleIdleStatus(payload: { socketId: string; userState: "active" | "idle" | "away" }) {
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
    }

    function handleChatMessage(message: ChatMessage) {
      if (cancelled) return;
      // Dedupe against the sender's own ack-driven insert in
      // sendChatMessage above — the gateway excludes the sender from this
      // broadcast, so this only matters for edge cases (e.g. a reconnect
      // replaying state), not the common case.
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [message, ...prev]));
    }

    socket.on("connect", handleConnect);
    socket.on("room-user-change", handleRoomUserChange);
    socket.on("scene-init", handleSceneInit);
    socket.on("scene-update", handleSceneUpdate);
    socket.on("mouse-location", handleMouseLocation);
    socket.on("idle-status", handleIdleStatus);
    socket.on("chat-message", handleChatMessage);

    resyncInterval = setInterval(() => {
      if (
        socket?.connected &&
        roleRef.current !== "VIEWER" &&
        localElementsRef.current.length > 0
      ) {
        socket.emit("scene-update", { fileId, elements: localElementsRef.current });
      }
    }, FULL_RESYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (resyncInterval) clearInterval(resyncInterval);
      socket.off("connect", handleConnect);
      socket.off("room-user-change", handleRoomUserChange);
      socket.off("scene-init", handleSceneInit);
      socket.off("scene-update", handleSceneUpdate);
      socket.off("mouse-location", handleMouseLocation);
      socket.off("idle-status", handleIdleStatus);
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket, fileId]);

  useEffect(() => {
    let cancelled = false;

    apiClient(`/files/${fileId}/messages`).then(
      (page: MessagesPage) => {
        if (cancelled) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...page.items.filter((m) => !seen.has(m.id))];
        });
        setNextCursor(page.nextCursor);
      },
      (err) => {
        console.error("[collab] failed to load message history", err);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [fileId, apiClient]);

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
      socket?.emit("scene-update", { fileId, elements: changed });
    },
    [fileId, socket],
  );

  const broadcastPointer = useCallback(
    (payload: PointerPayload) => {
      if (roleRef.current === "VIEWER") return;
      const state = pointerThrottleRef.current;
      state.pending = payload;
      if (state.timer) return;
      state.timer = setTimeout(() => {
        state.timer = null;
        if (state.pending && socket?.connected) {
          socket.emit("mouse-location", {
            fileId,
            pointer: { x: state.pending.pointer.x, y: state.pending.pointer.y },
            button: state.pending.button,
            selectedElementIds: {},
            username: usernameRef.current,
          });
        }
      }, CURSOR_THROTTLE_MS);
    },
    [fileId, socket],
  );

  const sendChatMessage = useCallback(
    (body: string, mentionedUserIds: string[] = []) => {
      // The gateway excludes the sender from the "chat-message" broadcast
      // now (see collab.gateway.ts) — this ack is the sender's only
      // delivery of their own message, so it has to add it to `messages`
      // itself, not just tag it in `ownMessageIds`.
      socket?.emit("send-chat-message", { fileId, body, mentionedUserIds }, (message: ChatMessage) => {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [message, ...prev]));
        setOwnMessageIds((prev) => new Set(prev).add(message.id));
      });
    },
    [fileId, socket],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const page: MessagesPage = await apiClient(`/files/${fileId}/messages?cursor=${nextCursor}`);
      setMessages((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      console.error("[collab] failed to load older messages", err);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [fileId, nextCursor, apiClient, isLoadingOlder]);

  return {
    collaboratorIds,
    collaborators,
    broadcastElements,
    broadcastPointer,
    connectionError,
    messages,
    ownMessageIds,
    hasMoreMessages: nextCursor !== null,
    sendChatMessage,
    loadOlderMessages,
    isLoadingOlderMessages: isLoadingOlder,
  };
}
