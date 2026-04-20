-- MendLog — v0 schema
-- Paste this into the Supabase SQL editor and run.
-- Safe to re-run: every object uses `if not exists` or `create or replace`.

-- ── Extensions ───────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Enum types ───────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('open', 'awaiting-tl', 'complete');
  end if;
  if not exists (select 1 from pg_type where typname = 'job_lang') then
    create type public.job_lang as enum ('en', 'si');
  end if;
end$$;

-- ── jobs table ───────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id                 bigserial primary key,
  user_id            uuid not null references auth.users(id) on delete cascade default auth.uid(),
  machine            text not null,
  dept               text not null,
  inv                text,
  date               date not null default current_date,
  reported_time      time not null default (now() at time zone 'utc')::time,
  idle_minutes       int  not null default 0,
  status             public.job_status not null default 'open',
  lang               public.job_lang   not null default 'en',
  photos             int  not null default 0,
  clips              int  not null default 0,
  root_cause         text not null default '',
  description        text not null default '',
  corrective_action  text not null default '',
  remarks            text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists jobs_user_date_idx on public.jobs (user_id, date desc);

-- ── updated_at trigger ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.jobs enable row level security;

drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own"
  on public.jobs for select
  using (auth.uid() = user_id);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own"
  on public.jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- ── Activity helper: jobs per day for the authed user ───────────────────
create or replace function public.activity_per_day(start_date date, end_date date)
returns table(day date, count int)
language sql
security invoker
stable
as $$
  select date as day, count(*)::int as count
  from public.jobs
  where user_id = auth.uid()
    and date between start_date and end_date
  group by date
  order by date;
$$;
