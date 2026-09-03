import { UserProfile } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your profile, email, and password.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <UserProfile
            routing="hash"
            appearance={{ elements: { rootBox: "w-full", card: "w-full shadow-none border-0" } }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
