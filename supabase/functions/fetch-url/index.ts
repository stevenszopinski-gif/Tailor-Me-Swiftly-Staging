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

        // ── LinkedIn: special handling for profile pages ──
        const isLinkedInProfile = host.includes('linkedin.com') && parsed.pathname.startsWith('/in/')
        const isLinkedInJob = host.includes('linkedin.com') && !isLinkedInProfile

        if (isLinkedInJob) {
            return new Response(JSON.stringify({
                error: 'LinkedIn blocks automated job listing access. Please copy the job description text and paste it manually.',
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

        let resp: Response
        try {
            resp = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                redirect: 'follow',
            })
        } catch (fetchErr) {
            clearTimeout(timeout)
            // LinkedIn profile fetch failed — return helpful message
            if (isLinkedInProfile) {
                return new Response(JSON.stringify({
                    error: 'Could not reach LinkedIn. Please copy your profile page text (Ctrl+A, Ctrl+C) and paste it in the resume upload area instead.',
                    source: 'linkedin'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
            throw fetchErr
        }
        clearTimeout(timeout)

        if (!resp.ok) {
            // LinkedIn commonly returns 999 or 403 to block scrapers
            if (isLinkedInProfile) {
                return new Response(JSON.stringify({
                    error: 'LinkedIn blocked automated access. Please copy your profile page text (Ctrl+A, Ctrl+C) and paste it in the resume upload area instead.',
                    source: 'linkedin'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
            throw new Error(`Remote server returned ${resp.status}`)
        }

        const html = await resp.text()

        // ── LinkedIn Profile: extract visible text from the public page ──
        if (isLinkedInProfile) {
            // LinkedIn public profiles include structured data in JSON-LD
            // and visible text in the page body
            let text = ''

            // Try JSON-LD for Person schema
            const personMatches = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
            if (personMatches) {
                for (const match of personMatches) {
                    try {
                        const json = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
                        const parsed = JSON.parse(json)
                        const schemas = Array.isArray(parsed) ? parsed : [parsed]
                        for (const schema of schemas) {
                            if (schema['@type'] === 'Person' || schema['@type'] === 'ProfilePage') {
                                text += `${schema.name || ''}\n${schema.jobTitle || ''}\n${schema.description || ''}\n`
                            }
                        }
                    } catch { /* skip */ }
                }
            }

            // Also extract readable text from the HTML body
            const bodyText = html
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<nav[\s\S]*?<\/nav>/gi, '')
                .replace(/<footer[\s\S]*?<\/footer>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            if (bodyText.length > text.length) {
                text = bodyText
            }

            if (text.length > 50) {
                return new Response(JSON.stringify({ text, source: 'linkedin-profile' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }

            // If we got very little text, LinkedIn likely blocked us
            return new Response(JSON.stringify({
                error: 'LinkedIn returned limited data. Please make sure your profile is set to public, or copy your profile text and paste it in the resume upload area.',
                source: 'linkedin'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

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
            status: 200,
        })
    }
})
