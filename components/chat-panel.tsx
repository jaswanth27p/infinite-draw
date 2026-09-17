"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/hooks/use-collab";
import { useFileShares } from "@/hooks/use-file-shares";

interface ChatPanelProps {
  fileId: string;
  owner: { id: string; name: string | null; email: string } | null;
  messages: ChatMessage[];
  ownMessageIds: Set<string>;
  hasMoreMessages: boolean;
  isLoadingOlderMessages: boolean;
  canChat: boolean;
  onSend: (
    body: string,
    mentionedUserIds: string[],
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  onLoadOlder: () => void;
  open: boolean;
  onClose: () => void;
}

// Docked inline over the canvas (right edge), mirroring the look of
// Excalidraw's own left-side selected-element panel (an Island: border,
// shadow, rounded corners, no backdrop) rather than a full-viewport Sheet
// overlay that blocks the canvas underneath.
export function ChatPanel({
  fileId,
  owner,
  messages,
  ownMessageIds,
  hasMoreMessages,
  isLoadingOlderMessages,
  canChat,
  onSend,
  onLoadOlder,
  open,
  onClose,
}: ChatPanelProps) {
  const { sharesQuery } = useFileShares(fileId);
  // Mention candidates are bounded to "who has access to this file" — the
  // same shares list the share dialog already fetches, plus the owner —
  // not a userbase-wide search (unlike sub-project 19's share-invite
  // search), so no new backend endpoint is needed here.
  const candidates = useMemo(() => {
    const fromShares = (sharesQuery.data ?? []).map((s) => ({
      id: s.user.id,
      label: s.user.name ?? s.user.email,
    }));
    const ownerEntry = owner ? [{ id: owner.id, label: owner.name ?? owner.email }] : [];
    const seen = new Set<string>();
    return [...ownerEntry, ...fromShares].filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [sharesQuery.data, owner]);

  const [draft, setDraft] = useState("");
  const [mentioned, setMentioned] = useState<{ id: string; label: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mentionMatches =
    mentionQuery === null
      ? []
      : candidates.filter((c) => c.label.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6);

  function handleDraftChange(value: string) {
    setDraft(value);
    // Detect an in-progress @mention: the last "@" before the cursor with
    // no whitespace between it and the end of the string.
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) {
      setMentionQuery(null);
      return;
    }
    const afterAt = value.slice(atIndex + 1);
    setMentionQuery(/\s/.test(afterAt) ? null : afterAt);
  }

  function selectMention(candidate: { id: string; label: string }) {
    const atIndex = draft.lastIndexOf("@");
    const next = `${draft.slice(0, atIndex)}@${candidate.label} `;
    setDraft(next);
    setMentioned((prev) => (prev.some((m) => m.id === candidate.id) ? prev : [...prev, candidate]));
    setMentionQuery(null);
    inputRef.current?.focus();
  }

  async function handleSend() {
    if (!canChat) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    // Only ids whose "@Label" text is still actually present in the final
    // message count — deleting an inserted mention after selecting it
    // should not signal intent to notify that person. (The server
    // re-validates access regardless of what's sent here.)
    const stillPresent = mentioned.filter((m) => trimmed.includes(`@${m.label}`)).map((m) => m.id);
    setSending(true);
    const result = await onSend(trimmed, stillPresent);
    setSending(false);
    if (!result.ok) {
      // Keep the draft so nothing typed is lost, and tell the user why it
      // didn't go out instead of clearing the input as if it had sent.
      setSendError(
        result.reason === "no-access"
          ? "You don't have permission to send messages in this file."
          : "Message failed to send — try again.",
      );
      return;
    }
    setSendError(null);
    setDraft("");
    setMentioned([]);
    setMentionQuery(null);
  }

  // `messages` arrives newest-first (matches the REST/WS payload order,
  // see hooks/use-collab.ts) — reversed here only for oldest-to-newest
  // chat display.
  const oldestFirst = [...messages].reverse();

  if (!open) return null;

  return (
    <div className="absolute top-14 right-2 bottom-2 z-20 flex w-80 max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
      <div className="flex items-center justify-between border-b p-3">
        <span className="font-heading text-sm font-semibold">Chat</span>
        <Button variant="ghost" size="icon-sm" aria-label="Close chat" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
          {hasMoreMessages && (
            <Button variant="ghost" size="sm" onClick={onLoadOlder} disabled={isLoadingOlderMessages}>
              {isLoadingOlderMessages ? "Loading…" : "Load older messages"}
            </Button>
          )}
          {messages.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No messages yet.</p>
          )}
          {oldestFirst.map((message) => (
            <div
              key={message.id}
              className={`flex max-w-[85%] flex-col gap-0.5 rounded-lg p-2 text-sm ${
                ownMessageIds.has(message.id)
                  ? "self-end border border-primary/20 bg-primary/10"
                  : "self-start bg-muted"
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground">{message.authorName}</span>
              <span>{message.body}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="relative flex flex-col gap-1 border-t p-4">
          {!canChat && (
            <p className="text-xs text-muted-foreground">
              You have view-only access to this file, so you can&apos;t send messages here.
            </p>
          )}
          {canChat && sendError && <p className="text-xs text-destructive">{sendError}</p>}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              disabled={!canChat}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === "Escape") {
                  setMentionQuery(null);
                }
              }}
              placeholder={canChat ? "Message… (@ to mention)" : "Chat unavailable"}
              maxLength={4000}
            />
            <Button onClick={handleSend} disabled={!canChat || !draft.trim() || sending}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="absolute bottom-full left-4 mb-1 flex max-h-40 w-56 flex-col overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
              {mentionMatches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectMention(c)}
                  className="rounded px-2 py-1 text-left text-sm hover:bg-muted"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
