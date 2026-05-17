insert into public.member_profiles (email, display_name, status)
values
  ('mara.ibarra@example.test', 'Mara Ibarra', 'onboarding'),
  ('elian.rocha@example.test', 'Elian Rocha', 'active'),
  ('camille.ortega@example.test', 'Camille Ortega', 'paused')
on conflict (email) do nothing;
