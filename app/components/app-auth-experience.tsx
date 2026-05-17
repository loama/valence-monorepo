"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type TouchEvent
} from "react";
import type { Provider, User } from "@supabase/supabase-js";
import {
  Activity,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  PanelLeftClose,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from "lucide-react";

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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const appBasePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "/app";

const navItems = [
  { label: "Today", icon: CalendarCheck, active: true },
  { label: "Care plan", icon: ClipboardList },
  { label: "Messages", icon: MessageCircle },
  { label: "Profile", icon: UserRound },
  { label: "Privacy", icon: ShieldCheck }
];

const checkInItems = [
  {
    title: "Mood reflection",
    description: "A brief note and signal check before the day gets loud.",
    icon: HeartPulse
  },
  {
    title: "Care plan",
    description: "Three active goals are ready for your next session.",
    icon: ClipboardList
  },
  {
    title: "Privacy review",
    description: "Your sharing settings are private by default.",
    icon: LockKeyhole
  }
];

type AuthState = {
  isLoading: boolean;
  user: User | null;
};

type AuthAction =
  | {
      type: "loaded";
      user: User | null;
    }
  | {
      type: "user-changed";
      user: User | null;
    };

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "loaded":
      return {
        isLoading: false,
        user: action.user
      };
    case "user-changed":
      return {
        isLoading: false,
        user: action.user
      };
  }
}

function getRedirectTo() {
  if (typeof window === "undefined") {
    return appBasePath;
  }

  return `${window.location.origin}${appBasePath}`;
}

function ProviderMark({ label }: { label: string }) {
  return (
    <span className="flex size-5 items-center justify-center rounded-sm border border-border bg-background text-xs font-semibold">
      {label}
    </span>
  );
}

function LoginScreen() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestEmailAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!supabase) {
      setError("Supabase is not configured for this app yet.");
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: getRedirectTo()
      }
    });
    setIsSubmitting(false);

    if (signInError) {
      setError("We could not send the sign-in email. Check auth settings.");
      return;
    }

    setStatus("Check your inbox for the Valence sign-in link or OTP.");
  }

  async function continueWithProvider(provider: Provider) {
    setError(null);
    setStatus(null);

    if (!supabase) {
      setError("Supabase is not configured for this app yet.");
      return;
    }

    const { error: providerError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectTo(),
        queryParams:
          provider === "google" ? { prompt: "select_account" } : undefined
      }
    });

    if (providerError) {
      setError("We could not start that sign-in flow. Check auth settings.");
    }
  }

  return (
    <main className="valence-auth-scene min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-accent text-primary">
              <Sparkles className="size-5" />
            </div>
            <CardTitle>Sign in to Valence</CardTitle>
            <CardDescription>
              Use email, Google, or Apple to open your care workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {status ? (
              <div className="rounded-md border border-border bg-accent p-4 text-sm leading-6">
                {status}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
                {error}
              </div>
            ) : null}

            <form className="flex flex-col gap-4" onSubmit={requestEmailAccess}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="member-email"
                  name="email"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <Button disabled={isSubmitting} type="submit">
                <Mail data-icon="inline-start" />
                {isSubmitting ? "Sending" : "Send magic link or OTP"}
              </Button>
            </form>

            <div className="grid gap-3">
              <Button
                onClick={() => void continueWithProvider("google")}
                type="button"
                variant="outline"
              >
                <ProviderMark label="G" />
                Continue with Google
              </Button>
              <Button
                onClick={() => void continueWithProvider("apple")}
                type="button"
                variant="outline"
              >
                <ProviderMark label="A" />
                Continue with Apple
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function WorkspaceShell({
  children,
  user,
  onSignOut
}: {
  children: ReactNode;
  user: User;
  onSignOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const email = user.email ?? "Member";
  const swipeThreshold = 56;

  function handleSwipeStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleOpenSwipeMove(event: TouchEvent<HTMLElement>) {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    if (deltaX > swipeThreshold && deltaX > deltaY * 1.4) {
      setIsOpen(true);
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }

  function handleCloseSwipeMove(event: TouchEvent<HTMLElement>) {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    if (deltaX < -swipeThreshold && Math.abs(deltaX) > deltaY * 1.4) {
      setIsOpen(false);
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }

  function resetSwipe() {
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const aside = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-sm font-semibold">Valence</p>
          <p className="text-xs text-muted-foreground">Member workspace</p>
        </div>
        <Button
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
          <span className="sr-only">Close navigation</span>
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                item.active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              key={item.label}
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-medium">{email}</p>
        <Button
          className="mt-3 w-full justify-start"
          onClick={onSignOut}
          type="button"
          variant="outline"
        >
          <LogOut data-icon="inline-start" />
          Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="valence-auth-scene min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="hidden lg:block">{aside}</div>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        data-state={isOpen ? "open" : "closed"}
      >
        <button
          aria-label="Close navigation"
          className={cn(
            "absolute inset-0 bg-foreground/35 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
            isOpen && "opacity-100"
          )}
          onClick={() => setIsOpen(false)}
          type="button"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 transform-gpu shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isOpen ? "translate-x-0" : "-translate-x-[105%]"
          )}
          data-testid="mobile-nav-drawer"
          onTouchCancel={resetSwipe}
          onTouchEnd={resetSwipe}
          onTouchMove={handleCloseSwipeMove}
          onTouchStart={handleSwipeStart}
        >
          {aside}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 z-30 w-7 lg:hidden"
        data-testid="mobile-nav-edge-swipe"
        onTouchCancel={resetSwipe}
        onTouchEnd={resetSwipe}
        onTouchMove={handleOpenSwipeMove}
        onTouchStart={handleSwipeStart}
      />

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Button
            className="lg:hidden"
            onClick={() => setIsOpen(true)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Menu className="size-4" />
            <span className="sr-only">Open navigation</span>
          </Button>
          <PanelLeftClose className="hidden size-4 text-muted-foreground lg:block" />
          <div>
            <p className="text-sm font-medium">Today</p>
            <p className="text-xs text-muted-foreground">
              Check-in, plan, and privacy context
            </p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function MemberDashboard({ user }: { user: User }) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your care rhythm, centered</CardTitle>
            <CardDescription>
              A focused starting point for reflection and care planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {checkInItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-md border border-border bg-background p-4"
                  key={item.title}
                >
                  <span className="mb-4 flex size-10 items-center justify-center rounded-md bg-accent text-primary">
                    <Icon className="size-5" />
                  </span>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session context</CardTitle>
            <CardDescription>
              Signed in as {user.email ?? "your Valence account"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-md bg-muted p-4">
              Next session prep is ready for the first authenticated flow.
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border p-4 text-foreground">
              <Activity className="size-4 text-primary" />
              Check-in completion baseline: 47.2%
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function AppAuthExperience() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authState, dispatchAuth] = useReducer(authReducer, {
    isLoading: true,
    user: null
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!supabase) {
        dispatchAuth({ type: "loaded", user: null });
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (isMounted) {
        dispatchAuth({ type: "loaded", user: session?.user ?? null });
      }
    }

    void loadSession();

    const {
      data: { subscription }
    } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        dispatchAuth({ type: "user-changed", user: session?.user ?? null });
      }) ?? { data: { subscription: null } };

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase?.auth.signOut();
    dispatchAuth({ type: "user-changed", user: null });
  }

  if (authState.isLoading) {
    return (
      <main className="valence-auth-scene grid min-h-dvh place-items-center bg-background p-6 text-foreground">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Opening Valence</CardTitle>
            <CardDescription>Checking your session.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!authState.user) {
    return <LoginScreen />;
  }

  return (
    <WorkspaceShell onSignOut={() => void signOut()} user={authState.user}>
      <MemberDashboard user={authState.user} />
    </WorkspaceShell>
  );
}
