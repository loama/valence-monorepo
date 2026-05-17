import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const adminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";
const supportedProviders = new Set<Provider>(["google"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const provider = String(formData.get("provider") ?? "") as Provider;

  if (!supportedProviders.has(provider)) {
    redirect(`${adminBasePath}/login?error=missing-provider`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`${adminBasePath}/login?error=missing-config`);
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3002";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo:
        `${origin}${adminBasePath}/auth/callback?next=` +
        encodeURIComponent(adminBasePath),
      queryParams:
        provider === "google" ? { prompt: "select_account" } : undefined
    }
  });

  if (error || !data.url) {
    redirect(`${adminBasePath}/login?error=auth`);
  }

  redirect(data.url);
}
