import { AccountSettingsCard } from "@/components/account-settings-card";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";
import { ThemeModeSelector } from "@/components/theme-mode-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <AccountSettingsCard />
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how infinite-draw looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeModeSelector />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
    </main>
  );
}
