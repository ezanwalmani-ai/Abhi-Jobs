-- ==============================================================================
-- ABHI JOBS — MIGRATION 05: IDEMPOTENT SEED & VERIFIED SUPER ADMIN BOOTSTRAP
-- Project Ref: ruagizqernsqypujeutu
-- File: supabase/migrations/20261125_05_seed_initial_catalog_and_admin.sql
--
-- SAFETY GUARANTEES:
-- 1. Strictly idempotent (ON CONFLICT DO NOTHING) — NEVER overwrites live data.
-- 2. Preserves the exact 12-module Excel for Job Seekers course IDs & structure.
-- 3. Super Admin bootstrap for ezanwalmani@gmail.com ONLY activates if a
--    verified Supabase Auth account (email_confirmed_at IS NOT NULL) exists.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Baseline Job Categories
-- ------------------------------------------------------------------------------
INSERT INTO public.job_categories (slug, name, description, display_order)
VALUES
  ('engineering', 'Technology & Engineering', 'Software, data, cloud, and IT engineering roles', 1),
  ('operations', 'Operations & Administration', 'Business operations, MIS, coordination, and admin', 2),
  ('finance-accounting', 'Finance & Accounting', 'Accounts, payroll, audit, and financial analysis', 3),
  ('sales-marketing', 'Sales & Marketing', 'Inside sales, B2B growth, digital marketing, and CRM', 4),
  ('human-resources', 'Human Resources', 'Talent acquisition, HR operations, and L&D', 5),
  ('customer-support', 'Customer Success & Support', 'Client onboarding, service desk, and account care', 6)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Default Certificate Template
-- ------------------------------------------------------------------------------
INSERT INTO public.certificate_templates (
  id,
  name,
  organization_name,
  certificate_title,
  subtitle,
  signatory_name,
  signatory_designation,
  primary_color,
  accent_color,
  is_default
)
VALUES (
  'default_abhi_certificate',
  'ABHI JOBS Official Certificate',
  'ABHI JOBS — Learn with ABHI',
  'Certificate of Course Completion',
  'has successfully completed all required modules, practical assessments, and the final examination for',
  'Abhishek',
  'Founder & Director, ABHI JOBS',
  '#102B4E',
  '#F47A24',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Excel for Job Seekers — Course & Complete 12-Module Structure
-- ------------------------------------------------------------------------------
INSERT INTO public.learning_courses (
  id,
  slug,
  category_id,
  category_name,
  title,
  short_description,
  full_description,
  level,
  estimated_duration,
  is_free,
  offers_certificate,
  sequential_unlock,
  pass_percentage,
  certificate_template_id,
  status
)
VALUES (
  'excel_for_job_seekers',
  'excel-for-job-seekers',
  'excel-digital-skills',
  'Excel & Digital Skills',
  'Excel for Job Seekers',
  'Build job-ready Microsoft Excel skills step by step across 12 structured practical modules — from core fundamentals to PivotTables, dashboards, and AI-assisted automation.',
  'Master workplace-ready Microsoft Excel across 12 hands-on modules covering spreadsheets, formatting, formulas, essential functions, VLOOKUP/XLOOKUP, tables, data cleaning, conditional formatting, PivotTables, dashboards, real workplace tasks, and AI automation.',
  'Beginner',
  '12 Modules · Self-Paced',
  true,
  true,
  true,
  70,
  'default_abhi_certificate',
  'published'
)
ON CONFLICT (id) DO NOTHING;

-- Seed all 12 Modules preserving exact module IDs and sequential order (1..12)
INSERT INTO public.course_modules (id, course_id, module_order, title, summary, estimated_minutes, quiz_required, pass_percentage)
VALUES
  ('excel_m01_fundamentals', 'excel_for_job_seekers', 1, 'Excel Fundamentals', 'Workbook navigation, ribbons, cells, ranges, and core spreadsheet workflows.', 25, true, 70),
  ('excel_m02_data_entry_formatting', 'excel_for_job_seekers', 2, 'Data Entry & Formatting', 'Structured data entry, number/date formatting, alignment, and presentation standards.', 30, true, 70),
  ('excel_m03_formulas_references', 'excel_for_job_seekers', 3, 'Formulas & Cell References', 'Arithmetic formulas, order of operations, and relative, absolute, and mixed references.', 30, true, 70),
  ('excel_m04_essential_functions', 'excel_for_job_seekers', 4, 'Essential Functions', 'SUM, AVERAGE, COUNT, MIN/MAX, IF, COUNTIF, and SUMIF for workplace analysis.', 35, true, 70),
  ('excel_m05_vlookup_xlookup', 'excel_for_job_seekers', 5, 'VLOOKUP, XLOOKUP & Lookup Skills', 'Cross-sheet lookups, exact vs approximate match, and error-safe lookup formulas.', 35, true, 70),
  ('excel_m06_sorting_filtering_tables', 'excel_for_job_seekers', 6, 'Sorting, Filtering, Tables & Data Validation', 'Multi-level sorting, AutoFilter, Excel Tables, dropdowns, and validation controls.', 35, true, 70),
  ('excel_m07_data_cleaning', 'excel_for_job_seekers', 7, 'Data Cleaning & Data Management', 'TRIM, CLEAN, text splitting, removing duplicates, and standardizing messy datasets.', 35, true, 70),
  ('excel_m08_conditional_formatting', 'excel_for_job_seekers', 8, 'Conditional Formatting', 'KPI highlighting, top/bottom rules, color scales, icon sets, and formula-driven alerts.', 30, true, 70),
  ('excel_m09_pivottables_analysis', 'excel_for_job_seekers', 9, 'PivotTables & Data Analysis', 'Summarizing large datasets with PivotTables, grouping, slicers, and calculated summaries.', 40, true, 70),
  ('excel_m10_charts_dashboards', 'excel_for_job_seekers', 10, 'Charts, Reports & Dashboards', 'Choosing the right chart, visual hierarchy, KPI cards, and interactive executive dashboards.', 40, true, 70),
  ('excel_m11_real_jobs_workplace', 'excel_for_job_seekers', 11, 'Excel for Real Jobs & Workplace Tasks', 'MIS trackers, HR/sales/finance reporting workflows, and interview case tests.', 40, true, 70),
  ('excel_m12_ai_automation_project', 'excel_for_job_seekers', 12, 'AI with Excel, Automation & Final Project', 'AI formula drafting, workflow automation essentials, and end-to-end capstone workbook.', 45, true, 70)
ON CONFLICT (id) DO NOTHING;

-- Seed all 12 Module Lessons preserving exact lesson IDs
INSERT INTO public.course_lessons (id, course_id, module_id, lesson_order, title, description, estimated_minutes)
VALUES
  ('excel_m01_lesson_01', 'excel_for_job_seekers', 'excel_m01_fundamentals', 1, 'Module 01: Excel Fundamentals', 'Master the Excel interface, workbooks, worksheets, cells, and navigation shortcuts.', 25),
  ('excel_m02_lesson_01', 'excel_for_job_seekers', 'excel_m02_data_entry_formatting', 1, 'Module 02: Data Entry & Formatting', 'Format business tables cleanly with number formats, dates, alignment, and print layout.', 30),
  ('excel_m03_lesson_01', 'excel_for_job_seekers', 'excel_m03_formulas_references', 1, 'Module 03: Formulas & Cell References', 'Build dynamic formulas using relative, absolute ($A$1), and mixed cell references.', 30),
  ('excel_m04_lesson_01', 'excel_for_job_seekers', 'excel_m04_essential_functions', 1, 'Module 04: Essential Functions', 'Apply SUM, AVERAGE, COUNT, IF, SUMIF, and COUNTIF to real business spreadsheets.', 35),
  ('excel_m05_lesson_01', 'excel_for_job_seekers', 'excel_m05_vlookup_xlookup', 1, 'Module 05: VLOOKUP, XLOOKUP & Lookup Skills', 'Combine datasets reliably using VLOOKUP, XLOOKUP, and IFERROR handling.', 35),
  ('excel_m06_lesson_01', 'excel_for_job_seekers', 'excel_m06_sorting_filtering_tables', 1, 'Module 06: Sorting, Filtering, Tables & Data Validation', 'Organize records with structured Excel Tables, filters, and dropdown validation.', 35),
  ('excel_m07_lesson_01', 'excel_for_job_seekers', 'excel_m07_data_cleaning', 1, 'Module 07: Data Cleaning & Data Management', 'Clean raw exports with TRIM, PROPER, Flash Fill, Text to Columns, and deduplication.', 35),
  ('excel_m08_lesson_01', 'excel_for_job_seekers', 'excel_m08_conditional_formatting', 1, 'Module 08: Conditional Formatting', 'Highlight exceptions, SLA breaches, and KPIs dynamically with conditional rules.', 30),
  ('excel_m09_lesson_01', 'excel_for_job_seekers', 'excel_m09_pivottables_analysis', 1, 'Module 09: PivotTables & Data Analysis', 'Build multi-dimensional PivotTables, slicers, and summary views in minutes.', 40),
  ('excel_m10_lesson_01', 'excel_for_job_seekers', 'excel_m10_charts_dashboards', 1, 'Module 10: Charts, Reports & Dashboards', 'Design executive-ready charts and interactive dashboards connected to PivotTables.', 40),
  ('excel_m11_lesson_01', 'excel_for_job_seekers', 'excel_m11_real_jobs_workplace', 1, 'Module 11: Excel for Real Jobs & Workplace Tasks', 'Complete realistic office trackers, HR/finance sheets, and job-interview exercises.', 40),
  ('excel_m12_lesson_01', 'excel_for_job_seekers', 'excel_m12_ai_automation_project', 1, 'Module 12: AI with Excel, Automation & Final Project', 'Accelerate spreadsheet tasks with AI tools and complete the capstone business workbook.', 45)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Default Website Content & Settings (Official ABHI JOBS Links Preserved)
-- ------------------------------------------------------------------------------
INSERT INTO public.website_settings (key, value, is_public, description)
VALUES
  (
    'social_links',
    '{"instagram":"https://www.instagram.com/abhijobsofficial/","linkedin":"https://www.linkedin.com/company/abhi-jobs/"}'::jsonb,
    true,
    'Official ABHI JOBS social media links displayed in the website footer.'
  ),
  (
    'admin_route_config',
    '{"privatePath":"/abhi-control-center","hideFromPublicNavigation":true}'::jsonb,
    false,
    'Private central admin panel routing metadata (non-public).'
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.website_content (key, section, title, content, is_published)
VALUES
  (
    'homepage_announcement',
    'homepage',
    'Learn with ABHI — Free Excel for Job Seekers',
    '{"enabled":true,"text":"Master job-ready Excel across 12 structured modules on Learn with ABHI.","ctaLabel":"Explore Courses","ctaPath":"/learning"}'::jsonb,
    true
  )
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. Verified Super Admin Bootstrap (ezanwalmani@gmail.com)
--    STRICT RULE: Grants super_admin ONLY if ezanwalmani@gmail.com ALREADY has
--    a verified Supabase Auth account (email_confirmed_at IS NOT NULL).
--    If not yet confirmed, safely logs a NOTICE and grants NO admin privileges.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_uid UUID;
BEGIN
  SELECT id
  INTO v_admin_uid
  FROM auth.users
  WHERE lower(email) = 'ezanwalmani@gmail.com'
    AND email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF v_admin_uid IS NULL THEN
    RAISE NOTICE 'Super Admin bootstrap skipped: verified auth.users account for ezanwalmani@gmail.com not found yet. Sign in & confirm email in Supabase Auth first, then re-run this bootstrap block.';
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, account_type, status)
  VALUES (v_admin_uid, 'ezanwalmani@gmail.com', 'ABHI JOBS Super Admin', 'admin', 'active')
  ON CONFLICT (id) DO UPDATE
    SET account_type = 'admin',
        status = 'active',
        updated_at = now();

  INSERT INTO public.admin_roles (user_id, role, is_active, notes)
  VALUES (v_admin_uid, 'super_admin', true, 'Verified initial Super Admin bootstrap')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.admin_activity_logs (actor_user_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_uid,
    'ezanwalmani@gmail.com',
    'super_admin',
    'bootstrap_super_admin',
    'admin_roles',
    v_admin_uid::text,
    '{"source":"migration_05","verified_email":true}'::jsonb
  );
END $$;
