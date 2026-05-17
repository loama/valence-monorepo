import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  const { url, publishableKey, isConfigured } = getSupabaseBrowserConfig();

  if (!isConfigured || !url || !publishableKey) {
    return null;
  }

  browserClient ??= createClient(url, publishableKey, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true
    }
  });

  return browserClient;
}
