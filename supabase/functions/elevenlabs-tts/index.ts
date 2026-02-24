const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { text, voiceId } = await req.json()
        const voice = voiceId || "8Ln42OXYupYsag45MAUy"
        console.log('[elevenlabs-tts] Request received, text length:', text?.length || 0)

        const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
        console.log('[elevenlabs-tts] API key present:', !!ELEVENLABS_API_KEY)
        if (!ELEVENLABS_API_KEY) {
            throw new Error("ELEVENLABS_API_KEY environment variable is not defined")
        }

        if (!text || !text.trim()) {
            throw new Error("text is required")
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`)
        }

        const audioBuffer = await response.arrayBuffer()

        return new Response(audioBuffer, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/octet-stream',
            },
            status: 200,
        })
    } catch (error) {
        console.error('[elevenlabs-tts] ERROR:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
