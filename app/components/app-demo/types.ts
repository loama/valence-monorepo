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
  endsAt?: string;
  id: string;
  mode: string;
  notes: string;
  patientId?: string;
  person: string;
  providerId?: string;
  rawStatus?: "cancelled" | "completed" | "confirmed" | "requested";
  startsAt?: string;
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

export type DemoProvider = {
  bio: string;
  id: string;
  modalities: string[];
  name: string;
  requestStatus?: "accepted" | "declined" | "pending";
  specialties: string[];
};

export type DemoConnectionRequest = {
  id: string;
  message: string | null;
  patientId: string;
  patientName: string;
  providerId: string;
  status: "accepted" | "cancelled" | "declined" | "pending";
};
