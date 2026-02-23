const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { systemInstruction, contents, generationConfig, model } = await req.json()
        const TARGET_MODEL = model || "gemini-3-flash-preview";

        // Retrieve secret from Supabase Vault/Env
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

        // Always return 200 so the client can read the full Gemini response body
        // (non-200 from Gemini causes Supabase to swallow the error details)
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
