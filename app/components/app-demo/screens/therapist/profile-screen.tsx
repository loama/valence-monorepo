import { Bell, LogOut } from "lucide-react";

import { SectionHeader } from "@/components/app-demo/section-header";
import type {
  PushRegistrationState,
  VersionState
} from "@/components/app-demo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

function VersionBadge({ versions }: { versions: VersionState }) {
  return (
    <Badge className="font-semibold" variant="secondary">
      Installed {versions.installedVersion} · Release {versions.releaseVersion}
    </Badge>
  );
}

export function TherapistProfileScreen({
  onEnablePushNotifications,
  onReset,
  onSignOut,
  pushRegistration,
  versions
}: {
  onEnablePushNotifications: () => void;
  onReset: () => void;
  onSignOut: () => void;
  pushRegistration: PushRegistrationState;
  versions: VersionState;
}) {
  const pushCopy =
    pushRegistration.status === "registered"
      ? "This device is registered for notifications."
      : pushRegistration.status === "denied"
        ? "Notifications are disabled in system settings."
        : pushRegistration.status === "unsupported"
          ? "Push notifications are only available in the native app."
          : "Enable local notification registration for the device.";

  return (
    <section>
      <SectionHeader
        description="Review clinical workspace settings, app version, and device permissions."
        eyebrow="Profile"
        title="Psychologist profile"
      />
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Practice details, patient lists, and workspace preferences live here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Psychologist</Badge>
            <VersionBadge versions={versions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell />
              Notifications
            </CardTitle>
            <CardDescription>{pushCopy}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled={pushRegistration.status === "registered"}
              onClick={onEnablePushNotifications}
              type="button"
              variant="outline"
            >
              {pushRegistration.status === "registered" ? "Enabled" : "Enable"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account controls</CardTitle>
            <CardDescription>
              Restart the first-run flow when you need to update your role.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button onClick={onReset} type="button" variant="outline">
              Reset onboarding
            </Button>
            <Button onClick={onSignOut} type="button" variant="ghost">
              <LogOut data-icon="inline-start" />
              Sign out of Supabase
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
