import Link from "next/link";
import { AlertCircle, KeyRound, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseConfig } from "@/lib/env";

const errorMessages: Record<string, string> = {
  "missing-email": "Enter an email address to request access.",
  "not-allowed": "That email is not on the admin allowlist.",
  "missing-config": "Supabase admin auth is not configured yet.",
  auth: "Supabase could not send the magic link. Check the project settings."
};

const adminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const { isConfigured } = getSupabaseConfig();
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-accent text-primary">
              <KeyRound className="size-5" />
            </div>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>
              Request a secure magic link with an allowlisted Valence email.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {!isConfigured ? (
              <div className="rounded-md border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
                Add{" "}
                <span className="font-mono text-foreground">
                  NEXT_PUBLIC_SUPABASE_URL
                </span>
                ,{" "}
                <span className="font-mono text-foreground">
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                </span>
                , and{" "}
                <span className="font-mono text-foreground">
                  ADMIN_EMAIL_ALLOWLIST
                </span>{" "}
                to enable admin auth.
              </div>
            ) : null}

            {params.sent ? (
              <div className="flex gap-3 rounded-md border border-border bg-accent p-4 text-sm leading-6">
                <MailCheck className="mt-0.5 size-4 text-primary" />
                <p>Check your inbox for the Valence admin sign-in link.</p>
              </div>
            ) : null}

            {error ? (
              <div className="flex gap-3 rounded-md border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
                <AlertCircle className="mt-0.5 size-4 text-primary" />
                <p>{error}</p>
              </div>
            ) : null}

            <form
              action={`${adminBasePath}/login/request`}
              className="flex flex-col gap-4"
              method="post"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  disabled={!isConfigured}
                  id="email"
                  name="email"
                  placeholder="ops@valence.example"
                  required
                  type="email"
                />
              </div>
              <Button disabled={!isConfigured} type="submit">
                Send magic link
              </Button>
            </form>

            <Button asChild variant="ghost">
              <Link href={adminBasePath}>Back to admin overview</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
