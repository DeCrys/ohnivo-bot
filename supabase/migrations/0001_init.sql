-- Ohnivo - initial schema
-- All timestamps are UTC. All tables have RLS enabled in 0002_rls.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null unique,
  username text not null,
  global_name text,
  avatar text,
  locale text not null default 'cs' check (locale in ('cs', 'en')),
  plan text not null default 'free' check (plan in ('free', 'starter', 'premium', 'pro')),
  plan_interval text check (plan_interval in ('month', 'year')),
  plan_renews_at timestamptz,
  stripe_customer_id text unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Server-side sessions. Tokens are encrypted by the web app before insert.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  discord_access_token text not null,
  discord_refresh_token text,
  discord_token_expires_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

-- Guilds --------------------------------------------------------------------
create table if not exists public.guilds (
  id text primary key,
  name text not null,
  icon text,
  owner_discord_id text,
  bot_present boolean not null default false,
  bot_present_checked_at timestamptz,
  locale text not null default 'cs' check (locale in ('cs', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger guilds_set_updated_at
before update on public.guilds
for each row execute function public.set_updated_at();

create table if not exists public.guild_members (
  guild_id text not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  permissions text not null default '0',
  is_owner boolean not null default false,
  synced_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

create index if not exists guild_members_user_id_idx on public.guild_members(user_id);

-- Blueprints ----------------------------------------------------------------
create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  guild_id text not null references public.guilds(id) on delete cascade,
  title text not null default 'Nový server',
  prompt text not null default '',
  data jsonb not null,
  issues jsonb not null default '[]'::jsonb,
  removed_permissions jsonb not null default '[]'::jsonb,
  revision integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'queued', 'applied', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blueprints_set_updated_at
before update on public.blueprints
for each row execute function public.set_updated_at();

create index if not exists blueprints_guild_id_idx on public.blueprints(guild_id);
create index if not exists blueprints_user_id_idx on public.blueprints(user_id);

-- Apply jobs ----------------------------------------------------------------
create table if not exists public.apply_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  guild_id text not null references public.guilds(id) on delete cascade,
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  blueprint_revision integer not null default 1,
  blueprint_snapshot jsonb not null,
  mode text not null default 'merge' check (mode in ('merge', 'append')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled', 'rolled_back')),
  progress jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  cost integer not null default 0,
  refunded boolean not null default false,
  error text,
  attempts integer not null default 0,
  locked_by text,
  locked_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger apply_jobs_set_updated_at
before update on public.apply_jobs
for each row execute function public.set_updated_at();

create index if not exists apply_jobs_status_idx on public.apply_jobs(status, created_at);
create index if not exists apply_jobs_guild_id_idx on public.apply_jobs(guild_id);
create index if not exists apply_jobs_user_id_idx on public.apply_jobs(user_id);

-- One active job per blueprint (idempotent apply button).
create unique index if not exists apply_jobs_one_active_per_blueprint
  on public.apply_jobs(blueprint_id)
  where status in ('queued', 'running');

create table if not exists public.apply_job_objects (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.apply_jobs(id) on delete cascade,
  object_key text not null,
  kind text not null,
  discord_id text not null,
  -- true when an existing object was reused (merge mode). Rollback must
  -- never delete reused objects.
  reused boolean not null default false,
  created_at timestamptz not null default now(),
  unique (job_id, object_key)
);

create index if not exists apply_job_objects_job_id_idx on public.apply_job_objects(job_id);

-- Credits (append-only ledger) ---------------------------------------------
create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete restrict,
  delta integer not null check (delta <> 0),
  kind text not null,
  meta jsonb not null default '{}'::jsonb,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_id_idx on public.credit_ledger(user_id, created_at desc);

create or replace function public.credit_ledger_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'credit_ledger is append-only';
end;
$$;

create trigger credit_ledger_no_update
before update or delete on public.credit_ledger
for each row execute function public.credit_ledger_append_only();

-- Subscriptions -------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('starter', 'premium', 'pro')),
  interval text not null check (interval in ('month', 'year')),
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- Notifications -------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;

-- AI usage / rate limiting --------------------------------------------------
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  ok boolean not null default true,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx on public.ai_usage(user_id, created_at desc);

-- Generated assets (phase 3 foundation) -------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  guild_id text not null references public.guilds(id) on delete cascade,
  blueprint_id uuid references public.blueprints(id) on delete set null,
  kind text not null check (kind in ('icon', 'banner', 'emoji', 'sticker')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'applied', 'failed')),
  prompt text not null default '',
  storage_path text,
  price integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create index if not exists assets_guild_id_idx on public.assets(guild_id);

-- Audit log -----------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.users(id) on delete set null,
  guild_id text,
  job_id uuid,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_guild_id_idx on public.audit_log(guild_id, created_at desc);

create or replace function public.audit_log_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

create trigger audit_log_no_update
before update or delete on public.audit_log
for each row execute function public.audit_log_append_only();
