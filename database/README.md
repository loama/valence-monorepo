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
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

Use the Supabase pooler connection string for remote development or production.
Never commit service role keys or database passwords.

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

1. Connect this GitHub repository in Supabase Branching.
2. Set the Supabase working directory to `database`.
3. Keep production connected to `main`.
4. Create a persistent Supabase branch named `development` and connect it to
   the Git `development` branch.
5. Let Supabase apply migrations from `supabase/migrations` on branch updates.
6. Keep Vercel environment variables branch-specific:
   - Production Vercel env vars point at the production Supabase project.
   - Preview/development Vercel env vars point at the Supabase `development`
     branch credentials.

Supabase branches are isolated environments with their own database, API URL,
and API keys. Production changes should land through reviewed migrations in
Git, not ad hoc dashboard edits.
