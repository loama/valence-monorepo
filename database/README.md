# Valence Database

Supabase and Drizzle workspace for Valence schema, migrations, and local
database configuration.

## Source Of Truth

- `src/schema.ts`: Drizzle TypeScript schema.
- `drizzle`: Drizzle migration state and generated SQL.
- `supabase/migrations`: Supabase-compatible SQL migrations mirrored from
  Drizzle.
- `supabase/config.toml`: Supabase CLI configuration for local development and
  branch deployments.
- `supabase/seed.sql`: safe local seed data for development branches.

## Environment

Create `database/.env` with the connection string for the environment you are
targeting:

```bash
DATABASE_URL="postgresql://postgres:<password>@<host>:5432/postgres"
```

For Valence, local development should target the persistent Supabase
`development` branch once it exists. The local Docker stack is still useful for
isolated migration work, but the default team workflow is to use the remote
development branch so app, admin, API, and database behavior match the
development deployment.

Never commit service role keys, secret keys, database passwords, or connection
strings.

## Local Workflow

```bash
bun install
bun run supabase:start
bun run db:generate -- --name init
bun run db:migrate
bun run db:types
```

Edit `src/schema.ts`, run `bun run db:generate -- --name <change-name>`, review
the generated SQL, then migrate locally before committing.

Custom Supabase-only changes, such as RLS policies or storage setup, should be
added as hand-written SQL files in `supabase/migrations`. The initial schema
enables RLS on public tables and leaves access denied until product-specific
policies are added.

## Branching Workflow

Production project ref:

```text
iqkwqjgvtzknyoldnrzj
```

1. Connect this GitHub repository in Supabase Branching.
2. Set the Supabase working directory to `database`.
3. Keep production connected to `main`.
4. Create a persistent Supabase branch named `development`:

   ```bash
   supabase branches create development \
     --persistent \
     --project-ref iqkwqjgvtzknyoldnrzj
   ```

5. List branches and copy the branch project ref:

   ```bash
   supabase branches list --project-ref iqkwqjgvtzknyoldnrzj
   ```

6. Add that ref to `supabase/config.toml` under `[remotes.development]`.
7. Configure GitHub secrets for the database workflow.
8. Keep Vercel environment variables branch-specific:
   - Production Vercel env vars point at the production Supabase project.
   - Preview/development Vercel env vars point at the Supabase `development`
     branch credentials.

Supabase branches are isolated environments with their own database, API URL,
and API keys. Production changes should land through reviewed migrations in
Git, not ad hoc dashboard edits.

## GitHub Actions Migrations

`.github/workflows/supabase.yml` validates the database workspace and pushes
SQL migrations on pushes to `development` and `main`.

Required GitHub repository secrets:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PRODUCTION_DB_URL
SUPABASE_DEVELOPMENT_DB_URL
SUPABASE_DEVELOPMENT_PROJECT_REF
```

`SUPABASE_PRODUCTION_DB_URL` and `SUPABASE_DEVELOPMENT_DB_URL` must be Postgres
connection strings. Supabase publishable keys and secret API keys are not enough
to run SQL migrations.

The production project ref is committed because it is not a credential. The
development project ref is stored as a secret because it does not exist until
the persistent branch is created.

The GitHub Actions workflow intentionally does not run `supabase config push`.
For auth and service configuration, prefer Supabase Git-based Branching with
the `[remotes]` blocks in `supabase/config.toml`. That avoids accidentally
pushing local-only settings, such as localhost redirect URLs, into production.

## Vercel Environment Variables

Set these on the Vercel project for the relevant environments:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
ADMIN_EMAIL_ALLOWLIST
```

Use production Supabase values for Vercel Production and development branch
values for Vercel Preview/Development. `SUPABASE_SECRET_KEY` must only be used
server-side. Do not expose it through `NEXT_PUBLIC_`.

## Auth Configuration As Code

Stable Supabase Auth settings should live in `supabase/config.toml`, including:

- `auth.site_url`
- `auth.additional_redirect_urls`
- `auth.jwt_expiry`
- refresh token rotation settings
- email signup and confirmation settings
- OAuth provider toggles and non-secret provider IDs

Secrets such as SMTP passwords, OAuth provider secrets, JWT secrets, and
Supabase secret keys should be managed with Supabase branch secrets or the
hosting provider environment, not committed in plain text.

The current config keeps signup disabled by default and allowlists the local
admin callback routes plus the current Vercel domain routes.
