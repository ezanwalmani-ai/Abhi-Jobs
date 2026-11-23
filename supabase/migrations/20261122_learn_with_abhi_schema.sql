-- ==============================================================================
-- ABHI JOBS — LEARN WITH ABHI PERSISTENT POSTGRESQL SCHEMA (SUPABASE)
--
-- Migration: 20261122_learn_with_abhi_schema.sql
--
-- ARCHITECTURAL & SAFETY GUARANTEES:
-- 1. Does NOT modify, drop, or alter any existing recruitment tables
--    (users, candidates, employers, jobs, applications, notifications,
--    saved_jobs, resumes).
-- 2. Bridges Firebase Auth UID (`TEXT`, e.g. 28-char Google Auth UID) with
--    Supabase `auth.users(id)` (`UUID`) via `public.learning_users`:
--      - PostgreSQL cannot create a direct FK from TEXT `firebase_uid` to UUID
--        `auth.users(id)` due to incompatible column types, and Firebase Google
--        sign-in users may not have a row in Supabase `auth.users`.
--      - `public.learning_users.firebase_uid` (`TEXT PRIMARY KEY`) is the
--        authoritative owner key for all student learning records, while
--        `auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL`
--        enforces a proper PostgreSQL FK to `auth.users(id)` whenever a linked
--        Supabase Auth account exists.
-- 3. Enables Row Level Security (RLS) on every `learning_*` table with ZERO
--    client policies AND revokes direct `anon` / `authenticated` privileges so
--    ONLY the Express backend using `SUPABASE_SECRET_KEY` (or
--    `SUPABASE_SERVICE_ROLE_KEY`) can access authoritative learning data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Learning Users Identity Bridge (Firebase UID <-> Optional Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_users (
  firebase_uid TEXT PRIMARY KEY,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_users_auth_user_id
  ON public.learning_users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. Courses (Authoritative course metadata & completion requirements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_courses (
  course_id TEXT PRIMARY KEY,
  course_slug TEXT NOT NULL UNIQUE,
  course_title TEXT NOT NULL,
  category_id TEXT NOT NULL DEFAULT 'general',
  category_name TEXT NOT NULL DEFAULT 'General',
  short_description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_duration TEXT NOT NULL DEFAULT '',
  is_free BOOLEAN NOT NULL DEFAULT true,
  sequential_unlock BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  ordered_module_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 70 AND 100),
  certificate_template_id TEXT NOT NULL DEFAULT 'default_abhi_certificate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Modules (Ordered curriculum modules belonging to a course)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  module_order INTEGER NOT NULL CHECK (module_order BETWEEN 1 AND 50),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  estimated_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_minutes BETWEEN 1 AND 600),
  quiz_required BOOLEAN NOT NULL DEFAULT true,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 50 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, module_order)
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_course
  ON public.learning_modules (course_id, module_order);

-- ------------------------------------------------------------------------------
-- 4. Lessons (Written lessons, embedded YouTube metadata, exercises & resources)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  lesson_order INTEGER NOT NULL CHECK (lesson_order BETWEEN 1 AND 200),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  youtube_video_id TEXT CHECK (youtube_video_id IS NULL OR youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$'),
  video_url TEXT,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  written_content TEXT NOT NULL DEFAULT '',
  exercise_title TEXT,
  exercise_instructions TEXT,
  exercise_deliverable TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_minutes INTEGER NOT NULL DEFAULT 10 CHECK (estimated_minutes BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, lesson_order)
);

CREATE INDEX IF NOT EXISTS idx_learning_lessons_course_module
  ON public.learning_lessons (course_id, module_id, lesson_order);

-- ------------------------------------------------------------------------------
-- 5. Assessment Configurations (Module Quizzes & Final Assessments — server-only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_assessments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('module_quiz', 'final_assessment')),
  module_id TEXT,
  module_order INTEGER CHECK (module_order IS NULL OR (module_order BETWEEN 1 AND 50)),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 40 AND 100),
  question_count INTEGER NOT NULL DEFAULT 1 CHECK (question_count BETWEEN 1 AND 30),
  randomize_order BOOLEAN NOT NULL DEFAULT true,
  required_for_completion BOOLEAN NOT NULL DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_learning_assessments_module_id CHECK (
    (assessment_type = 'module_quiz' AND module_id IS NOT NULL AND length(trim(module_id)) > 0)
    OR (assessment_type = 'final_assessment' AND module_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_learning_assessments_course
  ON public.learning_assessments (course_id, assessment_type);

-- ------------------------------------------------------------------------------
-- 6. Active Assessment Sessions (Stateless multi-instance grading on Cloud Run)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_assessment_sessions (
  session_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL REFERENCES public.learning_assessments(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('module_quiz', 'final_assessment')),
  module_id TEXT,
  firebase_uid TEXT NOT NULL REFERENCES public.learning_users(firebase_uid) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL DEFAULT '',
  served_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_uid_expires
  ON public.learning_assessment_sessions (firebase_uid, expires_at);

-- ------------------------------------------------------------------------------
-- 7. Lesson Progress (Per verified Firebase UID & course)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_lesson_progress (
  firebase_uid TEXT NOT NULL REFERENCES public.learning_users(firebase_uid) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  current_module_id TEXT,
  current_lesson_id TEXT,
  completed_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (firebase_uid, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_course
  ON public.learning_lesson_progress (course_id);

-- ------------------------------------------------------------------------------
-- 8. Module Quiz Attempts (Immutable, server-graded, HMAC-signed receipts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_quiz_attempts (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL REFERENCES public.learning_users(firebase_uid) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL DEFAULT '',
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  module_id TEXT NOT NULL,
  assessment_title TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 1 AND total_questions <= 30),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  incorrect_answers INTEGER NOT NULL CHECK (incorrect_answers >= 0 AND incorrect_answers <= total_questions),
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  pass_percentage INTEGER NOT NULL CHECK (pass_percentage BETWEEN 1 AND 100),
  passed BOOLEAN NOT NULL,
  verification_signature TEXT NOT NULL CHECK (length(verification_signature) >= 32),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_learning_quiz_counts CHECK (correct_answers + incorrect_answers = total_questions),
  CONSTRAINT chk_learning_quiz_pass_rule CHECK (passed = (score_percent >= pass_percentage))
);

CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_uid_course
  ON public.learning_quiz_attempts (firebase_uid, course_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_course
  ON public.learning_quiz_attempts (course_id, submitted_at DESC);

-- ------------------------------------------------------------------------------
-- 9. Final Course Assessment Attempts (Immutable, server-graded, >= 70% pass rule)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_final_assessment_attempts (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL REFERENCES public.learning_users(firebase_uid) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL DEFAULT '',
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  assessment_title TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 1 AND total_questions <= 30),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  incorrect_answers INTEGER NOT NULL CHECK (incorrect_answers >= 0 AND incorrect_answers <= total_questions),
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  pass_percentage INTEGER NOT NULL CHECK (pass_percentage BETWEEN 70 AND 100),
  passed BOOLEAN NOT NULL,
  verification_signature TEXT NOT NULL CHECK (length(verification_signature) >= 32),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_learning_final_counts CHECK (correct_answers + incorrect_answers = total_questions),
  CONSTRAINT chk_learning_final_pass_rule CHECK (passed = (score_percent >= pass_percentage AND score_percent >= 70))
);

CREATE INDEX IF NOT EXISTS idx_learning_final_attempts_uid_course
  ON public.learning_final_assessment_attempts (firebase_uid, course_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_final_attempts_course
  ON public.learning_final_assessment_attempts (course_id, submitted_at DESC);

-- ------------------------------------------------------------------------------
-- 10. Module Unlocks & Authoritative Course Progression (Server-derived only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_module_unlocks (
  firebase_uid TEXT NOT NULL REFERENCES public.learning_users(firebase_uid) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  passed_module_quiz_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  unlocked_module_order INTEGER NOT NULL DEFAULT 1 CHECK (unlocked_module_order BETWEEN 1 AND 50),
  final_assessment_passed BOOLEAN NOT NULL DEFAULT false,
  best_final_score_percent INTEGER CHECK (best_final_score_percent IS NULL OR (best_final_score_percent BETWEEN 0 AND 100)),
  last_verified_attempt_id TEXT,
  last_verified_final_attempt_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (firebase_uid, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_module_unlocks_course
  ON public.learning_module_unlocks (course_id);

-- ------------------------------------------------------------------------------
-- 11. Course Completion Certificates (Immutable, unique per student & course)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_certificates (
  certificate_id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL REFERENCES public.learning_users(firebase_uid) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(course_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  final_assessment_score INTEGER NOT NULL CHECK (final_assessment_score BETWEEN 70 AND 100),
  final_attempt_id TEXT NOT NULL REFERENCES public.learning_final_assessment_attempts(id) ON DELETE RESTRICT,
  template_id TEXT NOT NULL DEFAULT 'default_abhi_certificate',
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  verification_signature TEXT NOT NULL CHECK (length(verification_signature) >= 32),
  UNIQUE (firebase_uid, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_certificates_uid
  ON public.learning_certificates (firebase_uid, issued_at DESC);

-- ==============================================================================
-- STRICT SERVER-SIDE-ONLY ACCESS CONTROL (ZERO BROWSER/ANON/AUTHENTICATED ACCESS)
-- ==============================================================================
-- Enabling RLS with NO client policies + revoking table privileges from anon
-- and authenticated ensures browser Supabase publishable/anon keys can NEVER
-- read quiz answer keys or write scores, unlocks, attempts, or certificates.
-- Only the Express backend using SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
-- (which bypasses RLS) can access these tables.

ALTER TABLE public.learning_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_final_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_module_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_certificates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.learning_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_courses FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_modules FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_lessons FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_assessments FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_assessment_sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_lesson_progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_quiz_attempts FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_final_assessment_attempts FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_module_unlocks FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_certificates FROM anon, authenticated;
