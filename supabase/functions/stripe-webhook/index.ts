import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

Deno.serve(async (req) => {
    try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
        if (!stripeKey || !webhookSecret) throw new Error('Stripe not configured')

        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
        const body = await req.text()
        const sig = req.headers.get('stripe-signature')
        if (!sig) throw new Error('Missing stripe-signature header')

        const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const sb = createClient(supabaseUrl, supabaseServiceKey)

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.user_id
                if (!userId) break

                await sb.from('user_profiles').upsert({
                    user_id: userId,
                    plan: 'premium',
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                }, { onConflict: 'user_id' })
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const customerId = subscription.customer as string

                await sb.from('user_profiles')
                    .update({ plan: 'free', stripe_subscription_id: null })
                    .eq('stripe_customer_id', customerId)
                break
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
