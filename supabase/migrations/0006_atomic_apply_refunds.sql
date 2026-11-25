create or replace function public.refund_apply_job(
  p_job uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  job_row public.apply_jobs%rowtype;
  current_balance integer;
  new_balance integer;
  refund_exists boolean;
begin
  select * into job_row
  from public.apply_jobs
  where id = p_job
  for update;

  if not found then
    raise exception 'apply_job_not_found' using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.credit_ledger
    where user_id = job_row.user_id
      and kind = 'refund'
      and meta ->> 'jobId' = job_row.id::text
  ) into refund_exists;

  if refund_exists then
    update public.apply_jobs set refunded = true where id = job_row.id;
    return true;
  end if;

  if job_row.cost <= 0 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(job_row.user_id::text, 0));

  select coalesce(sum(delta), 0)::integer into current_balance
  from public.credit_ledger
  where user_id = job_row.user_id;

  new_balance := current_balance + job_row.cost;

  insert into public.credit_ledger (user_id, delta, kind, meta, balance_after)
  values (
    job_row.user_id,
    job_row.cost,
    'refund',
    jsonb_build_object('jobId', job_row.id, 'reason', p_reason),
    new_balance
  );

  update public.apply_jobs set refunded = true where id = job_row.id;
  return true;
end;
$$;

revoke all on function public.refund_apply_job(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_apply_job(uuid, text) to service_role;
