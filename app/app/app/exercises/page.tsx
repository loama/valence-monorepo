import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Exercises | Valence App",
  description: "Guided care exercises for Valence members"
};

export default function ExercisesPage() {
  return <AppAuthExperience page="exercises" />;
}
