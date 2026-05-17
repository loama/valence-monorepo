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
  Apple,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  CloudDownload,
  CreditCard,
  Dumbbell,
  Heart,
  Home,
  LogOut,
  Mail,
  MessageCircle,
  Mic,
  MoreHorizontal,
  PenLine,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Video,
  type LucideIcon
} from "lucide-react";
import packageJson from "@/package.json";

import { Button } from "@/components/ui/button";
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

export type PageKey = "home" | "exercises" | "sessions" | "messages" | "profile";

type VersionState = {
  capgoVersion: string;
  installedVersion: string;
};

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

const installedVersion = packageJson.version;

const navItems: Array<{
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  page: PageKey;
}> = [
  {
    description: "Mood check-in",
    href: `${appRouteBasePath}/`,
    icon: Home,
    label: "Home",
    page: "home"
  },
  {
    description: "Guided exercises",
    href: `${appRouteBasePath}/exercises/`,
    icon: Dumbbell,
    label: "Exercises",
    page: "exercises"
  },
  {
    description: "Appointments",
    href: `${appRouteBasePath}/sessions/`,
    icon: CalendarDays,
    label: "Sessions",
    page: "sessions"
  },
  {
    description: "Care team chat",
    href: `${appRouteBasePath}/messages/`,
    icon: MessageCircle,
    label: "Messages",
    page: "messages"
  },
  {
    description: "Progress and settings",
    href: `${appRouteBasePath}/profile/`,
    icon: UserRound,
    label: "Profile",
    page: "profile"
  }
];

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

function getPageHref(page: PageKey) {
  return (
    navItems.find((item) => item.page === page)?.href ?? `${appRouteBasePath}/`
  );
}

function getPageFromPathname(pathname: string): PageKey {
  const normalizedPathname = pathname.replace(/\/+$/, "");

  if (
    normalizedPathname.endsWith("/exercises") ||
    normalizedPathname.endsWith("/care-plan")
  ) {
    return "exercises";
  }

  if (normalizedPathname.endsWith("/sessions")) {
    return "sessions";
  }

  if (normalizedPathname.endsWith("/messages")) {
    return "messages";
  }

  if (normalizedPathname.endsWith("/profile")) {
    return "profile";
  }

  return "home";
}

function getClientPageFromLocation() {
  if (typeof window === "undefined") {
    return "home";
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
          capgoVersion: bundle.bundle.version ?? bundle.bundle.id ?? "builtin",
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

function BrandLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "valence-logo",
        size === "lg" ? "text-7xl" : size === "md" ? "text-4xl" : "text-3xl",
        className
      )}
    >
      valence
      <span
        className={cn(
          "valence-spark ml-1.5",
          size === "lg" ? "size-10" : size === "md" ? "size-6" : "size-4"
        )}
      />
    </span>
  );
}

function SparkMark({ className }: { className?: string }) {
  return <span className={cn("valence-spark", className)} />;
}

function Mascot({
  className,
  tone = "yellow"
}: {
  className?: string;
  tone?: "yellow" | "purple" | "orange";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "valence-mascot",
        tone === "yellow" && "valence-mascot-yellow",
        tone === "purple" && "valence-mascot-purple",
        tone === "orange" && "valence-mascot-orange",
        className
      )}
    >
      <span className="valence-mascot-face" />
    </span>
  );
}

function PageChrome({
  eyebrow,
  title,
  description,
  children,
  mascot
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  mascot?: ReactNode;
}) {
  return (
    <section className="relative mx-auto flex max-w-5xl flex-col gap-5 overflow-hidden px-5 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute right-[-3rem] top-8 hidden size-40 rounded-full bg-[var(--valence-yellow)]/75 sm:block" />
      <div className="pointer-events-none absolute right-8 top-16 hidden sm:block">
        {mascot}
      </div>
      <div className="relative">
        {eyebrow ? (
          <span className="inline-flex rounded-full bg-[var(--valence-purple-soft)] px-4 py-1.5 text-sm font-extrabold text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[0.95] text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-xl leading-8 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="relative grid gap-5">{children}</div>
    </section>
  );
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
        "rounded-2xl border border-border bg-white/82 px-3 py-2 text-xs leading-5 text-muted-foreground shadow-sm backdrop-blur",
        className
      )}
    >
      <span className="font-extrabold text-foreground">Installed</span>{" "}
      {versions.installedVersion}
      <span className="mx-2 text-border">/</span>
      <span className="font-extrabold text-foreground">Capgo</span>{" "}
      {versions.capgoVersion}
    </div>
  );
}

function ProviderMark({
  icon: Icon,
  label
}: {
  icon?: LucideIcon;
  label: string;
}) {
  return (
    <span className="flex size-7 items-center justify-center rounded-xl border border-border bg-white text-sm font-black">
      {Icon ? <Icon className="size-4" /> : label}
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
    <Drawer
      dismissible={false}
      open={Boolean(update.bundle)}
      shouldScaleBackground={false}
    >
      <DrawerContent className="mx-auto max-w-xl px-[env(safe-area-inset-left)]">
        <DrawerHeader className="text-left">
          <div className="flex items-start gap-3">
            <span className="valence-purple-surface mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl text-white">
              <CloudDownload className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-2xl font-black">
                Update ready
              </DrawerTitle>
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
          <Button
            className="valence-brand-button h-12 rounded-2xl text-base font-extrabold"
            onClick={onApplyNow}
            type="button"
          >
            Apply now
          </Button>
          <DrawerClose asChild>
            <Button
              className="h-12 rounded-2xl text-base font-extrabold"
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

function SplashScreen({ versions }: { versions: VersionState }) {
  return (
    <main className="valence-safe-screen relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6 text-foreground">
      <div className="valence-squiggle right-[-2rem] top-[10%] rotate-[38deg]" />
      <div className="valence-squiggle bottom-[-2rem] left-[-2rem] rotate-[210deg]" />
      <SparkMark className="absolute bottom-[27%] left-1/2 size-6 -translate-x-1/2" />
      <SparkMark className="absolute right-[18%] top-[44%] size-9" />
      <section className="flex flex-col items-center text-center">
        <BrandLogo size="lg" />
        <p className="mt-5 text-2xl font-semibold text-foreground">
          Mental health with clarity.
        </p>
        <Mascot className="mt-36 size-20" tone="purple" />
        <span className="valence-spinner mt-9 size-10" />
        <VersionBadge className="mt-8" versions={versions} />
      </section>
    </main>
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
    <main className="valence-auth-scene relative min-h-dvh overflow-hidden bg-background pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pl-[calc(env(safe-area-inset-left)+1.25rem)] pr-[calc(env(safe-area-inset-right)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.75rem)] text-foreground sm:pl-[calc(env(safe-area-inset-left)+1.5rem)] sm:pr-[calc(env(safe-area-inset-right)+1.5rem)]">
      <div className="valence-squiggle right-[-4rem] top-12 rotate-[35deg]" />
      <SparkMark className="absolute right-[17%] top-[24%] size-12" />
      <section className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <button
            aria-label="Valence assistant"
            className="flex size-14 items-center justify-center rounded-2xl border border-border bg-white/84 shadow-sm backdrop-blur"
            type="button"
          >
            <SparkMark className="size-6" />
          </button>
        </div>

        <div className="pt-14">
          <span className="inline-flex rounded-full bg-[var(--valence-purple-soft)] px-4 py-1.5 text-sm font-extrabold text-primary">
            your mental wellness companion
          </span>
          <h1 className="mt-7 text-6xl font-semibold leading-[0.94]">
            Welcome back
          </h1>
          <p className="mt-5 max-w-sm text-xl leading-8 text-muted-foreground">
            Continue your journey toward balance, clarity, and well-being.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={requestEmailAccess}>
          <Label className="sr-only" htmlFor="member-email">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-primary" />
            <Input
              autoComplete="email"
              className="h-16 rounded-[1.35rem] border-border bg-white/86 pl-14 text-lg shadow-sm"
              id="member-email"
              name="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="Enter your email"
              required
              type="email"
              value={email}
            />
          </div>
          <Button
            className="valence-brand-button h-16 rounded-[1.35rem] text-xl font-extrabold"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Sending" : "Send code"}
          </Button>
        </form>

        <div className="grid gap-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 text-muted-foreground">
            <span className="h-px bg-border" />
            <span className="font-semibold">or</span>
            <span className="h-px bg-border" />
          </div>
  <Button
            className="h-14 rounded-[1.25rem] border-border bg-white/86 text-lg font-extrabold"
            onClick={() => void continueWithProvider("google")}
            type="button"
            variant="outline"
          >
            <ProviderMark label="G" />
            Continue with Google
          </Button>
          <Button
            className="h-14 rounded-[1.25rem] border-border bg-white/86 text-lg font-extrabold"
            onClick={() => void continueWithProvider("apple")}
            type="button"
            variant="outline"
          >
            <ProviderMark icon={Apple} label="A" />
            Continue with Apple
          </Button>
        </div>

        {status ? (
          <div className="valence-panel rounded-[1.35rem] p-4 text-sm font-semibold leading-6">
            {status}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.35rem] border border-border bg-white/86 p-4 text-sm font-semibold leading-6 text-muted-foreground">
            {error}
          </div>
        ) : null}

        <div className="valence-panel relative mt-3 overflow-hidden rounded-[1.75rem] p-5">
          <div className="relative z-10 max-w-[14rem]">
            <p className="text-sm font-extrabold text-foreground">
              Compassionate support
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              A private space for sessions, reflection, and steady progress.
            </p>
          </div>
          <Mascot
            className="absolute bottom-[-1.25rem] right-[-0.75rem] size-24"
            tone="yellow"
          />
        </div>
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
    <aside className="flex h-full w-72 flex-col border-r border-border bg-white/84 backdrop-blur">
      <div className="flex h-20 items-center border-b border-border px-5">
        <BrandLogo size="sm" />
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.page === activePage;

          return (
            <a
              className={cn(
                "flex h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-extrabold transition-all",
                isActive
                  ? "bg-[var(--valence-purple-soft)] text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              href={item.href}
              key={item.label}
              onClick={(event) => handleNavigate(event, item.page)}
            >
              <Icon className="size-5" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <VersionBadge className="mb-3 bg-white" versions={versions} />
        <p className="truncate text-sm font-extrabold">{email}</p>
        <Button
          className="mt-3 w-full justify-start rounded-2xl"
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
    <div className="min-h-dvh overflow-x-hidden bg-background pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="hidden lg:block">{aside}</div>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[calc(5.5rem+env(safe-area-inset-top))] items-end justify-between bg-background/88 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+0.9rem)] backdrop-blur-xl sm:px-6 lg:min-h-20 lg:px-8 lg:pt-0">
          <BrandLogo className="lg:hidden" size="sm" />
          <div className="hidden lg:block">
            <p className="text-sm font-extrabold">{activeNav?.label}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              {activeNav?.description}
            </p>
          </div>
          <button
            aria-label="Open Valence tools"
            className="flex size-14 items-center justify-center rounded-2xl border border-border bg-white/84 shadow-sm backdrop-blur"
            type="button"
          >
            <SparkMark className="size-6" />
          </button>
        </header>
        <div className="pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-[calc(0.7rem+env(safe-area-inset-bottom))] left-[calc(0.75rem+env(safe-area-inset-left))] right-[calc(0.75rem+env(safe-area-inset-right))] z-40 lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 rounded-[2rem] border border-border bg-white/90 p-1.5 shadow-[0_18px_55px_rgba(24,27,34,0.16)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.page === activePage;

            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1.55rem] px-1 text-[0.62rem] font-extrabold leading-none transition-all duration-200 active:scale-[0.97]",
                  isActive
                    ? "bg-[var(--valence-purple-soft)] text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                href={item.href}
                key={item.page}
                onClick={(event) => handleNavigate(event, item.page)}
              >
                <Icon className="size-5" strokeWidth={2.4} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomePage({
  pushRegistration,
  onEnablePushNotifications
}: {
  pushRegistration: PushRegistrationState;
  onEnablePushNotifications: () => void;
}) {
  const moods = [
    { label: "Great", tone: "bg-[#cbb4ff]" },
    { label: "Good", tone: "bg-primary text-white", active: true },
    { label: "Okay", tone: "bg-[#ffd6c0]" },
    { label: "Low", tone: "bg-[var(--valence-orange)]" },
    { label: "Struggling", tone: "bg-[#ff8a34]" }
  ];
  const topics = [
    ["Sleep", Heart],
    ["Work", ClipboardList],
    ["Relationships", Heart],
    ["Health", Activity],
    ["Finances", CreditCard],
    ["Other", MoreHorizontal]
  ] as const;
  const pushDescription =
    pushRegistration.status === "registered"
      ? "This device is registered for Valence notifications."
      : pushRegistration.status === "denied"
        ? "Notifications are disabled in system settings for this device."
        : pushRegistration.status === "unsupported"
          ? "Push notifications are only available in the native app."
          : "Enable care reminders and important account notifications.";

  return (
    <PageChrome
      description="Take a moment to check in with yourself. Your feelings matter."
      eyebrow="mood check-in"
      mascot={<Mascot className="size-28" tone="yellow" />}
      title="How are you feeling right now?"
    >
      <div className="grid grid-cols-5 gap-3 overflow-x-auto pb-1">
        {moods.map((mood) => (
          <button
            className={cn(
              "flex min-w-24 flex-col items-center gap-2 rounded-[1.35rem] border bg-white p-3 text-sm font-extrabold shadow-sm transition active:scale-[0.97]",
              mood.active
                ? "border-primary shadow-[0_0_0_2px_rgba(104,51,244,0.2)]"
                : "border-border"
            )}
            key={mood.label}
            type="button"
          >
            <span
              className={cn(
                "grid size-12 place-items-center rounded-full text-xl",
                mood.tone
              )}
            >
              :)
            </span>
            {mood.label}
          </button>
        ))}
      </div>

      <div className="valence-panel rounded-[1.6rem] p-5">
        <h2 className="text-2xl font-semibold">How stressed do you feel?</h2>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          On a scale of 0 to 10
        </p>
        <div className="mt-8">
          <div className="relative h-3 rounded-full bg-muted">
            <div className="h-full w-[60%] rounded-full bg-primary" />
            <span className="absolute left-[60%] top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-primary bg-white text-sm font-black text-primary shadow-md">
              6
            </span>
          </div>
          <div className="mt-5 flex justify-between text-sm font-extrabold">
            <span>0</span>
            <span>10</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Not at all</span>
            <span>Extremely</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-semibold">What is on your mind?</h2>
        <p className="mt-1 font-semibold text-muted-foreground">
          Select all that apply
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {topics.map(([label, Icon], index) => (
            <button
              className={cn(
                "flex h-14 items-center justify-center gap-3 rounded-2xl border bg-white/86 text-sm font-extrabold shadow-sm",
                index === 1 ? "border-primary text-foreground" : "border-border"
              )}
              key={label}
              type="button"
            >
              <Icon className="size-5 text-primary" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold">Notes</h2>
        <div className="mt-3 rounded-[1.35rem] border border-border bg-white/88 p-5 text-muted-foreground shadow-sm">
          Add a few notes about how you are feeling&hellip;
          <p className="mt-6 text-right text-sm font-extrabold">0/200</p>
        </div>
      </div>

      <Button className="valence-brand-button h-16 rounded-[1.35rem] text-xl font-extrabold">
        Save check-in
      </Button>

      <div className="valence-panel flex items-center justify-between gap-4 rounded-[1.5rem] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--valence-purple-soft)] text-primary">
            <Bell className="size-5" />
          </span>
          <div>
            <p className="font-black">Notifications</p>
            <p className="text-sm font-semibold leading-6 text-muted-foreground">
              {pushDescription}
            </p>
          </div>
        </div>
        <Button
          className="rounded-2xl"
          disabled={pushRegistration.status === "registered"}
          onClick={onEnablePushNotifications}
          type="button"
          variant={pushRegistration.status === "registered" ? "outline" : "default"}
        >
          {pushRegistration.status === "registered" ? "Enabled" : "Enable"}
        </Button>
      </div>
    </PageChrome>
  );
}

function ExercisesPage() {
  return (
    <PageChrome
      description="A safe space to reflect, release, and grow."
      eyebrow="guided care"
      mascot={<SparkMark className="size-14" />}
      title="Exercises"
    >
      <div className="valence-panel relative overflow-hidden rounded-[1.65rem] p-6">
        <SparkMark className="mb-5 size-9" />
        <p className="max-w-md text-2xl font-semibold leading-10">
          Today I took time for myself. I went for a walk, stayed off my phone,
          and just breathed.
        </p>
        <div className="mt-8 flex items-center justify-between">
          <p className="font-semibold text-muted-foreground">
            Today, 9:30 PM
          </p>
          <button
            className="grid size-12 place-items-center rounded-2xl border border-border bg-white text-primary"
            type="button"
          >
            <PenLine className="size-5" />
          </button>
        </div>
        <Mascot
          className="absolute bottom-[-1.5rem] right-6 size-24"
          tone="yellow"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Breathing reset",
            detail: "A 4 minute exercise for racing thoughts.",
            icon: Activity,
            tone: "purple"
          },
          {
            title: "Name what you need",
            detail: "A brief prompt for identifying support.",
            icon: Sparkles,
            tone: "yellow"
          },
          {
            title: "Grounding scan",
            detail: "Move attention through senses and surroundings.",
            icon: Target,
            tone: "orange"
          },
          {
            title: "Sleep wind-down",
            detail: "A calmer transition from the day into rest.",
            icon: Heart,
            tone: "purple"
          }
        ].map((exercise) => {
          const Icon = exercise.icon;

          return (
            <button
              className="valence-panel flex items-center justify-between rounded-[1.35rem] p-5 text-left transition active:scale-[0.98]"
              key={exercise.title}
              type="button"
            >
              <span className="flex items-center gap-4">
                <span
                  className={cn(
                    "grid size-13 place-items-center rounded-2xl text-white",
                    exercise.tone === "purple" && "valence-purple-surface",
                    exercise.tone === "yellow" && "bg-[var(--valence-yellow)] text-foreground",
                    exercise.tone === "orange" && "bg-[var(--valence-orange)]"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-lg font-black">
                    {exercise.title}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-6 text-muted-foreground">
                    {exercise.detail}
                  </span>
                </span>
              </span>
              <ChevronRight className="size-5" />
            </button>
          );
        })}
      </div>

      <Button className="valence-brand-button h-16 rounded-[1.35rem] text-xl font-extrabold">
        <PenLine className="size-5" />
        New entry
      </Button>
    </PageChrome>
  );
}

function SessionsPage() {
  const weekdays = [
    { id: "sun", label: "SUN" },
    { id: "mon", label: "MON" },
    { id: "tue", label: "TUE" },
    { id: "wed", label: "WED" },
    { id: "thu", label: "THU" },
    { id: "fri", label: "FRI" },
    { id: "sat", label: "SAT" }
  ];
  const days = [
    { day: 27, id: "prev-27" },
    { day: 28, id: "prev-28" },
    { day: 29, id: "prev-29" },
    { day: 30, id: "prev-30" },
    { day: 1, id: "may-1" },
    { day: 2, id: "may-2" },
    { day: 3, id: "may-3" },
    { day: 4, id: "may-4" },
    { day: 5, id: "may-5" },
    { day: 6, id: "may-6" },
    { day: 7, id: "may-7" },
    { day: 8, id: "may-8" },
    { day: 9, id: "may-9" },
    { day: 10, id: "may-10" },
    { day: 11, id: "may-11" },
    { day: 12, id: "may-12" },
    { day: 13, id: "may-13" },
    { day: 14, id: "may-14" },
    { day: 15, id: "may-15" },
    { day: 16, id: "may-16" },
    { day: 17, id: "may-17" },
    { day: 18, id: "may-18" },
    { day: 19, id: "may-19" },
    { day: 20, id: "may-20" },
    { day: 21, id: "may-21" },
    { day: 22, id: "may-22" },
    { day: 23, id: "may-23" },
    { day: 24, id: "may-24" },
    { day: 25, id: "may-25" },
    { day: 26, id: "may-26" },
    { day: 27, id: "may-27" },
    { day: 28, id: "may-28" },
    { day: 29, id: "may-29" },
    { day: 30, id: "may-30" },
    { day: 31, id: "may-31" }
  ];
  const dots = new Set([7, 9, 12, 19, 28, 30]);

  return (
    <PageChrome
      description="View and manage your upcoming sessions and appointments."
      mascot={<Mascot className="size-32" tone="yellow" />}
      title="Sessions"
    >
      <div className="grid grid-cols-2 rounded-[1.5rem] border border-border bg-white p-1.5 shadow-sm">
        <button
          className="valence-brand-button h-13 rounded-[1.1rem] text-lg font-extrabold text-white"
          type="button"
        >
          Month
        </button>
        <button className="h-13 rounded-[1.1rem] text-lg font-extrabold" type="button">
          Week
        </button>
      </div>

      <div className="valence-panel rounded-[1.65rem] p-5">
        <div className="flex items-center justify-between">
          <ChevronRight className="size-6 rotate-180" />
          <h2 className="text-3xl font-semibold">May 2025</h2>
          <ChevronRight className="size-6" />
        </div>
        <div className="mt-7 grid grid-cols-7 gap-y-5 text-center">
          {weekdays.map((day) => (
            <span
              className="text-xs font-black text-muted-foreground"
              key={day.id}
            >
              {day.label}
            </span>
          ))}
          {days.map((date) => {
            const isSelected = date.id === "may-14";
            return (
              <span
                className="relative grid min-h-11 place-items-center text-xl font-bold"
                key={date.id}
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-full",
                    isSelected && "bg-primary text-white shadow-lg shadow-primary/25"
                  )}
                >
                  {date.day}
                </span>
                {dots.has(date.day) ? (
                  <span className="absolute bottom-0 size-1.5 rounded-full bg-primary" />
                ) : null}
              </span>
            );
          })}
        </div>
      </div>

      <div className="valence-panel rounded-[1.65rem] p-5">
        <p className="text-lg font-black">Next appointment</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-[var(--valence-purple-soft)] text-primary">
            <UserRound className="size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-black">Dr. Emma Lin</p>
            <p className="font-semibold text-muted-foreground">
              Clinical Psychologist
            </p>
            <p className="mt-2 text-sm font-bold text-primary">
              Tomorrow, May 15 at 10:00 AM
            </p>
          </div>
          <button className="grid size-12 place-items-center rounded-full border border-border bg-white text-primary" type="button">
            <Video className="size-5" />
          </button>
          <button className="grid size-12 place-items-center rounded-full border border-border bg-white text-primary" type="button">
            <Phone className="size-5" />
          </button>
        </div>
      </div>

      <div className="valence-purple-surface relative overflow-hidden rounded-[1.65rem] p-6 text-white">
        <p className="text-4xl font-black">Dr. Emma Lin</p>
        <p className="mt-2 text-xl font-semibold text-white/90">
          Clinical Psychologist
        </p>
        <p className="mt-4 flex items-center gap-2 text-2xl font-bold">
          <span className="size-3 rounded-full bg-[var(--valence-orange)]" />
          00:24
        </p>
        <div className="mt-9 grid grid-cols-4 gap-4">
          {[
            ["Mute", Mic],
            ["Video", Video],
            ["Notes", ClipboardList],
            ["End", Phone]
          ].map(([label, Icon]) => (
            <button
              className="grid place-items-center gap-2 text-sm font-bold text-white"
              key={label as string}
              type="button"
            >
              <span className="grid size-14 place-items-center rounded-full bg-white/18">
                <Icon className="size-5" />
              </span>
              {label as string}
            </button>
          ))}
        </div>
        <Mascot
          className="absolute bottom-5 right-7 size-20"
          tone="purple"
        />
      </div>

      <Button className="valence-brand-button h-16 rounded-[1.35rem] text-xl font-extrabold">
        <CalendarDays className="size-5" />
        Book new session
      </Button>
    </PageChrome>
  );
}

function MessagesPage() {
  const messages = [
    {
      body: "Hi there, I am glad you are here. How are you feeling today?",
      id: "clinician-welcome",
      mine: false,
      time: "10:00 AM"
    },
    {
      body: "I have been feeling really anxious lately, especially at night.",
      id: "member-anxious",
      mine: true,
      time: "10:01 AM"
    },
    {
      body: "Thank you for sharing that with me. Anxiety can be really tough, especially when it affects your rest.",
      id: "clinician-validate",
      mine: false,
      time: "10:02 AM"
    },
    {
      body: "It helps just talking about it. I feel so overwhelmed sometimes.",
      id: "member-overwhelmed",
      mine: true,
      time: "10:03 AM"
    },
    {
      body: "Let us try a quick breathing exercise together. It can help calm your mind and body.",
      id: "clinician-breathing",
      mine: false,
      time: "10:04 AM"
    }
  ];

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pb-8 pt-3 sm:px-6 lg:px-8">
      <div className="sticky top-[calc(5rem+env(safe-area-inset-top))] z-20 flex items-center gap-3 rounded-[1.5rem] border border-border bg-white/90 p-3 shadow-sm backdrop-blur">
        <span className="grid size-14 place-items-center rounded-full bg-[var(--valence-purple-soft)] text-primary">
          <UserRound className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-black">Dr. Emma Lin</p>
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="size-3 rounded-full bg-emerald-500" />
            Active now
          </p>
        </div>
        <button
          className="grid size-12 place-items-center rounded-2xl border border-border bg-white"
          type="button"
        >
          <Phone className="size-5" />
        </button>
      </div>

      <span className="w-fit rounded-full bg-[var(--valence-purple-soft)] px-4 py-1.5 text-sm font-extrabold text-primary">
        your session
      </span>

      <div className="grid gap-4">
        {messages.map((message) => (
          <div
            className={cn(
              "max-w-[82%] rounded-[1.45rem] p-5 shadow-sm",
              message.mine
                ? "valence-purple-surface ml-auto text-white"
                : "valence-panel text-foreground"
            )}
            key={message.id}
          >
            <p className="text-lg font-semibold leading-8">{message.body}</p>
            <p
              className={cn(
                "mt-3 text-sm font-bold",
                message.mine ? "text-white/82" : "text-muted-foreground"
              )}
            >
              {message.time}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold text-muted-foreground">
          Need help getting started?
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {["I feel overwhelmed", "Can not sleep", "Racing thoughts"].map(
            (prompt) => (
              <button
                className="whitespace-nowrap rounded-full border border-primary/55 bg-white px-4 py-2 text-sm font-extrabold text-primary"
                key={prompt}
                type="button"
              >
                <Sparkles className="mr-1 inline size-4" />
                {prompt}
              </button>
            )
          )}
        </div>
      </div>

      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3">
        <button
          className="valence-brand-button grid size-14 place-items-center rounded-full text-white"
          type="button"
        >
          +
        </button>
        <div className="flex h-14 min-w-0 flex-1 items-center rounded-full border border-border bg-white px-5 text-muted-foreground shadow-sm">
          Write a message&hellip;
        </div>
        <button
          className="valence-brand-button grid size-14 place-items-center rounded-full text-white"
          type="button"
        >
          <Send className="size-5" />
        </button>
      </div>
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
  const settings = [
    ["Personal info", "Update your profile and personal details", UserRound, "purple"],
    ["Therapy goals", "View and update your goals", Target, "orange"],
    ["Notifications", "Manage notification preferences", Bell, "yellow"],
    ["Privacy", "Manage your data and privacy settings", ShieldCheck, "ink"],
    ["Payment", "Manage subscription and payments", CreditCard, "white"]
  ] as const;

  return (
    <PageChrome
      description="You are doing great. Keep it going."
      mascot={<SparkMark className="size-9" />}
      title="Olivia Martinez"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span className="grid size-32 place-items-center rounded-full bg-[var(--valence-purple-soft)] text-primary shadow-sm">
            <UserRound className="size-16" />
          </span>
          <button
            className="absolute bottom-1 right-0 grid size-12 place-items-center rounded-full bg-white text-primary shadow-lg"
            type="button"
          >
            <PenLine className="size-5" />
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          {user.email ?? "your Valence account"}
        </p>
      </div>

      <div className="valence-purple-surface flex items-center gap-5 overflow-hidden rounded-[1.65rem] p-5 text-white">
        <Mascot className="size-24 shrink-0" tone="yellow" />
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-black">12-day streak</p>
          <p className="mt-1 text-lg font-semibold text-white/90">
            You logged your mood 12 days in a row
          </p>
        </div>
        <ChevronRight className="size-7" />
      </div>

      <div className="valence-panel rounded-[1.65rem] p-5">
        <div className="flex justify-between">
          <h2 className="text-2xl font-semibold">Your progress</h2>
          <p className="text-xl font-black text-primary">5 / 7</p>
        </div>
        <p className="mt-3 font-extrabold text-primary">
          Journal days this week
        </p>
        <div className="mt-5 grid grid-cols-7 gap-3 text-center">
          {[
            { day: "M", id: "monday" },
            { day: "T", id: "tuesday" },
            { day: "W", id: "wednesday" },
            { day: "T", id: "thursday" },
            { day: "F", id: "friday" },
            { day: "S", id: "saturday" },
            { day: "S", id: "sunday" }
          ].map((day, index) => (
            <span className="grid gap-2" key={day.id}>
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-full border text-white",
                  index < 5
                    ? "border-primary bg-primary"
                    : "border-border bg-white text-transparent"
                )}
              >
                <Check className="size-5" />
              </span>
              <span className="text-sm font-bold text-muted-foreground">
                {day.day}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="valence-panel overflow-hidden rounded-[1.65rem]">
        {settings.map(([title, detail, Icon, tone]) => (
          <button
            className="flex w-full items-center gap-4 border-b border-border/80 p-5 text-left last:border-b-0"
            key={title}
            type="button"
          >
            <span
              className={cn(
                "grid size-13 place-items-center rounded-2xl",
                tone === "purple" && "bg-primary text-white",
                tone === "orange" && "bg-[var(--valence-orange)] text-white",
                tone === "yellow" && "bg-[var(--valence-yellow)] text-foreground",
                tone === "ink" && "bg-foreground text-white",
                tone === "white" && "bg-muted text-foreground"
              )}
            >
              <Icon className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black">{title}</span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-muted-foreground">
                {detail}
              </span>
            </span>
            <ChevronRight className="size-5" />
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <VersionBadge versions={versions} />
        <Button
          className="h-13 rounded-2xl font-extrabold"
          onClick={onSignOut}
          type="button"
          variant="outline"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </PageChrome>
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
    case "exercises":
      return <ExercisesPage />;
    case "sessions":
      return <SessionsPage />;
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
    case "home":
      return (
        <HomePage
          onEnablePushNotifications={onEnablePushNotifications}
          pushRegistration={pushRegistration}
        />
      );
  }
}

export function AppAuthExperience({ page = "home" }: { page?: PageKey }) {
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
    return <SplashScreen versions={versions} />;
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
