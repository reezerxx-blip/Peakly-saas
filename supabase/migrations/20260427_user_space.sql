create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'system')),
  language text not null default 'fr' check (language in ('fr', 'en')),
  email_alerts_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null references public.tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, tool_id)
);

create index if not exists idx_user_favorites_user on public.user_favorites(user_id);
create index if not exists idx_user_favorites_tool on public.user_favorites(tool_id);

alter table public.user_preferences enable row level security;
alter table public.user_favorites enable row level security;

drop policy if exists "users can read own preferences" on public.user_preferences;
create policy "users can read own preferences"
on public.user_preferences for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can upsert own preferences" on public.user_preferences;
create policy "users can upsert own preferences"
on public.user_preferences for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can read own favorites" on public.user_favorites;
create policy "users can read own favorites"
on public.user_favorites for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own favorites" on public.user_favorites;
create policy "users can insert own favorites"
on public.user_favorites for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete own favorites" on public.user_favorites;
create policy "users can delete own favorites"
on public.user_favorites for delete to authenticated
using (auth.uid() = user_id);
