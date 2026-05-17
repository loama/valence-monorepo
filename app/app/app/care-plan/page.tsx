import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Care Plan | Valence App",
  description: "Care goals and session prep for Valence members"
};

export default function CarePlanPage() {
  return <AppAuthExperience page="care-plan" />;
}
