import { Activity, CalendarDays } from "lucide-react";

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

export function PatientHomeScreen() {
  return (
    <section>
      <SectionHeader
        description="The rest of the app is local demo UI, so you can move freely and test the feel."
        eyebrow="Patient demo"
        title="This is the home page"
      />
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Your patient workspace is ready for sessions and exercises.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Progress value={62} />
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <CalendarDays className="mb-3 text-primary" />
                  <p className="text-2xl font-semibold">2</p>
                  <p className="text-sm text-muted-foreground">
                    Upcoming sessions
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <Activity className="mb-3 text-primary" />
                  <p className="text-2xl font-semibold">3</p>
                  <p className="text-sm text-muted-foreground">
                    Active exercises
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Today&apos;s nudge</CardTitle>
            <CardDescription>
              Take two minutes to write what you want to remember for your next
              session.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">Low pressure</Badge>
            <Badge variant="outline">Local demo</Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
