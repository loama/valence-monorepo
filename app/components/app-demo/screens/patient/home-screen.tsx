import { Activity, CalendarDays } from "lucide-react";

import { SectionHeader } from "@/components/app-demo/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DemoProvider } from "@/components/app-demo/types";

export function PatientHomeScreen({
  onRequestProvider,
  providers
}: {
  onRequestProvider: (provider: DemoProvider) => void;
  providers: DemoProvider[];
}) {
  return (
    <section>
      <SectionHeader
        description="Your sessions, exercises, and care messages stay together in one place."
        eyebrow="Patient"
        title="Home"
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
              <Card>
                <CardContent className="p-4">
                  <CalendarDays className="mb-3 text-primary" />
                  <p className="text-2xl font-semibold">2</p>
                  <p className="text-sm text-muted-foreground">
                    Upcoming sessions
                  </p>
                </CardContent>
              </Card>
              <Card>
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
            <CardTitle className="text-xl">Find a psychologist</CardTitle>
            <CardDescription>
              Searchable providers can receive a request from you. They decide
              whether to accept the connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {providers.map((provider) => (
              <div
                className="rounded-xl border border-border bg-background p-3"
                key={provider.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {provider.specialties.join(", ")}
                    </p>
                  </div>
                  <Badge variant={provider.requestStatus ? "secondary" : "outline"}>
                    {provider.requestStatus ?? "Available"}
                  </Badge>
                </div>
                <Button
                  className="mt-3 w-full"
                  disabled={provider.requestStatus === "accepted" || provider.requestStatus === "pending"}
                  onClick={() => onRequestProvider(provider)}
                  type="button"
                  variant="outline"
                >
                  {provider.requestStatus === "accepted"
                    ? "Connected"
                    : provider.requestStatus === "pending"
                      ? "Request sent"
                      : "Mark as my therapist"}
                </Button>
              </div>
            ))}
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
            <Badge variant="outline">For today</Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
