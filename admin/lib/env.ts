export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    publishableKey,
    isConfigured: Boolean(url && publishableKey)
  };
}

export function getAdminEmailAllowlist() {
  return (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .flatMap((email) => {
      const normalizedEmail = email.trim().toLowerCase();

      return normalizedEmail ? [normalizedEmail] : [];
    });
}

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const allowlist = getAdminEmailAllowlist();

  if (allowlist.length === 0) {
    return false;
  }

  return allowlist.includes(email.toLowerCase());
}
