-- Add missing columns for the Past Applications history feature
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS interview_qa JSONB,
  ADD COLUMN IF NOT EXISTS email_text TEXT,
  ADD COLUMN IF NOT EXISTS resume_text TEXT,
  ADD COLUMN IF NOT EXISTS job_text TEXT,
  ADD COLUMN IF NOT EXISTS company_primary_color TEXT DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS missing_keywords JSONB;

-- Relax NOT NULL constraints (cover letter, job description, and resume are generated on-demand)
ALTER TABLE public.generations ALTER COLUMN cover_letter_html DROP NOT NULL;
ALTER TABLE public.generations ALTER COLUMN job_description DROP NOT NULL;
ALTER TABLE public.generations ALTER COLUMN resume_html DROP NOT NULL;
