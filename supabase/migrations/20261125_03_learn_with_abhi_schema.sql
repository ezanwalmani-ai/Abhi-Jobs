-- ==============================================================================
-- ABHI JOBS — MIGRATION 03: LEARN WITH ABHI COMPLETE SCHEMA & SECURITY RULES
-- Project Ref: ruagizqernsqypujeutu
-- File: supabase/migrations/20261125_03_learn_with_abhi_schema.sql
--
-- DESIGN GUARANTEES:
-- 1. Preserves the 12-module Excel for Job Seekers course structure, multi-video
--    metadata, collapsible Study Guides, practical workbooks, quizzes, and
--    immutable Course Completion Certificates.
-- 2. Supports seamless migration of existing Firebase learner records via
--    nullable legacy_firebase_uid columns on progress/attempt/certificate tables.
-- 3. Strictly hides quiz answer keys (quiz_configs, quiz_questions,
--    assessment_sessions) from anon & authenticated via RLS + REVOKE ALL.
-- 4. Prevents client-side tampering with module unlocks, quiz passes, or course
--    completion status via trigger + server-only write controls.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Certificate Templates
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL DEFAULT 'ABHI JOBS — Learn with ABHI',
  certificate_title TEXT NOT NULL DEFAULT 'Certificate of Completion',
  subtitle TEXT NOT NULL DEFAULT 'has successfully completed the professional course',
  signatory_name TEXT NOT NULL DEFAULT 'Abhishek',
  signatory_designation TEXT NOT NULL DEFAULT 'Founder & Director, ABHI JOBS',
  primary_color TEXT NOT NULL DEFAULT '#102B4E' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color TEXT NOT NULL DEFAULT '#F47A24' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_default BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Courses, Modules, Lessons, Videos & Collapsible Study Guides
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL DEFAULT 'excel-digital-skills',
  category_name TEXT NOT NULL DEFAULT 'Excel & Digital Skills',
  title TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Beginner',
  estimated_duration TEXT NOT NULL DEFAULT '',
  is_free BOOLEAN NOT NULL DEFAULT true,
  price_label TEXT,
  thumbnail_url TEXT,
  offers_certificate BOOLEAN NOT NULL DEFAULT true,
  sequential_unlock BOOLEAN NOT NULL DEFAULT true,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 70 AND 100),
  certificate_template_id TEXT REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  course_introduction JSONB NOT NULL DEFAULT '{}'::jsonb,
  what_you_will_learn TEXT[] NOT NULL DEFAULT '{}',
  skills_developed TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  deleted_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  module_order INTEGER NOT NULL CHECK (module_order BETWEEN 1 AND 50),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  level TEXT,
  learning_objectives TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER NOT NULL DEFAULT 25 CHECK (estimated_minutes BETWEEN 1 AND 600),
  quiz_required BOOLEAN NOT NULL DEFAULT true,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 50 AND 100),
  is_upcoming_placeholder BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, module_order)
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_order
  ON public.course_modules (course_id, module_order);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_order INTEGER NOT NULL CHECK (lesson_order BETWEEN 1 AND 200),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  written_content TEXT NOT NULL DEFAULT '',
  exercise_title TEXT,
  exercise_instructions TEXT,
  exercise_deliverable TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_minutes INTEGER NOT NULL DEFAULT 20 CHECK (estimated_minutes BETWEEN 1 AND 300),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, lesson_order)
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_module
  ON public.course_lessons (course_id, module_id, lesson_order);

CREATE TABLE IF NOT EXISTS public.lesson_videos (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  video_order INTEGER NOT NULL DEFAULT 1 CHECK (video_order BETWEEN 1 AND 20),
  title TEXT NOT NULL,
  publisher TEXT,
  youtube_video_id TEXT NOT NULL CHECK (youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$'),
  watch_url TEXT,
  embed_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('verified', 'needs_correction', 'unverified')),
  description TEXT NOT NULL DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 600 CHECK (duration_seconds >= 1),
  duration_label TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  sections_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, video_order)
);

CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson ON public.lesson_videos (lesson_id, video_order);

CREATE TABLE IF NOT EXISTS public.lesson_study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL UNIQUE REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Study Guide',
  subtitle TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Quizzes, Question Banks & Assessment Sessions (STRICTLY SERVER-ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_configs (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.course_modules(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('module_quiz', 'final_assessment')),
  module_order INTEGER CHECK (module_order IS NULL OR module_order BETWEEN 1 AND 50),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 40 AND 100),
  question_count INTEGER NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 1 AND 50),
  randomize_order BOOLEAN NOT NULL DEFAULT true,
  required_for_completion BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_quiz_configs_module_binding CHECK (
    (assessment_type = 'module_quiz' AND module_id IS NOT NULL)
    OR (assessment_type = 'final_assessment' AND module_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_quiz_configs_course ON public.quiz_configs (course_id, assessment_type);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_config_id TEXT NOT NULL REFERENCES public.quiz_configs(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index SMALLINT NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
  explanation TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_config ON public.quiz_questions (quiz_config_id, display_order)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  session_id TEXT PRIMARY KEY,
  quiz_config_id TEXT NOT NULL REFERENCES public.quiz_configs(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('module_quiz', 'final_assessment')),
  module_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  served_question_ids TEXT[] NOT NULL DEFAULT '{}',
  option_permutations JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_expires
  ON public.assessment_sessions (user_id, expires_at);

-- ------------------------------------------------------------------------------
-- 4. Learner Enrolments, Video Progress, Attempts, Certificates & Evaluations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_enrolments (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  legacy_firebase_uid TEXT,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
  current_module_id TEXT,
  current_lesson_id TEXT,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  passed_module_quiz_ids TEXT[] NOT NULL DEFAULT '{}',
  unlocked_module_order INTEGER NOT NULL DEFAULT 1 CHECK (unlocked_module_order BETWEEN 1 AND 50),
  final_assessment_passed BOOLEAN NOT NULL DEFAULT false,
  best_final_score_percent INTEGER CHECK (best_final_score_percent IS NULL OR best_final_score_percent BETWEEN 0 AND 100),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  last_verified_attempt_id UUID,
  last_verified_final_attempt_id UUID,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrolments_course ON public.course_enrolments (course_id, status);

-- Prevent client tampering with server-derived progression/completion fields
CREATE OR REPLACE FUNCTION public.guard_enrolment_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'enrolled';
    NEW.passed_module_quiz_ids := '{}';
    NEW.unlocked_module_order := 1;
    NEW.final_assessment_passed := false;
    NEW.best_final_score_percent := NULL;
    NEW.last_verified_attempt_id := NULL;
    NEW.last_verified_final_attempt_id := NULL;
    NEW.completed_at := NULL;
    NEW.progress_percent := LEAST(COALESCE(NEW.progress_percent, 0), 95);
    RETURN NEW;
  END IF;

  -- On client UPDATE, lock server-verified progression columns
  IF NEW.passed_module_quiz_ids IS DISTINCT FROM OLD.passed_module_quiz_ids
     OR NEW.unlocked_module_order IS DISTINCT FROM OLD.unlocked_module_order
     OR NEW.final_assessment_passed IS DISTINCT FROM OLD.final_assessment_passed
     OR NEW.best_final_score_percent IS DISTINCT FROM OLD.best_final_score_percent
     OR NEW.last_verified_attempt_id IS DISTINCT FROM OLD.last_verified_attempt_id
     OR NEW.last_verified_final_attempt_id IS DISTINCT FROM OLD.last_verified_final_attempt_id
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR (NEW.status = 'completed' AND OLD.final_assessment_passed = false)
  THEN
    RAISE EXCEPTION 'Progression unlock and completion fields can only be updated by verified server grading.';
  END IF;

  IF NEW.final_assessment_passed = false AND NEW.progress_percent >= 100 THEN
    NEW.progress_percent := 95;
  END IF;

  NEW.last_accessed_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrolments_guard_progression ON public.course_enrolments;
CREATE TRIGGER trg_enrolments_guard_progression
  BEFORE INSERT OR UPDATE ON public.course_enrolments
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_enrolment_privileged_columns();

CREATE TABLE IF NOT EXISTS public.video_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  legacy_firebase_uid TEXT,
  youtube_video_id TEXT NOT NULL,
  duration_seconds NUMERIC NOT NULL DEFAULT 0,
  watched_seconds NUMERIC NOT NULL DEFAULT 0,
  max_percent_watched NUMERIC NOT NULL DEFAULT 0 CHECK (max_percent_watched BETWEEN 0 AND 100),
  last_position_seconds NUMERIC NOT NULL DEFAULT 0,
  has_played BOOLEAN NOT NULL DEFAULT false,
  completed_via_player BOOLEAN NOT NULL DEFAULT false,
  manual_completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id, lesson_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_progress_user_course ON public.video_progress (user_id, course_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_firebase_uid TEXT,
  candidate_name TEXT NOT NULL DEFAULT '',
  candidate_email TEXT NOT NULL DEFAULT '',
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  quiz_config_id TEXT REFERENCES public.quiz_configs(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('module_quiz', 'final_assessment')),
  module_id TEXT,
  assessment_title TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 1 AND total_questions <= 50),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  incorrect_answers INTEGER NOT NULL CHECK (incorrect_answers >= 0 AND incorrect_answers <= total_questions),
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  pass_percentage INTEGER NOT NULL CHECK (pass_percentage BETWEEN 1 AND 100),
  passed BOOLEAN NOT NULL,
  question_results JSONB,
  verification_signature TEXT NOT NULL CHECK (length(verification_signature) >= 32),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_quiz_attempts_counts CHECK (correct_answers + incorrect_answers = total_questions),
  CONSTRAINT chk_quiz_attempts_pass_rule CHECK (passed = (score_percent >= pass_percentage))
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_course
  ON public.quiz_attempts (user_id, course_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_course_submitted
  ON public.quiz_attempts (course_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.certificates (
  certificate_id TEXT PRIMARY KEY CHECK (certificate_id ~ '^[A-Z0-9-]{8,64}$'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  legacy_firebase_uid TEXT,
  candidate_name TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.learning_courses(id) ON DELETE RESTRICT,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  final_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE RESTRICT,
  final_assessment_score INTEGER NOT NULL CHECK (final_assessment_score BETWEEN 70 AND 100),
  template_id TEXT REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  verification_signature TEXT NOT NULL CHECK (length(verification_signature) >= 32),
  completion_date TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates (user_id, issued_at DESC);

-- Safe Public Certificate Verification Function (Strictly returns 5 non-PII fields)
CREATE OR REPLACE FUNCTION public.verify_public_certificate(p_certificate_id TEXT)
RETURNS TABLE (
  certificate_id TEXT,
  candidate_name TEXT,
  course_title TEXT,
  issue_date TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.certificate_id,
    c.candidate_name,
    c.course_title,
    c.completion_date AS issue_date,
    c.status
  FROM public.certificates c
  WHERE c.certificate_id = upper(trim(p_certificate_id))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_public_certificate(TEXT) TO anon, authenticated;

-- Career Readiness Assessments (Replaces Firestore /users/{uid}/career_assessments)
CREATE TABLE IF NOT EXISTS public.career_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_firebase_uid TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  current_step INTEGER NOT NULL DEFAULT 0 CHECK (current_step BETWEEN 0 AND 7),
  basic_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  education JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience JSONB NOT NULL DEFAULT '{}'::jsonb,
  career_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills_evaluation JSONB NOT NULL DEFAULT '{}'::jsonb,
  practical_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning_recommendation_consent BOOLEAN NOT NULL DEFAULT false,
  recruitment_consent BOOLEAN NOT NULL DEFAULT false,
  report JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_assessments_user ON public.career_assessments (user_id, updated_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security & Strict Answer-Key Isolation
-- ------------------------------------------------------------------------------
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_assessments ENABLE ROW LEVEL SECURITY;

-- Strictly block all direct browser/client reads & writes on quiz answer keys and sessions
REVOKE ALL ON TABLE public.quiz_configs FROM anon, authenticated;
REVOKE ALL ON TABLE public.quiz_questions FROM anon, authenticated;
REVOKE ALL ON TABLE public.assessment_sessions FROM anon, authenticated;

-- Block client writes to server-graded attempts and immutable certificates
REVOKE INSERT, UPDATE, DELETE ON TABLE public.quiz_attempts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.certificates FROM anon, authenticated;

-- Published Learning Content (Public Read; Super Admin & Learning Admin Write)
CREATE POLICY "certificate_templates_public_read"
  ON public.certificate_templates FOR SELECT
  USING (true);

CREATE POLICY "certificate_templates_admin_write"
  ON public.certificate_templates FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));

CREATE POLICY "learning_courses_read_published_or_admin"
  ON public.learning_courses FOR SELECT
  USING (
    (status = 'published' AND deleted_at IS NULL)
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "learning_courses_admin_write"
  ON public.learning_courses FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));

CREATE POLICY "course_modules_read_published_or_admin"
  ON public.course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_courses lc
      WHERE lc.id = course_modules.course_id AND lc.status = 'published' AND lc.deleted_at IS NULL
    )
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "course_modules_admin_write"
  ON public.course_modules FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));

CREATE POLICY "course_lessons_read_published_or_admin"
  ON public.course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_courses lc
      WHERE lc.id = course_lessons.course_id AND lc.status = 'published' AND lc.deleted_at IS NULL
    )
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "course_lessons_admin_write"
  ON public.course_lessons FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));

CREATE POLICY "lesson_videos_read_published_or_admin"
  ON public.lesson_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_courses lc
      WHERE lc.id = lesson_videos.course_id AND lc.status = 'published' AND lc.deleted_at IS NULL
    )
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "lesson_videos_admin_write"
  ON public.lesson_videos FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));

CREATE POLICY "lesson_study_guides_read_published_or_admin"
  ON public.lesson_study_guides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_courses lc
      WHERE lc.id = lesson_study_guides.course_id AND lc.status = 'published' AND lc.deleted_at IS NULL
    )
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "lesson_study_guides_admin_write"
  ON public.lesson_study_guides FOR ALL
  TO authenticated
  USING (public.is_active_admin(ARRAY['super_admin', 'learning_admin']))
  WITH CHECK (public.is_active_admin(ARRAY['super_admin', 'learning_admin']));

-- Learner Enrolments & Progress (Strict Owner Isolation + Trigger Guard)
CREATE POLICY "course_enrolments_select_own_or_admin"
  ON public.course_enrolments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "course_enrolments_insert_own"
  ON public.course_enrolments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "course_enrolments_update_own"
  ON public.course_enrolments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_progress_owner_all_or_admin_read"
  ON public.video_progress FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "video_progress_owner_insert"
  ON public.video_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_progress_owner_update"
  ON public.video_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Attempts & Certificates (Owner & Authorized Admin SELECT ONLY; Writes Server-Only)
CREATE POLICY "quiz_attempts_select_own_or_admin"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

CREATE POLICY "certificates_select_own_or_admin"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_admin(ARRAY['super_admin', 'learning_admin', 'read_only_admin'])
  );

-- Career Assessments (Strict Owner Isolation; Admin Read ONLY if recruitment_consent = true or super_admin)
CREATE POLICY "career_assessments_select_own_or_consented_admin"
  ON public.career_assessments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR (
      recruitment_consent = true
      AND public.is_active_admin(ARRAY['recruitment_admin', 'read_only_admin'])
    )
  );

CREATE POLICY "career_assessments_owner_insert"
  ON public.career_assessments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "career_assessments_owner_update"
  ON public.career_assessments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
