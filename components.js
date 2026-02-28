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

    // ── Product Switcher (Google-style app grid) ──
    function initProductSwitcher() {
        var container = document.getElementById('product-switcher');
        if (!container) return;

        var products = brand.products;
        var active = brand.activeProduct;
        if (!products || !active) return;

        var items = [
            { key: 'applications', product: products.applications },
            { key: 'news', product: products.news },
            { key: 'learn', product: products.learn }
        ];

        // Build the grid button + popup
        var gridHtml = '<button class="app-grid-btn" aria-label="Switch product" onclick="this.nextElementSibling.classList.toggle(\'hidden\')">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="1" y="1" width="4.5" height="4.5" rx="1"/><rect x="7.75" y="1" width="4.5" height="4.5" rx="1"/><rect x="14.5" y="1" width="4.5" height="4.5" rx="1"/><rect x="1" y="7.75" width="4.5" height="4.5" rx="1"/><rect x="7.75" y="7.75" width="4.5" height="4.5" rx="1"/><rect x="14.5" y="7.75" width="4.5" height="4.5" rx="1"/><rect x="1" y="14.5" width="4.5" height="4.5" rx="1"/><rect x="7.75" y="14.5" width="4.5" height="4.5" rx="1"/><rect x="14.5" y="14.5" width="4.5" height="4.5" rx="1"/></svg>' +
            '</button>';

        gridHtml += '<div class="app-grid-popup hidden">';
        items.forEach(function (item) {
            var p = item.product;
            var isActive = p.id === active.id;
            var isPlaceholder = p.id === 'learn';
            var href = P + p.homePath;

            gridHtml += '<a href="' + href + '" class="app-grid-item' + (isActive ? ' active' : '') + (isPlaceholder ? ' coming-soon' : '') + '"' +
                (isPlaceholder ? ' title="Coming Soon"' : '') + '>' +
                '<div class="app-grid-icon" style="background:' + p.primaryColor + ';">' +
                '<i class="fa-solid ' + p.icon + '"></i>' +
                '</div>' +
                '<span>' + p.shortName + '</span>' +
                (isPlaceholder ? '<span class="app-grid-badge">Soon</span>' : '') +
                '</a>';
        });
        gridHtml += '</div>';

        container.innerHTML = gridHtml;

        // Close popup when clicking outside
        document.addEventListener('click', function (e) {
            var popup = container.querySelector('.app-grid-popup');
            if (popup && !popup.classList.contains('hidden') && !container.contains(e.target)) {
                popup.classList.add('hidden');
            }
        });
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
