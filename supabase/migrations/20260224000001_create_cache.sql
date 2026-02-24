-- Create cache table for edge function response caching
CREATE TABLE IF NOT EXISTS public.cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    cache_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for cache lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON public.cache(expires_at);

-- RLS: service role only (edge functions use service role key)
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;

-- No user-facing policies needed — edge functions bypass RLS with service role
