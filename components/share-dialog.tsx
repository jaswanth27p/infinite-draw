"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFileShares } from "@/hooks/use-file-shares";
import { useFileQuery } from "@/hooks/use-file-query";
import { ApiError } from "@/lib/api-client";

interface ShareDialogProps {
  fileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ fileId, open, onOpenChange }: ShareDialogProps) {
  const { data: file } = useFileQuery(fileId);
  const { sharesQuery, invite, updateRole, remove, updateGeneralAccess } = useFileShares(fileId);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) return;
    setInviteError(null);
    try {
      await invite.mutateAsync({ email: email.trim(), role: inviteRole });
      setEmail("");
    } catch (err) {
      setInviteError(
        err instanceof ApiError && err.status === 404
          ? "No account found for that email."
          : "Failed to invite — try again.",
      );
    }
  }

  function handleGeneralAccessChange(value: string | null) {
    if (!value) return;
    if (value === "RESTRICTED") {
      updateGeneralAccess.mutate({ generalAccess: "RESTRICTED" });
    } else {
      updateGeneralAccess.mutate({
        generalAccess: "ANYONE",
        generalAccessRole: file?.generalAccessRole ?? "VIEWER",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this file</DialogTitle>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {sharesQuery.data?.map((share) => (
            <li key={share.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{share.user.name ?? share.user.email}</span>
              <div className="flex items-center gap-2">
                <Select
                  value={share.role}
                  onValueChange={(role) => updateRole.mutate({ shareId: share.id, role: role as "VIEWER" | "EDITOR" })}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(share.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
          />
          <Select value={inviteRole} onValueChange={(role) => setInviteRole(role as "VIEWER" | "EDITOR")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEWER">Viewer</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={invite.isPending}>
            Invite
          </Button>
        </div>
        {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}

        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="flex items-center gap-2">
            <Select value={file?.generalAccess ?? "RESTRICTED"} onValueChange={handleGeneralAccessChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESTRICTED">Restricted</SelectItem>
                <SelectItem value="ANYONE">Anyone with the link</SelectItem>
              </SelectContent>
            </Select>
            {file?.generalAccess === "ANYONE" && (
              <Select
                value={file.generalAccessRole ?? "VIEWER"}
                onValueChange={(role: string | null) => {
                  if (role) {
                    updateGeneralAccess.mutate({ generalAccess: "ANYONE", generalAccessRole: role as "VIEWER" | "EDITOR" })
                  }
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {file?.generalAccess === "ANYONE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              Copy link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
