-- IFC ACADEMY - SAFE PRODUCTION MIGRATION
-- IMPORTANT: This file does NOT drop, truncate, reset, or recreate existing production tables.
-- Run once in Supabase SQL Editor. Existing rows are preserved.

create extension if not exists pgcrypto;

-- Compatibility columns required by the existing application model.
alter table public.players add column if not exists notes text;
alter table public.players add column if not exists membership_type text;
alter table public.players add column if not exists subscription_duration text;
alter table public.players add column if not exists price numeric default 0;
alter table public.players add column if not exists payment_method text;
alter table public.players add column if not exists start_date date;
alter table public.players add column if not exists end_date date;

alter table public.payments add column if not exists subscription_id uuid;
alter table public.payments add column if not exists paid_by text;
alter table public.payments add column if not exists notes text;

alter table public.attendance add column if not exists team_group text;
alter table public.attendance add column if not exists notes text;

alter table public.subscriptions add column if not exists player_name text;
alter table public.subscriptions add column if not exists player_code text;
alter table public.subscriptions add column if not exists team_group text;
alter table public.subscriptions add column if not exists plan_name text default 'اشتراك';
alter table public.subscriptions add column if not exists value numeric default 0;
alter table public.subscriptions add column if not exists start_date date;
alter table public.subscriptions add column if not exists end_date date;
alter table public.subscriptions add column if not exists status text default 'Unpaid';
alter table public.subscriptions add column if not exists last_payment_date date;
alter table public.subscriptions add column if not exists last_paid_by text;

-- Attendance writes are implemented as update-or-insert in the API so existing duplicate rows are preserved.

-- New features only: create only if missing.
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  assigned_group text,
  role text,
  monthly_salary numeric not null default 0,
  joined_date date,
  status text not null default 'Active',
  notes text,
  total_salaries_paid numeric not null default 0,
  last_payout_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_payouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete restrict,
  coach_name text not null,
  amount numeric not null,
  payout_date date not null,
  notes text,
  payment_method text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  amount numeric not null,
  date date not null,
  description text not null,
  category text,
  coach_name text,
  notes text,
  user_id uuid,
  payment_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  description text not null,
  timestamp timestamptz not null default now(),
  status text not null default 'SUCCESS'
);

create table if not exists public.academy_settings (
  id text primary key,
  academy_name text not null default 'IFC ACADEMY',
  phone text,
  address text,
  currency text not null default 'EGP',
  default_monthly_fee numeric not null default 0,
  admin_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  player_id uuid,
  date timestamptz not null default now(),
  read boolean not null default false
);

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null,
  filename text not null,
  google_drive_file_id text,
  file_size text,
  error text,
  created_at timestamptz not null default now()
);

-- Non-destructive indexes for production search and date filters.
create index if not exists idx_users_username on public.users(username);
create index if not exists idx_players_code on public.players(code);
create index if not exists idx_players_name on public.players(name);
create index if not exists idx_players_team_group on public.players(team_group);
create index if not exists idx_attendance_player_date on public.attendance(player_id, attendance_date);
create index if not exists idx_attendance_date on public.attendance(attendance_date);
create index if not exists idx_payments_player_date on public.payments(player_id, payment_date);
create index if not exists idx_payments_invoice_no on public.payments(invoice_no);
create index if not exists idx_payments_date on public.payments(payment_date);
create index if not exists idx_subscriptions_player on public.subscriptions("playerId");
create index if not exists idx_subscriptions_end_date on public.subscriptions(end_date);
create index if not exists idx_coaches_name on public.coaches(name);

-- Keep the production tables protected by RLS. Server-side service-role access bypasses RLS.
alter table public.coaches enable row level security;
alter table public.coach_payouts enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.academy_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.backups enable row level security;
