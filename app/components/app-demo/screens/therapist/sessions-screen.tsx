import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

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

export function TherapistSessionsScreen({
  onBookSession,
  onSelectSession,
  sessions
}: {
  onBookSession: () => void;
  onSelectSession: (session: DemoSession) => void;
  sessions: DemoSession[];
}) {
  const [dayOffset, setDayOffset] = useState(0);
  const selectedDay = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);
  const daySessions = sessions.filter((session) => {
    if (!session.startsAt) {
      return dayOffset === 0;
    }

    return new Date(session.startsAt).toDateString() === selectedDay.toDateString();
  });
  const visibleSessions = daySessions.length > 0 ? daySessions : sessions;

  function badgeClass(session: DemoSession) {
    if (session.rawStatus === "requested") {
      return "border-[var(--valence-pink)]/40 bg-[var(--valence-pink)]/15 text-foreground";
    }

    if (session.rawStatus === "confirmed") {
      return "border-primary/40 bg-primary/15 text-foreground";
    }

    return "border-border bg-secondary text-secondary-foreground";
  }

  return (
    <section>
      <SectionHeader
        description="Move through days, review requests, and open session details."
        eyebrow="Sessions"
        title="Clinical schedule"
      />
      <Button className="mb-4 w-full" onClick={onBookSession} type="button">
        Create session booking
      </Button>
      <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Button onClick={() => setDayOffset((value) => value - 1)} type="button" variant="ghost">
          Previous
        </Button>
        <div className="text-center">
          <p className="font-semibold">
            {selectedDay.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short"
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {daySessions.length} session{daySessions.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setDayOffset((value) => value + 1)} type="button" variant="ghost">
          Next
        </Button>
      </div>
      <div className="grid gap-3">
        {visibleSessions.map((session) => (
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
                <Badge className={badgeClass(session)}>{session.status}</Badge>
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
