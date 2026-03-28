-- ============================================================
-- TAARA MASTER SCHEMA — Run this ONCE in Supabase SQL Editor
-- Drops everything and rebuilds cleanly
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop all tables cleanly
DROP TABLE IF EXISTS public.join_requests         CASCADE;
DROP TABLE IF EXISTS public.work_logs             CASCADE;
DROP TABLE IF EXISTS public.talent_managers       CASCADE;
DROP TABLE IF EXISTS public.admin_profiles        CASCADE;
DROP TABLE IF EXISTS public.actor_availability    CASCADE;
DROP TABLE IF EXISTS public.casting_submissions   CASCADE;
DROP TABLE IF EXISTS public.casting_opportunities CASCADE;
DROP TABLE IF EXISTS public.shortlist_views       CASCADE;
DROP TABLE IF EXISTS public.shortlists            CASCADE;
DROP TABLE IF EXISTS public.calendar_events       CASCADE;
DROP TABLE IF EXISTS public.works                 CASCADE;
DROP TABLE IF EXISTS public.portfolio             CASCADE;
DROP TABLE IF EXISTS public.filmography           CASCADE;
DROP TABLE IF EXISTS public.actors                CASCADE;
DROP TABLE IF EXISTS public.agency_profile        CASCADE;
DROP TABLE IF EXISTS public.manager_profiles      CASCADE;
DROP VIEW  IF EXISTS public.user_stats            CASCADE;

-- Delete all auth users
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.flow_state;
DELETE FROM auth.users;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;

-- ── TABLES ────────────────────────────────────────────────────

CREATE TABLE public.actors (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name                 text NOT NULL,
  age                  integer,
  gender               text CHECK (gender IN ('Male','Female','Non-Binary')),
  type                 text CHECK (type IN ('Lead','Character','Emerging','Supporting')),
  status               text DEFAULT 'Available' CHECK (status IN ('Available','Booked','On Hold')),
  location             text, height text, hair text, eyes text, bio text,
  reel_url             text, reel_urls text[] DEFAULT '{}',
  headshot_url         text, slug text,
  profile_visible      boolean DEFAULT true,
  profile_password     text, profile_expires_at timestamptz,
  languages            text[] DEFAULT '{}', skills text[] DEFAULT '{}',
  accents              text[] DEFAULT '{}',
  manager_notes        text, contact_phone text, contact_email text,
  profile_completeness integer DEFAULT 0, color text DEFAULT '#6366f1',
  created_at           timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.filmography (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, role text, year integer,
  type text CHECK (type IN ('Film','TV Series','Short','Theatre')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.portfolio (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text CHECK (category IN ('Headshot','Behind the Scenes','Editorial','Character Look')),
  image_url text, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.works (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL, role text, director text, year integer,
  type text CHECK (type IN ('Film','TV Series','Short','Theatre','Web Series','Commercial')),
  status text CHECK (status IN ('Released','Post-Production','In Production','Upcoming')),
  description text, poster_url text, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.actors(id) ON DELETE SET NULL,
  actor_name text, title text NOT NULL,
  type text CHECK (type IN ('Audition','Callback','Booking','Meeting')),
  date date NOT NULL, time text, end_time text, location text, notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.shortlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, description text, actor_ids uuid[] DEFAULT '{}', slug text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.shortlist_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortlist_id uuid NOT NULL REFERENCES public.shortlists(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(), referrer text, ip text
);

CREATE TABLE public.casting_opportunities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL, role text, director text,
  casting_director text, deadline date, notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.casting_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id uuid NOT NULL REFERENCES public.casting_opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.actors(id) ON DELETE SET NULL,
  actor_name text,
  status text DEFAULT 'Submitted' CHECK (status IN ('Submitted','Viewed','Shortlisted','Callback','Booked','Rejected')),
  submitted_at timestamptz DEFAULT now(), notes text
);

CREATE TABLE public.agency_profile (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, slug text, about text, contact_email text, contact_phone text,
  website text, location text, logo_url text, founded_year integer,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.actor_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available','booked','frozen','unavailable')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(actor_id, date)
);

CREATE TABLE public.manager_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE, full_name text, email text, phone text, avatar_url text,
  agency_name text, agency_location text, bio text, website text,
  instagram text, linkedin text, years_experience integer, specialisation text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL, email text NOT NULL, agency_name text NOT NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.talent_managers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL, email text NOT NULL, phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.work_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, details text, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_name text NOT NULL, manager_email text NOT NULL, manager_phone text,
  target_admin_id uuid NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  message text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- ── TRIGGERS ──────────────────────────────────────────────────

CREATE TRIGGER actors_updated_at      BEFORE UPDATE ON public.actors           FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER shortlists_updated_at  BEFORE UPDATE ON public.shortlists       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER agency_updated_at      BEFORE UPDATE ON public.agency_profile   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER admin_updated_at       BEFORE UPDATE ON public.admin_profiles   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER mgr_updated_at         BEFORE UPDATE ON public.manager_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tm_updated_at          BEFORE UPDATE ON public.talent_managers  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER jr_updated_at          BEFORE UPDATE ON public.join_requests    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE public.actors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filmography          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_views      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_profile       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_managers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests        ENABLE ROW LEVEL SECURITY;

-- Actors
CREATE POLICY "actors_select"      ON public.actors FOR SELECT USING (true);
CREATE POLICY "actors_insert_auth" ON public.actors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actors_insert_anon" ON public.actors FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "actors_update"      ON public.actors FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "actors_delete"      ON public.actors FOR DELETE USING (auth.uid() = user_id);

-- Filmography
CREATE POLICY "film_select"      ON public.filmography FOR SELECT USING (true);
CREATE POLICY "film_insert_auth" ON public.filmography FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "film_insert_anon" ON public.filmography FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "film_update"      ON public.filmography FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "film_delete"      ON public.filmography FOR DELETE USING (auth.uid() = user_id);

-- Portfolio
CREATE POLICY "port_select"      ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "port_insert_auth" ON public.portfolio FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "port_insert_anon" ON public.portfolio FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "port_update"      ON public.portfolio FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "port_delete"      ON public.portfolio FOR DELETE USING (auth.uid() = user_id);

-- Works
CREATE POLICY "works_select"      ON public.works FOR SELECT USING (true);
CREATE POLICY "works_insert_auth" ON public.works FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "works_insert_anon" ON public.works FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "works_update"      ON public.works FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "works_delete"      ON public.works FOR DELETE USING (auth.uid() = user_id);

-- Simple all-access for owned tables
CREATE POLICY "cal_all"     ON public.calendar_events       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agency_all"  ON public.agency_profile        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "avail_all"   ON public.actor_availability    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "casting_all" ON public.casting_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subs_all"    ON public.casting_submissions   FOR ALL USING (auth.uid() = user_id);

-- Shortlists
CREATE POLICY "sl_select" ON public.shortlists FOR SELECT USING (true);
CREATE POLICY "sl_insert" ON public.shortlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sl_update" ON public.shortlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sl_delete" ON public.shortlists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "slv_insert" ON public.shortlist_views FOR INSERT WITH CHECK (true);
CREATE POLICY "slv_select" ON public.shortlist_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shortlists s WHERE s.id = shortlist_id AND s.user_id = auth.uid()));

-- Manager profiles
CREATE POLICY "mp_select" ON public.manager_profiles FOR SELECT USING (true);
CREATE POLICY "mp_insert" ON public.manager_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "mp_update" ON public.manager_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mp_delete" ON public.manager_profiles FOR DELETE USING (auth.uid() = user_id);

-- Admin profiles — open SELECT so no schema errors
CREATE POLICY "ap_select" ON public.admin_profiles FOR SELECT USING (true);
CREATE POLICY "ap_insert" ON public.admin_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "ap_update" ON public.admin_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ap_delete" ON public.admin_profiles FOR DELETE USING (auth.uid() = user_id);

-- Talent managers — open SELECT so login check works
CREATE POLICY "tm_select" ON public.talent_managers FOR SELECT USING (true);
CREATE POLICY "tm_insert" ON public.talent_managers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid()));
CREATE POLICY "tm_update" ON public.talent_managers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid()));
CREATE POLICY "tm_delete" ON public.talent_managers FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid()));

-- Work logs
CREATE POLICY "wl_insert" ON public.work_logs FOR INSERT WITH CHECK (auth.uid() = manager_user_id);
CREATE POLICY "wl_select" ON public.work_logs FOR SELECT USING (
  auth.uid() = manager_user_id OR
  EXISTS (SELECT 1 FROM public.talent_managers tm
          JOIN public.admin_profiles ap ON ap.id = tm.admin_id
          WHERE tm.user_id = manager_user_id AND ap.user_id = auth.uid()));

-- Join requests
CREATE POLICY "jr_insert"       ON public.join_requests FOR INSERT WITH CHECK (auth.uid() = manager_user_id);
CREATE POLICY "jr_mgr_select"   ON public.join_requests FOR SELECT USING (auth.uid() = manager_user_id);
CREATE POLICY "jr_admin_select" ON public.join_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = target_admin_id AND ap.user_id = auth.uid()));
CREATE POLICY "jr_admin_update" ON public.join_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = target_admin_id AND ap.user_id = auth.uid()));

-- ── INDEXES ───────────────────────────────────────────────────

CREATE INDEX actors_user_id_idx  ON public.actors(user_id);
CREATE INDEX actors_slug_idx     ON public.actors(slug);
CREATE INDEX film_actor_idx      ON public.filmography(actor_id);
CREATE INDEX port_actor_idx      ON public.portfolio(actor_id);
CREATE INDEX works_actor_idx     ON public.works(actor_id);
CREATE INDEX cal_user_idx        ON public.calendar_events(user_id);
CREATE INDEX sl_user_idx         ON public.shortlists(user_id);
CREATE INDEX sl_slug_idx         ON public.shortlists(slug);
CREATE INDEX casting_user_idx    ON public.casting_opportunities(user_id);
CREATE INDEX avail_actor_idx     ON public.actor_availability(actor_id);
CREATE INDEX mp_username_idx     ON public.manager_profiles(username);
CREATE INDEX mp_email_idx        ON public.manager_profiles(email);
CREATE INDEX ap_user_id_idx      ON public.admin_profiles(user_id);
CREATE INDEX tm_user_id_idx      ON public.talent_managers(user_id);
CREATE INDEX tm_admin_id_idx     ON public.talent_managers(admin_id);
CREATE INDEX tm_email_idx        ON public.talent_managers(email);
CREATE INDEX wl_manager_idx      ON public.work_logs(manager_user_id);
CREATE INDEX jr_manager_idx      ON public.join_requests(manager_user_id);
CREATE INDEX jr_admin_idx        ON public.join_requests(target_admin_id);

-- ── FUNCTIONS ─────────────────────────────────────────────────

-- create_manager_account: creates manager server-side, auto-confirmed, no email
CREATE OR REPLACE FUNCTION public.create_manager_account(
  p_email text, p_password text, p_full_name text, p_phone text, p_admin_id uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = extensions, public, auth AS $$
DECLARE v_user_id uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
    RETURN json_build_object('success', false, 'error', 'A manager with this email already exists.');
  END IF;
  INSERT INTO auth.users (id,instance_id,email,encrypted_password,
    email_confirmed_at,raw_app_meta_data,raw_user_meta_data,
    created_at,updated_at,role,aud)
  VALUES (v_user_id,'00000000-0000-0000-0000-000000000000',
    lower(trim(p_email)),
    extensions.crypt(p_password,extensions.gen_salt('bf',6)),
    now(),  -- auto-confirmed: manager can login immediately
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('full_name',p_full_name,'role','manager')::jsonb,
    now(),now(),'authenticated','authenticated');
  INSERT INTO auth.identities(id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
  VALUES(gen_random_uuid(),v_user_id,
    json_build_object('sub',v_user_id::text,'email',lower(trim(p_email)))::jsonb,
    'email',lower(trim(p_email)),now(),now(),now());
  INSERT INTO public.talent_managers(user_id,admin_id,full_name,email,phone,is_active)
  VALUES(v_user_id,p_admin_id,trim(p_full_name),lower(trim(p_email)),NULLIF(trim(p_phone),''),true);
  INSERT INTO public.manager_profiles(user_id,full_name,email,phone,updated_at)
  VALUES(v_user_id,trim(p_full_name),lower(trim(p_email)),NULLIF(trim(p_phone),''),now())
  ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name,
    email=excluded.email,phone=excluded.phone,updated_at=now();
  RETURN json_build_object('success',true,'user_id',v_user_id);
EXCEPTION
  WHEN unique_violation THEN RETURN json_build_object('success',false,'error','Email already exists.');
  WHEN OTHERS THEN RETURN json_build_object('success',false,'error',SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.create_manager_account TO authenticated;

-- approve_join_request
CREATE OR REPLACE FUNCTION public.approve_join_request(p_request_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req public.join_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM public.join_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RETURN json_build_object('success',false,'error','Not found.'); END IF;
  INSERT INTO public.talent_managers(user_id,admin_id,full_name,email,phone,is_active)
  VALUES(v_req.manager_user_id,v_req.target_admin_id,v_req.manager_name,
         v_req.manager_email,v_req.manager_phone,true)
  ON CONFLICT(user_id) DO UPDATE SET admin_id=excluded.admin_id,is_active=true,updated_at=now();
  UPDATE public.join_requests SET status='approved',updated_at=now() WHERE id=p_request_id;
  RETURN json_build_object('success',true);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success',false,'error',SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.approve_join_request TO authenticated;

-- ── STORAGE ───────────────────────────────────────────────────

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
  ('headshots','headshots',true,5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('portfolio', 'portfolio', true,10485760,ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars',   'avatars',   true,5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=true;

DROP POLICY IF EXISTS "storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "storage_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_read"   ON storage.objects FOR SELECT USING (bucket_id IN ('headshots','portfolio','avatars'));
CREATE POLICY "storage_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('headshots','portfolio','avatars'));
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (bucket_id IN ('headshots','portfolio','avatars'));
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (bucket_id IN ('headshots','portfolio','avatars'));

-- ── VIEW ──────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.user_stats AS
SELECT a.user_id,
  count(DISTINCT a.id)                                       AS total_actors,
  count(DISTINCT a.id) FILTER(WHERE a.status='Available')    AS available_actors,
  count(DISTINCT a.id) FILTER(WHERE a.status='Booked')       AS booked_actors,
  count(DISTINCT sl.id)                                       AS total_shortlists,
  count(DISTINCT co.id)                                       AS total_casting_calls,
  count(DISTINCT ce.id)                                       AS total_events
FROM public.actors a
LEFT JOIN public.shortlists sl            ON sl.user_id = a.user_id
LEFT JOIN public.casting_opportunities co ON co.user_id = a.user_id
LEFT JOIN public.calendar_events ce       ON ce.user_id = a.user_id
GROUP BY a.user_id;

-- ── DONE ──────────────────────────────────────────────────────
SELECT 'TAARA schema ready. Go to /admin/signup to create your admin account.' as status;
