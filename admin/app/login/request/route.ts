import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { isAllowedAdminEmail } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const adminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect(`${adminBasePath}/login?error=missing-email`);
  }

  if (!isAllowedAdminEmail(email)) {
    redirect(`${adminBasePath}/login?error=not-allowed`);
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

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        `${origin}${adminBasePath}/auth/callback?next=` +
        encodeURIComponent(adminBasePath)
    }
  });

  if (error) {
    redirect(`${adminBasePath}/login?error=auth`);
  }

  redirect(`${adminBasePath}/login?sent=1`);
}
