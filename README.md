# Valence Monorepo

Valence is a psychology platform split into three deployable workspaces.

## Workspaces

- `app`: Next.js, Capacitor, and shadcn app for the authenticated product experience. It is configured for the `/app` route on Vercel.
- `website`: Next.js and shadcn app for the public website. It is configured as the default Vercel route.
- `api`: Node.js and Express API for platform services. It is configured for Heroku through `Procfile`.

## Branches

- `development`: development deployments.
- `main`: production deployments.

## Commands

Install dependencies:

```bash
bun run install:all
```

Run the hello worlds locally:

```bash
bun run --cwd website dev
bun run --cwd app dev
bun run --cwd api dev
```

Build everything:

```bash
bun run build
```

Run React Doctor checks:

```bash
bun run react-doctor:app
bun run react-doctor:website
```

## Deployment

`vercel.json` maps `/app` to the `app` workspace and all other paths to the `website` workspace. The app workspace also sets `basePath` to `/app`, so generated URLs and assets stay under that route.

Heroku starts the API with the root `Procfile`. The official Heroku Node buildpack does not provide Bun, so the root Heroku build path compiles `api/src/server.ts` with `tsc` and starts `api/dist/server.js` with Node. Local development still uses Bun commands, and the `api/Procfile` is included for Heroku setups that deploy from the `api` directory directly.
