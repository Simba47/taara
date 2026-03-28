-- ============================================================
-- TAARA — ADMIN & TALENT MANAGER SYSTEM
-- Run this in Supabase SQL Editor AFTER the main schema.
-- Safe to re-run (uses IF NOT EXISTS everywhere).
-- ============================================================

-- ── 1. ADMIN PROFILES ─────────────────────────────────────────
-- One row per agency admin. Created at /admin/signup.

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  email        text NOT NULL,
  agency_name  text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "admin_select_own"    ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_insert_own"    ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_update_own"    ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_public_select" ON public.admin_profiles;

-- Admins manage their own profile; public SELECT needed for login role-check
CREATE POLICY "admin_select_own"    ON public.admin_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin_insert_own"    ON public.admin_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_update_own"    ON public.admin_profiles FOR UPDATE USING (auth.uid() = user_id);
-- Allow reading by user_id to verify admin role on login
CREATE POLICY "admin_public_select" ON public.admin_profiles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;

DROP TRIGGER IF EXISTS admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS admin_profiles_user_id_idx ON public.admin_profiles(user_id);


-- ── 2. TALENT MANAGERS ────────────────────────────────────────
-- One row per manager created by an admin.
-- admin_id → admin_profiles.id  (NOT user_id — ensures scoping per agency)

CREATE TABLE IF NOT EXISTS public.talent_managers (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    uuid NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  email       text NOT NULL,
  phone       text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.talent_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tm_select_own"    ON public.talent_managers;
DROP POLICY IF EXISTS "tm_admin_select"  ON public.talent_managers;
DROP POLICY IF EXISTS "tm_admin_insert"  ON public.talent_managers;
DROP POLICY IF EXISTS "tm_admin_update"  ON public.talent_managers;
DROP POLICY IF EXISTS "tm_admin_delete"  ON public.talent_managers;
DROP POLICY IF EXISTS "tm_public_select" ON public.talent_managers;

-- Manager reads their own record (e.g. to check is_active at login)
CREATE POLICY "tm_select_own" ON public.talent_managers
  FOR SELECT USING (auth.uid() = user_id);

-- Admin reads/writes ONLY their own managers
CREATE POLICY "tm_admin_select" ON public.talent_managers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid())
  );
CREATE POLICY "tm_admin_insert" ON public.talent_managers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid())
  );
CREATE POLICY "tm_admin_update" ON public.talent_managers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid())
  );
CREATE POLICY "tm_admin_delete" ON public.talent_managers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = admin_id AND ap.user_id = auth.uid())
  );
-- Open SELECT needed for role-check on manager login
CREATE POLICY "tm_public_select" ON public.talent_managers
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS talent_managers_updated_at ON public.talent_managers;
CREATE TRIGGER talent_managers_updated_at
  BEFORE UPDATE ON public.talent_managers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS talent_managers_user_id_idx  ON public.talent_managers(user_id);
CREATE INDEX IF NOT EXISTS talent_managers_admin_id_idx ON public.talent_managers(admin_id);


-- ── 3. WORK LOGS ──────────────────────────────────────────────
-- Auto-logged manager activity. Written by manager app on key actions.
-- Admin reads logs for all managers under them.

CREATE TABLE IF NOT EXISTS public.work_logs (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action            text NOT NULL,
  details           text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wl_manager_insert" ON public.work_logs;
DROP POLICY IF EXISTS "wl_manager_select" ON public.work_logs;
DROP POLICY IF EXISTS "wl_admin_select"   ON public.work_logs;

CREATE POLICY "wl_manager_insert" ON public.work_logs
  FOR INSERT WITH CHECK (auth.uid() = manager_user_id);

CREATE POLICY "wl_manager_select" ON public.work_logs
  FOR SELECT USING (auth.uid() = manager_user_id);

CREATE POLICY "wl_admin_select" ON public.work_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.talent_managers tm
      JOIN   public.admin_profiles ap ON ap.id = tm.admin_id
      WHERE  tm.user_id = manager_user_id AND ap.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS work_logs_manager_idx    ON public.work_logs(manager_user_id);
CREATE INDEX IF NOT EXISTS work_logs_created_at_idx ON public.work_logs(created_at DESC);


-- ============================================================
-- DONE.
-- Flow:
--   1. Agency admin signs up at /admin/signup
--   2. Admin creates managers from /admin/dashboard  (sets email + temp password)
--   3. Managers log in at /manager/login — system checks talent_managers table
--   4. Admin A only sees managers with admin_id = admin_A.id
--   5. Work logs auto-written by manager app; admin sees them in Work Logs tab
-- ============================================================
