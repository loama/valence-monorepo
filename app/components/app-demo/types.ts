import type { LucideIcon } from "lucide-react";

export type UserRole = "patient" | "therapist";

export type PageKey =
  | "home"
  | "sessions"
  | "exercises"
  | "patients"
  | "messages"
  | "profile";

export type VersionState = {
  installedVersion: string;
  releaseVersion: string;
};

export type PushRegistrationState = {
  error: string | null;
  status: "idle" | "unsupported" | "prompt" | "registered" | "denied" | "error";
  token: string | null;
};

export type PageItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  page: PageKey;
};

export type DemoSession = {
  date: string;
  id: string;
  mode: string;
  notes: string;
  person: string;
  status: string;
  time: string;
};

export type DemoPatient = {
  focus: string;
  id: string;
  lastSeen: string;
  name: string;
  progress: number;
  risk: string;
};
