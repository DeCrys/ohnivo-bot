-- Ohnivo - privileged database functions
-- These functions are only executable by the service role (web server and bot).

create or replace function public.credit_balance(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::integer
  from public.credit_ledger
  where user_id = p_user;
$$;

create or replace function public.spend_credits(
  p_user uuid,
  p_amount integer,
  p_kind text,
  p_meta jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select coalesce(sum(delta), 0)::integer into current_balance
  from public.credit_ledger
  where user_id = p_user;

  if current_balance < p_amount then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  new_balance := current_balance - p_amount;

  insert into public.credit_ledger (user_id, delta, kind, meta, balance_after)
  values (p_user, -p_amount, p_kind, coalesce(p_meta, '{}'::jsonb), new_balance);

  return new_balance;
end;
$$;

create or replace function public.grant_credits(
  p_user uuid,
  p_amount integer,
  p_kind text,
  p_meta jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select (coalesce(sum(delta), 0) + p_amount)::integer into new_balance
  from public.credit_ledger
  where user_id = p_user;

  insert into public.credit_ledger (user_id, delta, kind, meta, balance_after)
  values (p_user, p_amount, p_kind, coalesce(p_meta, '{}'::jsonb), new_balance);

  return new_balance;
end;
$$;

-- Atomic job claim with SKIP LOCKED. Stale jobs (worker crash) are requeued
-- after 15 minutes so a restarted bot can resume idempotently.
create or replace function public.claim_apply_job(p_worker text)
returns setof public.apply_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.apply_jobs
     set status = 'queued',
         locked_by = null,
         locked_at = null,
         updated_at = now()
   where status = 'running'
     and locked_at < now() - interval '15 minutes';

  return query
    with next_job as (
      select id
      from public.apply_jobs
      where status = 'queued'
      order by created_at
      limit 1
      for update skip locked
    )
    update public.apply_jobs j
       set status = 'running',
           locked_by = p_worker,
           locked_at = now(),
           started_at = coalesce(j.started_at, now()),
           attempts = j.attempts + 1,
           updated_at = now()
      from next_job
     where j.id = next_job.id
    returning j.*;
end;
$$;

-- Function permissions -------------------------------------------------------
revoke all on function public.credit_balance(uuid) from public, anon, authenticated;
revoke all on function public.spend_credits(uuid, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.grant_credits(uuid, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.claim_apply_job(text) from public, anon, authenticated;

grant execute on function public.credit_balance(uuid) to service_role;
grant execute on function public.spend_credits(uuid, integer, text, jsonb) to service_role;
grant execute on function public.grant_credits(uuid, integer, text, jsonb) to service_role;
grant execute on function public.claim_apply_job(text) to service_role;
