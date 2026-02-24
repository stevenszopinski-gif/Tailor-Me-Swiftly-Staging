const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
]

function extractJsonLd(html: string): any | null {
    const matches = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    if (!matches) return null
    for (const match of matches) {
        try {
            const json = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
            const parsed = JSON.parse(json)
            // Handle arrays of schemas
            const schemas = Array.isArray(parsed) ? parsed : [parsed]
            for (const schema of schemas) {
                if (schema['@type'] === 'JobPosting') return schema
            }
        } catch { /* skip malformed JSON-LD */ }
    }
    return null
}

function structuredFromJsonLd(schema: any): any {
    return {
        title: schema.title || null,
        company: schema.hiringOrganization?.name || null,
        text: schema.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || null,
        location: schema.jobLocation?.address?.addressLocality || null,
        structured: true,
        source: 'json-ld',
    }
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

        let parsed: URL
        try {
            parsed = new URL(url)
        } catch {
            throw new Error('Invalid URL')
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only HTTP/HTTPS URLs are supported')
        }

        const host = parsed.hostname.toLowerCase()

        // ── LinkedIn: reject early with helpful message ──
        if (host.includes('linkedin.com')) {
            return new Response(JSON.stringify({
                error: 'LinkedIn blocks automated access. Please copy the job description text and paste it manually.',
                source: 'linkedin'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // ── Fetch the page ──
        const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const resp = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': ua,
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

        // ── Greenhouse: try JSON-LD extraction ──
        if (host.includes('greenhouse.io') || host.includes('boards.greenhouse.io')) {
            const schema = extractJsonLd(html)
            if (schema) {
                return new Response(JSON.stringify(structuredFromJsonLd(schema)), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
        }

        // ── Lever: try JSON-LD extraction ──
        if (host.includes('lever.co') || host.includes('jobs.lever.co')) {
            const schema = extractJsonLd(html)
            if (schema) {
                return new Response(JSON.stringify(structuredFromJsonLd(schema)), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
        }

        // ── Workday: try embedded JSON in script tags ──
        if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) {
            const schema = extractJsonLd(html)
            if (schema) {
                return new Response(JSON.stringify(structuredFromJsonLd(schema)), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
        }

        // ── Generic: try JSON-LD first, then fall back to raw HTML ──
        const schema = extractJsonLd(html)
        if (schema) {
            return new Response(JSON.stringify(structuredFromJsonLd(schema)), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Fallback: return raw HTML (backward compatible)
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
