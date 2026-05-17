# Valence App

Next.js, Capacitor, and shadcn workspace for the authenticated Valence product.

The web deployment is routed at `/app`. For a production iOS mobile export,
run:

```bash
bun run --cwd app cap:sync:ios
```

`build:mobile` intentionally uses the production Supabase project and
`valence://auth/callback` as the native redirect URL. Local web development
continues to use `app/.env.local`.

## Release Versions

Capgo live updates use `app/release-version.json` as the source of truth.
The current release is displayed in the app as a plain integer, for example
`103`. The GitHub Action uploads the same release to Capgo as semver
`103.0.0`, because Capgo requires semver-compatible bundle names.

Before publishing a new mobile live update, bump the release by one:

```bash
bun run --cwd app release:bump
```

Supabase Auth URL configuration for the production project should allow:

- Site URL: `https://valencedev.com/app`
- Redirect URL: `https://valencedev.com/app`
- Redirect URL: `https://valencedev.com/app/**`
- Redirect URL: `valence://auth/callback`
- Redirect URL: `valence://**`
- Redirect URL: `com.valencedev.platform://**`
