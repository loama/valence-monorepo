import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Coach Messages | Valence App",
  description: "Clinical coach prompts and patient context"
};

export default function MessagesPage() {
  return <AppAuthExperience page="messages" />;
}
