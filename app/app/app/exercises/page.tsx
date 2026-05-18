import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Seguimiento | Valence App",
  description: "Clinical snapshots and patient follow-up for Valence therapists"
};

export default function ExercisesPage() {
  return <AppAuthExperience page="exercises" />;
}
