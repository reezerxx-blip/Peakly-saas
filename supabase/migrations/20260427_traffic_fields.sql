alter table public.tools add column if not exists global_rank bigint;
alter table public.tools add column if not exists bounce_rate numeric(6,2);
alter table public.tools add column if not exists pages_per_visit numeric(6,2);
alter table public.tools add column if not exists avg_visit_duration text;
alter table public.tools add column if not exists traffic_updated_at timestamptz;

alter table public.fetch_log drop constraint if exists fetch_log_status_check;
alter table public.fetch_log
  add constraint fetch_log_status_check
  check (status in ('success', 'fail', 'cached', 'fallback', 'blocked'));
