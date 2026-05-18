import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Coach | Valence App",
  description: "Clinical coach guidance and session preparation"
};

export default function SessionsPage() {
  return <AppAuthExperience page="sessions" />;
}
