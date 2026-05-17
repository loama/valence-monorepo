# TODO

## Web Update Prompt

- Add a web-only update notification once the database has a durable app release table.
- Use a permanent bottom-right Sonner toast with:
  - `Reload` as the primary action, which refreshes the page to apply the newest web deployment.
  - A close button for dismissing the prompt.
- Back the prompt with Supabase so web clients can subscribe to the latest active release for their route without polling Vercel.

## Push Notification Persistence

- Add a Supabase migration for device push tokens after the notification delivery model is decided.
- Store token, platform, user id, install id, permission state, and last seen timestamp.
- Add a token upsert endpoint or Supabase RPC before sending real care notifications.
