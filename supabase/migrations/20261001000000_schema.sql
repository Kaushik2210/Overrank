-- OVERRANK schema.
-- Point totals are never stored: they are derived from the append-only point_transactions ledger.

create type public.app_role as enum ('teacher', 'admin');
create type public.tx_status as enum ('active', 'reversed', 'pending');
create type public.achievement_rarity as enum ('common', 'rare', 'epic', 'legendary');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 40),
  slug text not null unique,
  color_primary text not null check (color_primary ~ '^#[0-9a-fA-F]{6}$'),
  color_glow text not null check (color_glow ~ '^#[0-9a-fA-F]{6}$'),
  motto text not null default '' check (char_length(motto) <= 80),
  created_at timestamptz not null default now()
);

create table public.students (
  student_id text primary key check (student_id ~ '^[0-9]{5,12}$'),
  name text not null check (char_length(name) between 1 and 120),
  team_id uuid not null references public.teams (id) on update cascade,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index students_team_idx on public.students (team_id);

-- One row per faculty account. Only faculty sign in; role lives here and clients can never write it.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'teacher',
  name text not null,
  created_at timestamptz not null default now()
);

create table public.point_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 40),
  slug text not null unique,
  icon text not null default 'Shapes',
  color text not null default '#94a3b8' check (color ~ '^#[0-9a-fA-F]{6}$')
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  points integer not null default 0 check (points between 0 and 5000),
  category_id uuid not null references public.point_categories (id),
  location text not null default 'TBA',
  winner_team_id uuid references public.teams (id) on delete set null,
  registered_base integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.event_teams (
  event_id uuid not null references public.events (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  primary key (event_id, team_id)
);

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on update cascade,
  team_id uuid not null references public.teams (id) on update cascade,
  amount integer not null check (amount <> 0 and abs(amount) <= 5000),
  type text generated always as (case when amount < 0 then 'deduction' else 'award' end) stored,
  category_id uuid not null references public.point_categories (id),
  reason text not null check (char_length(reason) between 1 and 300),
  event_id uuid references public.events (id) on delete set null,
  awarded_by uuid references auth.users (id) on delete set null,
  awarded_by_name text not null default 'System',
  status public.tx_status not null default 'active',
  evidence_path text,
  reverses_id uuid references public.point_transactions (id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index tx_student_idx on public.point_transactions (student_id, created_at desc);
create index tx_team_idx on public.point_transactions (team_id, created_at desc);
create index tx_created_idx on public.point_transactions (created_at desc);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  description text not null default '',
  icon text not null default 'Award',
  rarity public.achievement_rarity not null default 'common',
  xp integer not null default 0 check (xp >= 0),
  -- {"kind":"manual"} | {"kind":"points","threshold":n} | {"kind":"category","categoryId":uuid,"threshold":n}
  rule jsonb not null default '{"kind":"manual"}',
  is_demo boolean not null default false
);

create table public.student_achievements (
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  student_id text not null references public.students (student_id) on update cascade on delete cascade,
  unlocked_at timestamptz not null default now(),
  is_demo boolean not null default false,
  primary key (achievement_id, student_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null,
  action text not null,
  target text not null default '',
  detail text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index audit_created_idx on public.audit_logs (created_at desc);

create table public.settings (
  key text primary key,
  value jsonb not null
);

-- one-time first-login codes (hashed). Only the service role touches this table.
-- tiny public pulse table. Realtime listeners subscribe here instead of the private ledger.
create table public.rank_events (
  id bigint generated always as identity primary key,
  team_id uuid not null,
  created_at timestamptz not null default now()
);

create or replace function public.log_rank_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.rank_events (team_id) values (new.team_id);
  delete from public.rank_events where created_at < now() - interval '1 day';
  return new;
end $$;

create trigger tx_rank_event after insert on public.point_transactions
  for each row execute function public.log_rank_event();

-- A transaction's team is always the student's team at that moment. Block tampering.
create or replace function public.tx_enforce_team() returns trigger
language plpgsql as $$
begin
  select team_id into new.team_id from public.students where student_id = new.student_id;
  return new;
end $$;
create trigger tx_team_guard before insert on public.point_transactions
  for each row execute function public.tx_enforce_team();

-- The ledger is append-only. Only the status flag may change (active -> reversed).
create or replace function public.tx_append_only() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    -- only flagged demo rows may ever be removed (seed:demo:clear); real history is permanent
    if old.is_demo then return old; end if;
    raise exception 'point_transactions rows cannot be deleted';
  end if;
  if (new.id, new.student_id, new.team_id, new.amount, new.category_id, new.reason, new.created_at)
     is distinct from (old.id, old.student_id, old.team_id, old.amount, old.category_id, old.reason, old.created_at) then
    raise exception 'point_transactions rows are immutable; add a compensating row instead';
  end if;
  return new;
end $$;
create trigger tx_immutable before update or delete on public.point_transactions
  for each row execute function public.tx_append_only();

-- Derived totals. Reversed rows keep their amount and are cancelled by their compensating row,
-- so only pending rows are excluded.
create view public.student_points as
  select s.student_id, s.team_id, coalesce(sum(t.amount) filter (where t.status <> 'pending'), 0)::integer as points
  from public.students s
  left join public.point_transactions t on t.student_id = s.student_id
  group by s.student_id, s.team_id;

create view public.team_points as
  select tm.id as team_id, tm.name, tm.slug, tm.color_primary, tm.color_glow,
         coalesce(sum(t.amount) filter (where t.status <> 'pending'), 0)::integer as points,
         coalesce(sum(t.amount) filter (where t.status <> 'pending' and t.created_at > now() - interval '7 days'), 0)::integer as week_points
  from public.teams tm
  left join public.point_transactions t on t.team_id = tm.id
  group by tm.id;

insert into public.settings (key, value) values
  ('xp', '{"xpPerPoint": 1, "thresholds": [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000]}'),
  ('site', '{"siteName": "OVERRANK", "tagline": "EVERY POINT COUNTS."}');
