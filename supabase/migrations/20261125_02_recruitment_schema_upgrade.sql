-- ==============================================================================
-- ABHI JOBS — MIGRATION 02: RECRUITMENT SCHEMA UPGRADE & LEAST-PRIVILEGE RLS
-- Project Ref: ruagizqernsqypujeutu
-- File: supabase/migrations/20261125_02_recruitment_schema_upgrade.sql
--
-- SAFETY GUARANTEES:
-- 1. Non-destructively upgrades existing recruitment tables (candidates,
--    employers, jobs, applications, resumes, saved_jobs, notifications).
-- 2. Never drops tables or deletes existing rows.
-- 3. Replaces overly permissive USING (true) / WITH CHECK (true) policies
--    with strict role-separated RLS policies.
-- 4. Separates internal recruiter notes into application_notes so candidates
--    never access internal screening remarks.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Job Categories Lookup Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Non-Destructive Upgrades to Existing Recruitment Tables
-- ------------------------------------------------------------------------------

-- Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS work_status TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS experience_type TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_location TEXT,
  ADD COLUMN IF NOT EXISTS work_preference TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resume_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_name TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Immediate',
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'employers_only'
    CHECK (profile_visibility IN ('public', 'employers_only', 'private')),
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 20 CHECK (completion_percentage BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Backfill auth_user_id on candidates from public.users if applicable
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.candidates c
    SET auth_user_id = coalesce(u.auth_id, u.profile_id)
    FROM public.users u
    WHERE c.auth_user_id IS NULL
      AND c.user_id = u.id
      AND coalesce(u.auth_id, u.profile_id) IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_auth_user_id
  ON public.candidates (auth_user_id) WHERE auth_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_skills_gin ON public.candidates USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_candidates_city_level ON public.candidates (city, experience_level) WHERE deleted_at IS NULL;

-- Employers
CREATE TABLE IF NOT EXISTS public.employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employers
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT,
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS recruiter_name TEXT,
  ADD COLUMN IF NOT EXISTS recruiter_email TEXT,
  ADD COLUMN IF NOT EXISTS recruiter_role TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.employers e
    SET owner_user_id = coalesce(u.auth_id, u.profile_id)
    FROM public.users u
    WHERE e.owner_user_id IS NULL
      AND e.user_id = u.id
      AND coalesce(u.auth_id, u.profile_id) IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employers_slug
  ON public.employers (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employers_owner ON public.employers (owner_user_id) WHERE deleted_at IS NULL;

-- Recruiters (Multi-Recruiter Employer Team Access)
CREATE TABLE IF NOT EXISTS public.recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL DEFAULT 'Recruiter',
  can_post_jobs BOOLEAN NOT NULL DEFAULT true,
  can_manage_applications BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recruiters_user ON public.recruiters (user_id) WHERE is_active = true;

-- Helper: Check if authenticated user owns or actively recruits for an employer
CREATE OR REPLACE FUNCTION public.is_employer_member(target_employer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employers e
    WHERE e.id = target_employer_id
      AND e.deleted_at IS NULL
      AND (
        e.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.recruiters r
          WHERE r.employer_id = e.id
            AND r.user_id = auth.uid()
            AND r.is_active = true
        )
      )
  );
$$;

-- Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  overview TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.job_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS company_logo TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'On-site',
  ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'Full-time',
  ADD COLUMN IF NOT EXISTS experience_level TEXT NOT NULL DEFAULT 'Mid',
  ADD COLUMN IF NOT EXISTS min_experience_years NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS salary_period TEXT DEFAULT 'yearly',
  ADD COLUMN IF NOT EXISTS openings_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applicants_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified_company BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_public_listing
  ON public.jobs (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.jobs (employer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs (category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_skills_gin ON public.jobs USING GIN (preferred_skills);

-- Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS candidate_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS candidate_phone TEXT,
  ADD COLUMN IF NOT EXISTS cover_note TEXT,
  ADD COLUMN IF NOT EXISTS resume_id UUID,
  ADD COLUMN IF NOT EXISTS resume_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_name TEXT,
  ADD COLUMN IF NOT EXISTS match_score INTEGER,
  ADD COLUMN IF NOT EXISTS applied_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- Backfill candidate_user_id from candidates.auth_user_id where available
UPDATE public.applications a
SET candidate_user_id = c.auth_user_id
FROM public.candidates c
WHERE a.candidate_user_id IS NULL
  AND a.candidate_id = c.id
  AND c.auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_job_candidate
  ON public.applications (job_id, candidate_user_id)
  WHERE candidate_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_candidate_user ON public.applications (candidate_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.applications (job_id, status);

-- Internal Recruiter Notes (Strictly isolated from candidates)
CREATE TABLE IF NOT EXISTS public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  note_text TEXT NOT NULL CHECK (length(trim(note_text)) > 0 AND length(note_text) <= 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_notes_app ON public.application_notes (application_id, created_at DESC);

-- Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL,
  scheduled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interview_date DATE NOT NULL,
  interview_time TEXT NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('Video', 'Phone', 'In-person')),
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON public.interviews (candidate_user_id, interview_date);
CREATE INDEX IF NOT EXISTS idx_interviews_employer ON public.interviews (employer_id, interview_date);

-- Resumes (Upgrade to support multiple resumes per candidate + auth_user_id)
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop single-resume unique constraint if present so multi-resume builder works seamlessly
ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_user_id_key;

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'My Professional Resume',
  ADD COLUMN IF NOT EXISTS target_role TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skill_categories JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS design JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS training JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS volunteer JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS memberships JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.resumes r
    SET auth_user_id = coalesce(u.auth_id, u.profile_id)
    FROM public.users u
    WHERE r.auth_user_id IS NULL
      AND r.user_id = u.id
      AND coalesce(u.auth_id, u.profile_id) IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resumes_auth_user_id ON public.resumes (auth_user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Saved Jobs
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_jobs
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.saved_jobs s
    SET auth_user_id = coalesce(u.auth_id, u.profile_id)
    FROM public.users u
    WHERE s.auth_user_id IS NULL
      AND s.user_id = u.id
      AND coalesce(u.auth_id, u.profile_id) IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_jobs_auth_user_job
  ON public.saved_jobs (auth_user_id, job_id) WHERE auth_user_id IS NOT NULL;

-- Recently Viewed Jobs (Previously queried by AppContext but missing in DB)
CREATE TABLE IF NOT EXISTS public.recently_viewed_jobs (
  job_seeker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (job_seeker_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_jobs_user_time
  ON public.recently_viewed_jobs (job_seeker_id, viewed_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.notifications n
    SET auth_user_id = coalesce(u.auth_id, u.profile_id)
    FROM public.users u
    WHERE n.auth_user_id IS NULL
      AND n.user_id = u.id
      AND coalesce(u.auth_id, u.profile_id) IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_auth_user
  ON public.notifications (auth_user_id, read, created_at DESC);

-- Hiring Enquiries & Course Enquiries (Server/Edge Function Insert, Admin Manage)
CREATE TABLE IF NOT EXISTS public.hiring_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  business_email TEXT NOT NULL,
  phone_number TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL,
  vacancies INTEGER NOT NULL DEFAULT 1 CHECK (vacancies >= 1 AND vacancies <= 5000),
  job_location TEXT NOT NULL,
  additional_requirements TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'In Progress', 'Fulfilled', 'Closed')),
  assigned_recruiter TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hiring_enquiries_status ON public.hiring_enquiries (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.course_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Resolved', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_enquiries_status ON public.course_enquiries (status, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Strict Least-Privilege RLS Policies (Replacing All Legacy USING (true) Rules)
-- ------------------------------------------------------------------------------
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enquiries ENABLE ROW LEVEL SECURITY;

-- Drop legacy overly permissive policies if they exist
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public users can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Candidates can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can create applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can view applications" ON public.applications;
DROP POLICY IF EXISTS "Public can view employers" ON public.employers;
DROP POLICY IF EXISTS "Users can view their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can create their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resume" ON public.resumes;

-- Job Categories
CREATE POLICY "job_categories_public_read"
  ON public.job_categories FOR SELECT
  USING (is_active = true OR public.is_active_admin(ARRAY['super_admin', 'job_admin', 'read_only_admin']));

CREATE POLICY "job_categories_admin_write"
  ON public.job_categories FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'job_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'job_admin']));

-- Candidates (strict owner isolation; employer read only if visible or applied; admin read/manage)
CREATE POLICY "candidates_select_authorized"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth_user_id = auth.uid()
      OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
      OR (
        profile_visibility IN ('public', 'employers_only')
        AND EXISTS (
          SELECT 1 FROM public.employers e
          WHERE e.deleted_at IS NULL
            AND (e.owner_user_id = auth.uid() OR public.is_employer_member(e.id))
        )
      )
      OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.candidate_user_id = candidates.auth_user_id
          AND j.employer_id IS NOT NULL
          AND public.is_employer_member(j.employer_id)
      )
    )
  );

CREATE POLICY "candidates_insert_own"
  ON public.candidates FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "candidates_update_own_or_admin"
  ON public.candidates FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  );

-- Employers
CREATE POLICY "employers_select_verified_or_member_or_admin"
  ON public.employers FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      verified = true
      OR owner_user_id = auth.uid()
      OR public.is_employer_member(id)
      OR public.is_active_admin(ARRAY['super_admin', 'job_admin', 'recruitment_admin', 'read_only_admin'])
    )
  );

CREATE POLICY "employers_insert_authenticated"
  ON public.employers FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin']));

CREATE POLICY "employers_update_owner_or_admin"
  ON public.employers FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  );

-- Recruiters
CREATE POLICY "recruiters_select_own_company_or_admin"
  ON public.recruiters FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_employer_member(employer_id)
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
  );

CREATE POLICY "recruiters_manage_owner_or_admin"
  ON public.recruiters FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employers e WHERE e.id = employer_id AND e.owner_user_id = auth.uid())
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.employers e WHERE e.id = employer_id AND e.owner_user_id = auth.uid())
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  );

-- Jobs (Public sees ONLY published non-deleted jobs; employers manage own; job/super admins manage all)
CREATE POLICY "jobs_select_published_or_owner_or_admin"
  ON public.jobs FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      status = 'published'
      OR (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
      OR public.is_active_admin(ARRAY['super_admin', 'job_admin', 'recruitment_admin', 'read_only_admin'])
    )
  );

CREATE POLICY "jobs_insert_employer_or_admin"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
    OR public.is_active_admin(ARRAY['super_admin', 'job_admin'])
  );

CREATE POLICY "jobs_update_employer_or_admin"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
    OR public.is_active_admin(ARRAY['super_admin', 'job_admin'])
  )
  WITH CHECK (
    (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
    OR public.is_active_admin(ARRAY['super_admin', 'job_admin'])
  );

-- Applications (Strict Candidate / Employer-Job-Owner / Admin isolation)
CREATE POLICY "applications_select_authorized"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    candidate_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.employer_id IS NOT NULL
        AND public.is_employer_member(j.employer_id)
    )
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
  );

CREATE POLICY "applications_insert_candidate_own"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_user_id = auth.uid()
    AND status = 'Applied'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.status = 'published' AND j.deleted_at IS NULL
    )
  );

CREATE POLICY "applications_update_employer_or_admin"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.employer_id IS NOT NULL
        AND public.is_employer_member(j.employer_id)
    )
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
    OR (candidate_user_id = auth.uid() AND status NOT IN ('Selected', 'Not Selected', 'Rejected'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.employer_id IS NOT NULL
        AND public.is_employer_member(j.employer_id)
    )
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
    OR (candidate_user_id = auth.uid() AND status = 'Withdrawn')
  );

-- Application Internal Notes (Strictly hidden from candidates)
CREATE POLICY "application_notes_employer_or_admin_only"
  ON public.application_notes FOR ALL
  TO authenticated
  USING (
    public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = application_notes.application_id
        AND j.employer_id IS NOT NULL
        AND public.is_employer_member(j.employer_id)
    )
  )
  WITH CHECK (
    author_user_id = auth.uid()
    AND (
      public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
      OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.id = application_notes.application_id
          AND j.employer_id IS NOT NULL
          AND public.is_employer_member(j.employer_id)
      )
    )
  );

-- Interviews
CREATE POLICY "interviews_select_participant_or_admin"
  ON public.interviews FOR SELECT
  TO authenticated
  USING (
    candidate_user_id = auth.uid()
    OR (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
  );

CREATE POLICY "interviews_manage_employer_or_admin"
  ON public.interviews FOR ALL
  TO authenticated
  USING (
    (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  )
  WITH CHECK (
    (employer_id IS NOT NULL AND public.is_employer_member(employer_id))
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin'])
  );

-- Resumes (Strict owner CRUD + authorized employer/admin read for submitted resumes)
CREATE POLICY "resumes_select_own_or_authorized"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth_user_id = auth.uid()
      OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
      OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.resume_id = resumes.id
          AND j.employer_id IS NOT NULL
          AND public.is_employer_member(j.employer_id)
      )
    )
  );

CREATE POLICY "resumes_insert_own"
  ON public.resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "resumes_update_own"
  ON public.resumes FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "resumes_delete_own"
  ON public.resumes FOR DELETE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Saved Jobs & Recently Viewed Jobs (Strict owner only)
CREATE POLICY "saved_jobs_owner_all"
  ON public.saved_jobs FOR ALL
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "recently_viewed_jobs_owner_all"
  ON public.recently_viewed_jobs FOR ALL
  TO authenticated
  USING (job_seeker_id = auth.uid())
  WITH CHECK (job_seeker_id = auth.uid());

-- Notifications (Users read/mark-read/delete own; inserts strictly server/trigger/admin)
CREATE POLICY "notifications_owner_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "notifications_owner_update_read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "notifications_owner_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Enquiries (Submitted via validated Edge Function; read/managed by admins or own submitter)
CREATE POLICY "hiring_enquiries_select_own_or_admin"
  ON public.hiring_enquiries FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'recruitment_admin', 'read_only_admin'])
  );

CREATE POLICY "hiring_enquiries_admin_update"
  ON public.hiring_enquiries FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'recruitment_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'recruitment_admin']));

CREATE POLICY "course_enquiries_select_own_or_admin"
  ON public.course_enquiries FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'recruitment_admin', 'read_only_admin'])
  );

CREATE POLICY "course_enquiries_admin_update"
  ON public.course_enquiries FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));
