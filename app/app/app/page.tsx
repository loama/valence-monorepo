import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Valence App",
  description: "The authenticated care workspace for Valence members"
};

export default function AppHome() {
  return <AppAuthExperience page="today" />;
}
