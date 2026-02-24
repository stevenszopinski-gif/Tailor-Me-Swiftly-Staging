import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, email, returnUrl } = await req.json()

        if (!userId || !email) {
            throw new Error('userId and email are required')
        }

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        if (!stripeKey) throw new Error('Stripe not configured')

        const priceId = Deno.env.get('STRIPE_PRICE_ID')
        if (!priceId) throw new Error('Stripe price not configured')

        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${returnUrl || 'https://tailormeswiftly.com/app.html'}?upgrade=success`,
            cancel_url: `${returnUrl || 'https://tailormeswiftly.com/app.html'}?upgrade=cancelled`,
            metadata: { user_id: userId },
        })

        return new Response(JSON.stringify({ url: session.url }), {
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
