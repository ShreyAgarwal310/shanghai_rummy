create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  preferred_name text,
  bio text,
  avatar_url text,
  invite_notifications boolean not null default true,
  accessibility_preferences jsonb not null default jsonb_build_object(
    'highContrast', false,
    'reducedMotion', false,
    'largerText', false,
    'screenReaderHints', false,
    'colorAssistLabels', false
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.player_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  total_points integer not null default 0,
  average_score numeric(10,2) not null default 0,
  best_score integer,
  worst_score integer,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  total_melds integer not null default 0,
  perfect_rounds integer not null default 0,
  favorite_round text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leaderboard_period_stats (
  user_id uuid not null references public.profiles (id) on delete cascade,
  timeframe text not null check (timeframe in ('weekly', 'monthly')),
  period_start date not null,
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  total_points integer not null default 0,
  average_score numeric(10,2) not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, timeframe, period_start)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(excluded.display_name, public.profiles.display_name),
      updated_at = timezone('utc', now());

  insert into public.player_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_player_stats_updated_at on public.player_stats;
create trigger set_player_stats_updated_at
before update on public.player_stats
for each row execute procedure public.set_updated_at();

drop trigger if exists set_leaderboard_period_stats_updated_at on public.leaderboard_period_stats;
create trigger set_leaderboard_period_stats_updated_at
before update on public.leaderboard_period_stats
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.player_stats enable row level security;
alter table public.leaderboard_period_stats enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
on public.profiles
for select
using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "player stats are viewable by everyone" on public.player_stats;
create policy "player stats are viewable by everyone"
on public.player_stats
for select
using (true);

drop policy if exists "leaderboard period stats are viewable by everyone" on public.leaderboard_period_stats;
create policy "leaderboard period stats are viewable by everyone"
on public.leaderboard_period_stats
for select
using (true);

create or replace view public.leaderboard_all_time as
select
  p.id as user_id,
  coalesce(nullif(p.display_name, ''), nullif(p.preferred_name, ''), split_part(coalesce(p.email, 'player'), '@', 1)) as player_name,
  s.wins,
  s.games_played,
  case
    when s.games_played = 0 then 0
    else round((s.wins::numeric / s.games_played::numeric) * 100, 2)
  end as win_rate,
  s.average_score,
  s.current_streak
from public.player_stats s
join public.profiles p on p.id = s.user_id;

create or replace view public.leaderboard_current_weekly as
select
  p.id as user_id,
  coalesce(nullif(p.display_name, ''), nullif(p.preferred_name, ''), split_part(coalesce(p.email, 'player'), '@', 1)) as player_name,
  lps.wins,
  lps.games_played,
  case
    when lps.games_played = 0 then 0
    else round((lps.wins::numeric / lps.games_played::numeric) * 100, 2)
  end as win_rate,
  lps.average_score,
  lps.current_streak
from public.leaderboard_period_stats lps
join public.profiles p on p.id = lps.user_id
where lps.timeframe = 'weekly'
  and lps.period_start = date_trunc('week', timezone('utc', now()))::date;

create or replace view public.leaderboard_current_monthly as
select
  p.id as user_id,
  coalesce(nullif(p.display_name, ''), nullif(p.preferred_name, ''), split_part(coalesce(p.email, 'player'), '@', 1)) as player_name,
  lps.wins,
  lps.games_played,
  case
    when lps.games_played = 0 then 0
    else round((lps.wins::numeric / lps.games_played::numeric) * 100, 2)
  end as win_rate,
  lps.average_score,
  lps.current_streak
from public.leaderboard_period_stats lps
join public.profiles p on p.id = lps.user_id
where lps.timeframe = 'monthly'
  and lps.period_start = date_trunc('month', timezone('utc', now()))::date;
