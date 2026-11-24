-- Ohnivo - Row Level Security
-- Every table has RLS enabled. Users can only read guilds they manage and
-- their own data. All privileged writes go through the service role.

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.blueprints enable row level security;
alter table public.apply_jobs enable row level security;
alter table public.apply_job_objects enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_usage enable row level security;
alter table public.assets enable row level security;
alter table public.audit_log enable row level security;

-- users: read self only. Updates happen server-side with the service role.
create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid());

-- sessions: never exposed to clients (service role only).
-- stripe_events: never exposed to clients.

-- guilds: visible when the user has a cached membership.
create policy guilds_select_member on public.guilds
  for select to authenticated
  using (
    exists (
      select 1 from public.guild_members gm
      where gm.guild_id = guilds.id and gm.user_id = auth.uid()
    )
  );

create policy guild_members_select_self on public.guild_members
  for select to authenticated
  using (user_id = auth.uid());

-- blueprints: owner + guild access.
create policy blueprints_select_own on public.blueprints
  for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.guild_members gm
      where gm.guild_id = blueprints.guild_id and gm.user_id = auth.uid()
    )
  );

create policy blueprints_insert_own on public.blueprints
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.guild_members gm
      where gm.guild_id = blueprints.guild_id and gm.user_id = auth.uid()
    )
  );

create policy blueprints_update_own on public.blueprints
  for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.guild_members gm
      where gm.guild_id = blueprints.guild_id and gm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.guild_members gm
      where gm.guild_id = blueprints.guild_id and gm.user_id = auth.uid()
    )
  );

create policy blueprints_delete_own on public.blueprints
  for delete to authenticated
  using (
    user_id = auth.uid()
    and status = 'draft'
    and exists (
      select 1 from public.guild_members gm
      where gm.guild_id = blueprints.guild_id and gm.user_id = auth.uid()
    )
  );

-- apply jobs: read only for the owner with guild access. Insert/update is
-- service-role only (web API + bot).
create policy apply_jobs_select_own on public.apply_jobs
  for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.guild_members gm
      where gm.guild_id = apply_jobs.guild_id and gm.user_id = auth.uid()
    )
  );

create policy apply_job_objects_select_own on public.apply_job_objects
  for select to authenticated
  using (
    exists (
      select 1 from public.apply_jobs j
      where j.id = apply_job_objects.job_id and j.user_id = auth.uid()
    )
  );

-- credits: read own ledger. Writes only via security definer functions
-- callable by the service role.
create policy credit_ledger_select_own on public.credit_ledger
  for select to authenticated
  using (user_id = auth.uid());

create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy ai_usage_select_own on public.ai_usage
  for select to authenticated
  using (user_id = auth.uid());

create policy assets_select_own on public.assets
  for select to authenticated
  using (user_id = auth.uid());

create policy audit_log_select_own on public.audit_log
  for select to authenticated
  using (
    actor_user_id = auth.uid()
    or (
      guild_id is not null
      and exists (
        select 1 from public.guild_members gm
        where gm.guild_id = audit_log.guild_id and gm.user_id = auth.uid()
      )
    )
  );
