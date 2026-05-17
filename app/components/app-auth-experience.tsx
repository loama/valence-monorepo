"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type SetStateAction
} from "react";
import { App } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  CapacitorUpdater,
  type BundleInfo,
  type LatestVersion
} from "@capgo/capacitor-updater";
import type { Provider, User } from "@supabase/supabase-js";
import {
  Activity,
  Bell,
  CalendarCheck,
  CloudDownload,
  ClipboardList,
  FileText,
  HeartPulse,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  PanelLeftClose,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon
} from "lucide-react";
import packageJson from "@/package.json";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const appRouteBasePath = "/app";
const nativeRedirectUrl =
  process.env.NEXT_PUBLIC_APP_NATIVE_REDIRECT_URL ??
  "valence://auth/callback";

export type PageKey = "today" | "care-plan" | "messages" | "profile";

type VersionState = {
  capgoVersion: string;
  installedVersion: string;
};

const installedVersion = packageJson.version;

const navItems: Array<{
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  page: PageKey;
}> = [
  {
    description: "Check-in and care context",
    href: `${appRouteBasePath}/`,
    icon: CalendarCheck,
    label: "Today",
    page: "today"
  },
  {
    description: "Goals, tasks, and session prep",
    href: `${appRouteBasePath}/care-plan/`,
    icon: ClipboardList,
    label: "Plan",
    page: "care-plan"
  },
  {
    description: "Care team conversations",
    href: `${appRouteBasePath}/messages/`,
    icon: MessageCircle,
    label: "Messages",
    page: "messages"
  },
  {
    description: "Account, privacy, and app version",
    href: `${appRouteBasePath}/profile/`,
    icon: UserRound,
    label: "Profile",
    page: "profile"
  }
];

function getPageHref(page: PageKey) {
  return navItems.find((item) => item.page === page)?.href ?? `${appRouteBasePath}/`;
}

function getPageFromPathname(pathname: string): PageKey {
  const normalizedPathname = pathname.replace(/\/+$/, "");

  if (normalizedPathname.endsWith("/care-plan")) {
    return "care-plan";
  }

  if (normalizedPathname.endsWith("/messages")) {
    return "messages";
  }

  if (normalizedPathname.endsWith("/profile")) {
    return "profile";
  }

  return "today";
}

function getClientPageFromLocation() {
  if (typeof window === "undefined") {
    return "today";
  }

  return getPageFromPathname(window.location.pathname);
}

function subscribeToPageChanges(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("valence:navigation", onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("valence:navigation", onStoreChange);
  };
}

function useActivePage(fallbackPage: PageKey) {
  return useSyncExternalStore(
    subscribeToPageChanges,
    getClientPageFromLocation,
    () => fallbackPage
  );
}

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
      type: "checking";
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
    case "checking":
      return {
        ...state,
        error: null,
        percent: 0
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

async function holdNativeUpdateForPrompt() {
  const oneYearFromNow = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000
  ).toISOString();

  await CapacitorUpdater.setMultiDelay({
    delayConditions: [{ kind: "date", value: oneYearFromNow }]
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
      void holdNativeUpdateForPrompt();
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

function isDownloadableUpdate(latest: LatestVersion) {
  return (
    latest.kind !== "up_to_date" &&
    latest.kind !== "blocked" &&
    latest.version &&
    (latest.url || latest.manifest)
  );
}

async function checkAndDownloadNativeUpdate(
  dispatch: Dispatch<NativeUpdateAction>
) {
  dispatch({ type: "checking" });

  try {
    const latest = await CapacitorUpdater.getLatest();

    if (!isDownloadableUpdate(latest)) {
      dispatch({ type: "dismiss" });
      return;
    }

    const bundle = await CapacitorUpdater.download({
      checksum: latest.checksum,
      manifest: latest.manifest,
      sessionKey: latest.sessionKey,
      url: latest.url ?? "",
      version: latest.version
    });

    await holdNativeUpdateForPrompt();
    dispatch({ bundle, type: "downloaded" });
  } catch (error) {
    dispatch({
      message:
        error instanceof Error
          ? error.message
          : "The update check could not be completed.",
      type: "failed"
    });
  }
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
    return appRouteBasePath;
  }

  return `${window.location.origin}${appRouteBasePath}`;
}

function useAppVersions(): VersionState {
  const [versions, setVersions] = useState<VersionState>({
    capgoVersion: Capacitor.isNativePlatform() ? "checking" : "web",
    installedVersion
  });

  useEffect(() => {
    let isMounted = true;

    if (!Capacitor.isNativePlatform()) {
      setVersions({
        capgoVersion: "web",
        installedVersion
      });
      return () => {
        isMounted = false;
      };
    }

    void CapacitorUpdater.current()
      .then((bundle) => {
        if (!isMounted) {
          return;
        }

        setVersions({
          capgoVersion:
            bundle.bundle.version ?? bundle.bundle.id ?? "builtin",
          installedVersion: bundle.native || installedVersion
        });
      })
      .catch(() => {
        if (isMounted) {
          setVersions({
            capgoVersion: "unknown",
            installedVersion
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return versions;
}

function VersionBadge({
  className,
  versions
}: {
  className?: string;
  versions: VersionState;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card/85 px-3 py-2 text-xs leading-5 text-muted-foreground shadow-sm backdrop-blur",
        className
      )}
    >
      <span className="font-medium text-foreground">Installed</span>{" "}
      {versions.installedVersion}
      <span className="mx-2 text-border">/</span>
      <span className="font-medium text-foreground">Capgo</span>{" "}
      {versions.capgoVersion}
    </div>
  );
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
  return (
    <Drawer dismissible={false} open={Boolean(update.bundle)}>
      <DrawerContent className="mx-auto max-w-xl px-[env(safe-area-inset-left)]">
        <DrawerHeader className="text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
              <CloudDownload className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DrawerTitle>Update ready</DrawerTitle>
              <DrawerDescription className="mt-1 leading-6">
                A new Valence app update is downloaded and ready to apply.
              </DrawerDescription>
              {update.percent !== null && update.percent < 100 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Downloading {Math.round(update.percent)}%
                </p>
              ) : null}
            </div>
          </div>
        </DrawerHeader>
        <DrawerFooter className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button onClick={onApplyNow} type="button">
            Apply now
          </Button>
          <DrawerClose asChild>
            <Button
              onClick={onApplyNextLaunch}
              type="button"
              variant="outline"
            >
              Next app launch
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function LoginScreen({ versions }: { versions: VersionState }) {
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
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center gap-4">
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
        <VersionBadge className="self-center" versions={versions} />
      </section>
    </main>
  );
}

function WorkspaceShell({
  activePage,
  children,
  user,
  versions,
  onNavigate,
  onSignOut
}: {
  activePage: PageKey;
  children: ReactNode;
  user: User;
  versions: VersionState;
  onNavigate: (page: PageKey) => void;
  onSignOut: () => void;
}) {
  const email = user.email ?? "Member";
  const activeNav = navItems.find((item) => item.page === activePage);

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, page: PageKey) {
    event.preventDefault();
    onNavigate(page);
  }

  const aside = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-sm font-semibold">Valence</p>
          <p className="text-xs text-muted-foreground">Member workspace</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.page === activePage;

          return (
            <a
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              href={item.href}
              key={item.label}
              onClick={(event) => handleNavigate(event, item.page)}
            >
              <Icon className="size-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <VersionBadge className="mb-3 bg-background" versions={versions} />
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
    <div className="min-h-dvh bg-background pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="hidden lg:block">{aside}</div>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[calc(4rem+env(safe-area-inset-top))] items-end gap-3 border-b border-border bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur sm:px-6 lg:min-h-16 lg:px-8 lg:pt-0">
          <PanelLeftClose className="hidden size-4 text-muted-foreground lg:block" />
          <div>
            <p className="text-sm font-medium">{activeNav?.label ?? "Today"}</p>
            <p className="text-xs text-muted-foreground">
              {activeNav?.description ?? "Check-in and care context"}
            </p>
          </div>
        </header>
        <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-[calc(1rem+env(safe-area-inset-left))] right-[calc(1rem+env(safe-area-inset-right))] z-40 lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-lg border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.page === activePage;

            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.68rem] font-medium leading-none transition-all duration-200 active:scale-[0.98]",
                  isActive
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                href={item.href}
                key={item.page}
                onClick={(event) => handleNavigate(event, item.page)}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
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

function CarePlanPage() {
  const goals = [
    {
      title: "Steady morning check-ins",
      detail: "Capture the first mood signal before calendar pressure builds.",
      meta: "5 minute rhythm"
    },
    {
      title: "Session prep",
      detail: "Keep notes, consent context, and care themes ready for review.",
      meta: "Next session"
    },
    {
      title: "Privacy defaults",
      detail: "Share only the pieces your care team needs for the next step.",
      meta: "Private by default"
    }
  ];

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Care plan</CardTitle>
          <CardDescription>
            A calm view of goals, tasks, and care context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {goals.map((goal) => (
            <div
              className="flex min-h-44 flex-col justify-between rounded-md border border-border bg-background p-4"
              key={goal.title}
            >
              <div>
                <p className="text-sm font-semibold">{goal.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {goal.detail}
                </p>
              </div>
              <p className="mt-5 text-xs font-medium text-primary">
                {goal.meta}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session notes</CardTitle>
          <CardDescription>
            Draft structure for the clinical workflows coming next.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-muted p-4 text-sm leading-6">
            <FileText className="mb-3 size-5 text-primary" />
            Reflect on what felt regulated, what felt strained, and what
            support would help this week.
          </div>
          <div className="rounded-md bg-muted p-4 text-sm leading-6">
            <ShieldCheck className="mb-3 size-5 text-primary" />
            Consent and sharing preferences stay attached to every care note.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MessagesPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            A private inbox for care team conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            "Your clinician shared a prep note for your next session.",
            "A care coordinator will confirm availability once scheduling is live.",
            "System reminders will appear here after notification rules are active."
          ].map((message, index) => (
            <div
              className="flex items-start gap-3 rounded-md border border-border bg-background p-4"
              key={message}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                {index === 0 ? (
                  <MessageCircle className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
              </span>
              <p className="text-sm leading-6 text-muted-foreground">
                {message}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function ProfilePage({
  user,
  versions,
  onSignOut
}: {
  user: User;
  versions: VersionState;
  onSignOut: () => void;
}) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-md bg-accent text-primary">
              <UserRound className="size-5" />
            </div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Signed in as {user.email ?? "your Valence account"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full justify-start"
              onClick={onSignOut}
              type="button"
              variant="outline"
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App version</CardTitle>
            <CardDescription>
              Use these values when confirming which native shell and live
              update are running.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Installed
              </p>
              <p className="mt-2 font-mono text-lg tabular-nums">
                {versions.installedVersion}
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Capgo
              </p>
              <p className="mt-2 font-mono text-lg tabular-nums">
                {versions.capgoVersion}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Account controls are private by default while settings are built.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-muted p-4 text-sm leading-6">
            Only explicitly shared care context should leave the member
            workspace.
          </div>
          <div className="rounded-md bg-muted p-4 text-sm leading-6">
            Admin visibility and audit trails will be governed from the
            platform API.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ActivePage({
  page,
  pushRegistration,
  user,
  versions,
  onEnablePushNotifications,
  onSignOut
}: {
  page: PageKey;
  pushRegistration: PushRegistrationState;
  user: User;
  versions: VersionState;
  onEnablePushNotifications: () => void;
  onSignOut: () => void;
}) {
  switch (page) {
    case "care-plan":
      return <CarePlanPage />;
    case "messages":
      return <MessagesPage />;
    case "profile":
      return (
        <ProfilePage
          onSignOut={onSignOut}
          user={user}
          versions={versions}
        />
      );
    case "today":
      return (
        <MemberDashboard
          onEnablePushNotifications={onEnablePushNotifications}
          pushRegistration={pushRegistration}
          user={user}
        />
      );
  }
}

export function AppAuthExperience({ page = "today" }: { page?: PageKey }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const versions = useAppVersions();
  const activePage = useActivePage(page);
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

    const cleanup = bindNativeUpdateLifecycle(dispatchNativeUpdate);
    void checkAndDownloadNativeUpdate(dispatchNativeUpdate);

    return cleanup;
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
    await CapacitorUpdater.setMultiDelay({
      delayConditions: [{ kind: "kill" }]
    });
    dispatchNativeUpdate({ type: "dismiss" });
  }

  async function applyNativeUpdateNow() {
    if (!nativeUpdate.bundle) {
      return;
    }

    await CapacitorUpdater.cancelDelay();
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

  function navigateWithinApp(nextPage: PageKey) {
    if (typeof window === "undefined") {
      return;
    }

    const href = getPageHref(nextPage);

    if (window.location.pathname !== href) {
      window.history.pushState({ page: nextPage }, "", href);
    }

    window.dispatchEvent(new Event("valence:navigation"));
    window.scrollTo({ top: 0 });
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
    return <LoginScreen versions={versions} />;
  }

  return (
    <WorkspaceShell
      activePage={activePage}
      onNavigate={navigateWithinApp}
      onSignOut={() => void signOut()}
      user={authState.user}
      versions={versions}
    >
      <ActivePage
        onEnablePushNotifications={() => void enablePushNotifications()}
        onSignOut={() => void signOut()}
        page={activePage}
        pushRegistration={pushRegistration}
        user={authState.user}
        versions={versions}
      />
      <NativeUpdateDrawer
        onApplyNextLaunch={() => void applyNativeUpdateOnNextLaunch()}
        onApplyNow={() => void applyNativeUpdateNow()}
        update={nativeUpdate}
      />
    </WorkspaceShell>
  );
}
