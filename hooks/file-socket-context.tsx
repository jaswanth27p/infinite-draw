"use client";

import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

interface FileSocketContextValue {
  socket: Socket | null;
  connectionError: boolean;
}

const FileSocketContext = createContext<FileSocketContextValue>({
  socket: null,
  connectionError: false,
});

export function useFileSocket(): FileSocketContextValue {
  return useContext(FileSocketContext);
}

// One Socket.IO connection per file-editor session, shared by useCollab
// (scene sync/presence/chat) and useVoice (call signaling) — both ride
// the same file:<fileId> room instead of each opening its own connection.
export function FileSocketProvider({
  fileId,
  children,
}: {
  fileId: string;
  children: ReactNode;
}) {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const getTokenRef = useRef(getToken);
  // eslint-disable-next-line react-hooks/refs
  getTokenRef.current = getToken;

  useEffect(() => {
    let cancelled = false;

    // `auth` must be a FUNCTION (not a static object) so Socket.IO calls
    // it again — minting a fresh Clerk token — on every connection
    // attempt, not just the first. Clerk session tokens are short-lived
    // (~60s); with a static `{ token }` object, every auto-reconnect
    // after the first ~60s would replay the original (by then expired)
    // token and get rejected by the server's auth guard.
    const s = io(WS_URL, {
      auth: (cb) => {
        getTokenRef.current().then(
          (token) => cb({ token }),
          () => cb({ token: null }),
        );
      },
    });

    s.on("connect_error", (err) => {
      console.error("[file-socket] connect error", err);
      if (!cancelled) setConnectionError(true);
    });
    // Nest emits this for a rejected WsException (e.g. auth failure,
    // stale/revoked file access) — without this listener those failures
    // are entirely silent.
    s.on("exception", (err) => {
      console.error("[file-socket] server exception", err);
    });
    s.on("disconnect", (reason) => {
      // "io client disconnect" = our own cleanup calling s.disconnect() on
      // unmount — expected, not an error. Anything else (transport close,
      // server-initiated, ping timeout) is worth flagging.
      if (reason === "io client disconnect") {
        console.log("[file-socket] disconnected", reason);
      } else {
        console.error("[file-socket] disconnected", reason);
      }
    });
    s.on("connect", () => {
      if (!cancelled) setConnectionError(false);
    });

    setSocket(s);

    return () => {
      cancelled = true;
      s.disconnect();
      setSocket(null);
    };
  }, [fileId]);

  return (
    <FileSocketContext.Provider value={{ socket, connectionError }}>
      {children}
    </FileSocketContext.Provider>
  );
}
