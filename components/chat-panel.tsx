"use client";

import { useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  onSend: (body: string, mentionedUserIds: string[]) => void;
  onLoadOlder: () => void;
}

export function ChatPanel({
  fileId,
  owner,
  messages,
  ownMessageIds,
  hasMoreMessages,
  isLoadingOlderMessages,
  onSend,
  onLoadOlder,
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

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    // Only ids whose "@Label" text is still actually present in the final
    // message count — deleting an inserted mention after selecting it
    // should not signal intent to notify that person. (The server
    // re-validates access regardless of what's sent here.)
    const stillPresent = mentioned.filter((m) => trimmed.includes(`@${m.label}`)).map((m) => m.id);
    onSend(trimmed, stillPresent);
    setDraft("");
    setMentioned([]);
    setMentionQuery(null);
  }

  // `messages` arrives newest-first (matches the REST/WS payload order,
  // see hooks/use-collab.ts) — reversed here only for oldest-to-newest
  // chat display.
  const oldestFirst = [...messages].reverse();

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <MessageCircle className="size-4" />
        Chat
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
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
                ownMessageIds.has(message.id) ? "self-end bg-primary/10" : "self-start bg-muted"
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground">{message.authorName}</span>
              <span>{message.body}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="relative flex items-center gap-2 border-t p-4">
          <Input
            ref={inputRef}
            value={draft}
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
            placeholder="Message… (@ to mention)"
            maxLength={4000}
          />
          <Button onClick={handleSend} disabled={!draft.trim()}>
            Send
          </Button>
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
      </SheetContent>
    </Sheet>
  );
}
