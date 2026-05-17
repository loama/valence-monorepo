import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Profile | Valence App",
  description: "Profile and app version details for Valence members"
};

export default function ProfilePage() {
  return <AppAuthExperience page="profile" />;
}
