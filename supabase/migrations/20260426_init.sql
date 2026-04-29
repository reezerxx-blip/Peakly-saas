create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  pro_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tools (
  id text primary key,
  name text not null,
  category text,
  current_growth_percent numeric(6,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null references public.tools(id) on delete cascade,
  threshold_percent numeric(6,2) not null default 15,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_alerts_user_id on public.alerts(user_id);
create index if not exists idx_alerts_tool_id on public.alerts(tool_id);
create index if not exists idx_tools_growth on public.tools(current_growth_percent);

alter table public.users enable row level security;
alter table public.tools enable row level security;
alter table public.alerts enable row level security;

create policy "users can read own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id);

create policy "authenticated users can read tools"
on public.tools
for select
to authenticated
using (true);

create policy "users can read own alerts"
on public.alerts
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own alerts"
on public.alerts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own alerts"
on public.alerts
for update
to authenticated
using (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.handle_updated_at();
