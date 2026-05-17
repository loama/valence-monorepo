import type { Metadata } from "next";

import { AppAuthExperience } from "@/components/app-auth-experience";

export const metadata: Metadata = {
  title: "Messages | Valence App",
  description: "Private care team messages for Valence members"
};

export default function MessagesPage() {
  return <AppAuthExperience page="messages" />;
}
