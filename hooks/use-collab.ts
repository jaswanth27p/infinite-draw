"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useCollab(fileId: string) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;

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
            if (!cancelled) {
              setCollaboratorIds(response.data.collaborators.filter((id) => id !== socket!.id));
            }
          },
        );
      });

      socket.on("room-user-change", (payload: { collaborators: string[] }) => {
        if (!cancelled) {
          setCollaboratorIds(payload.collaborators.filter((id) => id !== socket!.id));
        }
      });
    }

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, getToken]);

  return { collaboratorIds };
}
