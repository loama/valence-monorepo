import { CalendarDays, UsersRound } from "lucide-react";

import { SectionHeader } from "@/components/app-demo/section-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TherapistHomeScreen() {
  return (
    <section>
      <SectionHeader
        description="The rest of the app is local demo UI, so you can move freely and test the feel."
        eyebrow="Therapist demo"
        title="This is the home page"
      />
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Clinical workspace</CardTitle>
            <CardDescription>
              Your therapist workspace is ready for sessions and patients.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Progress value={74} />
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <CalendarDays className="mb-3 text-primary" />
                  <p className="text-2xl font-semibold">4</p>
                  <p className="text-sm text-muted-foreground">
                    Upcoming sessions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <UsersRound className="mb-3 text-primary" />
                  <p className="text-2xl font-semibold">12</p>
                  <p className="text-sm text-muted-foreground">
                    Active patients
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Today&apos;s prep</CardTitle>
            <CardDescription>
              Review two patient notes and confirm one intake item before your
              next call.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">Clinical flow</Badge>
            <Badge variant="outline">Local demo</Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
