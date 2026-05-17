import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  HeartPulse,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Valence | Reflective psychology care",
  description:
    "A privacy-first psychology platform for reflection, care plans, and clinician-ready context."
};

const carePoints = [
  {
    title: "Reflection that becomes useful",
    description:
      "Members capture mood, context, and patterns in a calm flow that can inform care without becoming busywork.",
    icon: HeartPulse
  },
  {
    title: "Care plans that stay current",
    description:
      "Clinicians and members share goals, session context, and follow-up signals in one structured workspace.",
    icon: CalendarCheck
  },
  {
    title: "Privacy from the first screen",
    description:
      "Consent, access, and sharing boundaries are treated as core product behavior, not a settings afterthought.",
    icon: LockKeyhole
  }
];

const workflow = [
  "Private check-ins before sessions",
  "Care goals with clinical context",
  "Messaging around consent and next steps",
  "Admin views for quality and operations"
];

export default function WebsiteHome() {
  return (
    <main className="min-h-screen overflow-hidden text-foreground">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Valence
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a className="transition-colors hover:text-foreground" href="#care">
            Care model
          </a>
          <a className="transition-colors hover:text-foreground" href="#platform">
            Platform
          </a>
          <a className="transition-colors hover:text-foreground" href="#privacy">
            Privacy
          </a>
        </div>
        <form action="/app" method="get">
          <Button type="submit" variant="outline">
            Open app
          </Button>
        </form>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:pb-20">
        <div className="soft-grid absolute inset-x-0 top-0 -z-10 h-[42rem] opacity-45" />
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-md border border-border bg-card/70 px-3 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
            <ShieldCheck className="size-4" />
            Psychology support, centered around consent
          </div>
          <h1 className="font-display text-6xl font-semibold leading-[0.88] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            Reflective care for the moments between sessions.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Valence helps people notice patterns, prepare for care, and stay
            connected to clinicians through a private, structured psychology
            workspace.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <form action="/app" method="get">
              <Button className="w-full sm:w-auto" type="submit">
                Open app route
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <Button asChild className="w-full sm:w-auto" variant="soft">
              <Link href="#platform">See the platform</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="taupe-panel rounded-[1.25rem] border border-border p-2">
            <div className="overflow-hidden rounded-[1rem] border border-border bg-background">
              <Image
                src="/valence-app-preview.png"
                alt="Valence member workspace showing check-in, care plan, and privacy context"
                width={1440}
                height={980}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
          <div className="absolute -bottom-8 left-6 max-w-xs rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur">
            <p className="text-sm font-semibold">Today&apos;s signal</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mood reflection and privacy review are ready before the next
              appointment.
            </p>
          </div>
        </div>
      </section>

      <section id="care" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Care model
            </p>
            <h2 className="mt-4 max-w-lg font-display text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              A quieter operating system for psychology care.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {carePoints.map((point) => {
              const Icon = point.icon;

              return (
                <article
                  className="rounded-lg border border-border bg-card/70 p-6 shadow-sm"
                  key={point.title}
                >
                  <span className="mb-5 flex size-11 items-center justify-center rounded-md bg-accent text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-display text-2xl font-semibold leading-7">
                    {point.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {point.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="platform" className="bg-[#181512] py-20 text-[#fffaf1]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <div className="rounded-lg bg-[#fffaf1] p-4 text-[#181512]">
              <div className="flex items-center justify-between border-b border-[#d5c9b9] pb-4">
                <div>
                  <p className="font-display text-lg font-semibold">
                    Member check-in
                  </p>
                  <p className="text-sm text-[#70685f]">
                    Shared with clinician after consent
                  </p>
                </div>
                <span className="rounded-md bg-[#dbe8df] px-3 py-1 text-sm font-semibold text-[#244f49]">
                  Private
                </span>
              </div>
              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                {["Mood", "Sleep", "Stress"].map((label, index) => (
                  <div
                    className="rounded-md border border-[#d5c9b9] bg-[#f4f0e8] p-4"
                    key={label}
                  >
                    <p className="text-sm font-semibold">{label}</p>
                    <div className="mt-4 h-2 rounded-full bg-[#e0d6c9]">
                      <div
                        className="h-full rounded-full bg-[#244f49]"
                        style={{ width: `${58 + index * 11}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-[#d5c9b9] bg-white/60 p-4">
                <p className="text-sm font-semibold">Reflection note</p>
                <p className="mt-2 text-sm leading-6 text-[#70685f]">
                  I noticed the strongest tension before work calls. Walking
                  afterward helped me come back down.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-[#a7c9bd]">
              Platform
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Built for the space where care actually changes.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/68">
              Valence gives the member a gentle daily surface and gives the care
              team structured context when it matters.
            </p>
            <div className="mt-8 grid gap-3">
              {workflow.map((item) => (
                <div
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium"
                  key={item}
                >
                  <Activity className="size-4 text-[#a7c9bd]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="taupe-panel rounded-xl border border-border p-8">
            <BookOpen className="size-9 text-primary" />
            <h2 className="mt-6 font-display text-4xl font-semibold leading-none tracking-tight">
              Designed for trust before scale.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Psychology products need a different default. Valence starts with
              privacy, consent, and clinical context, then builds the product
              experience around those boundaries.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Consent-aware sharing", "Members can understand what context is shared and why."],
              ["Clinician-ready context", "Sessions start with the pattern, not a blank page."],
              ["Member-owned reflection", "Daily notes stay calm, personal, and easy to revisit."],
              ["Operational clarity", "Internal teams can manage care quality without noisy dashboards."]
            ].map(([title, description]) => (
              <article
                className="rounded-lg border border-border bg-card/70 p-6"
                key={title}
              >
                <MessageCircle className="size-5 text-primary" />
                <h3 className="mt-5 font-display text-2xl font-semibold">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 Valence. Reflective care, carefully built.</p>
          <div className="flex gap-5">
            <Link className="hover:text-foreground" href="#care">
              Care model
            </Link>
            <Link className="hover:text-foreground" href="#privacy">
              Privacy
            </Link>
            <form action="/admin" method="get">
              <button className="hover:text-foreground" type="submit">
                Admin
              </button>
            </form>
          </div>
        </div>
      </footer>
    </main>
  );
}
