-- Apply jobs can now perform a confirmed replacement after building the new structure.
alter table public.apply_jobs
  drop constraint if exists apply_jobs_mode_check;

alter table public.apply_jobs
  add constraint apply_jobs_mode_check
  check (mode in ('merge', 'append', 'replace'));
