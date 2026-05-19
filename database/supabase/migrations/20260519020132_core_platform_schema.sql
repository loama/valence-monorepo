create type public.user_role as enum ('patient', 'provider', 'admin');
create type public.appointment_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type public.appointment_modality as enum ('video', 'in_person', 'hybrid');
create type public.connection_request_status as enum ('pending', 'accepted', 'declined', 'cancelled');
create type public.conversation_type as enum ('care_team', 'appointment', 'support');
create type public.message_delivery_status as enum ('sent', 'delivered', 'read');
create type public.app_platform as enum ('ios', 'android', 'web');
create type public.app_version_status as enum ('draft', 'released', 'deprecated');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email varchar(320) not null unique,
  display_name text not null,
  role public.user_role not null,
  avatar_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  preferred_name text not null,
  care_goals jsonb not null default '[]'::jsonb,
  risk_level text not null default 'low',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  specialties text[] not null default '{}',
  modalities public.appointment_modality[] not null default '{}',
  bio text,
  search_code text unique,
  searchable boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.therapist_connection_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  status public.connection_request_status not null default 'pending',
  message text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, provider_id, status)
);

create table public.patient_provider_connections (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  accepted_request_id uuid references public.therapist_connection_requests(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (patient_id, provider_id)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  connection_id uuid references public.patient_provider_connections(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'requested',
  modality public.appointment_modality not null default 'video',
  location text,
  daily_room_name text,
  daily_room_url text,
  daily_room_expires_at timestamptz,
  notes text,
  created_by_user_id uuid references public.users(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  type public.conversation_type not null default 'care_team',
  title text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_message_id uuid,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete set null,
  body text not null,
  delivery_status public.message_delivery_status not null default 'sent',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  encrypted_body text not null,
  encryption_key_id text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_check_ins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  mood text not null,
  stress_level integer not null check (stress_level between 0 and 10),
  topics text[] not null default '{}',
  encrypted_note text,
  encryption_key_id text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  duration_minutes integer not null default 5,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.patient_exercises (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  status text not null default 'assigned',
  progress integer not null default 0 check (progress between 0 and 100),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.app_versions (
  id uuid primary key default gen_random_uuid(),
  platform public.app_platform not null,
  release_number integer not null,
  bundle_version text not null,
  capgo_channel text not null default 'production',
  status public.app_version_status not null default 'released',
  notes text,
  created_at timestamptz not null default now(),
  unique (platform, release_number, capgo_channel)
);

create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  platform public.app_platform not null,
  token text not null unique,
  badge_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.daily_rooms (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  name text not null unique,
  url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index users_auth_user_id_idx on public.users(auth_user_id);
create index users_role_idx on public.users(role);
create index patients_user_id_idx on public.patients(user_id);
create index providers_user_id_idx on public.providers(user_id);
create index providers_search_code_idx on public.providers(search_code);
create index therapist_connection_requests_patient_id_idx on public.therapist_connection_requests(patient_id);
create index therapist_connection_requests_provider_id_idx on public.therapist_connection_requests(provider_id);
create index patient_provider_connections_patient_id_idx on public.patient_provider_connections(patient_id);
create index patient_provider_connections_provider_id_idx on public.patient_provider_connections(provider_id);
create index appointments_patient_id_idx on public.appointments(patient_id);
create index appointments_provider_id_idx on public.appointments(provider_id);
create index appointments_starts_at_idx on public.appointments(starts_at);
create index messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at);
create index clinical_notes_patient_id_idx on public.clinical_notes(patient_id);
create index patient_check_ins_patient_id_created_at_idx on public.patient_check_ins(patient_id, created_at);
create index app_versions_platform_release_idx on public.app_versions(platform, release_number desc);
create index notification_events_user_id_created_at_idx on public.notification_events(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.providers enable row level security;
alter table public.therapist_connection_requests enable row level security;
alter table public.patient_provider_connections enable row level security;
alter table public.appointments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.patient_check_ins enable row level security;
alter table public.exercises enable row level security;
alter table public.patient_exercises enable row level security;
alter table public.app_versions enable row level security;
alter table public.device_push_tokens enable row level security;
alter table public.notification_events enable row level security;
alter table public.daily_rooms enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on
  public.users,
  public.patients,
  public.providers,
  public.therapist_connection_requests,
  public.patient_provider_connections,
  public.appointments,
  public.conversations,
  public.conversation_participants,
  public.messages,
  public.exercises,
  public.patient_exercises,
  public.app_versions,
  public.device_push_tokens,
  public.notification_events,
  public.daily_rooms
to anon, authenticated;
grant select, insert, update on public.clinical_notes, public.patient_check_ins to authenticated;

create policy "demo users are readable" on public.users
  for select using (is_demo or auth_user_id = auth.uid());
create policy "authenticated users can update themselves" on public.users
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy "demo patients are readable" on public.patients
  for select using (
    is_demo or
    exists (
      select 1 from public.users u
      where u.id = patients.user_id and u.auth_user_id = auth.uid()
    ) or
    exists (
      select 1
      from public.patient_provider_connections c
      join public.providers p on p.id = c.provider_id
      join public.users u on u.id = p.user_id
      where c.patient_id = patients.id and u.auth_user_id = auth.uid()
    )
  );

create policy "demo providers are searchable" on public.providers
  for select using (
    is_demo or searchable or
    exists (
      select 1 from public.users u
      where u.id = providers.user_id and u.auth_user_id = auth.uid()
    )
  );

create policy "demo connection requests are readable" on public.therapist_connection_requests
  for select using (is_demo);
create policy "patients can request therapists" on public.therapist_connection_requests
  for insert with check (
    is_demo or
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = therapist_connection_requests.patient_id
        and u.auth_user_id = auth.uid()
    )
  );
create policy "request owners can update requests" on public.therapist_connection_requests
  for update using (
    is_demo or
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = therapist_connection_requests.patient_id
        and u.auth_user_id = auth.uid()
    ) or
    exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = therapist_connection_requests.provider_id
        and u.auth_user_id = auth.uid()
    )
  );

create policy "demo connections are readable" on public.patient_provider_connections
  for select using (is_demo);

create policy "demo appointments are readable" on public.appointments
  for select using (
    is_demo or
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = appointments.patient_id and u.auth_user_id = auth.uid()
    ) or
    exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = appointments.provider_id and u.auth_user_id = auth.uid()
    )
  );
create policy "providers can create appointments" on public.appointments
  for insert with check (
    is_demo or
    exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = appointments.provider_id and u.auth_user_id = auth.uid()
    )
  );
create policy "care participants can update appointments" on public.appointments
  for update using (
    is_demo or
    exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = appointments.provider_id and u.auth_user_id = auth.uid()
    ) or
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = appointments.patient_id and u.auth_user_id = auth.uid()
    )
  );

create policy "demo conversations are readable" on public.conversations
  for select using (
    is_demo or exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = conversations.id and u.auth_user_id = auth.uid()
    )
  );
create policy "demo messages are readable" on public.messages
  for select using (
    is_demo or exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = messages.conversation_id and u.auth_user_id = auth.uid()
    )
  );
create policy "demo messages can be inserted" on public.messages
  for insert with check (
    is_demo or exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = messages.conversation_id and u.auth_user_id = auth.uid()
    )
  );

create policy "participants can read conversation rows" on public.conversation_participants
  for select using (
    exists (
      select 1 from public.users u
      where u.id = conversation_participants.user_id and u.auth_user_id = auth.uid()
    ) or
    exists (
      select 1 from public.conversations c
      where c.id = conversation_participants.conversation_id and c.is_demo
    )
  );

create policy "providers can read clinical notes" on public.clinical_notes
  for select using (
    exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = clinical_notes.provider_id and u.auth_user_id = auth.uid()
    )
  );
create policy "providers can write clinical notes" on public.clinical_notes
  for insert with check (
    exists (
      select 1
      from public.providers p
      join public.users u on u.id = p.user_id
      where p.id = clinical_notes.provider_id and u.auth_user_id = auth.uid()
    )
  );

create policy "patients can read check ins" on public.patient_check_ins
  for select using (
    exists (
      select 1
      from public.patients p
      join public.users u on u.id = p.user_id
      where p.id = patient_check_ins.patient_id and u.auth_user_id = auth.uid()
    ) or
    exists (
      select 1
      from public.patient_provider_connections c
      join public.providers p on p.id = c.provider_id
      join public.users u on u.id = p.user_id
      where c.patient_id = patient_check_ins.patient_id and u.auth_user_id = auth.uid()
    )
  );

create policy "demo exercises are readable" on public.exercises
  for select using (is_demo);
create policy "demo patient exercises are readable" on public.patient_exercises
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = patient_exercises.patient_id and p.is_demo
    )
  );

create policy "released app versions are readable" on public.app_versions
  for select using (status = 'released');
create policy "device token owner can read token" on public.device_push_tokens
  for select using (
    user_id is null or exists (
      select 1 from public.users u
      where u.id = device_push_tokens.user_id and u.auth_user_id = auth.uid()
    )
  );
create policy "devices can register push tokens" on public.device_push_tokens
  for insert with check (true);
create policy "devices can refresh push tokens" on public.device_push_tokens
  for update using (true) with check (true);
create policy "notification owners can read events" on public.notification_events
  for select using (
    exists (
      select 1 from public.users u
      where u.id = notification_events.user_id and u.auth_user_id = auth.uid()
    )
  );
create policy "demo daily rooms are readable" on public.daily_rooms
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = daily_rooms.appointment_id and a.is_demo
    )
  );

alter table public.appointments replica identity full;
alter table public.therapist_connection_requests replica identity full;
alter table public.conversations replica identity full;
alter table public.messages replica identity full;
alter table public.app_versions replica identity full;
alter table public.device_push_tokens replica identity full;
alter table public.notification_events replica identity full;

alter publication supabase_realtime add table
  public.appointments,
  public.therapist_connection_requests,
  public.conversations,
  public.messages,
  public.app_versions,
  public.device_push_tokens,
  public.notification_events;

insert into public.users (id, email, display_name, role, avatar_url, is_demo) values
  ('10000000-0000-4000-8000-000000000001', 'olivia.martinez@example.com', 'Olivia Martinez', 'patient', null, true),
  ('10000000-0000-4000-8000-000000000002', 'emma.lin@example.com', 'Dr. Emma Lin', 'provider', null, true),
  ('10000000-0000-4000-8000-000000000003', 'sofia.martinez@example.com', 'Sofia Martinez', 'patient', null, true),
  ('10000000-0000-4000-8000-000000000004', 'mateo.ruiz@example.com', 'Mateo Ruiz', 'patient', null, true);

insert into public.patients (id, user_id, preferred_name, care_goals, risk_level, is_demo) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Olivia', '["sleep better","reduce anxiety before work"]'::jsonb, 'low', true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'Sofia', '["sleep routine","work conflict"]'::jsonb, 'low', true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', 'Mateo', '["intake","family context"]'::jsonb, 'medium', true);

insert into public.providers (id, user_id, display_name, specialties, modalities, bio, search_code, is_demo) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Dr. Emma Lin', array['Anxiety', 'Sleep', 'Work stress'], array['video'::public.appointment_modality, 'in_person'::public.appointment_modality], 'Clinical psychologist focused on practical, compassionate care.', 'EMMA-LIN', true);

insert into public.therapist_connection_requests (id, patient_id, provider_id, status, message, is_demo) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'accepted', 'I would like to keep working with you in Valence.', true);

insert into public.patient_provider_connections (id, patient_id, provider_id, accepted_request_id, is_demo) values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', true),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', null, true),
  ('50000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', null, true);

insert into public.appointments (id, patient_id, provider_id, connection_id, starts_at, ends_at, status, modality, notes, is_demo) values
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', now() + interval '1 day', now() + interval '1 day 50 minutes', 'confirmed', 'video', 'Review sleep log and set one small practice for the week.', true),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', now() + interval '2 days', now() + interval '2 days 50 minutes', 'confirmed', 'video', 'Discuss work conflict and recovery routines.', true),
  ('60000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000003', now() + interval '4 days', now() + interval '4 days 50 minutes', 'requested', 'in_person', 'Complete intake and review consent item.', true);

insert into public.conversations (id, appointment_id, type, title, is_demo) values
  ('70000000-0000-4000-8000-000000000001', null, 'care_team', 'Olivia and Dr. Emma Lin', true);

insert into public.conversation_participants (conversation_id, user_id) values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002');

insert into public.messages (id, conversation_id, sender_user_id, body, delivery_status, is_demo, created_at) values
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Hi Olivia, I am glad you are here. How are you feeling today?', 'read', true, now() - interval '12 minutes'),
  ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'A little anxious, but ready to prepare for tomorrow.', 'read', true, now() - interval '9 minutes'),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'That makes sense. We can keep the session focused and simple.', 'delivered', true, now() - interval '6 minutes');

insert into public.exercises (id, title, description, category, duration_minutes, is_demo) values
  ('90000000-0000-4000-8000-000000000001', 'Breathing reset', 'Six minutes to slow down before sleep.', 'grounding', 6, true),
  ('90000000-0000-4000-8000-000000000002', 'Thought record', 'Capture a thought and gently test it.', 'reflection', 8, true),
  ('90000000-0000-4000-8000-000000000003', 'Grounding', 'Use senses to return to the room.', 'grounding', 4, true);

insert into public.patient_exercises (patient_id, exercise_id, status, progress) values
  ('20000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 'assigned', 35),
  ('20000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', 'assigned', 62),
  ('20000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000003', 'assigned', 18);

insert into public.app_versions (platform, release_number, bundle_version, capgo_channel, status, notes) values
  ('ios', 109, '1.1.109', 'production', 'released', 'Seeded current production Capgo release.');
