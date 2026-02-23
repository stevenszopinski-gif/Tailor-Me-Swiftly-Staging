-- Run this SQL in your Supabase SQL Editor to create the generations table

CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_description TEXT NOT NULL,
    resume_html TEXT NOT NULL,
    cover_letter_html TEXT NOT NULL,
    match_score INTEGER,
    applicant_name TEXT,
    target_company TEXT,
    application_status TEXT DEFAULT 'Tailored',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own generations
CREATE POLICY "Users can view their own generations."
ON public.generations FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own generations
CREATE POLICY "Users can insert their own generations."
ON public.generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own generations
CREATE POLICY "Users can update their own generations."
ON public.generations FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own generations
CREATE POLICY "Users can delete their own generations."
ON public.generations FOR DELETE
USING (auth.uid() = user_id);

-- Add version_name column for resume versions
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS version_name TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_created_at_idx ON public.generations(created_at DESC);

-- ─── Saved Jobs Table ───
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_url TEXT,
    job_title TEXT,
    company_name TEXT,
    job_description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved jobs."
ON public.saved_jobs FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_jobs_user_id_idx ON public.saved_jobs(user_id);

-- ─── Master Career Profile Table ───
CREATE TABLE IF NOT EXISTS public.master_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_text TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.master_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile."
ON public.master_profiles FOR ALL
USING (auth.uid() = user_id);
