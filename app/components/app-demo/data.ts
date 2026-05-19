import {
  BookOpen,
  CalendarDays,
  HeartPulse,
  Home,
  MessageCircle,
  Stethoscope,
  UserRound,
  UsersRound
} from "lucide-react";

import type {
  DemoPatient,
  DemoProvider,
  DemoSession,
  PageItem,
  PageKey,
  UserRole
} from "./types";

const appRouteBasePath = "/app";

export const pageItems: Record<PageKey, PageItem> = {
  home: {
    description: "Your starting point",
    href: `${appRouteBasePath}/`,
    icon: Home,
    label: "Home",
    page: "home"
  },
  sessions: {
    description: "Upcoming care sessions",
    href: `${appRouteBasePath}/sessions/`,
    icon: CalendarDays,
    label: "Sessions",
    page: "sessions"
  },
  exercises: {
    description: "Practice between sessions",
    href: `${appRouteBasePath}/exercises/`,
    icon: BookOpen,
    label: "Exercises",
    page: "exercises"
  },
  patients: {
    description: "Client list and notes",
    href: `${appRouteBasePath}/patients/`,
    icon: UsersRound,
    label: "Patients",
    page: "patients"
  },
  messages: {
    description: "Care team messages",
    href: `${appRouteBasePath}/messages/`,
    icon: MessageCircle,
    label: "Messages",
    page: "messages"
  },
  profile: {
    description: "Profile and settings",
    href: `${appRouteBasePath}/profile/`,
    icon: UserRound,
    label: "Profile",
    page: "profile"
  }
};

export const patientNavItems = [
  pageItems.home,
  pageItems.sessions,
  pageItems.exercises,
  pageItems.profile
];

export const therapistNavItems = [
  pageItems.home,
  pageItems.sessions,
  pageItems.patients,
  pageItems.profile
];

export const roleTheme: Record<
  UserRole,
  {
    accent: string;
    accentSoft: string;
    audience: string;
    icon: typeof HeartPulse;
  }
> = {
  patient: {
    accent: "#8bcf52",
    accentSoft: "#e5f6cf",
    audience: "Patient",
    icon: HeartPulse
  },
  therapist: {
    accent: "#123b8f",
    accentSoft: "#dce8ff",
    audience: "Psychologist",
    icon: Stethoscope
  }
};

export const patientSessions: DemoSession[] = [
  {
    date: "Today",
    id: "session-1",
    mode: "Video",
    notes: "Review sleep log and set one small practice for the week.",
    person: "Dr. Emma Lin",
    status: "Confirmed",
    time: "5:30 PM"
  },
  {
    date: "Thursday",
    id: "session-2",
    mode: "In person",
    notes: "Prepare questions around work stress and recovery routines.",
    person: "Dr. Rafael Torres",
    status: "Needs confirmation",
    time: "10:00 AM"
  },
  {
    date: "May 28",
    id: "session-3",
    mode: "Video",
    notes: "Follow up on grounding exercise and relationship goals.",
    person: "Dr. Emma Lin",
    status: "Confirmed",
    time: "2:15 PM"
  }
];

export const therapistSessions: DemoSession[] = [
  {
    date: "Today",
    id: "clinical-1",
    mode: "Video",
    notes: "Sofia wants to discuss sleep and work conflict.",
    person: "Sofia Martinez",
    status: "Confirmed",
    time: "4:00 PM"
  },
  {
    date: "Today",
    id: "clinical-2",
    mode: "In person",
    notes: "Mateo completed intake and has one open consent item.",
    person: "Mateo Ruiz",
    status: "Intake",
    time: "6:30 PM"
  },
  {
    date: "Tomorrow",
    id: "clinical-3",
    mode: "Video",
    notes: "Ana shared a new journal entry about relationship boundaries.",
    person: "Ana Beltran",
    status: "Confirmed",
    time: "11:00 AM"
  }
];

export const demoPatients: DemoPatient[] = [
  {
    focus: "Sleep, anxiety, work stress",
    id: "patient-1",
    lastSeen: "Today",
    name: "Sofia Martinez",
    progress: 72,
    risk: "Low"
  },
  {
    focus: "Intake, family context",
    id: "patient-2",
    lastSeen: "Yesterday",
    name: "Mateo Ruiz",
    progress: 41,
    risk: "Medium"
  },
  {
    focus: "Relationships, boundaries",
    id: "patient-3",
    lastSeen: "May 16",
    name: "Ana Beltran",
    progress: 63,
    risk: "Low"
  },
  {
    focus: "Panic symptoms, exposure",
    id: "patient-4",
    lastSeen: "May 14",
    name: "Diego Herrera",
    progress: 56,
    risk: "Medium"
  }
];

export const demoProviders: DemoProvider[] = [
  {
    bio: "Clinical psychologist focused on practical, compassionate therapy.",
    id: "30000000-0000-4000-8000-000000000011",
    modalities: ["Video", "In person"],
    name: "Dr. Maya Chen",
    requestStatus: "accepted",
    specialties: ["Anxiety", "Sleep", "Work stress"]
  },
  {
    bio: "Therapist focused on reflective care and clear next steps.",
    id: "30000000-0000-4000-8000-000000000012",
    modalities: ["Video"],
    name: "Dr. Lucia Ramos",
    requestStatus: "pending",
    specialties: ["Relationships", "Mood", "Transitions"]
  }
];
