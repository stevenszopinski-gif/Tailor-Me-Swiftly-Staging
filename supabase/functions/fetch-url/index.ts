const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()

        if (!url || typeof url !== 'string') {
            throw new Error('url is required')
        }

        // Basic URL validation
        let parsed: URL
        try {
            parsed = new URL(url)
        } catch {
            throw new Error('Invalid URL')
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only HTTP/HTTPS URLs are supported')
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const resp = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
        })
        clearTimeout(timeout)

        if (!resp.ok) {
            throw new Error(`Remote server returned ${resp.status}`)
        }

        const html = await resp.text()

        return new Response(JSON.stringify({ html }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        const msg = error.name === 'AbortError' ? 'Request timed out' : error.message
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
