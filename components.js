/**
 * Shared UI Components for TailorMeSwiftly.com
 *
 * Centralizes the avatar dropdown menu and footer so changes
 * propagate across all pages without manual edits.
 *
 * Usage:
 *   Include <script src="components.js"></script> after auth.js.
 *   Components auto-initialize on DOMContentLoaded.
 *
 * For pages in subdirectories (e.g. /blog/), set:
 *   <script>window.TMS_PATH_PREFIX = '../';</script>
 *   before including this file.
 */
(function () {
    const P = window.TMS_PATH_PREFIX || '';

    // ── Avatar Dropdown Menu Items ──
    // Single source of truth for the dropdown menu
    function getDropdownItems() {
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

        // Check if already has items (skip if page has custom dropdown)
        const existingLinks = dropdown.querySelectorAll('.dropdown-item');
        const hasLogout = dropdown.querySelector('#logout-btn');

        // Build menu items
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

        footer.innerHTML = `
            <p>&copy; ${new Date().getFullYear()} TailorMeSwiftly.com. This service is mostly free to use and supported by advertising.</p>
            <p>
                <a href="${P}pricing.html">Pricing</a> |
                <a href="${P}blog.html">Blog</a> |
                <a href="${P}help.html">Help</a> |
                <a href="${P}terms.html">Terms & Conditions</a> |
                <a href="${P}privacy.html">Privacy Policy</a> |
                <a href="${P}security.html">Security Policy</a>
            </p>`;
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
