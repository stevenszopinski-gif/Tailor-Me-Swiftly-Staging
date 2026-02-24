-- Create error_logs table for client-side error monitoring
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    page_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by user and recency
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);

-- RLS: users can insert their own errors, only service role can read
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own errors"
    ON public.error_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own errors"
    ON public.error_logs FOR SELECT
    USING (auth.uid() = user_id);
