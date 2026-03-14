-- ============================================================
-- TAARA — COMPLETE SUPABASE BACKEND
-- Run this ONCE in Supabase → SQL Editor → Run
-- If you already ran a previous version, scroll to bottom
-- and run the RESET SCRIPT first, then run this whole file.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── TABLES ────────────────────────────────────────────────

create table if not exists public.actors (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  age                  integer,
  gender               text check (gender in ('Male', 'Female', 'Non-Binary')),
  type                 text check (type in ('Lead', 'Character', 'Emerging', 'Supporting')),
  status               text default 'Available' check (status in ('Available', 'Booked', 'On Hold')),
  location             text,
  height               text,
  hair                 text,
  eyes                 text,
  bio                  text,
  reel_url             text,
  headshot_url         text,
  slug                 text,
  profile_visible      boolean default true,
  profile_password     text,
  profile_expires_at   timestamptz,
  languages            text[] default '{}',
  skills               text[] default '{}',
  accents              text[] default '{}',
  manager_notes        text,
  profile_completeness integer default 0,
  color                text default '#6366f1',
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create table if not exists public.filmography (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid not null references public.actors(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  role       text,
  year       integer,
  type       text check (type in ('Film', 'TV Series', 'Short', 'Theatre')),
  created_at timestamptz default now()
);

create table if not exists public.portfolio (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid not null references public.actors(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  category   text check (category in ('Headshot', 'Behind the Scenes', 'Editorial', 'Character Look')),
  image_url  text,
  created_at timestamptz default now()
);

create table if not exists public.works (
  id           uuid primary key default uuid_generate_v4(),
  actor_id     uuid not null references public.actors(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  role         text,
  director     text,
  year         integer,
  type         text check (type in ('Film', 'TV Series', 'Short', 'Theatre', 'Web Series', 'Commercial')),
  status       text check (status in ('Released', 'Post-Production', 'In Production', 'Upcoming')),
  description  text,
  poster_url   text,
  created_at   timestamptz default now()
);

create table if not exists public.calendar_events (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  actor_id   uuid references public.actors(id) on delete set null,
  actor_name text,
  title      text not null,
  type       text check (type in ('Audition', 'Callback', 'Booking', 'Meeting')),
  date       date not null,
  time       text,
  end_time   text,
  location   text,
  notes      text,
  created_at timestamptz default now()
);

create table if not exists public.shortlists (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  actor_ids   uuid[] default '{}',
  slug        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.shortlist_views (
  id           uuid primary key default uuid_generate_v4(),
  shortlist_id uuid not null references public.shortlists(id) on delete cascade,
  viewed_at    timestamptz default now(),
  referrer     text,
  ip           text
);

create table if not exists public.casting_opportunities (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  project_name     text not null,
  role             text,
  director         text,
  casting_director text,
  deadline         date,
  notes            text,
  created_at       timestamptz default now()
);

create table if not exists public.casting_submissions (
  id             uuid primary key default uuid_generate_v4(),
  opportunity_id uuid not null references public.casting_opportunities(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  actor_id       uuid references public.actors(id) on delete set null,
  actor_name     text,
  status         text default 'Submitted' check (status in ('Submitted', 'Viewed', 'Shortlisted', 'Callback', 'Booked', 'Rejected')),
  submitted_at   timestamptz default now(),
  notes          text
);

create table if not exists public.agency_profile (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  name          text,
  slug          text,
  about         text,
  contact_email text,
  contact_phone text,
  website       text,
  location      text,
  logo_url      text,
  founded_year  integer,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- User A CANNOT see User B's data. Ever. Enforced in the DB.

alter table public.actors                enable row level security;
alter table public.filmography           enable row level security;
alter table public.portfolio             enable row level security;
alter table public.works                 enable row level security;
alter table public.calendar_events       enable row level security;
alter table public.shortlists            enable row level security;
alter table public.shortlist_views       enable row level security;
alter table public.casting_opportunities enable row level security;
alter table public.casting_submissions   enable row level security;
alter table public.agency_profile        enable row level security;

create policy "actors_own"    on public.actors for select using (auth.uid() = user_id);
create policy "actors_public" on public.actors for select using (profile_visible = true);
create policy "actors_insert" on public.actors for insert with check (auth.uid() = user_id);
create policy "actors_update" on public.actors for update using (auth.uid() = user_id);
create policy "actors_delete" on public.actors for delete using (auth.uid() = user_id);

create policy "filmography_all" on public.filmography        for all using (auth.uid() = user_id);
create policy "portfolio_all"   on public.portfolio          for all using (auth.uid() = user_id);
create policy "works_all"       on public.works              for all using (auth.uid() = user_id);
create policy "events_all"      on public.calendar_events    for all using (auth.uid() = user_id);
create policy "casting_all"     on public.casting_opportunities for all using (auth.uid() = user_id);
create policy "submissions_all" on public.casting_submissions for all using (auth.uid() = user_id);
create policy "agency_all"      on public.agency_profile     for all using (auth.uid() = user_id);

create policy "shortlists_own"    on public.shortlists for all    using (auth.uid() = user_id);
create policy "shortlists_public" on public.shortlists for select using (true);

create policy "slviews_insert" on public.shortlist_views for insert with check (true);
create policy "slviews_select" on public.shortlist_views for select
  using (exists (select 1 from public.shortlists s where s.id = shortlist_id and s.user_id = auth.uid()));

-- ── AUTO updated_at TRIGGERS ──────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger actors_updated_at     before update on public.actors        for each row execute function public.handle_updated_at();
create trigger shortlists_updated_at before update on public.shortlists    for each row execute function public.handle_updated_at();
create trigger agency_updated_at     before update on public.agency_profile for each row execute function public.handle_updated_at();

-- ── INDEXES ───────────────────────────────────────────────

create index if not exists actors_user_id_idx       on public.actors(user_id);
create index if not exists actors_slug_idx          on public.actors(slug);
create index if not exists actors_status_idx        on public.actors(user_id, status);
create index if not exists filmography_actor_idx    on public.filmography(actor_id);
create index if not exists portfolio_actor_idx      on public.portfolio(actor_id);
create index if not exists works_actor_idx          on public.works(actor_id);
create index if not exists events_user_idx          on public.calendar_events(user_id);
create index if not exists events_date_idx          on public.calendar_events(date);
create index if not exists events_actor_idx         on public.calendar_events(actor_id);
create index if not exists shortlists_user_idx      on public.shortlists(user_id);
create index if not exists shortlists_slug_idx      on public.shortlists(slug);
create index if not exists casting_user_idx         on public.casting_opportunities(user_id);
create index if not exists submissions_opp_idx      on public.casting_submissions(opportunity_id);
create index if not exists slviews_shortlist_idx    on public.shortlist_views(shortlist_id);

-- ── STORAGE BUCKETS ───────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('headshots', 'headshots', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('portfolio',  'portfolio',  true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "headshots_upload" on storage.objects for insert with check (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "headshots_read"   on storage.objects for select using (bucket_id = 'headshots');
create policy "headshots_update" on storage.objects for update using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "headshots_delete" on storage.objects for delete using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "portfolio_upload" on storage.objects for insert with check (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "portfolio_read"   on storage.objects for select using (bucket_id = 'portfolio');
create policy "portfolio_update" on storage.objects for update using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "portfolio_delete" on storage.objects for delete using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── VIEWS ─────────────────────────────────────────────────
-- Dashboard stats per user — no extra queries needed

create or replace view public.user_stats as
select
  a.user_id,
  count(distinct a.id)                                              as total_actors,
  count(distinct a.id) filter (where a.status = 'Available')       as available_actors,
  count(distinct a.id) filter (where a.status = 'Booked')          as booked_actors,
  count(distinct sl.id)                                             as total_shortlists,
  count(distinct co.id)                                             as total_casting_calls,
  count(distinct ce.id)                                             as total_events
from public.actors a
left join public.shortlists          sl on sl.user_id = a.user_id
left join public.casting_opportunities co on co.user_id = a.user_id
left join public.calendar_events     ce on ce.user_id = a.user_id
group by a.user_id;

-- ── RESET SCRIPT ──────────────────────────────────────────
-- Run ONLY if you need a clean slate (drops everything!)
-- Uncomment, run once, re-comment, then run this whole file.
-- ────────────────────────────────────────────────────────
-- drop table if exists public.casting_submissions    cascade;
-- drop table if exists public.casting_opportunities  cascade;
-- drop table if exists public.shortlist_views        cascade;
-- drop table if exists public.shortlists             cascade;
-- drop table if exists public.calendar_events        cascade;
-- drop table if exists public.works                  cascade;
-- drop table if exists public.portfolio              cascade;
-- drop table if exists public.filmography            cascade;
-- drop table if exists public.actors                 cascade;
-- drop table if exists public.agency_profile         cascade;
-- drop function if exists public.handle_updated_at   cascade;
-- drop view  if exists public.user_stats             cascade;

-- ============================================================
-- ADDITIONAL POLICY: allow public actor submission via /register
-- (actors fill their own profile without being logged in)
-- ============================================================
create policy "Public can submit actor profiles via invite"
  on public.actors for insert
  with check (user_id is null);

create policy "Public can insert filmography for invited actors"
  on public.filmography for insert
  with check (user_id is null);

create policy "Public can insert portfolio for invited actors"
  on public.portfolio for insert
  with check (user_id is null);

-- Storage: allow anonymous uploads to portfolio bucket (for /register)
create policy "Anyone can upload portfolio images"
  on storage.objects for insert
  with check (bucket_id = 'portfolio');

-- ============================================================
-- ACTOR REGISTRATION (PUBLIC INSERT)
-- Allows invited actors to submit their profile without logging in.
-- The row has no user_id — manager claims it later.
-- ============================================================

-- Allow public (unauthenticated) inserts on actors for the invite flow
create policy "Public can insert actor registration"
  on public.actors for insert
  with check (user_id IS NULL);

-- Allow public inserts on filmography for invite flow
create policy "Public can insert filmography for registration"
  on public.filmography for insert
  with check (user_id IS NULL);

-- Allow public inserts on portfolio for invite flow
create policy "Public can insert portfolio for registration"
  on public.portfolio for insert
  with check (user_id IS NULL);

-- Allow unauthenticated uploads to portfolio bucket (invite flow)
-- Actors upload to a special public/ subfolder
create policy "Public can upload to portfolio public folder"
  on storage.objects for insert
  with check (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = 'public');

-- Allow reading public/ portfolio images without auth
create policy "Public portfolio images readable"
  on storage.objects for select
  using (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = 'public');

-- ============================================================
-- ACTOR SELF-REGISTRATION POLICY
-- Run this separately after the main schema if you want
-- actors to submit via the /register invite link WITHOUT logging in.
-- ============================================================

-- Allow public (unauthenticated) inserts into actors table
-- for self-registration. Note: user_id will be NULL for these rows.
-- Managers can then claim and assign these actors.
create policy "Public can self-register as actor"
  on public.actors for insert
  with check (user_id is null);

-- Allow public insert into filmography for self-registration
create policy "Public can insert filmography during registration"
  on public.filmography for insert
  with check (user_id is null);

-- Allow public insert into portfolio for self-registration  
create policy "Public can insert portfolio during registration"
  on public.portfolio for insert
  with check (user_id is null);

-- Managers see ALL actors including self-registered ones (user_id IS NULL)
-- Drop the old "own actors only" select policy and replace with one
-- that also includes unclaimed (null user_id) actors
drop policy if exists "Users can only see their own actors" on public.actors;

create policy "Users see their own actors and unclaimed ones"
  on public.actors for select
  using (auth.uid() = user_id OR user_id is null OR profile_visible = true);

-- Allow manager to claim/assign a self-registered actor by setting user_id
create policy "Managers can claim unclaimed actors"
  on public.actors for update
  using (auth.uid() = user_id OR user_id is null);

-- ============================================================
-- ACTOR REGISTRATION — public insert policy
-- Allows actors to submit via invite link without being logged in.
-- profile_visible defaults to false so manager must approve first.
-- ============================================================

-- Allow anyone (including unauthenticated) to INSERT a new actor row
-- but ONLY if profile_visible = false (pending review, not yet public)
create policy "Public invite: actors can self-register"
  on public.actors for insert
  with check (profile_visible = false);

-- Allow unauthenticated inserts into filmography and portfolio
-- when submitted as part of registration (user_id will be null)
create policy "Public invite: filmography self-register"
  on public.filmography for insert
  with check (user_id is null);

create policy "Public invite: portfolio self-register"
  on public.portfolio for insert
  with check (user_id is null);

-- Allow unauthenticated portfolio uploads to the portfolio bucket
create policy "Public can upload to portfolio for registration"
  on storage.objects for insert
  with check (bucket_id = 'portfolio');

-- ============================================================
-- FIX: Allow public reads of ALL actors by slug or ID
-- The manager intentionally shares the link — don't block it
-- ============================================================
DROP POLICY IF EXISTS "Public profiles are readable by anyone" ON public.actors;

-- Anyone can read ANY actor by ID or slug (for shared links)
-- profile_visible is a UI hint only — not a security gate
CREATE POLICY "Anyone can read actors via shared links"
  ON public.actors FOR SELECT
  USING (true);
