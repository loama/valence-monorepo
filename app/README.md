# Valence App

Next.js, Capacitor, and shadcn workspace for the authenticated Valence product.

The web deployment is routed at `/app`. For a production iOS mobile export,
run:

```bash
bun run --cwd app cap:sync:ios
```

`build:mobile` intentionally uses the production Supabase project and
`https://valencedev.com/app` as the native redirect URL. Local web development
continues to use `app/.env.local`.

Supabase Auth URL configuration for the production project should allow:

- Site URL: `https://valencedev.com/app`
- Redirect URL: `https://valencedev.com/app`
- Redirect URL: `https://valencedev.com/app/**`
- Redirect URL: `valence://**`
- Redirect URL: `com.valencedev.platform://**`
