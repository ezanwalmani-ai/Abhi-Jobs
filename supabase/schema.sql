-- ==============================================================================
-- ABHI JOBS - SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to create all required tables, enums, indexes, and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Create Enums if they don't already exist
DO $$ BEGIN
  CREATE TYPE public.work_mode_enum AS ENUM ('Remote', 'Hybrid', 'On-site');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type_enum AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.experience_level_enum AS ENUM ('Fresher', 'Junior', 'Mid', 'Senior', 'Lead');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('job_seeker', 'employer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'job_seeker',
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Candidates / Job Seekers Profile Table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  headline TEXT,
  about TEXT,
  city TEXT,
  state TEXT,
  work_status TEXT,
  experience_level TEXT,
  experience_type TEXT,
  skills TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  resume_url TEXT,
  resume_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Employers / Company Profiles Table
CREATE TABLE IF NOT EXISTS public.employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  website TEXT,
  about TEXT,
  logo TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  location TEXT NOT NULL,
  department TEXT,
  industry TEXT,
  work_mode TEXT NOT NULL DEFAULT 'On-site',
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  experience_level TEXT NOT NULL DEFAULT 'Mid',
  min_experience_years NUMERIC DEFAULT 0,
  salary_min NUMERIC DEFAULT 0,
  salary_max NUMERIC DEFAULT 0,
  salary_currency TEXT DEFAULT 'INR',
  salary_period TEXT DEFAULT 'per annum',
  openings_count INTEGER DEFAULT 1,
  overview TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published',
  deadline TIMESTAMPTZ,
  views_count INTEGER DEFAULT 0,
  applicants_count INTEGER DEFAULT 0,
  is_verified_company BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Job Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  cover_note TEXT,
  resume_url TEXT,
  resume_name TEXT,
  status TEXT NOT NULL DEFAULT 'Applied',
  applied_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Saved Jobs Table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- 9. Resumes Table (Resume Builder)
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  professional_title TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  linkedin TEXT,
  portfolio TEXT,
  photo_url TEXT,
  show_photo BOOLEAN NOT NULL DEFAULT false,
  summary TEXT,
  experiences JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  projects JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  template TEXT NOT NULL DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 11. Public Read Policies for Jobs
CREATE POLICY "Public can view published jobs"
  ON public.jobs FOR SELECT
  USING (status = 'published' OR auth.role() = 'authenticated');

-- 12. Applications Policies
CREATE POLICY "Candidates can view their own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Candidates can insert applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 13. Resumes Policies (Strict User Isolation)
CREATE POLICY "Users can view their own resume"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume"
  ON public.resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume"
  ON public.resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume"
  ON public.resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
