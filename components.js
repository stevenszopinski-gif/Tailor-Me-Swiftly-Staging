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
        var products = brand.products;
        var active = brand.activeProduct;
        if (!products || !active) return;

        // Find the header-actions area to place the grid button next to the avatar
        var headerActions = document.querySelector('.header-actions');
        var placeholder = document.getElementById('product-switcher');

        // Hide the original placeholder in the middle of the header
        if (placeholder) placeholder.style.display = 'none';

        // If no header-actions found, fall back to placeholder
        var container = headerActions || placeholder;
        if (!container) return;

        var items = [
            { key: 'applications', product: products.applications },
            { key: 'news', product: products.news },
            { key: 'learn', product: products.learn }
        ];

        // Build the grid button + popup
        var wrapper = document.createElement('div');
        wrapper.className = 'product-switcher';
        wrapper.style.cssText = 'position:relative;display:flex;align-items:center;';

        var gridHtml = '<button class="app-grid-btn" aria-label="Switch product" onclick="var p=this.nextElementSibling;p.style.display=p.style.display===\'none\'?\'grid\':\'none\'">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="1" y="1" width="4.5" height="4.5" rx="1"/><rect x="7.75" y="1" width="4.5" height="4.5" rx="1"/><rect x="14.5" y="1" width="4.5" height="4.5" rx="1"/><rect x="1" y="7.75" width="4.5" height="4.5" rx="1"/><rect x="7.75" y="7.75" width="4.5" height="4.5" rx="1"/><rect x="14.5" y="7.75" width="4.5" height="4.5" rx="1"/><rect x="1" y="14.5" width="4.5" height="4.5" rx="1"/><rect x="7.75" y="14.5" width="4.5" height="4.5" rx="1"/><rect x="14.5" y="14.5" width="4.5" height="4.5" rx="1"/></svg>' +
            '</button>';

        gridHtml += '<div class="app-grid-popup" style="display:none;position:absolute;top:calc(100% + 0.5rem);right:0;background:var(--dropdown-bg,var(--panel-bg));border:1px solid var(--panel-border);border-radius:16px;padding:1rem;min-width:240px;box-shadow:0 8px 32px rgba(0,0,0,0.25);z-index:300;grid-template-columns:repeat(3,1fr);gap:0.5rem;">';
        items.forEach(function (item) {
            var p = item.product;
            var isActive = p.id === active.id;
            var isPlaceholder = p.id === 'learn';
            var href = P + p.homePath;
            var itemStyle = 'display:flex;flex-direction:column;align-items:center;gap:0.4rem;padding:0.75rem 0.5rem;border-radius:12px;text-decoration:none;color:var(--text-primary);font-size:0.72rem;font-weight:500;text-align:center;position:relative;';
            if (isPlaceholder) itemStyle += 'opacity:0.45;pointer-events:none;';

            gridHtml += '<a href="' + href + '" class="app-grid-item' + (isActive ? ' active' : '') + (isPlaceholder ? ' coming-soon' : '') + '"' +
                (isPlaceholder ? ' title="Coming Soon"' : '') + ' style="' + itemStyle + '">' +
                '<div class="app-grid-icon" style="background:' + p.primaryColor + ';width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#fff;">' +
                '<i class="fa-solid ' + p.icon + '"></i>' +
                '</div>' +
                '<span>' + p.shortName + '</span>' +
                (isPlaceholder ? '<span class="app-grid-badge" style="position:absolute;top:0.25rem;right:0;font-size:0.55rem;font-weight:700;text-transform:uppercase;background:var(--panel-border);color:var(--text-secondary);padding:0.1rem 0.35rem;border-radius:4px;">Soon</span>' : '') +
                '</a>';
        });
        gridHtml += '</div>';

        wrapper.innerHTML = gridHtml;

        // Insert as first child of header-actions (before login btn / avatar)
        if (headerActions) {
            headerActions.insertBefore(wrapper, headerActions.firstChild);
        } else if (placeholder) {
            placeholder.style.display = '';
            placeholder.innerHTML = gridHtml;
        }

        // Close popup when clicking outside
        document.addEventListener('click', function (e) {
            var popup = wrapper.querySelector('.app-grid-popup');
            if (popup && popup.style.display !== 'none' && !wrapper.contains(e.target)) {
                popup.style.display = 'none';
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
