import type { Metadata } from "next";
import {
  ArrowRight,
  ClipboardCheck,
  HeartPulse,
  LockKeyhole,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Valence App",
  description: "The authenticated care workspace for Valence members"
};

const checkInItems = [
  {
    title: "Mood reflection",
    description:
      "Begin with a focused check-in that keeps the member experience calm.",
    icon: HeartPulse
  },
  {
    title: "Private by default",
    description:
      "Build care workflows around consent, secure sessions, and clear context.",
    icon: LockKeyhole
  }
];

export default function AppHome() {
  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col items-center justify-center gap-8 py-12 text-center">
        <div className="flex max-w-3xl flex-col items-center gap-6">
          <p className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-4 text-primary" />
            Valence App
          </p>

          <div className="flex flex-col items-center gap-4">
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your care rhythm, centered.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Valence brings reflection, care planning, and privacy-first
              support into one quiet workspace for members and clinicians at the{" "}
              <span className="font-mono text-sm font-medium text-foreground">
                /app
              </span>{" "}
              route.
            </p>
          </div>

          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <a href="#check-in">
                Start check-in
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#privacy-defaults">
                <ClipboardCheck data-icon="inline-start" />
                Review privacy defaults
              </a>
            </Button>
          </div>
        </div>

        <Card
          className="w-full max-w-3xl overflow-hidden text-left"
          id="check-in"
        >
          <CardHeader className="items-center text-center">
            <CardTitle>Today&apos;s check-in</CardTitle>
            <CardDescription>
              A calm starting point for the authenticated product experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {checkInItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li
                    className="flex flex-col gap-4 rounded-md border border-border bg-background p-4"
                    id={
                      item.title === "Private by default"
                        ? "privacy-defaults"
                        : undefined
                    }
                    key={item.title}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
                        <Icon className="size-5" />
                      </span>
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
          <CardFooter className="justify-center text-center text-sm leading-6 text-muted-foreground">
            App route active, styled, and ready for the first authenticated flow.
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
