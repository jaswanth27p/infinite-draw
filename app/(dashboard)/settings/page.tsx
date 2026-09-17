import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
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
