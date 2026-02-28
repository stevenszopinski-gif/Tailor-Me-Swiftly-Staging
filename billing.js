/**
 * Shared Billing Helpers for GAG Multi-Domain Platform
 *
 * Provides product-aware checkout, portal, and subscription
 * status checks. Works with both TMS and TTN.
 *
 * Requires: auth.js (for window.supabaseClient), brand-config.js (for window.TMS_BRAND)
 */
(function () {
    const brand = () => window.TMS_BRAND || { id: 'tms' };

    /**
     * Check if the current user has premium for the current product.
     * Falls back to legacy user_profiles.plan for TMS.
     */
    window.checkProductPremium = async function (userId) {
        if (!window.supabaseClient || !userId) return false;

        try {
            // Try product-aware user_subscriptions first
            const { data } = await window.supabaseClient
                .from('user_subscriptions')
                .select('plan')
                .eq('user_id', userId)
                .eq('product_id', brand().id)
                .maybeSingle();

            if (data?.plan === 'premium') {
                window.isPremiumUser = true;
                return true;
            }

            // Fallback to legacy user_profiles for TMS backward compat
            if (brand().id === 'tms') {
                const { data: profile } = await window.supabaseClient
                    .from('user_profiles')
                    .select('plan')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (profile?.plan === 'premium') {
                    window.isPremiumUser = true;
                    return true;
                }
            }
        } catch (e) {
            console.error('[Billing] Premium check failed:', e);
        }

        window.isPremiumUser = false;
        return false;
    };

    /**
     * Start a Stripe checkout session for the current product.
     */
    window.startCheckout = async function (returnUrl) {
        if (!window.supabaseClient) {
            console.error('[Billing] Supabase not ready');
            return null;
        }

        const url = returnUrl || window.location.href;
        const { data, error } = await window.supabaseClient.functions.invoke('create-checkout', {
            body: { returnUrl: url, productId: brand().id }
        });

        if (error) {
            console.error('[Billing] Checkout error:', error);
            return null;
        }

        return data?.url || null;
    };

    /**
     * Open the Stripe billing portal.
     */
    window.openBillingPortal = async function (returnUrl) {
        if (!window.supabaseClient) return null;

        const url = returnUrl || window.location.href;
        const { data, error } = await window.supabaseClient.functions.invoke('create-portal-session', {
            body: { returnUrl: url }
        });

        if (error) {
            console.error('[Billing] Portal error:', error);
            return null;
        }

        return data?.url || null;
    };

    /**
     * Get generation count for the current product.
     */
    window.getGenerationCount = async function (userId) {
        if (!window.supabaseClient || !userId) return 0;

        try {
            const { data } = await window.supabaseClient
                .from('user_subscriptions')
                .select('generation_count, generation_reset_at')
                .eq('user_id', userId)
                .eq('product_id', brand().id)
                .maybeSingle();

            return data?.generation_count || 0;
        } catch (e) {
            return 0;
        }
    };
})();
