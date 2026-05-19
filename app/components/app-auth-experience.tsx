"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type FormEvent,
  type CSSProperties,
  type ReactNode,
  type SetStateAction
} from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  CapacitorUpdater,
  type BundleInfo,
  type LatestVersion
} from "@capgo/capacitor-updater";
import type { Provider, User } from "@supabase/supabase-js";
import {
  Apple,
  ArrowLeft,
  CloudDownload,
  HeartPulse,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  Stethoscope,
  type LucideIcon
} from "lucide-react";
import packageJson from "@/package.json";
import releaseVersion from "@/release-version.json";

import {
  demoPatients as previewPatients,
  pageItems,
  patientNavItems,
  patientSessions as previewPatientSessions,
  therapistNavItems,
  therapistSessions as previewTherapistSessions
} from "@/components/app-demo/data";
import { PatientExercisesScreen } from "@/components/app-demo/screens/patient/exercises-screen";
import { PatientHomeScreen } from "@/components/app-demo/screens/patient/home-screen";
import { PatientOnboardingScreen } from "@/components/app-demo/screens/patient/onboarding-screen";
import { PatientProfileScreen } from "@/components/app-demo/screens/patient/profile-screen";
import { PatientSessionsScreen } from "@/components/app-demo/screens/patient/sessions-screen";
import { PatientWelcomeCarousel } from "@/components/app-demo/screens/patient/welcome-carousel";
import { TherapistHomeScreen } from "@/components/app-demo/screens/therapist/home-screen";
import { TherapistOnboardingScreen } from "@/components/app-demo/screens/therapist/onboarding-screen";
import { TherapistPatientsScreen } from "@/components/app-demo/screens/therapist/patients-screen";
import { TherapistProfileScreen } from "@/components/app-demo/screens/therapist/profile-screen";
import { TherapistSessionsScreen } from "@/components/app-demo/screens/therapist/sessions-screen";
import { TherapistWelcomeCarousel } from "@/components/app-demo/screens/therapist/welcome-carousel";
import type { DemoPatient, DemoSession, PageKey } from "@/components/app-demo/types";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const appRouteBasePath = "/app";
const nativeRedirectUrl =
  process.env.NEXT_PUBLIC_APP_NATIVE_REDIRECT_URL ??
  "valence://auth/callback";
const flowStorageKey = "valence-demo-flow-v3";

type UserRole = "patient" | "therapist";
type FlowStage = "role" | "carousel" | "auth" | "onboarding" | "app";

type DemoFlowState = {
  carouselIndex: number;
  onboardingStep: number;
  role: UserRole | null;
  stage: FlowStage;
};

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

type ChatMessage = {
  body: string;
  id: string;
  mine: boolean;
};

const fallbackInstalledVersion = packageJson.version;
const appReleaseNumber = Number(releaseVersion.version);
const appReleaseVersion = Number.isInteger(appReleaseNumber)
  ? String(appReleaseNumber)
  : fallbackInstalledVersion;

const roleContent: Record<
  UserRole,
  {
    accent: string;
    accentSoft: string;
    audience: string;
    carousel: Array<{ body: string; title: string }>;
    onboarding: Array<{
      description: string;
      fields: Array<{
        label: string;
        options?: string[];
        placeholder?: string;
        type: "input" | "radio" | "textarea";
      }>;
      title: string;
    }>;
  }
> = {
  patient: {
    accent: "#8bcf52",
    accentSoft: "#e5f6cf",
    audience: "Patient",
    carousel: [
      {
        title: "Care that stays organized",
        body: "Keep sessions, exercises, and messages in one calm place."
      },
      {
        title: "Know what comes next",
        body: "See upcoming appointments and what to practice before them."
      },
      {
        title: "Use exercises between visits",
        body: "Try short guided activities and track what feels helpful."
      },
      {
        title: "Message without losing context",
        body: "See how private chat will look once backend messages are live."
      }
    ],
    onboarding: [
      {
        title: "About you",
        description: "A few basics help shape your demo experience.",
        fields: [
          { label: "Preferred name", placeholder: "Olivia", type: "input" },
          {
            label: "What brings you here?",
            options: ["Anxiety", "Relationships", "Sleep", "Work stress"],
            type: "radio"
          }
        ]
      },
      {
        title: "Session preferences",
        description: "Choose how you would like sessions to work.",
        fields: [
          {
            label: "Preferred format",
            options: ["Video", "In person", "Either"],
            type: "radio"
          },
          { label: "Best days", placeholder: "Tuesday evenings", type: "input" }
        ]
      },
      {
        title: "Current goals",
        description: "Name the areas you want to focus on first.",
        fields: [
          {
            label: "Primary goal",
            placeholder: "Sleep better and feel less anxious at night",
            type: "textarea"
          }
        ]
      },
      {
        title: "Check-in style",
        description: "Pick the amount of structure that feels comfortable.",
        fields: [
          {
            label: "Reminders",
            options: ["Gentle", "Structured", "Only before sessions"],
            type: "radio"
          },
          { label: "Anything to avoid?", placeholder: "Optional", type: "input" }
        ]
      },
      {
        title: "Ready to explore",
        description: "You can change this later from profile.",
        fields: [
          {
            label: "What would make Valence useful this week?",
            placeholder: "A simple way to prepare for my next session",
            type: "textarea"
          }
        ]
      }
    ]
  },
  therapist: {
    accent: "#123b8f",
    accentSoft: "#dce8ff",
    audience: "Psychologist",
    carousel: [
      {
        title: "A clean clinical workspace",
        body: "Manage sessions, patient context, and notes without visual noise."
      },
      {
        title: "Patients stay within reach",
        body: "Search your active list and open patient details from a drawer."
      },
      {
        title: "Sessions are easy to review",
        body: "Open details, prepare focus areas, and keep the next step clear."
      },
      {
        title: "Messages remain contextual",
        body: "Use the chat drawer while staying in the current screen."
      }
    ],
    onboarding: [
      {
        title: "Practice profile",
        description: "Set the name and modality shown in the demo.",
        fields: [
          { label: "Display name", placeholder: "Dra. Emma Lin", type: "input" },
          {
            label: "Session format",
            options: ["Virtual", "In person", "Both"],
            type: "radio"
          }
        ]
      },
      {
        title: "Clinical approach",
        description: "Choose what your profile should highlight.",
        fields: [
          {
            label: "Therapy style",
            options: ["CBT", "ACT", "Psychodynamic", "Integrative"],
            type: "radio"
          },
          { label: "Specialty", placeholder: "Anxiety and trauma", type: "input" }
        ]
      },
      {
        title: "Availability",
        description: "Make the schedule feel realistic for the demo.",
        fields: [
          { label: "Clinic hours", placeholder: "Mon to Thu, 10 AM to 6 PM", type: "input" },
          {
            label: "New patients",
            options: ["Accepting", "Waitlist", "Not right now"],
            type: "radio"
          }
        ]
      },
      {
        title: "Patient intake",
        description: "Configure what you want to capture first.",
        fields: [
          {
            label: "Required intake",
            options: ["Goals", "Symptoms", "History", "Consent"],
            type: "radio"
          },
          { label: "Intake note", placeholder: "Ask about sleep and support system", type: "textarea" }
        ]
      },
      {
        title: "Workspace defaults",
        description: "Pick the first thing you want to see after login.",
        fields: [
          {
            label: "Default screen",
            options: ["Home", "Sessions", "Patients"],
            type: "radio"
          }
        ]
      }
    ]
  }
};

function getInitialFlow(): DemoFlowState {
  if (typeof window === "undefined") {
    return {
      carouselIndex: 0,
      onboardingStep: 0,
      role: null,
      stage: "role"
    };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const demoRole = params.get("demoRole");
    const demoStage = params.get("demoStage");
    const hasDemoPreview = demoRole || demoStage;

    if (hasDemoPreview) {
      const role =
        demoRole === "therapist" || demoRole === "patient"
          ? demoRole
          : null;
      const stage =
        demoStage === "carousel" ||
        demoStage === "auth" ||
        demoStage === "onboarding" ||
        demoStage === "app" ||
        demoStage === "role"
          ? demoStage
          : "role";

      return {
        carouselIndex: Math.max(
          0,
          Math.min(3, Number(params.get("demoSlide")) || 0)
        ),
        onboardingStep: Math.max(
          0,
          Math.min(4, Number(params.get("demoStep")) || 0)
        ),
        role,
        stage
      };
    }

    const stored = window.localStorage.getItem(flowStorageKey);

    if (!stored) {
      throw new Error("No stored flow");
    }

    const parsed = JSON.parse(stored) as Partial<DemoFlowState>;

    return {
      carouselIndex: Number(parsed.carouselIndex) || 0,
      onboardingStep: Number(parsed.onboardingStep) || 0,
      role: parsed.role === "patient" || parsed.role === "therapist" ? parsed.role : null,
      stage:
        parsed.stage === "carousel" ||
        parsed.stage === "auth" ||
        parsed.stage === "onboarding" ||
        parsed.stage === "app" ||
        parsed.stage === "role"
          ? parsed.stage
          : "role"
    };
  } catch {
    return {
      carouselIndex: 0,
      onboardingStep: 0,
      role: null,
      stage: "role"
    };
  }
}

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

  if (normalizedPathname.endsWith("/patients")) {
    return "patients";
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

function useDemoFlow() {
  const [flow, setFlow] = useState<DemoFlowState>(getInitialFlow);

  useEffect(() => {
    window.localStorage.setItem(flowStorageKey, JSON.stringify(flow));
  }, [flow]);

  return [flow, setFlow] as const;
}

function bindKeyboardInsetLifecycle(
  setKeyboardInset: Dispatch<SetStateAction<number>>
) {
  const handles: PluginListenerHandle[] = [];
  let isActive = true;

  bindListener(
    Keyboard.addListener("keyboardWillShow", (info) => {
      if (isActive) {
        setKeyboardInset(info.keyboardHeight);
      }
    }),
    handles,
    () => isActive
  );

  bindListener(
    Keyboard.addListener("keyboardWillHide", () => {
      if (isActive) {
        setKeyboardInset(0);
      }
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

function useKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return () => {};
    }

    return bindKeyboardInsetLifecycle(setKeyboardInset);
  }, []);

  return keyboardInset;
}

function roleAccentStyle(role: UserRole | null) {
  const roleKey = role ?? "patient";
  const content = roleContent[roleKey];

  return {
    "--role-accent": content.accent,
    "--role-accent-soft": content.accentSoft
  } as CSSProperties;
}

function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("valence-logo text-2xl", className)}>
      <span className="valence-loop" aria-hidden="true" />
      valence
      <span className="valence-spark ml-1.5 size-3" />
    </span>
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
    <Badge className={cn("font-semibold", className)} variant="secondary">
      Installed {versions.installedVersion} · Release {versions.releaseVersion}
    </Badge>
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
    <span className="grid size-7 place-items-center rounded-md border bg-background text-xs font-bold">
      {Icon ? <Icon /> : label}
    </span>
  );
}

function AppScreen({
  children,
  role
}: {
  children: ReactNode;
  role: UserRole | null;
}) {
  return (
    <main
      className="valence-app-shell min-h-dvh bg-background text-foreground"
      style={roleAccentStyle(role)}
    >
      <div className="valence-screen-transition mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        {children}
      </div>
    </main>
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
      <DrawerContent className="mx-auto max-w-xl">
        <DrawerHeader className="text-left">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <CloudDownload />
            </span>
            <div className="min-w-0 flex-1">
              <DrawerTitle>Update ready</DrawerTitle>
              <DrawerDescription className="mt-1">
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
            <Button onClick={onApplyNextLaunch} type="button" variant="outline">
              Next app launch
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function RoleChoiceScreen({
  onChoose,
  versions
}: {
  onChoose: (role: UserRole) => void;
  versions: VersionState;
}) {
  return (
    <AppScreen role={null}>
      <div className="flex items-center justify-between">
        <BrandLogo />
        <VersionBadge versions={versions} />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div>
          <Badge variant="outline">Start here</Badge>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            How will you use Valence?
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Choose a role to tailor the accent color, onboarding, navigation,
            and demo screens.
          </p>
        </div>
        <div className="grid gap-3">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <HeartPulse className="text-[var(--patient-accent)]" />
                Patient
              </CardTitle>
              <CardDescription>
                Purple accent, exercises, sessions, and profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => onChoose("patient")}>
                Continue as patient
              </Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Stethoscope className="text-[var(--therapist-accent)]" />
                Psychologist
              </CardTitle>
              <CardDescription>
                Blue accent, patient list, session prep, and profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => onChoose("therapist")}
                variant="outline"
              >
                Continue as psychologist
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppScreen>
  );
}

function CarouselScreen({
  flow,
  onBack,
  onNext
}: {
  flow: DemoFlowState;
  onBack: () => void;
  onNext: () => void;
}) {
  const role = flow.role ?? "patient";

  return (
    <AppScreen role={role}>
      {role === "therapist" ? (
        <TherapistWelcomeCarousel
          brand={<BrandLogo />}
          index={flow.carouselIndex}
          onBack={onBack}
          onNext={onNext}
        />
      ) : (
        <PatientWelcomeCarousel
          brand={<BrandLogo />}
          index={flow.carouselIndex}
          onBack={onBack}
          onNext={onNext}
        />
      )}
    </AppScreen>
  );
}

function AuthScreen({
  error,
  email,
  isSubmitting,
  onBack,
  onContinueDemo,
  onEmailChange,
  onProvider,
  onSubmit,
  role,
  status
}: {
  email: string;
  error: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onContinueDemo: () => void;
  onEmailChange: (email: string) => void;
  onProvider: (provider: Provider) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  role: UserRole;
  status: string | null;
}) {
  return (
    <AppScreen role={role}>
      <div className="flex items-center justify-between">
        <Button onClick={onBack} size="icon" type="button" variant="ghost">
          <ArrowLeft />
        </Button>
        <BrandLogo />
        <Badge variant="secondary">{roleContent[role].audience}</Badge>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div>
          <Badge variant="outline">Sign in</Badge>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Enter Valence securely
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Google, Apple, and email are wired to Supabase. The demo button lets
            you move through the prototype without backend data.
          </p>
        </div>
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoComplete="email"
                className="h-12 pl-10"
                id="member-email"
                name="email"
                onChange={(event) => onEmailChange(event.currentTarget.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </div>
          </div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending code" : "Send magic link or OTP"}
          </Button>
        </form>
        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-muted-foreground">
            <Separator />
            <span className="text-sm">or</span>
            <Separator />
          </div>
          <Button onClick={() => onProvider("google")} type="button" variant="outline">
            <ProviderMark label="G" />
            Continue with Google
          </Button>
          <Button onClick={() => onProvider("apple")} type="button" variant="outline">
            <ProviderMark icon={Apple} label="A" />
            Continue with Apple
          </Button>
          <Button onClick={onContinueDemo} type="button" variant="secondary">
            Continue demo without login
          </Button>
        </div>
        {status ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {status}
            </CardContent>
          </Card>
        ) : null}
        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="p-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppScreen>
  );
}

function OnboardingScreen({
  flow,
  onBack,
  onNext,
  onSkipToApp
}: {
  flow: DemoFlowState;
  onBack: () => void;
  onNext: () => void;
  onSkipToApp: () => void;
}) {
  const role = flow.role ?? "patient";

  return (
    <AppScreen role={role}>
      {role === "therapist" ? (
        <TherapistOnboardingScreen
          brand={<BrandLogo />}
          onBack={onBack}
          onNext={onNext}
          onSkipToApp={onSkipToApp}
          stepIndex={flow.onboardingStep}
        />
      ) : (
        <PatientOnboardingScreen
          brand={<BrandLogo />}
          onBack={onBack}
          onNext={onNext}
          onSkipToApp={onSkipToApp}
          stepIndex={flow.onboardingStep}
        />
      )}
    </AppScreen>
  );
}

function SplashScreen({ versions }: { versions: VersionState }) {
  return (
    <AppScreen role={null}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary">
          <Sparkles className="size-10" />
        </div>
        <BrandLogo className="text-4xl" />
        <p className="max-w-64 text-sm leading-6 text-muted-foreground">
          Preparing your Valence workspace.
        </p>
        <VersionBadge versions={versions} />
      </div>
    </AppScreen>
  );
}

function ChatDrawer({
  keyboardInset,
  messages,
  onOpenChange,
  onSend,
  open,
  role
}: {
  keyboardInset: number;
  messages: ChatMessage[];
  onOpenChange: (open: boolean) => void;
  onSend: (body: string) => void;
  open: boolean;
  role: UserRole;
}) {
  const [draft, setDraft] = useState("");

  function sendMessage() {
    const body = draft.trim();

    if (!body) {
      return;
    }

    onSend(body);
    setDraft("");
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open} shouldScaleBackground={false}>
      <DrawerContent
        className="mx-auto flex h-[86dvh] max-w-md flex-col rounded-t-[1.75rem] transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(-${keyboardInset}px)`
        }}
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>Messages</DrawerTitle>
          <DrawerDescription>
            Local chat demo for the {roleContent[role].audience.toLowerCase()} experience.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-3 pb-4">
            {messages.map((message) => (
              <Card
                className={cn(
                  "max-w-[82%]",
                  message.mine
                    ? "ml-auto border-primary bg-primary text-primary-foreground"
                    : "bg-card"
                )}
                key={message.id}
              >
                <CardContent className="p-3 text-sm leading-6">
                  {message.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <DrawerFooter className="border-t border-border/40">
          <div className="flex gap-2">
            <Input
              className="h-11"
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Write a message"
              value={draft}
            />
            <Button onClick={sendMessage} size="icon" type="button">
              <Send />
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SessionDetailDrawer({
  onJoin,
  onOpenChange,
  open,
  session
}: {
  onJoin: (session: DemoSession) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  session: DemoSession | null;
}) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>{session?.person ?? "Session"}</DrawerTitle>
          <DrawerDescription>
            {session?.date} at {session?.time}, {session?.mode}
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-3 px-4 pb-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session details</CardTitle>
              <CardDescription>{session?.notes}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>{session?.status}</Badge>
              <Badge variant="secondary">{session?.mode}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demo actions</CardTitle>
              <CardDescription>
                These buttons are local only, but they show how the session flow
                will feel.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                disabled={!session}
                onClick={() => {
                  if (session) {
                    onJoin(session);
                  }
                }}
                type="button"
              >
                Join
              </Button>
              <Button type="button" variant="outline">
                Reschedule
              </Button>
            </CardContent>
          </Card>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function PatientDetailDrawer({
  onOpenChange,
  open,
  patient
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  patient: DemoPatient | null;
}) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>{patient?.name ?? "Patient"}</DrawerTitle>
          <DrawerDescription>{patient?.focus}</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-3 px-4 pb-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient snapshot</CardTitle>
              <CardDescription>
                Last seen {patient?.lastSeen}. Current risk is {patient?.risk}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Progress value={patient?.progress ?? 0} />
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <Badge variant="secondary">Progress {patient?.progress}%</Badge>
                <Badge variant="outline">Risk {patient?.risk}</Badge>
                <Badge variant="outline">{patient?.lastSeen}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next note</CardTitle>
              <CardDescription>
                Review session goals and ask what changed since the last check-in.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button">Close details</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DailyCallScreen({
  onClose,
  session
}: {
  onClose: () => void;
  session: DemoSession | null;
}) {
  const dailyRoomUrl = process.env.NEXT_PUBLIC_DAILY_ROOM_URL;

  if (!session) {
    return null;
  }

  return (
    <div className="valence-call-screen fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/30 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <Button
          aria-label="Close call"
          onClick={onClose}
          size="icon"
          type="button"
          variant="outline"
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate font-semibold">{session.person}</p>
          <p className="text-xs text-muted-foreground">
            Daily.co room, {session.mode}
          </p>
        </div>
        <Badge variant="secondary">{session.status}</Badge>
      </header>
      <div className="min-h-0 flex-1 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {dailyRoomUrl ? (
          <iframe
            allow="camera; microphone; fullscreen; display-capture"
            className="size-full rounded-[1.5rem] border border-border bg-card"
            src={dailyRoomUrl}
            title={`Daily.co call with ${session.person}`}
          />
        ) : (
          <div className="grid size-full place-items-center rounded-[1.5rem] border border-border bg-card p-6 text-center">
            <div className="max-w-xs">
              <Badge variant="secondary">Daily.co preview</Badge>
              <h2 className="mt-4 text-2xl font-semibold">
                Video room ready
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your secure session space will appear here when the room is
                assigned.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceShell({
  activePage,
  children,
  onNavigate,
  onOpenMessages,
  onReset,
  role
}: {
  activePage: PageKey;
  children: ReactNode;
  onNavigate: (page: PageKey) => void;
  onOpenMessages: () => void;
  onReset: () => void;
  role: UserRole;
}) {
  const navItems = role === "therapist" ? therapistNavItems : patientNavItems;
  const activeNavIndex = Math.max(
    0,
    navItems.findIndex((item) => item.page === activePage)
  );

  return (
    <div
      className="valence-app-shell min-h-dvh bg-background text-foreground"
      style={roleAccentStyle(role)}
    >
      <header className="fixed left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)] top-0 z-30 border-b border-border/30 bg-background/88 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.8rem)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{roleContent[role].audience}</Badge>
            <Button
              aria-label="Open messages"
              onClick={onOpenMessages}
              size="icon"
              type="button"
              variant="outline"
            >
              <MessageCircle />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))]">
        <div className="valence-screen-transition">{children}</div>
      </main>
      <nav className="fixed bottom-[calc(0.65rem+env(safe-area-inset-bottom))] left-[calc(0.75rem+env(safe-area-inset-left))] right-[calc(0.75rem+env(safe-area-inset-right))] z-30">
        <div className="relative mx-auto grid max-w-md grid-cols-4 rounded-2xl border border-border bg-card/95 p-1.5 backdrop-blur-xl">
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 left-1.5 top-1.5 z-0 rounded-xl bg-primary/12 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${activeNavIndex * 100}%)`,
              width: "calc((100% - 0.75rem) / 4)"
            }}
          />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.page === activePage;

            return (
              <Button
                className={cn(
                  "relative z-10 h-14 flex-col gap-1 rounded-xl text-[0.66rem]",
                  isActive && "text-primary"
                )}
                key={item.page}
                onClick={() => onNavigate(item.page)}
                type="button"
                variant="ghost"
              >
                <Icon />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
      <button
        className="sr-only"
        onClick={onReset}
        type="button"
      >
        Reset demo
      </button>
    </div>
  );
}

function ActivePage({
  onEnablePushNotifications,
  onReset,
  onSelectPatient,
  onSelectSession,
  onSignOut,
  page,
  pushRegistration,
  role,
  versions
}: {
  onEnablePushNotifications: () => void;
  onReset: () => void;
  onSelectPatient: (patient: DemoPatient) => void;
  onSelectSession: (session: DemoSession) => void;
  onSignOut: () => void;
  page: PageKey;
  pushRegistration: PushRegistrationState;
  role: UserRole;
  versions: VersionState;
}) {
  if (role === "patient") {
    if (page === "sessions") {
      return <PatientSessionsScreen onSelectSession={onSelectSession} />;
    }

    if (page === "exercises") {
      return <PatientExercisesScreen />;
    }

    if (page === "profile") {
      return (
        <PatientProfileScreen
          onEnablePushNotifications={onEnablePushNotifications}
          onReset={onReset}
          onSignOut={onSignOut}
          pushRegistration={pushRegistration}
          versions={versions}
        />
      );
    }

    return <PatientHomeScreen />;
  }

  if (page === "sessions") {
    return <TherapistSessionsScreen onSelectSession={onSelectSession} />;
  }

  if (page === "patients") {
    return <TherapistPatientsScreen onSelectPatient={onSelectPatient} />;
  }

  if (page === "profile") {
    return (
      <TherapistProfileScreen
        onEnablePushNotifications={onEnablePushNotifications}
        onReset={onReset}
        onSignOut={onSignOut}
        pushRegistration={pushRegistration}
        versions={versions}
      />
    );
  }

  return <TherapistHomeScreen />;
}

export function AppAuthExperience({ page = "home" }: { page?: PageKey }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const versions = useAppVersions();
  const keyboardInset = useKeyboardInset();
  const activePage = useActivePage(page);
  const [flow, setFlow] = useDemoFlow();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<DemoSession | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<DemoPatient | null>(null);
  const [callSession, setCallSession] = useState<DemoSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      body: "Hi, this is the local message drawer. Send anything to test the interaction.",
      id: "seed",
      mine: false
    }
  ]);
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
  const role = flow.role ?? "patient";

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const drawer = params.get("demoDrawer");

    if (drawer === "chat") {
      setMessagesOpen(true);
    }

    if (drawer === "session") {
      setSelectedSession(
        role === "therapist"
          ? previewTherapistSessions[0] ?? null
          : previewPatientSessions[0] ?? null
      );
    }

    if (drawer === "call") {
      setCallSession(
        role === "therapist"
          ? previewTherapistSessions[0] ?? null
          : previewPatientSessions[0] ?? null
      );
    }

    if (drawer === "patient") {
      setSelectedPatient(previewPatients[0] ?? null);
    }
  }, [role]);

  useEffect(() => {
    if (authState.user && flow.stage === "auth") {
      setFlow((current) => ({
        ...current,
        onboardingStep: 0,
        stage: "onboarding"
      }));
    }
  }, [authState.user, flow.stage, setFlow]);

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
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
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

      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
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

        void Browser.close().catch(() => {});

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
      await Browser.open({
        presentationStyle: "fullscreen",
        url: data.url
      });
    }
  }

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

  async function signOut() {
    await supabase?.auth.signOut();
    dispatchAuth({ type: "user-changed", user: null });
    setStatus("Signed out.");
    setError(null);
    setMessagesOpen(false);
    setSelectedPatient(null);
    setSelectedSession(null);
    setFlow((current) => ({
      ...current,
      carouselIndex: 0,
      onboardingStep: 0,
      stage: "auth"
    }));
    navigateWithinApp("home");
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

  function navigateWithinApp(nextPage: PageKey) {
    if (typeof window === "undefined") {
      return;
    }

    const href = getPageHref(nextPage);

    if (window.location.pathname !== href) {
      window.history.pushState({ page: nextPage }, "", href);
    }

    window.dispatchEvent(new Event("valence:navigation"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDemoFlow() {
    window.localStorage.removeItem(flowStorageKey);
    setFlow({
      carouselIndex: 0,
      onboardingStep: 0,
      role: null,
      stage: "role"
    });
    navigateWithinApp("home");
  }

  function sendChatMessage(body: string) {
    const userMessage: ChatMessage = {
      body,
      id: `user-${Date.now()}`,
      mine: true
    };

    setChatMessages((current) => [...current, userMessage]);

    window.setTimeout(() => {
      setChatMessages((current) => [
        ...current,
        {
          body: "This is not connected to backend, but this is how messages look.",
          id: `reply-${Date.now()}`,
          mine: false
        }
      ]);
    }, 450);
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

  if (!flow.role || flow.stage === "role") {
    return (
      <>
        <RoleChoiceScreen
          onChoose={(nextRole) =>
            setFlow({
              carouselIndex: 0,
              onboardingStep: 0,
              role: nextRole,
              stage: "carousel"
            })
          }
          versions={versions}
        />
        {updateDrawer}
      </>
    );
  }

  if (flow.stage === "carousel") {
    return (
      <>
        <CarouselScreen
          flow={flow}
          onBack={() =>
            setFlow((current) => ({
              ...current,
              carouselIndex: Math.max(0, current.carouselIndex - 1),
              stage: current.carouselIndex === 0 ? "role" : "carousel"
            }))
          }
          onNext={() =>
            setFlow((current) => {
              const slideCount = roleContent[role].carousel.length;

              if (current.carouselIndex >= slideCount - 1) {
                return { ...current, carouselIndex: 0, stage: "auth" };
              }

              return {
                ...current,
                carouselIndex: current.carouselIndex + 1
              };
            })
          }
        />
        {updateDrawer}
      </>
    );
  }

  if (flow.stage === "auth") {
    return (
      <>
        <AuthScreen
          email={email}
          error={error}
          isSubmitting={isSubmitting}
          onBack={() =>
            setFlow((current) => ({
              ...current,
              carouselIndex: roleContent[role].carousel.length - 1,
              stage: "carousel"
            }))
          }
          onContinueDemo={() =>
            setFlow((current) => ({
              ...current,
              onboardingStep: 0,
              stage: "onboarding"
            }))
          }
          onEmailChange={setEmail}
          onProvider={(provider) => void continueWithProvider(provider)}
          onSubmit={(event) => void requestEmailAccess(event)}
          role={role}
          status={status}
        />
        {updateDrawer}
      </>
    );
  }

  if (flow.stage === "onboarding") {
    return (
      <>
        <OnboardingScreen
          flow={flow}
          onBack={() =>
            setFlow((current) => ({
              ...current,
              onboardingStep: Math.max(0, current.onboardingStep - 1),
              stage: current.onboardingStep === 0 ? "auth" : "onboarding"
            }))
          }
          onNext={() =>
            setFlow((current) => {
              const stepCount = roleContent[role].onboarding.length;

              if (current.onboardingStep >= stepCount - 1) {
                return { ...current, onboardingStep: 0, stage: "app" };
              }

              return {
                ...current,
                onboardingStep: current.onboardingStep + 1
              };
            })
          }
          onSkipToApp={() =>
            setFlow((current) => ({
              ...current,
              onboardingStep: 0,
              stage: "app"
            }))
          }
        />
        {updateDrawer}
      </>
    );
  }

  return (
    <>
      <WorkspaceShell
        activePage={activePage}
        onNavigate={navigateWithinApp}
        onOpenMessages={() => setMessagesOpen(true)}
        onReset={resetDemoFlow}
        role={role}
      >
        <ActivePage
          onEnablePushNotifications={() => void enablePushNotifications()}
          onReset={resetDemoFlow}
          onSelectPatient={(patient) => setSelectedPatient(patient)}
          onSelectSession={(session) => setSelectedSession(session)}
          onSignOut={() => void signOut()}
          page={activePage}
          pushRegistration={pushRegistration}
          role={role}
          versions={versions}
        />
      </WorkspaceShell>
      <ChatDrawer
        keyboardInset={keyboardInset}
        messages={chatMessages}
        onOpenChange={setMessagesOpen}
        onSend={sendChatMessage}
        open={messagesOpen}
        role={role}
      />
      <SessionDetailDrawer
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSession(null);
          }
        }}
        open={Boolean(selectedSession)}
        onJoin={(session) => {
          setSelectedSession(null);
          setCallSession(session);
        }}
        session={selectedSession}
      />
      <PatientDetailDrawer
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPatient(null);
          }
        }}
        open={Boolean(selectedPatient)}
        patient={selectedPatient}
      />
      <DailyCallScreen
        onClose={() => setCallSession(null)}
        session={callSession}
      />
      {updateDrawer}
    </>
  );
}
