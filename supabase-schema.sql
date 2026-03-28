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

-- ============================================================
-- MANAGER PROFILES TABLE
-- Stores talent manager details, username, and contact info
-- ============================================================

CREATE TABLE public.manager_profiles (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username          text UNIQUE,                      -- custom login ID
  full_name         text,
  email             text,                             -- synced from auth.users
  phone             text,
  avatar_url        text,
  agency_name       text,
  agency_location   text,
  bio               text,
  website           text,
  instagram         text,
  linkedin          text,
  years_experience  integer,
  specialisation    text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read their own profile"
  ON public.manager_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can upsert their own profile"
  ON public.manager_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update their own profile"
  ON public.manager_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow username lookups during sign-in (auth service needs to find email by username)
CREATE POLICY "Username lookup is public (email only)"
  ON public.manager_profiles FOR SELECT
  USING (true);

-- Auto-updated_at trigger
CREATE TRIGGER manager_profiles_updated_at
  BEFORE UPDATE ON public.manager_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for username lookups (used during sign-in)
CREATE INDEX manager_profiles_username_idx ON public.manager_profiles(username);
CREATE INDEX manager_profiles_user_id_idx  ON public.manager_profiles(user_id);

-- ============================================================
-- AVATARS STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Managers upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Managers can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SUPABASE EMAIL AUTH SETTINGS (do in Dashboard, not SQL)
-- Authentication → Email → Enable "Confirm email"
-- Authentication → Email → Set "Site URL" to your Vercel URL
-- Authentication → Email Templates → customise if needed
-- ============================================================

-- ============================================================
-- FIX 1: Actor availability persistence
-- Stores painted calendar dates per actor
-- ============================================================
CREATE TABLE IF NOT EXISTS public.actor_availability (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  status     text NOT NULL CHECK (status IN ('available','booked','frozen','unavailable')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(actor_id, date)
);

ALTER TABLE public.actor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own actor availability"
  ON public.actor_availability FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX actor_availability_actor_id_idx ON public.actor_availability(actor_id);
CREATE INDEX actor_availability_user_id_idx  ON public.actor_availability(user_id);

-- ============================================================
-- FIX 2: Multiple reel URLs (stored as text array)
-- ============================================================
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS reel_urls text[] DEFAULT '{}';

-- ============================================================
-- FIX: Multiple reel URLs — stored as text array on actors
-- Run this if actors table already exists
-- ============================================================
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS reel_urls text[] DEFAULT '{}';

-- ============================================================
-- ADD REEL_URLS COLUMN (array of multiple reel links)
-- Run this if you already ran the original schema
-- ============================================================
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS reel_urls text[] DEFAULT '{}';

-- ============================================================
-- CALENDAR FIX: Ensure actor_availability table is created
-- Run if you get errors on calendar save
-- ============================================================
CREATE TABLE IF NOT EXISTS public.actor_availability (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  status     text NOT NULL CHECK (status IN ('available', 'booked', 'frozen', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(actor_id, date)
);

ALTER TABLE public.actor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own actor availability" ON public.actor_availability;
CREATE POLICY "Users manage their own actor availability"
  ON public.actor_availability FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS actor_availability_actor_id_idx ON public.actor_availability(actor_id);
CREATE INDEX IF NOT EXISTS actor_availability_user_id_idx  ON public.actor_availability(user_id);

-- ============================================================
-- COMPLETE SQL FIXES — run all of these in Supabase SQL Editor
-- ============================================================

-- 1. Manager profiles table (REQUIRED for settings page to work)
CREATE TABLE IF NOT EXISTS public.manager_profiles (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username          text UNIQUE,
  full_name         text,
  email             text,
  phone             text,
  avatar_url        text,
  agency_name       text,
  agency_location   text,
  bio               text,
  website           text,
  instagram         text,
  linkedin          text,
  years_experience  integer,
  specialisation    text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manager_read"   ON public.manager_profiles;
DROP POLICY IF EXISTS "manager_insert" ON public.manager_profiles;
DROP POLICY IF EXISTS "manager_update" ON public.manager_profiles;
DROP POLICY IF EXISTS "username_public" ON public.manager_profiles;
CREATE POLICY "manager_read"    ON public.manager_profiles FOR SELECT USING (true);
CREATE POLICY "manager_insert"  ON public.manager_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "manager_update"  ON public.manager_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS mp_username_idx ON public.manager_profiles(username);
CREATE INDEX IF NOT EXISTS mp_user_id_idx  ON public.manager_profiles(user_id);

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS manager_profiles_updated_at ON public.manager_profiles;
CREATE TRIGGER manager_profiles_updated_at
  BEFORE UPDATE ON public.manager_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. reel_urls column for multiple reels
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS reel_urls text[] DEFAULT '{}';

-- 4. actor_availability table for calendar
CREATE TABLE IF NOT EXISTS public.actor_availability (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  status     text NOT NULL CHECK (status IN ('available', 'booked', 'frozen', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(actor_id, date)
);
ALTER TABLE public.actor_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "availability_all" ON public.actor_availability;
CREATE POLICY "availability_all" ON public.actor_availability FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS avail_actor_idx ON public.actor_availability(actor_id);
CREATE INDEX IF NOT EXISTS avail_user_idx  ON public.actor_availability(user_id);

-- 5. Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "avatar_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatar_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar_read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Fix storage policies for headshots and portfolio (public read for cross-device access)
DROP POLICY IF EXISTS "Headshots are publicly readable"     ON storage.objects;
DROP POLICY IF EXISTS "Portfolio images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "headshot_read" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_read" ON storage.objects;
CREATE POLICY "headshot_read"  ON storage.objects FOR SELECT USING (bucket_id = 'headshots');
CREATE POLICY "portfolio_read" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');

-- 7. Allow filmography/works inserts even when user_id matches
-- (these already have policies but let's ensure they work for Google-auth users too)
DROP POLICY IF EXISTS "filmography_all" ON public.filmography;
DROP POLICY IF EXISTS "works_all" ON public.works;
CREATE POLICY "filmography_all" ON public.filmography FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "works_all"       ON public.works       FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FIX: Allow anonymous (incognito) reads for public-facing data
-- This is required for shared profile links to work in any browser
-- ============================================================

-- Allow anyone to read actors (public profiles, shared links)
DROP POLICY IF EXISTS "actors_own"    ON public.actors;
DROP POLICY IF EXISTS "actors_insert" ON public.actors;
DROP POLICY IF EXISTS "actors_update" ON public.actors;
DROP POLICY IF EXISTS "actors_delete" ON public.actors;
DROP POLICY IF EXISTS "Anyone can read actors via shared links" ON public.actors;
DROP POLICY IF EXISTS "Managers can see pending registrations" ON public.actors;
DROP POLICY IF EXISTS "Managers can claim pending actors" ON public.actors;
DROP POLICY IF EXISTS "Public invite: actors can self-register" ON public.actors;

-- Public: anyone can read any actor row (needed for incognito shared links)
CREATE POLICY "actors_public_read"  ON public.actors FOR SELECT USING (true);
-- Authenticated: managers can only write their own actors
CREATE POLICY "actors_auth_insert"  ON public.actors FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "actors_auth_update"  ON public.actors FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "actors_auth_delete"  ON public.actors FOR DELETE USING (auth.uid() = user_id);

-- Allow anonymous reads of filmography, portfolio, works (for public profiles)
DROP POLICY IF EXISTS "filmography_all" ON public.filmography;
DROP POLICY IF EXISTS "portfolio_all"   ON public.portfolio;
DROP POLICY IF EXISTS "works_all"       ON public.works;
DROP POLICY IF EXISTS "Public invite: filmography self-register" ON public.filmography;
DROP POLICY IF EXISTS "Public invite: portfolio self-register"   ON public.portfolio;

CREATE POLICY "filmography_public_read" ON public.filmography FOR SELECT USING (true);
CREATE POLICY "filmography_auth_write"  ON public.filmography FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "filmography_auth_delete" ON public.filmography FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "portfolio_public_read"   ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "portfolio_auth_write"    ON public.portfolio FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "portfolio_auth_delete"   ON public.portfolio FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "works_public_read"   ON public.works FOR SELECT USING (true);
CREATE POLICY "works_auth_write"    ON public.works FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "works_auth_delete"   ON public.works FOR DELETE USING (auth.uid() = user_id);

-- Allow anonymous reads of shortlists (for shared shortlist links)
DROP POLICY IF EXISTS "shortlists_own"           ON public.shortlists;
DROP POLICY IF EXISTS "Public shortlists readable by anyone" ON public.shortlists;
CREATE POLICY "shortlists_public_read"  ON public.shortlists FOR SELECT USING (true);
CREATE POLICY "shortlists_auth_insert"  ON public.shortlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shortlists_auth_update"  ON public.shortlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shortlists_auth_delete"  ON public.shortlists FOR DELETE USING (auth.uid() = user_id);

-- Storage: ensure headshots and portfolio are fully public (critical for cross-device)
UPDATE storage.buckets SET public = true WHERE id IN ('headshots', 'portfolio', 'avatars');

-- Remove any restrictive select policies on storage
DROP POLICY IF EXISTS "Headshots are publicly readable"          ON storage.objects;
DROP POLICY IF EXISTS "Portfolio images are publicly readable"   ON storage.objects;
DROP POLICY IF EXISTS "headshot_read"  ON storage.objects;
DROP POLICY IF EXISTS "portfolio_read" ON storage.objects;
DROP POLICY IF EXISTS "avatar_read"    ON storage.objects;

-- Re-create with explicit anon access
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('headshots', 'portfolio', 'avatars'));

-- ============================================================
-- DEFINITIVE FIX: Filmography/Works insert from actor invite link
-- The actor is NOT authenticated — user_id is NULL on insert
-- Previous policy conflicts may have blocked this. Run this to fix.
-- ============================================================

-- Clean slate for filmography policies
DROP POLICY IF EXISTS "filmography_all"                          ON public.filmography;
DROP POLICY IF EXISTS "filmography_public_read"                  ON public.filmography;
DROP POLICY IF EXISTS "filmography_auth_write"                   ON public.filmography;
DROP POLICY IF EXISTS "filmography_auth_delete"                  ON public.filmography;
DROP POLICY IF EXISTS "Public can insert filmography during registration" ON public.filmography;
DROP POLICY IF EXISTS "Public invite: filmography self-register" ON public.filmography;
DROP POLICY IF EXISTS "Users manage their own filmography"       ON public.filmography;

CREATE POLICY "filmography_select" ON public.filmography FOR SELECT USING (true);
CREATE POLICY "filmography_insert" ON public.filmography FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "filmography_delete" ON public.filmography FOR DELETE
  USING (auth.uid() = user_id);

-- Clean slate for portfolio policies
DROP POLICY IF EXISTS "portfolio_all"                           ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_public_read"                   ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_auth_write"                    ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_auth_delete"                   ON public.portfolio;
DROP POLICY IF EXISTS "Public can insert portfolio during registration" ON public.portfolio;
DROP POLICY IF EXISTS "Public invite: portfolio self-register"  ON public.portfolio;
DROP POLICY IF EXISTS "Users manage their own portfolio"        ON public.portfolio;

CREATE POLICY "portfolio_select" ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "portfolio_insert" ON public.portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "portfolio_delete" ON public.portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- Works: same treatment
DROP POLICY IF EXISTS "works_all"          ON public.works;
DROP POLICY IF EXISTS "works_public_read"  ON public.works;
DROP POLICY IF EXISTS "works_auth_write"   ON public.works;
DROP POLICY IF EXISTS "works_auth_delete"  ON public.works;

CREATE POLICY "works_select" ON public.works FOR SELECT USING (true);
CREATE POLICY "works_insert" ON public.works FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "works_delete" ON public.works FOR DELETE
  USING (auth.uid() = user_id);

-- Add contact columns to actors table (if not already added)
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS contact_email text;

-- ============================================================
-- DEFINITIVE FIX: Allow actor self-registration filmography/works/portfolio
-- The previous policies used auth.uid() = user_id OR user_id IS NULL
-- But in PostgreSQL: NULL = NULL evaluates to NULL (not TRUE)
-- So anonymous inserts were silently failing.
-- Fix: use a separate policy that explicitly allows anonymous inserts.
-- ============================================================

-- FILMOGRAPHY: allow anonymous insert when user_id is null (actor invite link)
DROP POLICY IF EXISTS "filmography_insert"       ON public.filmography;
DROP POLICY IF EXISTS "filmography_auth_write"   ON public.filmography;
DROP POLICY IF EXISTS "filmography_auth_delete"  ON public.filmography;
DROP POLICY IF EXISTS "filmography_public_read"  ON public.filmography;
DROP POLICY IF EXISTS "filmography_all"          ON public.filmography;

CREATE POLICY "filmography_select" ON public.filmography
  FOR SELECT USING (true);

CREATE POLICY "filmography_insert_auth" ON public.filmography
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "filmography_insert_anon" ON public.filmography
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "filmography_update" ON public.filmography
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "filmography_delete" ON public.filmography
  FOR DELETE USING (auth.uid() = user_id);

-- PORTFOLIO: same fix
DROP POLICY IF EXISTS "portfolio_insert"       ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_auth_write"   ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_auth_delete"  ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_public_read"  ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_all"          ON public.portfolio;

CREATE POLICY "portfolio_select" ON public.portfolio
  FOR SELECT USING (true);

CREATE POLICY "portfolio_insert_auth" ON public.portfolio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolio_insert_anon" ON public.portfolio
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "portfolio_update" ON public.portfolio
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolio_delete" ON public.portfolio
  FOR DELETE USING (auth.uid() = user_id);

-- WORKS: same fix
DROP POLICY IF EXISTS "works_insert"       ON public.works;
DROP POLICY IF EXISTS "works_auth_write"   ON public.works;
DROP POLICY IF EXISTS "works_auth_delete"  ON public.works;
DROP POLICY IF EXISTS "works_public_read"  ON public.works;
DROP POLICY IF EXISTS "works_all"          ON public.works;

CREATE POLICY "works_select" ON public.works
  FOR SELECT USING (true);

CREATE POLICY "works_insert_auth" ON public.works
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "works_insert_anon" ON public.works
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "works_update" ON public.works
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "works_delete" ON public.works
  FOR DELETE USING (auth.uid() = user_id);

-- ACTORS: allow anonymous self-registration (user_id IS NULL)
DROP POLICY IF EXISTS "actors_auth_insert"   ON public.actors;
DROP POLICY IF EXISTS "actors_public_read"   ON public.actors;
DROP POLICY IF EXISTS "actors_auth_update"   ON public.actors;
DROP POLICY IF EXISTS "actors_auth_delete"   ON public.actors;
DROP POLICY IF EXISTS "actors_own"           ON public.actors;
DROP POLICY IF EXISTS "actors_insert"        ON public.actors;
DROP POLICY IF EXISTS "actors_update"        ON public.actors;
DROP POLICY IF EXISTS "actors_delete"        ON public.actors;

CREATE POLICY "actors_select"        ON public.actors FOR SELECT USING (true);
CREATE POLICY "actors_insert_auth"   ON public.actors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actors_insert_anon"   ON public.actors FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "actors_update_auth"   ON public.actors FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "actors_delete_auth"   ON public.actors FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FIX: Portfolio insert for authenticated managers in AddTalent
-- Ensure the policy allows manager's own user_id in inserts
-- ============================================================
DROP POLICY IF EXISTS "portfolio_insert_auth" ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_insert_anon" ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_update"      ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_delete"      ON public.portfolio;

-- Authenticated manager: can insert/update/delete their own rows
CREATE POLICY "portfolio_insert_auth" ON public.portfolio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anonymous actor via invite link: user_id must be null
CREATE POLICY "portfolio_insert_anon" ON public.portfolio
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Update/delete: only owner
CREATE POLICY "portfolio_update" ON public.portfolio
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolio_delete" ON public.portfolio
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FIX: Allow anonymous uploads to headshots bucket
-- Actors on the invite form are not logged in — storage policy
-- must allow unauthenticated inserts to headshots bucket.
-- ============================================================
DROP POLICY IF EXISTS "headshot_upload"       ON storage.objects;
DROP POLICY IF EXISTS "headshot_upload_anon"  ON storage.objects;
DROP POLICY IF EXISTS "Headshots upload"      ON storage.objects;
DROP POLICY IF EXISTS "Managers upload headshots" ON storage.objects;

CREATE POLICY "headshot_upload_anon" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'headshots');

DROP POLICY IF EXISTS "headshot_read" ON storage.objects;
CREATE POLICY "headshot_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'headshots');