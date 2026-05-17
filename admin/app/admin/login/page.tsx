import { AdminLoginScreen } from "@/components/admin-login-screen";
import { getSupabaseConfig } from "@/lib/env";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const { isConfigured } = getSupabaseConfig();

  return (
    <AdminLoginScreen
      errorKey={params.error}
      isConfigured={isConfigured}
      sent={params.sent}
      showBackLink
    />
  );
}
