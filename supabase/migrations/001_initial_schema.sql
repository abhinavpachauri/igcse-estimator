-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Subjects ────────────────────────────────────────────────────────────────
create table if not exists subjects (
  id            uuid primary key default gen_random_uuid(),
  syllabus_code text unique not null,
  name          text not null,
  has_tiers     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── Papers ──────────────────────────────────────────────────────────────────
create table if not exists papers (
  id                 uuid primary key default gen_random_uuid(),
  subject_id         uuid not null references subjects(id) on delete cascade,
  paper_number       text not null,
  name               text not null,
  tier               text check (tier in ('Core', 'Extended')),
  is_ums             boolean not null default false,
  max_raw_mark       integer not null,
  max_ums_mark       integer,
  weight_percentage  numeric not null,
  created_at         timestamptz not null default now(),
  unique (subject_id, paper_number, tier)
);

-- ─── Series ──────────────────────────────────────────────────────────────────
create table if not exists series (
  id      uuid primary key default gen_random_uuid(),
  year    integer not null,
  season  text not null check (season in ('FM', 'MJ', 'ON')),
  unique (year, season)
);

-- ─── Grade Thresholds (component / paper level) ───────────────────────────────
create table if not exists grade_thresholds (
  id         uuid primary key default gen_random_uuid(),
  paper_id   uuid not null references papers(id) on delete cascade,
  series_id  uuid not null references series(id) on delete cascade,
  grade      text not null check (grade in ('A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U')),
  min_mark   integer not null,
  created_at timestamptz not null default now(),
  unique (paper_id, series_id, grade)
);

-- ─── Subject Thresholds (overall / weighted level) ────────────────────────────
create table if not exists subject_thresholds (
  id         uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  series_id  uuid not null references series(id) on delete cascade,
  tier       text check (tier in ('Core', 'Extended')),
  grade      text not null check (grade in ('A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U')),
  min_mark   integer not null,
  max_mark   integer not null,
  created_at timestamptz not null default now(),
  unique (subject_id, series_id, tier, grade)
);

-- ─── User Profiles ────────────────────────────────────────────────────────────
create table if not exists user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ─── Saved Estimates ──────────────────────────────────────────────────────────
create table if not exists saved_estimates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references user_profiles(id) on delete cascade,
  session_id text,
  label      text,
  result     jsonb,
  created_at timestamptz not null default now(),
  constraint chk_owner check (user_id is not null or session_id is not null)
);

create index if not exists idx_saved_estimates_user_id    on saved_estimates(user_id);
create index if not exists idx_saved_estimates_session_id on saved_estimates(session_id);

-- ─── Estimate Entries ─────────────────────────────────────────────────────────
create table if not exists estimate_entries (
  id             uuid primary key default gen_random_uuid(),
  estimate_id    uuid not null references saved_estimates(id) on delete cascade,
  subject_id     uuid not null references subjects(id),
  tier_selected  text check (tier_selected in ('Core', 'Extended')),
  paper_marks    jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_estimate_entries_estimate_id on estimate_entries(estimate_id);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

-- Public read access for static data
alter table subjects          enable row level security;
alter table papers            enable row level security;
alter table series            enable row level security;
alter table grade_thresholds  enable row level security;
alter table subject_thresholds enable row level security;

create policy "Public can read subjects"
  on subjects for select using (true);

create policy "Public can read papers"
  on papers for select using (true);

create policy "Public can read series"
  on series for select using (true);

create policy "Public can read grade_thresholds"
  on grade_thresholds for select using (true);

create policy "Public can read subject_thresholds"
  on subject_thresholds for select using (true);

-- User profiles
alter table user_profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Saved estimates
alter table saved_estimates enable row level security;

create policy "Users can read own estimates"
  on saved_estimates for select
  using (auth.uid() = user_id);

create policy "Users can insert own estimates"
  on saved_estimates for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete own estimates"
  on saved_estimates for delete
  using (auth.uid() = user_id);

create policy "Users can update own estimates"
  on saved_estimates for update
  using (auth.uid() = user_id);

-- Estimate entries
alter table estimate_entries enable row level security;

create policy "Users can read own estimate entries"
  on estimate_entries for select
  using (
    exists (
      select 1 from saved_estimates se
      where se.id = estimate_entries.estimate_id
        and se.user_id = auth.uid()
    )
  );

create policy "Users can insert own estimate entries"
  on estimate_entries for insert
  with check (
    exists (
      select 1 from saved_estimates se
      where se.id = estimate_entries.estimate_id
        and (se.user_id = auth.uid() or se.user_id is null)
    )
  );

create policy "Users can delete own estimate entries"
  on estimate_entries for delete
  using (
    exists (
      select 1 from saved_estimates se
      where se.id = estimate_entries.estimate_id
        and se.user_id = auth.uid()
    )
  );

-- ─── Trigger: auto-create user profile on signup ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
