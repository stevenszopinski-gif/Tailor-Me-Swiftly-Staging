-- Run this in the Supabase SQL Editor to set up the feedback feature:

-- 1. Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email text,
    category text DEFAULT 'general',
    message text NOT NULL,
    rating smallint CHECK (rating >= 1 AND rating <= 5),
    page text,
    created_at timestamptz DEFAULT now(),
    read boolean DEFAULT false
);

-- 2. Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy to allow authenticated users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.feedback
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 4. Create Policy for service role / admin access
CREATE POLICY "Full access for service role" ON public.feedback
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. (Optional) Email Notification Setup
-- To get an email whenever feedback is submitted:
-- Go to Database -> Webhooks in the Supabase Dashboard
-- Create a new webhook for the 'feedback' table on 'INSERT'
-- Point it to a service like Resend or a custom Edge Function.
