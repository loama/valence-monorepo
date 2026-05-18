import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Valence App",
  description: "The therapist platform workspace for Valence clinicians"
};

export default function AppHome() {
  return <AppAuthExperience page="home" />;
}
