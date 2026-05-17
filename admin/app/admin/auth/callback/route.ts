import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const adminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? adminBasePath;

  if (!code) {
    redirect(`${adminBasePath}/login?error=auth`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`${adminBasePath}/login?error=missing-config`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`${adminBasePath}/login?error=auth`);
  }

  redirect(next.startsWith(adminBasePath) ? next : adminBasePath);
}
