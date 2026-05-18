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
  Brain,
  Check,
  ChevronRight,
  Clock,
  ClipboardList,
  CloudDownload,
  FileText,
  LogOut,
  Mail,
  MessageCircle,
  PenLine,
  Phone,
  Send,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import packageJson from "@/package.json";
import releaseVersion from "@/release-version.json";

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
  installedVersion: string;
  releaseVersion: string;
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

const fallbackInstalledVersion = packageJson.version;
const appReleaseNumber = Number(releaseVersion.version);
const appReleaseVersion = Number.isInteger(appReleaseNumber)
  ? String(appReleaseNumber)
  : fallbackInstalledVersion;

const pageItems: Record<
  PageKey,
  {
    description: string;
    href: string;
    icon: LucideIcon;
    label: string;
    page: PageKey;
  }
> = {
  home: {
    description: "Clinical patient profile",
    href: `${appRouteBasePath}/`,
    icon: UserRound,
    label: "Perfil",
    page: "home"
  },
  exercises: {
    description: "Clinical snapshot",
    href: `${appRouteBasePath}/exercises/`,
    icon: Activity,
    label: "Seguimiento",
    page: "exercises"
  },
  sessions: {
    description: "Clinical coach",
    href: `${appRouteBasePath}/sessions/`,
    icon: Brain,
    label: "Coach",
    page: "sessions"
  },
  messages: {
    description: "Care team chat",
    href: `${appRouteBasePath}/messages/`,
    icon: MessageCircle,
    label: "Messages",
    page: "messages"
  },
  profile: {
    description: "Patient activity",
    href: `${appRouteBasePath}/profile/`,
    icon: ClipboardList,
    label: "Actividad",
    page: "profile"
  }
};

const navItems: Array<{
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  page: PageKey;
}> = [pageItems.home, pageItems.exercises, pageItems.sessions, pageItems.profile];

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
  return pageItems[page]?.href ?? `${appRouteBasePath}/`;
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

async function scheduleNativeUpdateForNextLaunch(bundle: BundleInfo) {
  await CapacitorUpdater.next({ id: bundle.id });
  await CapacitorUpdater.setMultiDelay({
    delayConditions: [{ kind: "kill" }]
  });
}

function bindNativeUpdateLifecycle(
  dispatch: Dispatch<NativeUpdateAction>
): () => void {
  let isActive = true;
  const handles: PluginListenerHandle[] = [];

  void CapacitorUpdater.notifyAppReady();

  void CapacitorUpdater.current().then((currentBundle) => {
    if (isActive) {
      console.info("[valence:update] current bundle", currentBundle);
    }

    void CapacitorUpdater.getNextBundle().then((nextBundle) => {
      if (
        nextBundle &&
        isActive &&
        nextBundle.id !== currentBundle.bundle.id
      ) {
        void scheduleNativeUpdateForNextLaunch(nextBundle);
        dispatch({ bundle: nextBundle, type: "downloaded" });
      }
    });
  });

  bindListener(
    App.addListener("resume", () => {
      void checkAndDownloadNativeUpdate(dispatch);
    }),
    handles,
    () => isActive
  );

  bindListener(
    CapacitorUpdater.addListener("download", ({ percent }) => {
      dispatch({ percent, type: "download-progress" });
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
    const currentBundle = await CapacitorUpdater.current();
    const nextBundle = await CapacitorUpdater.getNextBundle();

    if (nextBundle && nextBundle.id !== currentBundle.bundle.id) {
      await scheduleNativeUpdateForNextLaunch(nextBundle);
      dispatch({ bundle: nextBundle, type: "downloaded" });
      return;
    }

    const latest = await CapacitorUpdater.getLatest();
    console.info("[valence:update] latest bundle", latest);

    if (!isDownloadableUpdate(latest)) {
      return;
    }

    const bundle = await CapacitorUpdater.download({
      checksum: latest.checksum,
      manifest: latest.manifest,
      sessionKey: latest.sessionKey,
      url: latest.url ?? "",
      version: latest.version
    });

    await scheduleNativeUpdateForNextLaunch(bundle);
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
    installedVersion: fallbackInstalledVersion,
    releaseVersion: Capacitor.isNativePlatform() ? "checking" : appReleaseVersion
  });

  useEffect(() => {
    let isMounted = true;

    if (!Capacitor.isNativePlatform()) {
      setVersions({
        installedVersion: "web",
        releaseVersion: appReleaseVersion
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
          installedVersion: bundle.native || fallbackInstalledVersion,
          releaseVersion: getVisibleReleaseVersion(
            bundle.bundle.id,
            bundle.bundle.version
          )
        });
      })
      .catch(() => {
        if (isMounted) {
          setVersions({
            installedVersion: fallbackInstalledVersion,
            releaseVersion: "unknown"
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return versions;
}

function useClinicianRealtimeEvents(user: User | null) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [eventCount, setEventCount] = useState(3);
  const [lastEvent, setLastEvent] = useState("Sofía updated her check-in");

  useEffect(() => {
    if (!supabase || !user) {
      return () => {};
    }

    const channel = supabase
      .channel(`therapist-platform:${user.id}`)
      .on(
        "broadcast",
        { event: "patient_activity" },
        (payload) => {
          const label =
            typeof payload.payload?.title === "string"
              ? payload.payload.title
              : "New patient activity";

          setLastEvent(label);
          setEventCount((count) => count + 1);
        }
      );

    channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [supabase, user]);

  return { eventCount, lastEvent };
}

function getVisibleReleaseVersion(
  bundleId: string | null | undefined,
  bundleVersion: string | null | undefined
) {
  if (!bundleId || bundleId === "builtin") {
    return "built-in";
  }

  return formatReleaseVersion(bundleVersion ?? bundleId);
}

function formatReleaseVersion(version: string) {
  const integerVersion = version.match(/^(?:1\.1\.|)(\d+)$/);

  return integerVersion?.[1] ?? version;
}

function BrandLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "valence-logo",
        size === "lg" ? "text-6xl" : size === "md" ? "text-3xl" : "text-2xl",
        className
      )}
    >
      valence
      <span
        className={cn(
          "valence-spark ml-1.5",
          size === "lg" ? "size-8" : size === "md" ? "size-5" : "size-3.5"
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
    <section className="relative mx-auto flex max-w-5xl flex-col gap-4 overflow-hidden px-5 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute right-[-3rem] top-8 hidden size-36 rounded-full bg-[var(--valence-pink)]/20 sm:block" />
      <div className="pointer-events-none absolute right-8 top-16 hidden sm:block">
        {mascot}
      </div>
      <div className="relative">
        {eyebrow ? (
          <span className="inline-flex rounded-full bg-[var(--valence-teal-soft)] px-4 py-1.5 text-sm font-extrabold text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[0.98] text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>
      <div className="relative grid gap-4">{children}</div>
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
        "rounded-2xl border border-border bg-card/82 px-3 py-2 text-xs leading-5 text-muted-foreground shadow-sm backdrop-blur",
        className
      )}
    >
      <span className="font-extrabold text-foreground">Installed</span>{" "}
      {versions.installedVersion}
      <span className="mx-2 text-border">/</span>
      <span className="font-extrabold text-foreground">Release</span>{" "}
      {versions.releaseVersion}
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
    <span className="flex size-7 items-center justify-center rounded-xl border border-border bg-card text-sm font-black">
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
            <span className="valence-purple-surface mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[1.1rem] text-white">
              <CloudDownload className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-xl font-black">
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
            className="valence-brand-button h-11 rounded-2xl text-sm font-extrabold"
            onClick={onApplyNow}
            type="button"
          >
            Apply now
          </Button>
          <DrawerClose asChild>
            <Button
              className="h-11 rounded-2xl text-sm font-extrabold"
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

function MessagesDrawer({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto flex h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border-border bg-background px-[calc(env(safe-area-inset-left)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] pr-[calc(env(safe-area-inset-right)+1rem)] pt-4">
        <DrawerHeader className="shrink-0 px-1 pb-3 pt-1 text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[1.1rem] bg-[var(--valence-teal-soft)] text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-xl font-black">
                Coach
              </DrawerTitle>
              <DrawerDescription className="mt-0.5">
                Clinical prompts and patient context are ready.
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1">
          <MessagesPage mode="drawer" />
        </div>
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
          Therapist platform.
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
    <main className="valence-auth-scene relative min-h-dvh overflow-hidden bg-background pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pl-[calc(env(safe-area-inset-left)+1.25rem)] pr-[calc(env(safe-area-inset-right)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)] text-foreground sm:pl-[calc(env(safe-area-inset-left)+1.5rem)] sm:pr-[calc(env(safe-area-inset-right)+1.5rem)]">
      <div className="valence-squiggle right-[-4rem] top-10 rotate-[35deg]" />
      <SparkMark className="absolute right-[14%] top-[21%] size-12 bg-[var(--valence-pink)]" />
      <section className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <button
            aria-label="Open therapist coach"
            className="flex size-11 items-center justify-center rounded-[1.15rem] border border-border bg-card/88 shadow-sm backdrop-blur"
            type="button"
          >
            <SparkMark className="size-5 bg-[var(--valence-pink)]" />
          </button>
        </div>

        <div className="pt-8">
          <span className="inline-flex rounded-full bg-[var(--valence-teal-soft)] px-4 py-1.5 text-sm font-extrabold text-primary">
            therapist platform
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[0.98]">
            Set up your clinical workspace
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-muted-foreground">
            Profile, agenda, patients, and clinical coach in one private flow.
          </p>
        </div>

        <div className="valence-panel grid gap-3 rounded-[1.65rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-primary">Step 1</p>
              <p className="text-lg font-black">Practice profile</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[var(--valence-pink)] text-white">
              <UsersRound className="size-5" />
            </span>
          </div>
          <div className="grid gap-3">
            <Input
              className="valence-field h-12 rounded-[1rem] px-4 text-sm"
              placeholder="Full name"
              readOnly
              value="Dra. Emma Lin"
            />
            <Input
              className="valence-field h-12 rounded-[1rem] px-4 text-sm"
              placeholder="Clinical approach"
              readOnly
              value="CBT, trauma-informed care"
            />
            <div className="grid grid-cols-2 gap-2">
              {["Online sessions", "In-person"].map((method) => (
                <button
                  className="rounded-[1rem] border border-border bg-[var(--valence-teal-soft)] p-3 text-left text-xs font-black text-foreground"
                  key={method}
                  type="button"
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form className="grid gap-3" onSubmit={requestEmailAccess}>
          <Label className="sr-only" htmlFor="member-email">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-primary" />
            <Input
              autoComplete="email"
              className="valence-field h-14 rounded-[1.2rem] pl-14 text-base shadow-sm"
              id="member-email"
              name="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="Clinical email"
              required
              type="email"
              value={email}
            />
          </div>
          <Button
            className="valence-brand-button h-14 rounded-[1.2rem] text-lg font-extrabold"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Sending" : "Send secure code"}
          </Button>
        </form>

        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 text-muted-foreground">
            <span className="h-px bg-border" />
            <span className="font-semibold">or</span>
            <span className="h-px bg-border" />
          </div>
  <Button
            className="h-12 rounded-[1.15rem] border-border bg-card/88 text-base font-extrabold"
            onClick={() => void continueWithProvider("google")}
            type="button"
            variant="outline"
          >
            <ProviderMark label="G" />
            Continue with Google
          </Button>
          <Button
            className="h-12 rounded-[1.15rem] border-border bg-card/88 text-base font-extrabold"
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
          <div className="rounded-[1.35rem] border border-border bg-card/88 p-4 text-sm font-semibold leading-6 text-muted-foreground">
            {error}
          </div>
        ) : null}

        <div className="valence-panel relative mt-1 overflow-hidden rounded-[1.75rem] p-5">
          <div className="relative z-10 max-w-[14rem]">
            <p className="text-sm font-extrabold text-primary">
              Realtime ready
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Patient events and coach notes are prepared for Supabase live sync.
            </p>
          </div>
          <Mascot
            className="absolute bottom-[-1.25rem] right-[-0.75rem] size-20"
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
  eventCount,
  lastEvent,
  user,
  versions,
  onNavigate,
  onSignOut
}: {
  activePage: PageKey;
  children: ReactNode;
  eventCount: number;
  lastEvent: string;
  user: User;
  versions: VersionState;
  onNavigate: (page: PageKey) => void;
  onSignOut: () => void;
}) {
  const email = user.email ?? "Member";
  const [messagesOpen, setMessagesOpen] = useState(false);
  const activeNav = pageItems[activePage];
  const activeNavIndex = Math.max(
    0,
    navItems.findIndex((item) => item.page === activePage)
  );

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, page: PageKey) {
    event.preventDefault();
    onNavigate(page);
  }

  const aside = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card/92 backdrop-blur">
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
                  ? "bg-[var(--valence-teal-soft)] text-primary"
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
        <VersionBadge className="mb-3 bg-card" versions={versions} />
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
      <div className="hidden lg:block" aria-hidden="true" />
      <div className="fixed bottom-0 left-[env(safe-area-inset-left)] top-0 z-40 hidden lg:block">
        {aside}
      </div>

      <main className="min-w-0 lg:col-start-2">
        <header className="fixed left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)] top-0 z-50 flex min-h-[calc(4.25rem+env(safe-area-inset-top))] items-end justify-between border-b border-border/60 bg-background/92 px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.65rem)] backdrop-blur-xl sm:px-6 lg:left-[calc(18rem+env(safe-area-inset-left))] lg:min-h-16 lg:px-8 lg:pt-0">
          <BrandLogo className="lg:hidden" size="sm" />
          <div className="hidden lg:block">
            <p className="text-sm font-extrabold">{activeNav?.label}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              {activeNav?.description}
            </p>
          </div>
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 px-4 lg:flex">
            <span className="size-2 rounded-full bg-primary" />
            <p className="truncate text-xs font-bold text-muted-foreground">
              {eventCount} live updates, {lastEvent}
            </p>
          </div>
          <button
            aria-label="Open messages"
            className="flex size-11 items-center justify-center rounded-[1.15rem] border border-border bg-card/88 shadow-sm backdrop-blur"
            onClick={() => setMessagesOpen(true)}
            type="button"
          >
            <SparkMark className="size-5 bg-[var(--valence-pink)]" />
          </button>
        </header>
        <div className="pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-[calc(4.25rem+env(safe-area-inset-top))] lg:pb-0 lg:pt-16">
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-[calc(0.55rem+env(safe-area-inset-bottom))] left-[calc(0.75rem+env(safe-area-inset-left))] right-[calc(0.75rem+env(safe-area-inset-right))] z-40 lg:hidden"
      >
        <div className="relative mx-auto grid max-w-sm grid-cols-4 rounded-[1.7rem] border border-border bg-card/94 p-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 z-0 rounded-[1.35rem] bg-[var(--valence-teal-soft)] transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${activeNavIndex * 100}%)`,
              width: "calc((100% - 0.75rem) / 4)"
            }}
          />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.page === activePage;

            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative z-10 flex min-h-13 flex-col items-center justify-center gap-1 rounded-[1.35rem] px-1 text-[0.58rem] font-extrabold leading-none transition-all duration-200 active:scale-[0.97]",
                  isActive
                    ? "text-primary"
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

      <MessagesDrawer open={messagesOpen} onOpenChange={setMessagesOpen} />
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
      description="The clinical profile combines onboarding answers, notes, and patient activity into one view."
      eyebrow="patient profile"
      mascot={<Mascot className="size-24" tone="purple" />}
      title="Sofía Martínez"
    >
      <div className="valence-panel grid gap-4 rounded-[1.6rem] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-primary">Active patient</p>
            <p className="mt-1 text-2xl font-black">23 questions completed</p>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-muted-foreground">
              Primary goals: anxiety management, sleep consistency, and conflict recovery.
            </p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-[1.25rem] bg-[var(--valence-pink)] text-white">
            <UserRound className="size-7" />
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Risk", "Low"],
            ["Mood", "Stable"],
            ["Last seen", "Today"]
          ].map(([label, value]) => (
            <div className="rounded-[1.1rem] bg-[var(--valence-teal-soft)] p-3" key={label}>
              <p className="text-xs font-bold text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-black">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Fortalezas", "Clear emotional vocabulary, keeps routines, asks for support."],
          ["Puntos de atención", "Avoidance rises after work conflict and poor sleep."],
          ["Plan sugerido", "Weekly exposure ladder, sleep log, and brief post-session check-in."],
          ["Método", "CBT with trauma-informed pacing and structured homework."]
        ].map(([title, detail]) => (
          <article className="valence-panel rounded-[1.35rem] p-4" key={title}>
            <p className="font-black text-primary">{title}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              {detail}
            </p>
          </article>
        ))}
      </div>

      <div className="valence-panel flex items-center justify-between gap-3 rounded-[1.35rem] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[1.1rem] bg-[var(--valence-teal-soft)] text-primary">
            <Bell className="size-5" />
          </span>
          <div>
            <p className="font-black">Notificaciones</p>
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
  const dimensions = [
    ["Regulación", 72],
    ["Sueño", 58],
    ["Relaciones", 66],
    ["Energía", 49]
  ] as const;

  return (
    <PageChrome
      description="A live clinical snapshot fed by notes, check-ins, and patient activity."
      eyebrow="seguimiento"
      mascot={<SparkMark className="size-14 bg-[var(--valence-pink)]" />}
      title="Clinical snapshot"
    >
      <div className="valence-panel rounded-[1.6rem] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-primary">This week</p>
            <p className="mt-1 text-2xl font-black">More stable, sleep still uneven</p>
          </div>
          <span className="grid size-12 place-items-center rounded-[1.2rem] bg-[var(--valence-pink)] text-white">
            <Activity className="size-6" />
          </span>
        </div>
        <div className="mt-5 grid gap-4">
          {dimensions.map(([label, value]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm font-bold">
                <span>{label}</span>
                <span className="text-primary">{value}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Insight",
            detail: "Stress spikes after 8 PM when work notes mention evaluation or deadlines.",
            icon: Activity,
            tone: "lime"
          },
          {
            title: "Clinical note",
            detail: "Patient completed 4 of 5 reflections and skipped one sleep log.",
            icon: FileText,
            tone: "pink"
          },
          {
            title: "Next focus",
            detail: "Review cognitive distortions around performance feedback.",
            icon: Target,
            tone: "lime"
          },
          {
            title: "Realtime",
            detail: "Snapshot listens for patient activity broadcasts from Supabase.",
            icon: Sparkles,
            tone: "pink"
          }
        ].map((exercise) => {
          const Icon = exercise.icon;

          return (
            <button
              className="valence-panel flex items-center justify-between rounded-[1.25rem] p-4 text-left transition active:scale-[0.98]"
              key={exercise.title}
              type="button"
            >
              <span className="flex items-center gap-4">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-[1.1rem] text-white",
                    exercise.tone === "lime" && "bg-primary text-primary-foreground",
                    exercise.tone === "pink" && "bg-[var(--valence-pink)]"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-base font-black">
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

      <Button className="valence-brand-button h-14 rounded-[1.2rem] text-lg font-extrabold">
        <PenLine className="size-5" />
        Add clinical note
      </Button>
    </PageChrome>
  );
}

function SessionsPage() {
  return (
    <PageChrome
      description="Clinical guidance, session preparation, and suggested next steps for the therapist."
      eyebrow="clinical coach"
      mascot={<Mascot className="size-28" tone="purple" />}
      title="Coach"
    >
      <div className="valence-purple-surface relative overflow-hidden rounded-[1.5rem] p-5 text-white">
        <p className="text-sm font-black text-primary">Suggested focus</p>
        <p className="mt-2 max-w-md text-2xl font-black leading-8 text-foreground">
          Begin next session with sleep patterns before moving into workplace triggers.
        </p>
        <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">
          Generated from the last check-in, activity timeline, and your previous note.
        </p>
        <Mascot className="absolute bottom-4 right-6 size-16" tone="purple" />
      </div>

      <div className="grid gap-3">
        {[
          ["Before session", "Review last panic log and note the avoided task."],
          ["Question to ask", "What changed the night you slept better?"],
          ["Suggested homework", "One 6 minute breathing practice after work, 3 times."]
        ].map(([title, detail]) => (
          <article className="valence-panel rounded-[1.35rem] p-4" key={title}>
            <p className="text-sm font-black text-primary">{title}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              {detail}
            </p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button className="valence-brand-button h-14 rounded-[1.2rem] text-base font-extrabold">
          <Sparkles className="size-5" />
          Generate plan
        </Button>
        <Button className="h-14 rounded-[1.2rem] border-border bg-card/88 text-base font-extrabold" variant="outline">
          <FileText className="size-5" />
          Save note
        </Button>
      </div>
    </PageChrome>
  );
}

function MessagesPage({ mode = "page" }: { mode?: "drawer" | "page" }) {
  const isDrawer = mode === "drawer";
  const messages = [
    {
      body: "Sofía's last check-in points to sleep disruption after workplace feedback.",
      id: "clinician-welcome",
      mine: false,
      time: "10:00 AM"
    },
    {
      body: "Give me a quick session opening and one homework idea.",
      id: "member-anxious",
      mine: true,
      time: "10:01 AM"
    },
    {
      body: "Open with sleep context, then ask what changed on the night she slept better.",
      id: "clinician-validate",
      mine: false,
      time: "10:02 AM"
    },
    {
      body: "Keep it gentle and short, please.",
      id: "member-overwhelmed",
      mine: true,
      time: "10:03 AM"
    },
    {
      body: "Suggested homework: one 6 minute breathing reset after work, three times this week.",
      id: "clinician-breathing",
      mine: false,
      time: "10:04 AM"
    }
  ];

  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        isDrawer
          ? "h-full min-h-0 px-1 pb-0 pt-0"
          : "mx-auto max-w-3xl px-5 pb-8 pt-3 sm:px-6 lg:px-8"
      )}
    >
      <div
        className={cn(
          "z-20 flex shrink-0 items-center gap-3 rounded-[1.35rem] border border-border bg-card/90 p-3 shadow-sm backdrop-blur",
          !isDrawer && "sticky top-[calc(4.25rem+env(safe-area-inset-top))]"
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-[var(--valence-teal-soft)] text-primary">
          <UserRound className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black">Clinical coach</p>
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="size-3 rounded-full bg-emerald-500" />
            Active now
          </p>
        </div>
        <button
          className="grid size-10 place-items-center rounded-[1.1rem] border border-border bg-card"
          type="button"
        >
          <Phone className="size-5" />
        </button>
      </div>

      <span className="w-fit rounded-full bg-[var(--valence-teal-soft)] px-4 py-1.5 text-sm font-extrabold text-primary">
        clinical prompt
      </span>

      <div
        className={cn(
          "min-h-0",
          isDrawer ? "flex-1 overflow-y-auto pr-1" : "grid gap-4"
        )}
      >
        <div className="grid gap-4">
          {messages.map((message) => (
            <div
              className={cn(
                "max-w-[82%] rounded-[1.3rem] p-4 shadow-sm",
                message.mine
                  ? "valence-purple-surface ml-auto text-white"
                  : "valence-panel text-foreground"
              )}
              key={message.id}
            >
              <p className="text-base font-semibold leading-7">{message.body}</p>
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

        <div className="mt-5">
          <p className="text-sm font-semibold text-muted-foreground">
            Need help getting started?
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {["I feel overwhelmed", "Can not sleep", "Racing thoughts"].map(
              (prompt) => (
                <button
                  className="whitespace-nowrap rounded-full border border-primary/55 bg-card px-4 py-2 text-sm font-extrabold text-primary"
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
      </div>

      <div
        className={cn(
          "z-20 flex shrink-0 items-center gap-3",
          !isDrawer && "sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))]"
        )}
      >
        <button
          className="valence-brand-button grid size-12 place-items-center rounded-full text-white"
          type="button"
        >
          +
        </button>
        <div className="flex h-12 min-w-0 flex-1 items-center rounded-full border border-border bg-card px-5 text-sm text-muted-foreground shadow-sm">
          Write a message&hellip;
        </div>
        <button
          className="valence-brand-button grid size-12 place-items-center rounded-full text-white"
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
  const activity = [
    ["Today, 8:42 AM", "Completed mood check-in", "Mood stable, stress 4/10"],
    ["Yesterday, 10:11 PM", "Journal entry", "Work conflict and sleep concerns"],
    ["May 16, 7:30 PM", "Exercise", "Finished breathing reset"],
    ["May 15, 6:05 PM", "Coach summary", "Clinical note reviewed"]
  ] as const;

  return (
    <PageChrome
      description="A chronological view of patient activity from newest to oldest."
      eyebrow="actividad"
      mascot={<SparkMark className="size-9 bg-[var(--valence-pink)]" />}
      title="Patient timeline"
    >
      <div className="valence-panel rounded-[1.6rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-primary">Live activity</p>
            <p className="mt-1 text-2xl font-black">4 updates this week</p>
          </div>
          <span className="grid size-12 place-items-center rounded-[1.2rem] bg-primary text-primary-foreground">
            <Clock className="size-6" />
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {activity.map(([time, title, detail], index) => (
          <article className="valence-panel relative rounded-[1.35rem] p-4 pl-14" key={title}>
            <span className="absolute left-4 top-4 grid size-8 place-items-center rounded-full bg-[var(--valence-teal-soft)] text-primary">
              {index === 0 ? <span className="size-2 rounded-full bg-primary" /> : <Check className="size-4" />}
            </span>
            <p className="text-xs font-bold text-muted-foreground">{time}</p>
            <p className="mt-1 font-black">{title}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
              {detail}
            </p>
          </article>
        ))}
      </div>

      <div className="valence-panel overflow-hidden rounded-[1.5rem]">
        {[
          ["Realtime source", "Supabase broadcast channel"],
          ["Signed in as", user.email ?? "Valence therapist"],
          ["Release", versions.releaseVersion]
        ].map(([title, detail]) => (
          <div
            className="flex w-full items-center justify-between gap-3 border-b border-border/80 p-4 last:border-b-0"
            key={title}
          >
            <span>
              <span className="block text-sm font-black">{title}</span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-muted-foreground">
                {detail}
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </div>
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
  const clinicianEvents = useClinicianRealtimeEvents(authState.user);
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

    await scheduleNativeUpdateForNextLaunch(nativeUpdate.bundle);
    dispatchNativeUpdate({ type: "dismiss" });
  }

  async function applyNativeUpdateNow() {
    if (!nativeUpdate.bundle) {
      return;
    }

    dispatchNativeUpdate({ type: "dismiss" });
    await Promise.all([
      CapacitorUpdater.cancelDelay(),
      scheduleNativeUpdateForNextLaunch(nativeUpdate.bundle)
    ]);
    await CapacitorUpdater.reload();
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

  const updateDrawer = (
    <NativeUpdateDrawer
      onApplyNextLaunch={() => void applyNativeUpdateOnNextLaunch()}
      onApplyNow={() => void applyNativeUpdateNow()}
      update={nativeUpdate}
    />
  );

  if (authState.isLoading) {
    return (
      <>
        <SplashScreen versions={versions} />
        {updateDrawer}
      </>
    );
  }

  if (!authState.user) {
    return (
      <>
        <LoginScreen versions={versions} />
        {updateDrawer}
      </>
    );
  }

  return (
    <>
      <WorkspaceShell
        activePage={activePage}
        eventCount={clinicianEvents.eventCount}
        lastEvent={clinicianEvents.lastEvent}
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
      </WorkspaceShell>
      {updateDrawer}
    </>
  );
}
