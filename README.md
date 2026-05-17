# Valence Monorepo

Valence is a psychology platform split into deployable workspaces and shared
database infrastructure.

## Workspaces

- `app`: Next.js, Capacitor, and shadcn app for the authenticated product experience. It is configured for the `/app` route on Vercel.
- `admin`: Next.js and shadcn internal dashboard for metrics, auth-gated operations, and customer management. It is configured for the `/admin` route on Vercel.
- `website`: Next.js and shadcn app for the public website. It is configured as the default Vercel route.
- `api`: Node.js and Express API for platform services. It is configured for Heroku through `Procfile`.
- `database`: Supabase CLI and Drizzle workspace for schema, migrations, local seeds, and branch configuration.

## Branches

- `development`: development deployments.
- `main`: production deployments.

## Commands

Install dependencies:

```bash
bun run install:all
```

Run the production-like local router:

```bash
bun run dev
```

Then open:

- `http://localhost:3005`
- `http://localhost:3005/app`
- `http://localhost:3005/admin`

Run individual workspaces locally:

```bash
bun run --cwd website dev
bun run --cwd app dev
bun run --cwd admin dev
bun run --cwd api dev
```

Build everything:

```bash
bun run build
```

Run React Doctor checks:

```bash
bun run react-doctor:app
bun run react-doctor:admin
bun run react-doctor:website
```

Manage database migrations:

```bash
bun run db:generate -- --name <change-name>
bun run db:migrate
bun run db:studio
```

## Deployment

`vercel.json` maps `/app` to the `app` workspace, `/admin` to the `admin` workspace, and all other paths to the `website` workspace. The app and admin workspaces set `basePath` to their route prefixes, so generated URLs and assets stay under the correct route.

Heroku starts the API with the root `Procfile`. The official Heroku Node buildpack does not provide Bun, so the root Heroku build path compiles `api/src/server.ts` with `tsc` and starts `api/dist/server.js` with Node. Local development still uses Bun commands, and the `api/Procfile` is included for Heroku setups that deploy from the `api` directory directly.

Supabase should use `database` as its GitHub integration working directory. Production should track `main`, and the persistent Supabase `development` branch should track the Git `development` branch.
