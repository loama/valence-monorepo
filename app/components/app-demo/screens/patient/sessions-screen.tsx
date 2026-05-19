import { ChevronRight } from "lucide-react";

import { SectionHeader } from "@/components/app-demo/section-header";
import type { DemoSession } from "@/components/app-demo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export function PatientSessionsScreen({
  onBookSession,
  onSelectSession,
  sessions
}: {
  onBookSession: () => void;
  onSelectSession: (session: DemoSession) => void;
  sessions: DemoSession[];
}) {
  function badgeClass(session: DemoSession) {
    if (session.rawStatus === "requested") {
      return "border-[var(--valence-pink)]/40 bg-[var(--valence-pink)]/15 text-foreground";
    }

    if (session.rawStatus === "confirmed") {
      return "border-primary/40 bg-primary/15 text-foreground";
    }

    return "border-border bg-secondary text-secondary-foreground";
  }

  function timingLabel(session: DemoSession) {
    const startsAt = session.startsAt ? new Date(session.startsAt) : null;
    const endsAt = session.endsAt ? new Date(session.endsAt) : null;
    const now = new Date();

    if (!startsAt || !endsAt) {
      return "Future";
    }

    if (now > new Date(endsAt.getTime() + 2 * 60 * 1000)) {
      return "Previous";
    }

    if (now >= new Date(startsAt.getTime() - 2 * 60 * 1000)) {
      return "Current";
    }

    return "Future";
  }

  return (
    <section>
      <SectionHeader
        description="Review previous, current, and future sessions with your provider."
        eyebrow="Sessions"
        title="Upcoming sessions"
      />
      <Button className="mb-4 w-full" onClick={onBookSession} type="button">
        Book session
      </Button>
      <div className="grid gap-3">
        {sessions.map((session) => (
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
                <div className="flex flex-col items-end gap-1">
                  <Badge className={badgeClass(session)}>{session.status}</Badge>
                  <Badge variant="outline">{timingLabel(session)}</Badge>
                </div>
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
