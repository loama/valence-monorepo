# Valence Admin

Internal Next.js and shadcn workspace for Valence operations.

## Routes

- Local: `http://localhost:3002/admin`
- Vercel: `https://<domain>/admin`

## Environment

Create `admin/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
ADMIN_EMAIL_ALLOWLIST="ops@valence.example,founder@valence.example"
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported for projects that have not
renamed keys yet. Do not put service role keys in this workspace.

## Commands

```bash
bun install
bun run dev
bun run build
bun run react-doctor
```
