-- ==============================================================================
-- ABHI JOBS — MIGRATION 01: UNIFIED IDENTITY, ADMIN RBAC & IMMUTABLE AUDIT LOGS
-- Project Ref: ruagizqernsqypujeutu
-- File: supabase/migrations/20261125_01_identity_and_admin_rbac.sql
--
-- SAFETY GUARANTEES:
-- 1. Strictly non-destructive: zero DROP TABLE, zero TRUNCATE, zero overwrites.
-- 2. Preserves existing public.users and auth.users records intact.
-- 3. Never grants admin permissions during self-registration or first-user signup.
-- 4. Prevents privilege escalation via trigger + REVOKE on admin_roles.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Core Profiles Table (1:1 with Supabase auth.users(id))
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'job_seeker'
    CHECK (account_type IN ('job_seeker', 'employer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  legacy_firebase_uid TEXT UNIQUE,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles (account_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_legacy_firebase_uid ON public.profiles (legacy_firebase_uid)
  WHERE legacy_firebase_uid IS NOT NULL;

-- Non-destructively reconcile legacy public.users table if it already exists
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS legacy_firebase_uid TEXT;
  END IF;
END $$;

-- Idempotently backfill public.profiles from existing Supabase auth.users without overwriting
INSERT INTO public.profiles (id, email, full_name, avatar_url, account_type, status, created_at)
SELECT
  u.id,
  lower(coalesce(u.email, '')),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(u.email, 'user'), '@', 1)
  ),
  nullif(trim(u.raw_user_meta_data ->> 'avatar_url'), ''),
  CASE
    WHEN lower(coalesce(u.raw_user_meta_data ->> 'role', '')) = 'employer' THEN 'employer'
    ELSE 'job_seeker'
  END,
  'active',
  coalesce(u.created_at, now())
FROM auth.users u
WHERE u.email IS NOT NULL AND length(trim(u.email)) > 0
ON CONFLICT (id) DO NOTHING;

-- Backfill legacy public.users.profile_id link where matching auth_id or email exists
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.users u
    SET profile_id = p.id
    FROM public.profiles p
    WHERE u.profile_id IS NULL
      AND (u.auth_id = p.id OR lower(u.email) = lower(p.email));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Granular Administrator Roles (RBAC — Zero Self-Service Writes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (
    role IN (
      'super_admin',
      'job_admin',
      'recruitment_admin',
      'learning_admin',
      'content_admin',
      'read_only_admin'
    )
  ),
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles (user_id, role)
  WHERE is_active = true;

-- ------------------------------------------------------------------------------
-- 3. Immutable Administrative Activity Logs (Append-Only Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at
  ON public.admin_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_actor
  ON public.admin_activity_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_entity
  ON public.admin_activity_logs (entity_type, entity_id);

-- Enforce strict immutability on audit logs (blocks UPDATE and DELETE)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'admin_activity_logs is immutable and cannot be modified or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_activity_logs_immutable ON public.admin_activity_logs;
CREATE TRIGGER trg_admin_activity_logs_immutable
  BEFORE UPDATE OR DELETE ON public.admin_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- ------------------------------------------------------------------------------
-- 4. Shared Security Helper Functions (Pinned search_path, SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_admin(
  allowed_roles TEXT[] DEFAULT ARRAY[
    'super_admin',
    'job_admin',
    'recruitment_admin',
    'learning_admin',
    'content_admin',
    'read_only_admin'
  ]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles ar
    JOIN public.profiles p ON p.id = ar.user_id
    WHERE ar.user_id = auth.uid()
      AND ar.is_active = true
      AND ar.role = ANY(allowed_roles)
      AND p.status = 'active'
      AND p.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_admin(ARRAY['super_admin']);
$$;

-- Trigger: Auto-create profile on auth.users signup (NEVER allows self-assigned 'admin')
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
  safe_account_type TEXT;
  resolved_name TEXT;
BEGIN
  requested_role := lower(coalesce(NEW.raw_user_meta_data ->> 'role', 'job_seeker'));
  IF requested_role = 'employer' THEN
    safe_account_type := 'employer';
  ELSE
    safe_account_type := 'job_seeker';
  END IF;

  resolved_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(NEW.email, 'user'), '@', 1)
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, account_type, status)
  VALUES (
    NEW.id,
    lower(coalesce(NEW.email, '')),
    resolved_name,
    nullif(trim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    safe_account_type,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Trigger: Prevent ordinary users from modifying privileged profile columns
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow trusted server-side service_role / postgres migrations
  IF current_user IN ('postgres', 'service_role') OR auth.role() = 'service_role' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- Non-super-admins cannot modify account_type, status, legacy_firebase_uid, or deleted_at
  IF NOT public.is_super_admin() THEN
    IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
      RAISE EXCEPTION 'Insufficient privileges to change account_type.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Insufficient privileges to change account status.';
    END IF;
    IF NEW.legacy_firebase_uid IS DISTINCT FROM OLD.legacy_firebase_uid THEN
      RAISE EXCEPTION 'Insufficient privileges to change legacy_firebase_uid.';
    END IF;
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      RAISE EXCEPTION 'Insufficient privileges to change deleted_at.';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_privileged ON public.profiles;
CREATE TRIGGER trg_profiles_guard_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();

DROP TRIGGER IF EXISTS trg_admin_roles_updated_at ON public.admin_roles;
CREATE TRIGGER trg_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Row Level Security & Privilege Hardening
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'learning_admin', 'read_only_admin'])
  );

DROP POLICY IF EXISTS "profiles_update_own_or_super_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_super_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- Admin Roles RLS: strictly read-only to self or super_admin; ZERO client writes
REVOKE INSERT, UPDATE, DELETE ON TABLE public.admin_roles FROM anon, authenticated;

DROP POLICY IF EXISTS "admin_roles_select_self_or_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_select_self_or_super_admin"
  ON public.admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

-- Admin Activity Logs RLS: strictly read-only to super_admin / read_only_admin; ZERO client writes
REVOKE INSERT, UPDATE, DELETE ON TABLE public.admin_activity_logs FROM anon, authenticated;

DROP POLICY IF EXISTS "admin_activity_logs_select_authorized" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_select_authorized"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'read_only_admin']));

-- Harden legacy public.users table if present
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
    CREATE POLICY "users_select_own_or_admin"
      ON public.users FOR SELECT
      TO authenticated
      USING (
        auth_id = auth.uid()
        OR profile_id = auth.uid()
        OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
      );
  END IF;
END $$;
