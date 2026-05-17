"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  type TouchEvent
} from "react";
import { App } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  CapacitorUpdater,
  type BundleInfo
} from "@capgo/capacitor-updater";
import type { Provider, User } from "@supabase/supabase-js";
import {
  Activity,
  Bell,
  CalendarCheck,
  CloudDownload,
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
const nativeRedirectUrl =
  process.env.NEXT_PUBLIC_APP_NATIVE_REDIRECT_URL ??
  "valence://auth/callback";

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

type PushRegistrationState = {
  error: string | null;
  status: "idle" | "unsupported" | "prompt" | "registered" | "denied" | "error";
  token: string | null;
};

type NativeUpdateState = {
  bundle: BundleInfo | null;
  error: string | null;
  percent: number | null;
};

type NativeUpdateAction =
  | {
      type: "download-progress";
      percent: number;
    }
  | {
      type: "downloaded";
      bundle: BundleInfo;
    }
  | {
      type: "failed";
      message: string;
    }
  | {
      type: "dismiss";
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

function nativeUpdateReducer(
  state: NativeUpdateState,
  action: NativeUpdateAction
): NativeUpdateState {
  switch (action.type) {
    case "download-progress":
      return {
        ...state,
        error: null,
        percent: action.percent
      };
    case "downloaded":
      return {
        bundle: action.bundle,
        error: null,
        percent: 100
      };
    case "failed":
      return {
        bundle: null,
        error: action.message,
        percent: null
      };
    case "dismiss":
      return {
        bundle: null,
        error: null,
        percent: null
      };
  }
}

function bindListener(
  listenerPromise: Promise<PluginListenerHandle>,
  handles: PluginListenerHandle[],
  isActive: () => boolean
) {
  void listenerPromise.then((handle) => {
    if (isActive()) {
      handles.push(handle);
      return;
    }

    void handle.remove();
  });
}

function bindNativeUpdateLifecycle(
  dispatch: Dispatch<NativeUpdateAction>
): () => void {
  let isActive = true;
  const handles: PluginListenerHandle[] = [];

  void CapacitorUpdater.notifyAppReady();

  void CapacitorUpdater.getNextBundle().then((bundle) => {
    if (bundle && isActive) {
      dispatch({ bundle, type: "downloaded" });
    }
  });

  bindListener(
    CapacitorUpdater.addListener("download", ({ percent }) => {
      dispatch({ percent, type: "download-progress" });
    }),
    handles,
    () => isActive
  );

  bindListener(
    CapacitorUpdater.addListener("downloadComplete", ({ bundle }) => {
      void CapacitorUpdater.next({ id: bundle.id });
      dispatch({ bundle, type: "downloaded" });
    }),
    handles,
    () => isActive
  );

  bindListener(
    CapacitorUpdater.addListener("downloadFailed", ({ version }) => {
      dispatch({
        message: `Update ${version} could not be downloaded.`,
        type: "failed"
      });
    }),
    handles,
    () => isActive
  );

  bindListener(
    CapacitorUpdater.addListener("updateFailed", ({ bundle }) => {
      dispatch({
        message: `Update ${bundle.version} could not be applied.`,
        type: "failed"
      });
    }),
    handles,
    () => isActive
  );

  return () => {
    isActive = false;
    for (const handle of handles) {
      void handle.remove();
    }
  };
}

function bindPushNotificationLifecycle(
  setPushRegistration: Dispatch<SetStateAction<PushRegistrationState>>
): () => void {
  let isActive = true;
  const handles: PluginListenerHandle[] = [];

  bindListener(
    PushNotifications.addListener("registration", (token) => {
      setPushRegistration({
        error: null,
        status: "registered",
        token: token.value
      });
    }),
    handles,
    () => isActive
  );

  bindListener(
    PushNotifications.addListener("registrationError", (error) => {
      setPushRegistration({
        error: error.error,
        status: "error",
        token: null
      });
    }),
    handles,
    () => isActive
  );

  bindListener(
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      ({ notification }) => {
        const url = notification.data?.url;

        if (typeof url === "string" && url.startsWith("/")) {
          window.location.assign(url);
        }
      }
    ),
    handles,
    () => isActive
  );

  return () => {
    isActive = false;
    for (const handle of handles) {
      void handle.remove();
    }
  };
}

function getRedirectTo() {
  if (Capacitor.isNativePlatform()) {
    return nativeRedirectUrl;
  }

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

function NativeUpdateDrawer({
  update,
  onApplyNow,
  onApplyNextLaunch
}: {
  update: NativeUpdateState;
  onApplyNow: () => void;
  onApplyNextLaunch: () => void;
}) {
  if (!update.bundle) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-lg translate-y-0 rounded-t-lg border border-border bg-card p-4 shadow-2xl sm:rounded-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
            <CloudDownload className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Update ready</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              A new Valence app update is downloaded and ready to apply.
            </p>
            {update.percent !== null && update.percent < 100 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Downloading {Math.round(update.percent)}%
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button onClick={onApplyNow} type="button">
            Apply now
          </Button>
          <Button onClick={onApplyNextLaunch} type="button" variant="outline">
            Next app launch
          </Button>
        </div>
      </div>
    </div>
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

    const isNative = Capacitor.isNativePlatform();
    const { data, error: providerError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectTo(),
        skipBrowserRedirect: isNative,
        queryParams:
          provider === "google" ? { prompt: "select_account" } : undefined
      }
    });

    if (providerError) {
      setError("We could not start that sign-in flow. Check auth settings.");
      return;
    }

    if (isNative && data.url) {
      await AppLauncher.openUrl({ url: data.url });
    }
  }

  return (
    <main className="valence-auth-scene valence-safe-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
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
  const [dragX, setDragX] = useState<number | null>(null);
  const dragXRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMode = useRef<"open" | "close" | null>(null);
  const email = user.email ?? "Member";
  const drawerWidth = 288;

  const currentX = dragX ?? (isOpen ? 0 : -drawerWidth);
  const drawerProgress = Math.min(
    1,
    Math.max(0, (currentX + drawerWidth) / drawerWidth)
  );

  function clampDrawerX(value: number) {
    return Math.min(0, Math.max(-drawerWidth, value));
  }

  function setDrawerX(value: number | null) {
    dragXRef.current = value;
    setDragX(value);
  }

  function handleSwipeStart(
    event: TouchEvent<HTMLElement>,
    mode: "open" | "close"
  ) {
    const touch = event.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchMode.current = mode;
    setDrawerX(mode === "open" ? -drawerWidth : 0);
  }

  function handleSwipeMove(event: TouchEvent<HTMLElement>) {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      touchMode.current === null
    ) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    if (Math.abs(deltaX) < deltaY && deltaY > 8) {
      resetSwipe();
      return;
    }

    event.preventDefault();
    setDrawerX(
      touchMode.current === "open"
        ? clampDrawerX(-drawerWidth + Math.max(0, deltaX))
        : clampDrawerX(Math.min(0, deltaX))
    );
  }

  function finishSwipe() {
    const releasedX = dragXRef.current ?? (isOpen ? 0 : -drawerWidth);

    setIsOpen(releasedX > -drawerWidth / 2);
    resetSwipe();
  }

  function resetSwipe() {
    touchStartX.current = null;
    touchStartY.current = null;
    touchMode.current = null;
    setDrawerX(null);
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
    <div className="valence-auth-scene valence-safe-screen bg-background text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="hidden lg:block">{aside}</div>

      <div
        className={cn(
          "valence-safe-fixed fixed z-40 lg:hidden",
          isOpen || dragX !== null ? "pointer-events-auto" : "pointer-events-none"
        )}
        data-state={isOpen ? "open" : "closed"}
      >
        <button
          aria-label="Close navigation"
          className={cn(
            "absolute inset-0 bg-foreground/35 backdrop-blur-[2px] ease-out",
            dragX === null && "transition-opacity duration-300"
          )}
          onClick={() => setIsOpen(false)}
          style={{ opacity: drawerProgress }}
          type="button"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 transform-gpu shadow-2xl ease-[cubic-bezier(0.22,1,0.36,1)]",
            dragX === null && "transition-transform duration-300"
          )}
          data-testid="mobile-nav-drawer"
          onTouchCancel={resetSwipe}
          onTouchEnd={finishSwipe}
          onTouchMove={handleSwipeMove}
          onTouchStart={(event) => handleSwipeStart(event, "close")}
          style={{
            transform: `translate3d(${currentX}px, 0, 0)`,
            touchAction: "pan-y"
          }}
        >
          {aside}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="fixed bottom-[env(safe-area-inset-bottom)] left-[env(safe-area-inset-left)] top-[env(safe-area-inset-top)] z-30 w-7 lg:hidden"
        data-testid="mobile-nav-edge-swipe"
        onTouchCancel={resetSwipe}
        onTouchEnd={finishSwipe}
        onTouchMove={handleSwipeMove}
        onTouchStart={(event) => handleSwipeStart(event, "open")}
        style={{ touchAction: "pan-y" }}
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

function MemberDashboard({
  pushRegistration,
  user,
  onEnablePushNotifications
}: {
  pushRegistration: PushRegistrationState;
  user: User;
  onEnablePushNotifications: () => void;
}) {
  const pushDescription =
    pushRegistration.status === "registered"
      ? "This device is registered for Valence notifications."
      : pushRegistration.status === "denied"
        ? "Notifications are disabled in system settings for this device."
        : pushRegistration.status === "unsupported"
          ? "Push notifications are only available in the native app."
          : "Enable care reminders and important account notifications.";

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

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>{pushDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
              <Bell className="size-5" />
            </span>
            <span>
              {pushRegistration.status === "registered"
                ? "Device token is ready."
                : "Permission is requested only when you opt in."}
            </span>
          </div>
          <Button
            disabled={pushRegistration.status === "registered"}
            onClick={onEnablePushNotifications}
            type="button"
            variant={
              pushRegistration.status === "registered" ? "outline" : "default"
            }
          >
            {pushRegistration.status === "registered"
              ? "Enabled"
              : "Enable notifications"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

export function AppAuthExperience() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authState, dispatchAuth] = useReducer(authReducer, {
    isLoading: true,
    user: null
  });
  const [nativeUpdate, dispatchNativeUpdate] = useReducer(nativeUpdateReducer, {
    bundle: null,
    error: null,
    percent: null
  });
  const [pushRegistration, setPushRegistration] =
    useState<PushRegistrationState>({
      error: null,
      status: Capacitor.isNativePlatform() ? "idle" : "unsupported",
      token: null
    });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return () => {};
    }

    return bindNativeUpdateLifecycle(dispatchNativeUpdate);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return () => {};
    }

    return bindPushNotificationLifecycle(setPushRegistration);
  }, []);

  async function enablePushNotifications() {
    if (!Capacitor.isNativePlatform()) {
      setPushRegistration({
        error: null,
        status: "unsupported",
        token: null
      });
      return;
    }

    setPushRegistration((current) => ({ ...current, status: "prompt" }));
    let permission = await PushNotifications.checkPermissions();

    if (permission.receive === "prompt") {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== "granted") {
      setPushRegistration({
        error: "Notifications were not granted for this device.",
        status: "denied",
        token: null
      });
      return;
    }

    await PushNotifications.register();
  }

  async function applyNativeUpdateOnNextLaunch() {
    if (!nativeUpdate.bundle) {
      return;
    }

    await CapacitorUpdater.next({ id: nativeUpdate.bundle.id });
    dispatchNativeUpdate({ type: "dismiss" });
  }

  async function applyNativeUpdateNow() {
    if (!nativeUpdate.bundle) {
      return;
    }

    await CapacitorUpdater.set({ id: nativeUpdate.bundle.id });
  }

  useEffect(() => {
    let isMounted = true;
    let appUrlOpenHandle: { remove: () => Promise<void> } | null = null;

    async function exchangeSessionFromUrl(urlString: string) {
      if (!supabase) {
        return null;
      }

      const url = new URL(urlString);
      const code = url.searchParams.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          return null;
        }

        return data.session?.user ?? null;
      }

      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        return null;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        return null;
      }

      return data.session?.user ?? null;
    }

    async function loadSession() {
      if (!supabase) {
        dispatchAuth({ type: "loaded", user: null });
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await exchangeSessionFromUrl(url.toString());
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

    if (Capacitor.isNativePlatform()) {
      void App.addListener("appUrlOpen", async ({ url }) => {
        const user = await exchangeSessionFromUrl(url);

        if (user && isMounted) {
          dispatchAuth({ type: "user-changed", user });
        }
      }).then((handle) => {
        if (!isMounted) {
          void handle.remove();
          return;
        }

        appUrlOpenHandle = handle;
      });
    }

    const {
      data: { subscription }
    } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        dispatchAuth({ type: "user-changed", user: session?.user ?? null });
      }) ?? { data: { subscription: null } };

    return () => {
      isMounted = false;
      void appUrlOpenHandle?.remove();
      subscription?.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase?.auth.signOut();
    dispatchAuth({ type: "user-changed", user: null });
  }

  if (authState.isLoading) {
    return (
      <main className="valence-auth-scene valence-safe-screen grid place-items-center bg-background p-6 text-foreground">
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
      <MemberDashboard
        onEnablePushNotifications={() => void enablePushNotifications()}
        pushRegistration={pushRegistration}
        user={authState.user}
      />
      <NativeUpdateDrawer
        onApplyNextLaunch={() => void applyNativeUpdateOnNextLaunch()}
        onApplyNow={() => void applyNativeUpdateNow()}
        update={nativeUpdate}
      />
    </WorkspaceShell>
  );
}
