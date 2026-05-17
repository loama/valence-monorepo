import type { Metadata } from "next";
import { HeartPulse, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Valence App",
  description: "Hello world shell for the Valence psychology platform app"
};

export default function AppHome() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-7">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Valence App
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] text-foreground sm:text-7xl">
            Hello from the Valence psychology platform app.
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-muted-foreground">
            This Next.js, Capacitor, and shadcn workspace is ready for the
            authenticated product experience at the `/app` route.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Open app hello world</Button>
            <Button variant="outline">Review care plan</Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Today&apos;s check-in</CardTitle>
            <CardDescription>
              A quiet baseline screen for the product shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-3">
                <HeartPulse className="size-5 text-primary" />
                <p className="font-semibold">Mood reflection</p>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Capture a simple hello world state while the clinical workflows
                come online.
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="size-5 text-primary" />
                <p className="font-semibold">Private by default</p>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                The app shell is ready for secure authenticated experiences.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
