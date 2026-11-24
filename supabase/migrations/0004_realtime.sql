-- Ohnivo - realtime for live apply progress and the notification bell.

do $$
begin
  alter publication supabase_realtime add table public.apply_jobs;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

alter table public.apply_jobs replica identity full;
