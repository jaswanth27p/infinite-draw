"use client";

import { LogOut, Settings2 } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function initials(name: string | null, email: string): string {
  return (name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();
}

export function AccountSettingsCard() {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();

  const name = user?.fullName ?? user?.username ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your profile and sign-in details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isLoaded ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                {initials(name, email)}
              </span>
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{name ?? email}</span>
              {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
            <Settings2 className="size-4" />
            Manage account
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => void signOut({ redirectUrl: "/sign-in" })}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
