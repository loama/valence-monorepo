alter table public.member_profiles enable row level security;
alter table public.care_plans enable row level security;
alter table public.check_ins enable row level security;
alter table public.admin_audit_events enable row level security;

comment on table public.member_profiles is
  'Valence member profile records. RLS is enabled and policies should be added with each product access path.';

comment on table public.care_plans is
  'Care plan records connected to member profiles. RLS is enabled by default.';

comment on table public.check_ins is
  'Member check-in records. RLS is enabled by default.';

comment on table public.admin_audit_events is
  'Internal admin audit events. RLS is enabled by default.';
