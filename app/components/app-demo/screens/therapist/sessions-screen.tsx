import { ChevronRight } from "lucide-react";

import { therapistSessions } from "@/components/app-demo/data";
import { SectionHeader } from "@/components/app-demo/section-header";
import type { DemoSession } from "@/components/app-demo/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export function TherapistSessionsScreen({
  onSelectSession
}: {
  onSelectSession: (session: DemoSession) => void;
}) {
  return (
    <section>
      <SectionHeader
        description="Tap any card to open clinical session details in a bottom drawer."
        eyebrow="Sessions"
        title="Clinical schedule"
      />
      <div className="grid gap-3">
        {therapistSessions.map((session) => (
          <Card
            className="cursor-pointer transition-transform active:scale-[0.99]"
            key={session.id}
            onClick={() => onSelectSession(session)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{session.person}</CardTitle>
                  <CardDescription>
                    {session.date}, {session.time}
                  </CardDescription>
                </div>
                <Badge>{session.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
              <span>{session.mode}</span>
              <ChevronRight />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
