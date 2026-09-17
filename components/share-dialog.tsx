"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link as LinkIcon, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFileShares, useUserSearch } from "@/hooks/use-file-shares";
import { useFileQuery } from "@/hooks/use-file-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface ShareDialogProps {
  fileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string | null, email: string): string {
  return (name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();
}

function AvatarCircle({
  name,
  email,
  avatarUrl,
}: {
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- external
    // avatar URL, not a static/local asset; next/image would need a
    // remotePatterns entry for an arbitrary user-account host.
    return <img src={avatarUrl} alt="" className="size-7 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
      {getInitials(name, email)}
    </span>
  );
}

export function ShareDialog({ fileId, open, onOpenChange }: ShareDialogProps) {
  const { data: file } = useFileQuery(fileId);
  const { sharesQuery, invite, updateRole, remove, updateGeneralAccess } = useFileShares(fileId);
  const [query, setQuery] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: searchResults } = useUserSearch(fileId, debouncedQuery);

  async function handleInviteUser(userId: string) {
    setInviteError(null);
    try {
      await invite.mutateAsync({ userId, role: inviteRole });
      setQuery("");
      toast.success("Invited");
    } catch {
      setInviteError("Failed to invite — try again.");
    }
  }

  function handleGeneralAccessChange(value: string | null) {
    if (!value) return;
    if (value === "RESTRICTED") {
      updateGeneralAccess.mutate(
        { generalAccess: "RESTRICTED" },
        { onSuccess: () => toast.success("Sharing settings updated"), onError: () => toast.error("Couldn't update sharing settings") },
      );
    } else {
      updateGeneralAccess.mutate(
        { generalAccess: "ANYONE", generalAccessRole: file?.generalAccessRole ?? "VIEWER" },
        { onSuccess: () => toast.success("Sharing settings updated"), onError: () => toast.error("Couldn't update sharing settings") },
      );
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy link"),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this file</DialogTitle>
        </DialogHeader>

        <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {sharesQuery.data?.map((share) => (
            <li key={share.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <AvatarCircle name={share.user.name} email={share.user.email} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{share.user.name ?? share.user.email}</span>
                  {share.user.name && (
                    <span className="truncate text-xs text-muted-foreground">{share.user.email}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={share.role}
                  onValueChange={(role) =>
                    updateRole.mutate(
                      { shareId: share.id, role: role as "VIEWER" | "COMMENTER" | "EDITOR" },
                      { onSuccess: () => toast.success("Role updated"), onError: () => toast.error("Couldn't update role") },
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="COMMENTER">Commenter</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove access"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    remove.mutate(share.id, {
                      onSuccess: () => toast.success("Removed"),
                      onError: () => toast.error("Couldn't remove"),
                    })
                  }
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {sharesQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No one else has access yet.</p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="share-invite-search" className="text-sm font-medium leading-none">
            Invite by name or email
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="share-invite-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-8"
              />
            </div>
            <Select value={inviteRole} onValueChange={(role) => setInviteRole(role as "VIEWER" | "COMMENTER" | "EDITOR")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="COMMENTER">Commenter</SelectItem>
                <SelectItem value="EDITOR">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {searchResults && searchResults.length > 0 && (
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border p-1">
              {searchResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleInviteUser(user.id)}
                    disabled={invite.isPending}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
                  >
                    <AvatarCircle name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{user.name ?? user.email}</span>
                      {user.name && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {debouncedQuery.length >= 3 && searchResults && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No matching users found.</p>
          )}
        </div>
        {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}

        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">General access</p>
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
                    updateGeneralAccess.mutate(
                      { generalAccess: "ANYONE", generalAccessRole: role as "VIEWER" | "COMMENTER" | "EDITOR" },
                      { onSuccess: () => toast.success("Sharing settings updated"), onError: () => toast.error("Couldn't update sharing settings") },
                    )
                  }
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="COMMENTER">Commenter</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {file?.generalAccess === "ANYONE" && (
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <LinkIcon />
              Copy link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
