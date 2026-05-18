import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Actividad | Valence App",
  description: "Patient activity timeline and therapist app details"
};

export default function ProfilePage() {
  return <AppAuthExperience page="profile" />;
}
