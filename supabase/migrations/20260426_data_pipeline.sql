create extension if not exists "pgcrypto";

create table if not exists public.tools (
  id text primary key,
  name text not null,
  website text,
  category text,
  description text,
  pricing text,
  launched integer,
  trend_score numeric(6,2) default 0,
  weekly_growth numeric(8,2) default 0,
  monthly_visits bigint,
  status text check (status in ('hot', 'rising', 'stable', 'declining')),
  data_quality text check (data_quality in ('high', 'medium', 'low')),
  updated_at timestamptz default now()
);

create table if not exists public.api_cache (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  source text not null,
  value jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create unique index if not exists uq_api_cache_tool_source on public.api_cache(tool_id, source);
create index if not exists idx_api_cache_expire on public.api_cache(expires_at);

create table if not exists public.fetch_log (
  id uuid primary key default gen_random_uuid(),
  tool_id text,
  source text not null,
  status text not null check (status in ('success', 'fail', 'cached', 'fallback')),
  error_message text,
  fetched_at timestamptz not null default now()
);

create table if not exists public.score_history (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  trend_score numeric(6,2) not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_score_history_tool_time on public.score_history(tool_id, recorded_at desc);

alter table public.tools enable row level security;
alter table public.api_cache enable row level security;
alter table public.fetch_log enable row level security;
alter table public.score_history enable row level security;
