/**
 * Shared UI Components for GAG Multi-Domain Platform
 *
 * Centralizes the avatar dropdown menu and footer so changes
 * propagate across all pages without manual edits.
 *
 * Usage:
 *   Include <script src="components.js"></script> after brand-config.js and auth.js.
 *   Components auto-initialize on DOMContentLoaded.
 *
 * For pages in subdirectories (e.g. /blog/), set:
 *   <script>window.TMS_PATH_PREFIX = '../';</script>
 *   before including this file.
 */
(function () {
    const P = window.TMS_PATH_PREFIX || '';
    const brand = window.TMS_BRAND || { id: 'tms', name: 'TailorMeSwiftly', domain: 'tailormeswiftly.com' };

    // ── Avatar Dropdown Menu Items ──
    function getDropdownItems() {
        if (brand.navItems) {
            return brand.navItems.map(item => ({
                href: P + item.href,
                icon: item.icon,
                label: item.label
            }));
        }
        // Fallback (TMS default)
        return [
            { href: P + 'account.html', icon: 'fa-user-gear', label: 'Account' },
            { href: P + 'dashboard.html', icon: 'fa-compass', label: 'Dashboard' },
            { href: P + 'updates.html', icon: 'fa-bullhorn', label: 'Release Notes' },
            { href: P + 'help.html', icon: 'fa-circle-question', label: 'Help Center' },
            { href: P + 'blog.html', icon: 'fa-newspaper', label: 'Blog' }
        ];
    }

    // Inject dropdown items into existing avatar-dropdown containers
    function initDropdown() {
        const dropdown = document.getElementById('avatar-dropdown');
        if (!dropdown) return;

        const items = getDropdownItems();
        let html = items.map(item =>
            `<a href="${item.href}" class="dropdown-item" style="text-decoration:none;color:inherit;"><i class="fa-solid ${item.icon}"></i> ${item.label}</a>`
        ).join('');

        // Add sign out button
        html += `<button class="dropdown-item" id="logout-btn" aria-label="Sign out"><i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</button>`;

        dropdown.innerHTML = html;
    }

    // ── Footer ──
    function initFooter() {
        const footer = document.querySelector('footer.site-footer');
        if (!footer) return;

        const links = brand.footerLinks || [
            { href: 'pricing.html', label: 'Pricing' },
            { href: 'blog.html', label: 'Blog' },
            { href: 'help.html', label: 'Help' },
            { href: 'terms.html', label: 'Terms & Conditions' },
            { href: 'privacy.html', label: 'Privacy Policy' },
            { href: 'security.html', label: 'Security Policy' }
        ];

        const linksHtml = links.map(l => `<a href="${P}${l.href}">${l.label}</a>`).join(' | ');

        footer.innerHTML = `
            <p>&copy; ${new Date().getFullYear()} ${brand.domain || 'TailorMeSwiftly.com'}. This service is mostly free to use and supported by advertising.</p>
            <p>${linksHtml}</p>`;
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initDropdown();
            initFooter();
        });
    } else {
        initDropdown();
        initFooter();
    }

    // Expose for pages that need to re-init after dynamic rendering
    window.TMS_Components = { initDropdown, initFooter };
})();
