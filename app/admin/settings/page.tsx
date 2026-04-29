import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Settings — Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Agency settings</CardTitle>
          <CardDescription>Coming in a later phase.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Per-agency settings (notification preferences, default dispute window, default fees) will live here.</p>
          <p>For now, settings are configured per-customer on the customer detail page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
