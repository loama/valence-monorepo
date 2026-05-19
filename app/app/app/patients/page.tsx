import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Patients | Valence App",
  description: "Patient search and detail workspace for Valence therapists"
};

export default function PatientsPage() {
  return <AppAuthExperience page="patients" />;
}
