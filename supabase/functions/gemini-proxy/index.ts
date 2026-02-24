import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { systemInstruction, contents, generationConfig, model, cacheKey, cacheTtlSeconds } = await req.json()
        const TARGET_MODEL = model || "gemini-3-flash-preview";

        // ── Cache check ──
        if (cacheKey) {
            try {
                const supabaseUrl = Deno.env.get('SUPABASE_URL')!
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                const sb = createClient(supabaseUrl, supabaseServiceKey)

                const { data: cached } = await sb
                    .from('cache')
                    .select('cache_value')
                    .eq('cache_key', cacheKey)
                    .gt('expires_at', new Date().toISOString())
                    .maybeSingle()

                if (cached) {
                    return new Response(JSON.stringify(cached.cache_value), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
                        status: 200,
                    })
                }
            } catch {
                // Cache read failure is non-fatal — proceed to Gemini
            }
        }

        // ── Gemini API call ──
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not defined")
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL}:generateContent?key=${GEMINI_API_KEY}`

        const googleReqBody: any = {
            contents,
            generationConfig: generationConfig || { temperature: 0.7 }
        }

        if (systemInstruction) {
            googleReqBody.systemInstruction = systemInstruction;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(googleReqBody)
        });

        const data = await response.json();

        // ── Cache write (only on successful Gemini response) ──
        if (cacheKey && data?.candidates?.[0]) {
            try {
                const ttl = cacheTtlSeconds || 86400; // default 24h
                const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
                const supabaseUrl = Deno.env.get('SUPABASE_URL')!
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                const sb = createClient(supabaseUrl, supabaseServiceKey)

                await sb.from('cache').upsert({
                    cache_key: cacheKey,
                    cache_value: data,
                    expires_at: expiresAt
                }, { onConflict: 'cache_key' })
            } catch {
                // Cache write failure is non-fatal
            }
        }

        // Always return 200 so the client can read the full Gemini response body
        // (non-200 from Gemini causes Supabase to swallow the error details)
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
