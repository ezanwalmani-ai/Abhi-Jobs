-- ==============================================================================
-- ABHI JOBS — LEARN WITH ABHI PERSISTENT POSTGRESQL SCHEMA (SUPABASE)
--
-- Migration: 20261122_learn_with_abhi_schema.sql
--
-- SAFETY GUARANTEES:
-- 1. Does NOT modify, drop, or alter any existing recruitment tables
--    (users, candidates, employers, jobs, applications, notifications,
--    saved_jobs, resumes).
-- 2. Creates dedicated, isolated learning_* tables associated with the
--    verified Firebase UID (`firebase_uid`).
-- 3. Enables Row Level Security (RLS) on every learning_* table with ZERO
--    policies for `anon` or `authenticated` roles AND revokes direct client
--    privileges so ONLY the Express backend using `SUPABASE_SECRET_KEY`
--    (or `SUPABASE_SERVICE_ROLE_KEY`) can read or mutate authoritative records.
--
-- Run this script once in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Courses (Authoritative course structure & completion requirements)
CREATE TABLE IF NOT EXISTS public.learning_courses (
  course_id TEXT PRIMARY KEY,
  course_slug TEXT NOT NULL UNIQUE,
  course_title TEXT NOT NULL,
  ordered_module_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 70 AND 100),
  certificate_template_id TEXT NOT NULL DEFAULT 'default_abhi_certificate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Assessment Configurations (Module Quizzes & Final Assessments — server-only answer keys)
CREATE TABLE IF NOT EXISTS public.learning_assessments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
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

-- 3. Active Assessment Sessions (Stateless multi-instance grading across Cloud Run instances)
CREATE TABLE IF NOT EXISTS public.learning_assessment_sessions (
  session_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('module_quiz', 'final_assessment')),
  module_id TEXT,
  firebase_uid TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL DEFAULT '',
  served_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_uid_expires
  ON public.learning_assessment_sessions (firebase_uid, expires_at);

-- 4. Lesson Progress (Per verified Firebase UID and course)
CREATE TABLE IF NOT EXISTS public.learning_lesson_progress (
  firebase_uid TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (firebase_uid, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_course
  ON public.learning_lesson_progress (course_id);

-- 5. Module Quiz Attempts (Immutable, server-graded, HMAC-signed receipts)
CREATE TABLE IF NOT EXISTS public.learning_quiz_attempts (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL DEFAULT '',
  course_id TEXT NOT NULL,
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

-- 6. Final Course Assessment Attempts (Immutable, server-graded, HMAC-signed, minimum 70% pass rule)
CREATE TABLE IF NOT EXISTS public.learning_final_assessment_attempts (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL DEFAULT '',
  course_id TEXT NOT NULL,
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

-- 7. Module Unlocks & Authoritative Course Progression (Server-derived only)
CREATE TABLE IF NOT EXISTS public.learning_module_unlocks (
  firebase_uid TEXT NOT NULL,
  course_id TEXT NOT NULL,
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

-- 8. Course Completion Certificates (Immutable, unique per (firebase_uid, course_id), HMAC-signed)
CREATE TABLE IF NOT EXISTS public.learning_certificates (
  certificate_id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  final_assessment_score INTEGER NOT NULL CHECK (final_assessment_score BETWEEN 70 AND 100),
  final_attempt_id TEXT NOT NULL,
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

ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_final_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_module_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_certificates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.learning_courses FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_assessments FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_assessment_sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_lesson_progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_quiz_attempts FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_final_assessment_attempts FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_module_unlocks FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_certificates FROM anon, authenticated;
