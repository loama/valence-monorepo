drop policy if exists "demo conversations are readable" on public.conversations;
drop policy if exists "demo messages are readable" on public.messages;
drop policy if exists "participants can read conversation rows" on public.conversation_participants;

create policy "care conversations are readable" on public.conversations
  for select using (
    is_demo or exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = conversations.id
        and u.auth_user_id = auth.uid()
    )
  );

create policy "care messages are readable" on public.messages
  for select using (
    is_demo or exists (
      select 1
      from public.conversation_participants cp
      join public.users u on u.id = cp.user_id
      where cp.conversation_id = messages.conversation_id
        and u.auth_user_id = auth.uid()
    )
  );

create policy "conversation participant rows are readable" on public.conversation_participants
  for select using (
    exists (
      select 1
      from public.users u
      where u.id = conversation_participants.user_id
        and (u.is_demo or u.auth_user_id = auth.uid())
    )
  );
