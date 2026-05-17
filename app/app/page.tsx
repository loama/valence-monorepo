import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Valence App",
  description: "The Valence member workspace"
};

export default function MobileAppPage() {
  return <AppAuthExperience />;
}
