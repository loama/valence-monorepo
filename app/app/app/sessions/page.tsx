import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Sessions | Valence App",
  description: "Appointments and care sessions for Valence members"
};

export default function SessionsPage() {
  return <AppAuthExperience page="sessions" />;
}
