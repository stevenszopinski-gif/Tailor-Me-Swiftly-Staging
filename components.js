/**
 * Shared UI Components for TailorMeSwiftly Multi-Product Platform
 *
 * Renders the avatar dropdown menu, product switcher tabs, and footer.
 * All content is driven by window.TMS_BRAND (set by brand-config.js).
 *
 * Usage:
 *   Include <script src="components.js"></script> after brand-config.js and auth.js.
 *   Components auto-initialize on DOMContentLoaded.
 *
 * For pages in subdirectories (e.g. /news/, /learn/, /blog/), set:
 *   <script>window.TMS_PATH_PREFIX = '../';</script>
 *   before including brand-config.js.
 */
(function () {
    const P = window.TMS_PATH_PREFIX || '';
    const brand = window.TMS_BRAND || { id: 'tms', name: 'TailorMeSwiftly', domain: 'tailormeswiftly.com' };

    // ── Avatar Dropdown Menu Items ──
    function getDropdownItems() {
        if (brand.navItems) {
            return brand.navItems.map(function (item) {
                return { href: item.href, icon: item.icon, label: item.label };
            });
        }
        return [
            { href: P + 'account.html', icon: 'fa-user-gear', label: 'Account' },
            { href: P + 'dashboard.html', icon: 'fa-compass', label: 'Dashboard' },
            { href: P + 'updates.html', icon: 'fa-bullhorn', label: 'Release Notes' },
            { href: P + 'help.html', icon: 'fa-circle-question', label: 'Help Center' },
            { href: P + 'blog.html', icon: 'fa-newspaper', label: 'Blog' }
        ];
    }

    function initDropdown() {
        var dropdown = document.getElementById('avatar-dropdown');
        if (!dropdown) return;

        var items = getDropdownItems();
        var html = items.map(function (item) {
            return '<a href="' + item.href + '" class="dropdown-item" style="text-decoration:none;color:inherit;"><i class="fa-solid ' + item.icon + '"></i> ' + item.label + '</a>';
        }).join('');

        html += '<button class="dropdown-item" id="logout-btn" aria-label="Sign out"><i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</button>';
        dropdown.innerHTML = html;
    }

    // ── Product Switcher ──
    function initProductSwitcher() {
        var container = document.getElementById('product-switcher');
        if (!container) return;

        var products = brand.products;
        var active = brand.activeProduct;
        if (!products || !active) return;

        var items = [
            { key: 'applications', product: products.applications },
            { key: 'learn', product: products.learn },
            { key: 'news', product: products.news }
        ];

        container.innerHTML = items.map(function (item) {
            var p = item.product;
            var isActive = p.id === active.id;
            var isPlaceholder = p.id === 'learn';
            var href = P + p.homePath;
            var cls = 'product-tab' + (isActive ? ' active' : '') + (isPlaceholder ? ' coming-soon' : '');

            return '<a href="' + href + '" class="' + cls + '" style="--tab-color:' + p.primaryColor + ';"' +
                (isPlaceholder ? ' title="Coming Soon"' : '') + '>' +
                '<i class="fa-solid ' + p.icon + '"></i>' +
                '<span>' + p.shortName + '</span>' +
                '</a>';
        }).join('');
    }

    // ── Footer ──
    function initFooter() {
        var footer = document.querySelector('footer.site-footer');
        if (!footer) return;

        var links = brand.footerLinks || [
            { href: P + 'pricing.html', label: 'Pricing' },
            { href: P + 'blog.html', label: 'Blog' },
            { href: P + 'help.html', label: 'Help' },
            { href: P + 'terms.html', label: 'Terms & Conditions' },
            { href: P + 'privacy.html', label: 'Privacy Policy' },
            { href: P + 'security.html', label: 'Security Policy' }
        ];

        var linksHtml = links.map(function (l) {
            return '<a href="' + l.href + '">' + l.label + '</a>';
        }).join(' | ');

        footer.innerHTML =
            '<p>&copy; ' + new Date().getFullYear() + ' TailorMeSwiftly.com. This service is mostly free to use and supported by advertising.</p>' +
            '<p>' + linksHtml + '</p>';
    }

    // Auto-init when DOM is ready
    function init() {
        initDropdown();
        initProductSwitcher();
        initFooter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for pages that need to re-init after dynamic rendering
    window.TMS_Components = { initDropdown: initDropdown, initProductSwitcher: initProductSwitcher, initFooter: initFooter };
})();
