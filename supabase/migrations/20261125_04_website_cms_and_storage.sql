-- ==============================================================================
-- ABHI JOBS — MIGRATION 04: WEBSITE CMS, SETTINGS & SUPABASE STORAGE SECURITY
-- Project Ref: ruagizqernsqypujeutu
-- File: supabase/migrations/20261125_04_website_cms_and_storage.sql
--
-- SAFETY GUARANTEES:
-- 1. Idempotent bucket provisioning (ON CONFLICT DO NOTHING).
-- 2. Strict MIME type & file size limits on every bucket.
-- 3. Private resumes bucket isolated by user folder prefix (auth.uid()).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Website Content & Website Settings Tables
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_content (
  key TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  description TEXT DEFAULT '',
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "website_content_public_read" ON public.website_content;
CREATE POLICY "website_content_public_read"
  ON public.website_content FOR SELECT
  USING (
    is_published = true
    OR public.is_active_admin(ARRAY['super_admin', 'content_admin', 'read_only_admin'])
  );

DROP POLICY IF EXISTS "website_content_admin_write" ON public.website_content;
CREATE POLICY "website_content_admin_write"
  ON public.website_content FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'content_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'content_admin']));

DROP POLICY IF EXISTS "website_settings_public_or_admin_read" ON public.website_settings;
CREATE POLICY "website_settings_public_or_admin_read"
  ON public.website_settings FOR SELECT
  USING (
    is_public = true
    OR public.is_active_admin(ARRAY['super_admin', 'content_admin', 'read_only_admin'])
  );

DROP POLICY IF EXISTS "website_settings_admin_write" ON public.website_settings;
CREATE POLICY "website_settings_admin_write"
  ON public.website_settings FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'content_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'content_admin']));

-- ------------------------------------------------------------------------------
-- 2. Storage Buckets (Idempotent Provisioning with File-Size & MIME Limits)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'resumes',
    'resumes',
    false,
    5242880, -- 5 MB
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'workbooks',
    'workbooks',
    false,
    10485760, -- 10 MB
    ARRAY[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf'
    ]
  ),
  (
    'course-assets',
    'course-assets',
    true,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'company-logos',
    'company-logos',
    true,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Storage Object RLS Policies
-- ------------------------------------------------------------------------------

-- Private Resumes: Owner can manage strictly within /{auth.uid()}/...; Admin can read
DROP POLICY IF EXISTS "resumes_storage_owner_read" ON storage.objects;
CREATE POLICY "resumes_storage_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
    )
  );

DROP POLICY IF EXISTS "resumes_storage_owner_insert" ON storage.objects;
CREATE POLICY "resumes_storage_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "resumes_storage_owner_update" ON storage.objects;
CREATE POLICY "resumes_storage_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "resumes_storage_owner_delete" ON storage.objects;
CREATE POLICY "resumes_storage_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Learning Workbooks: Authenticated learners read; Learning/Super Admin manage
DROP POLICY IF EXISTS "workbooks_storage_auth_read" ON storage.objects;
CREATE POLICY "workbooks_storage_auth_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'workbooks');

DROP POLICY IF EXISTS "workbooks_storage_admin_write" ON storage.objects;
CREATE POLICY "workbooks_storage_admin_write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'workbooks'
    AND public.is_active_admin(ARRAY['super_admin', 'learning_admin'])
  )
  WITH CHECK (
    bucket_id = 'workbooks'
    AND public.is_active_admin(ARRAY['super_admin', 'learning_admin'])
  );

-- Course Assets: Public read; Learning/Content/Super Admin write
DROP POLICY IF EXISTS "course_assets_public_read" ON storage.objects;
CREATE POLICY "course_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-assets');

DROP POLICY IF EXISTS "course_assets_admin_write" ON storage.objects;
CREATE POLICY "course_assets_admin_write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'course-assets'
    AND public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'content_admin'])
  )
  WITH CHECK (
    bucket_id = 'course-assets'
    AND public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'content_admin'])
  );

-- Avatars: Public read; Owner write within /{auth.uid()}/...
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Company Logos: Public read; Owner/Admin write
DROP POLICY IF EXISTS "company_logos_public_read" ON storage.objects;
CREATE POLICY "company_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "company_logos_owner_or_admin_write" ON storage.objects;
CREATE POLICY "company_logos_owner_or_admin_write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'content_admin'])
    )
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'content_admin'])
    )
  );
