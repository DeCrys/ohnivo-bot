-- Ohnivo - administrator-managed plans
-- A manual plan is an internal entitlement. It never creates Stripe objects.
-- Stripe may only overwrite it when a real subscription becomes active.

alter table public.users
  add column if not exists plan_source text not null default 'stripe'
    check (plan_source in ('stripe', 'manual')),
  add column if not exists manual_plan text
    check (manual_plan in ('free', 'starter', 'premium', 'pro')),
  add column if not exists manual_plan_interval text
    check (manual_plan_interval in ('month', 'year')),
  add column if not exists manual_plan_granted_by uuid
    references public.users(id) on delete set null,
  add column if not exists manual_plan_granted_at timestamptz;

-- Atomic plan assignment plus idempotent monthly credit grant. The advisory
-- lock matches the credit RPCs so concurrent grants cannot double-spend.
create or replace function public.admin_assign_manual_plan(
  p_target uuid,
  p_actor uuid,
  p_plan text,
  p_interval text,
  p_amount integer,
  p_reason text,
  p_grant_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interval text;
  v_balance integer;
  v_granted boolean := false;
begin
  if p_plan not in ('free', 'starter', 'premium', 'pro') then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;
  if p_amount < 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  if p_plan = 'free' then
    v_interval := null;
  else
    if p_interval not in ('month', 'year') then
      raise exception 'invalid_interval' using errcode = '22023';
    end if;
    v_interval := p_interval;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_target::text, 0));

  update public.users
     set plan = p_plan,
         plan_interval = v_interval,
         plan_renews_at = null,
         plan_source = 'manual',
         manual_plan = p_plan,
         manual_plan_interval = v_interval,
         manual_plan_granted_by = p_actor,
         manual_plan_granted_at = now()
   where id = p_target;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  if p_amount > 0
     and not exists (
       select 1
         from public.credit_ledger
        where user_id = p_target
          and kind = 'admin_plan_grant'
          and meta->>'grantKey' = p_grant_key
     )
  then
    select (coalesce(sum(delta), 0) + p_amount)::integer
      into v_balance
      from public.credit_ledger
     where user_id = p_target;

    insert into public.credit_ledger (user_id, delta, kind, meta, balance_after)
    values (
      p_target,
      p_amount,
      'admin_plan_grant',
      jsonb_build_object(
        'grantKey', p_grant_key,
        'plan', p_plan,
        'interval', v_interval,
        'actorUserId', p_actor,
        'reason', p_reason,
        'source', 'admin_panel'
      ),
      v_balance
    );
    v_granted := true;
  else
    select coalesce(sum(delta), 0)::integer
      into v_balance
      from public.credit_ledger
     where user_id = p_target;
  end if;

  return jsonb_build_object('balance', v_balance, 'creditsGranted', v_granted);
end;
$$;

revoke all on function public.admin_assign_manual_plan(uuid, uuid, text, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_assign_manual_plan(uuid, uuid, text, text, integer, text, text)
  to service_role;
