import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Database,
  ShieldCheck,
  Users
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
import {
  getAdminEmailAllowlist,
  getSupabaseConfig,
  isAllowedAdminEmail
} from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const adminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";

const metrics = [
  {
    label: "Active members",
    value: "128",
    detail: "+14.6% over the last 30 days",
    icon: Users
  },
  {
    label: "Care plans",
    value: "42",
    detail: "9 awaiting clinician review",
    icon: ClipboardList
  },
  {
    label: "Check-ins",
    value: "314",
    detail: "47.2% completed on mobile",
    icon: Activity
  },
  {
    label: "Risk reviews",
    value: "7",
    detail: "2 marked as high-priority follow-up",
    icon: ShieldCheck
  }
];

const customers = [
  {
    name: "Mara Ibarra",
    status: "Onboarding",
    plan: "Individual care",
    lastSeen: "18 min ago"
  },
  {
    name: "Elian Rocha",
    status: "Active",
    plan: "Couples support",
    lastSeen: "2 hr ago"
  },
  {
    name: "Camille Ortega",
    status: "Review",
    plan: "Clinical intake",
    lastSeen: "Yesterday"
  }
];

function SetupScreen() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col justify-center">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-accent text-primary">
              <Database className="size-5" />
            </div>
            <CardTitle>Connect Supabase to unlock admin</CardTitle>
            <CardDescription>
              The internal dashboard is ready. Add environment variables to
              enable auth-gated access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-md border border-border bg-muted p-4 font-mono text-xs leading-6 text-foreground">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              <br />
              ADMIN_EMAIL_ALLOWLIST
            </div>
            <p>
              Admin workspace hello world is online at{" "}
              <span className="font-mono text-foreground">/admin</span>. Once
              Supabase credentials are configured, only allowlisted emails can
              enter.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function AccessRequiredScreen() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>
              Sign in with an allowlisted Valence operations email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`${adminBasePath}/login`}>
                Continue to sign in
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function NotAllowedScreen({ email }: { email?: string | null }) {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access not enabled</CardTitle>
            <CardDescription>
              {email ?? "This account"} is signed in, but it is not on the
              admin allowlist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={`${adminBasePath}/sign-out`} method="post">
              <Button className="w-full" type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default async function AdminHome() {
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured || getAdminEmailAllowlist().length === 0) {
    return <SetupScreen />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    return <AccessRequiredScreen />;
  }

  if (!isAllowedAdminEmail(user.email)) {
    return <NotAllowedScreen email={user.email} />;
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Valence Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Operations overview
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`${adminBasePath}/login`}>Manage session</Link>
            </Button>
            <form action={`${adminBasePath}/sign-out`} method="post">
              <Button type="submit">Sign out</Button>
            </form>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.label}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription>{metric.label}</CardDescription>
                    <span className="flex size-9 items-center justify-center rounded-md bg-accent text-primary">
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <CardTitle className="font-mono text-3xl">
                    {metric.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {metric.detail}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Customer queue</CardTitle>
              <CardDescription>
                Early management surface for member status and care context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border border-border">
                <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.7fr] bg-muted px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Member</span>
                  <span>Status</span>
                  <span>Plan</span>
                  <span>Last seen</span>
                </div>
                <div className="divide-y divide-border">
                  {customers.map((customer) => (
                    <div
                      className="grid grid-cols-[1fr_0.8fr_0.8fr_0.7fr] p-4 text-sm"
                      key={customer.name}
                    >
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-muted-foreground">
                        {customer.status}
                      </span>
                      <span className="text-muted-foreground">
                        {customer.plan}
                      </span>
                      <span className="text-muted-foreground">
                        {customer.lastSeen}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-accent text-primary">
                <BarChart3 className="size-5" />
              </div>
              <CardTitle>Metrics foundation</CardTitle>
              <CardDescription>
                Ready for Supabase-backed metrics, audit events, and customer
                management workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <p>
                This first screen stays operational and compact while the real
                reporting tables come online.
              </p>
              <p className="font-medium text-foreground">
                Admin workspace hello world is live.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href={`${adminBasePath}/login`}>Review auth setup</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  );
}
