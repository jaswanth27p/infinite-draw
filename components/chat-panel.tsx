"use client";

import { useState } from "react";
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

interface ChatPanelProps {
  messages: ChatMessage[];
  ownMessageIds: Set<string>;
  hasMoreMessages: boolean;
  onSend: (body: string) => void;
  onLoadOlder: () => void;
}

export function ChatPanel({
  messages,
  ownMessageIds,
  hasMoreMessages,
  onSend,
  onLoadOlder,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
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
            <Button variant="ghost" size="sm" onClick={onLoadOlder}>
              Load older messages
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

        <div className="flex items-center gap-2 border-t p-4">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message…"
          />
          <Button onClick={handleSend} disabled={!draft.trim()}>
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
