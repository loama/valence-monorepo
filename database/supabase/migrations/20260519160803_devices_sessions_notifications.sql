create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  installation_id text not null unique,
  platform public.app_platform not null,
  bundle_id text,
  app_version text,
  push_token text unique,
  push_token_provider text not null default 'apns',
  push_token_updated_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  auth_session_id uuid,
  status text not null default 'active' check (status in ('active', 'ended', 'expired')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.device_push_tokens
  add column if not exists device_id uuid references public.devices(id) on delete set null,
  add column if not exists token_provider text not null default 'apns';

alter table public.appointments
  add column if not exists daily_room_token_url text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

create index if not exists devices_user_id_idx on public.devices(user_id);
create index if not exists devices_installation_id_idx on public.devices(installation_id);
create index if not exists devices_push_token_idx on public.devices(push_token);
create index if not exists sessions_user_id_status_idx on public.sessions(user_id, status);
create index if not exists sessions_device_id_status_idx on public.sessions(device_id, status);
create index if not exists appointments_status_starts_at_idx on public.appointments(status, starts_at);

alter table public.devices enable row level security;
alter table public.sessions enable row level security;

grant select, insert, update on public.devices, public.sessions to anon, authenticated;

drop policy if exists "demo users are readable" on public.users;
drop policy if exists "authenticated users can update themselves" on public.users;
drop policy if exists "users can insert their own app profile" on public.users;
drop policy if exists "users can read their own app profile" on public.users;
drop policy if exists "users can update their own app profile" on public.users;

create policy "users can insert their own app profile" on public.users
  for insert with check (
    auth.uid() is not null
    and auth_user_id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "users can read their own app profile" on public.users
  for select using (
    auth_user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "users can update their own app profile" on public.users
  for update using (
    auth_user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) with check (
    auth_user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "demo patients are readable" on public.patients;
drop policy if exists "patients can insert their own profile" on public.patients;
drop policy if exists "patients can update their own profile" on public.patients;
drop policy if exists "care participants can read patients" on public.patients;

create policy "patients can insert their own profile" on public.patients
  for insert with check (
    exists (
      select 1
      from public.users u
      where u.id = patients.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "patients can update their own profile" on public.patients
  for update using (
    exists (
      select 1
      from public.users u
      where u.id = patients.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  ) with check (
    exists (
      select 1
      from public.users u
      where u.id = patients.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "care participants can read patients" on public.patients
  for select using (
    exists (
      select 1
      from public.users u
      where u.id = patients.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
    or exists (
      select 1
      from public.patient_provider_connections c
      join public.providers p on p.id = c.provider_id
      join public.users u on u.id = p.user_id
      where c.patient_id = patients.id
        and c.ended_at is null
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "demo providers are searchable" on public.providers;
drop policy if exists "providers can insert their own profile" on public.providers;
drop policy if exists "providers can update their own profile" on public.providers;
drop policy if exists "providers are searchable by patients" on public.providers;

create policy "providers can insert their own profile" on public.providers
  for insert with check (
    exists (
      select 1
      from public.users u
      where u.id = providers.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "providers can update their own profile" on public.providers
  for update using (
    exists (
      select 1
      from public.users u
      where u.id = providers.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  ) with check (
    exists (
      select 1
      from public.users u
      where u.id = providers.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "providers are searchable by patients" on public.providers
  for select using (
    searchable
    or exists (
      select 1
      from public.users u
      where u.id = providers.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "demo connection requests are readable" on public.therapist_connection_requests;
drop policy if exists "connection request owners can read requests" on public.therapist_connection_requests;

create policy "connection request owners can read requests" on public.therapist_connection_requests
  for select using (
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = therapist_connection_requests.patient_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
    or exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = therapist_connection_requests.provider_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "demo connections are readable" on public.patient_provider_connections;
drop policy if exists "connection owners can read connections" on public.patient_provider_connections;

create policy "connection owners can read connections" on public.patient_provider_connections
  for select using (
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = patient_provider_connections.patient_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
    or exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = patient_provider_connections.provider_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "demo conversations are readable" on public.conversations;
drop policy if exists "care conversations are readable" on public.conversations;
drop policy if exists "care conversations are readable by participants" on public.conversations;

create policy "care conversations are readable by participants" on public.conversations
  for select using (
    exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = conversations.id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "demo messages are readable" on public.messages;
drop policy if exists "care messages are readable" on public.messages;
drop policy if exists "care messages are readable by participants" on public.messages;

create policy "care messages are readable by participants" on public.messages
  for select using (
    exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = messages.conversation_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "participants can read conversation rows" on public.conversation_participants;
drop policy if exists "conversation participant rows are readable" on public.conversation_participants;
drop policy if exists "conversation participants can read their rows" on public.conversation_participants;

create policy "conversation participants can read their rows" on public.conversation_participants
  for select using (
    exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = conversation_participants.conversation_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "devices can register push tokens" on public.device_push_tokens;
drop policy if exists "devices can refresh push tokens" on public.device_push_tokens;
drop policy if exists "device token owner can read token" on public.device_push_tokens;
drop policy if exists "device token owners can read token" on public.device_push_tokens;
drop policy if exists "device token owners can register token" on public.device_push_tokens;
drop policy if exists "device token owners can refresh token" on public.device_push_tokens;

create policy "device token owners can read token" on public.device_push_tokens
  for select using (
    exists (
      select 1
      from public.users u
      where u.id = device_push_tokens.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "device token owners can register token" on public.device_push_tokens
  for insert with check (
    exists (
      select 1
      from public.users u
      where u.id = device_push_tokens.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "device token owners can refresh token" on public.device_push_tokens
  for update using (
    exists (
      select 1
      from public.users u
      where u.id = device_push_tokens.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  ) with check (
    exists (
      select 1
      from public.users u
      where u.id = device_push_tokens.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "device owners can read devices" on public.devices;
drop policy if exists "device owners can register devices" on public.devices;
drop policy if exists "device owners can update devices" on public.devices;

create policy "device owners can read devices" on public.devices
  for select using (
    exists (
      select 1
      from public.users u
      where u.id = devices.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "device owners can register devices" on public.devices
  for insert with check (
    exists (
      select 1
      from public.users u
      where u.id = devices.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "device owners can update devices" on public.devices
  for update using (
    exists (
      select 1
      from public.users u
      where u.id = devices.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  ) with check (
    exists (
      select 1
      from public.users u
      where u.id = devices.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "session owners can read sessions" on public.sessions;
drop policy if exists "session owners can create sessions" on public.sessions;
drop policy if exists "session owners can update sessions" on public.sessions;

create policy "session owners can read sessions" on public.sessions
  for select using (
    exists (
      select 1
      from public.users u
      where u.id = sessions.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "session owners can create sessions" on public.sessions
  for insert with check (
    exists (
      select 1
      from public.users u
      where u.id = sessions.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "session owners can update sessions" on public.sessions
  for update using (
    exists (
      select 1
      from public.users u
      where u.id = sessions.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  ) with check (
    exists (
      select 1
      from public.users u
      where u.id = sessions.user_id
        and (u.auth_user_id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create or replace function public.handle_new_message_notification()
returns trigger
language plpgsql
as $$
begin
  update public.conversation_participants
  set unread_count = unread_count + 1
  where conversation_id = new.conversation_id
    and user_id is distinct from new.sender_user_id;

  insert into public.notification_events (user_id, type, title, body, data)
  select
    cp.user_id,
    'message',
    'New message',
    left(new.body, 160),
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'message_id', new.id,
      'url', '/app'
    )
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.user_id is distinct from new.sender_user_id;

  update public.devices d
  set updated_at = now()
  where d.user_id in (
    select cp.user_id
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id is distinct from new.sender_user_id
  );

  update public.device_push_tokens dpt
  set badge_count = dpt.badge_count + 1,
      updated_at = now()
  where dpt.user_id in (
    select cp.user_id
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id is distinct from new.sender_user_id
  );

  return new;
end;
$$;

drop trigger if exists messages_notify_participants on public.messages;
create trigger messages_notify_participants
  after insert on public.messages
  for each row execute function public.handle_new_message_notification();

alter table public.devices replica identity full;
alter table public.sessions replica identity full;

alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.sessions;

insert into public.users (id, email, display_name, role, avatar_url, is_demo)
values
  ('10000000-0000-4000-8000-000000000010', 'loama18@gmail.com', 'Eduardo Valence', 'patient', null, false),
  ('10000000-0000-4000-8000-000000000011', 'maya.chen@werevalence.com', 'Dr. Maya Chen', 'provider', null, false),
  ('10000000-0000-4000-8000-000000000012', 'lucia.ramos@werevalence.com', 'Dr. Lucia Ramos', 'provider', null, false)
on conflict (email) do update
set display_name = excluded.display_name,
    updated_at = now();

insert into public.patients (id, user_id, preferred_name, care_goals, risk_level, is_demo)
values
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'Eduardo', '["prepare for sessions","reduce work stress","sleep more consistently"]'::jsonb, 'low', false)
on conflict (id) do update
set preferred_name = excluded.preferred_name,
    care_goals = excluded.care_goals,
    updated_at = now();

insert into public.providers (id, user_id, display_name, specialties, modalities, bio, search_code, searchable, is_demo)
values
  ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'Eduardo Valence', array['Clinical operations', 'Care design'], array['video'::public.appointment_modality], 'Internal Valence profile for testing the provider workspace.', 'EDUARDO-TEST', true, false),
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', 'Dr. Maya Chen', array['Anxiety', 'Sleep', 'Work stress'], array['video'::public.appointment_modality, 'in_person'::public.appointment_modality], 'Clinical psychologist focused on practical, compassionate therapy.', 'MAYA-CHEN', true, false),
  ('30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', 'Dr. Lucia Ramos', array['Relationships', 'Mood', 'Life transitions'], array['video'::public.appointment_modality], 'Therapist focused on reflective care and clear next steps.', 'LUCIA-RAMOS', true, false)
on conflict (id) do update
set display_name = excluded.display_name,
    specialties = excluded.specialties,
    modalities = excluded.modalities,
    bio = excluded.bio,
    search_code = excluded.search_code,
    searchable = excluded.searchable,
    updated_at = now();

insert into public.therapist_connection_requests (id, patient_id, provider_id, status, message, is_demo)
values
  ('40000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000011', 'accepted', 'I would like to use Valence for our sessions.', false),
  ('40000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000012', 'pending', 'I am looking for a therapist who can help with transitions.', false)
on conflict do nothing;

insert into public.patient_provider_connections (id, patient_id, provider_id, accepted_request_id, is_demo)
values
  ('50000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000010', false)
on conflict (patient_id, provider_id) do update
set ended_at = null,
    accepted_request_id = excluded.accepted_request_id;

insert into public.appointments (id, patient_id, provider_id, connection_id, starts_at, ends_at, status, modality, notes, is_demo)
values
  ('60000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-000000000010', now() - interval '2 days', now() - interval '2 days' + interval '50 minutes', 'completed', 'video', 'Reviewed sleep routines and selected one evening check-in.', false),
  ('60000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-000000000010', now() - interval '1 minute', now() + interval '49 minutes', 'confirmed', 'video', 'Focus on work stress and a short grounding plan.', false),
  ('60000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-000000000010', now() + interval '2 days', now() + interval '2 days 50 minutes', 'requested', 'video', 'Requested follow-up for next week.', false),
  ('60000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-000000000010', now() + interval '7 days', now() + interval '7 days 50 minutes', 'confirmed', 'video', 'Review goals and exercise progress.', false)
on conflict (id) do update
set starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    status = excluded.status,
    modality = excluded.modality,
    notes = excluded.notes,
    updated_at = now();

insert into public.conversations (id, appointment_id, type, title, is_demo)
values
  ('70000000-0000-4000-8000-000000000010', null, 'care_team', 'Eduardo and Dr. Maya Chen', false)
on conflict (id) do update
set title = excluded.title,
    updated_at = now();

insert into public.conversation_participants (conversation_id, user_id)
values
  ('70000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010'),
  ('70000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000011')
on conflict do nothing;

insert into public.messages (id, conversation_id, sender_user_id, body, delivery_status, is_demo, created_at)
values
  ('80000000-0000-4000-8000-000000000010', '70000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000011', 'Hi Eduardo, I am glad you are here. How are you feeling today?', 'read', false, now() - interval '16 minutes'),
  ('80000000-0000-4000-8000-000000000011', '70000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'A little anxious, but ready to prepare for tomorrow.', 'read', false, now() - interval '12 minutes'),
  ('80000000-0000-4000-8000-000000000012', '70000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000011', 'That makes sense. We can keep the session focused and simple.', 'delivered', false, now() - interval '8 minutes')
on conflict (id) do nothing;
