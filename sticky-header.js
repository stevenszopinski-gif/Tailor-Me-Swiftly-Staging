/**
 * Sticky Header — adds .scrolled class to .app-header on scroll
 * Uses IntersectionObserver on a sentinel element for performance.
 */
(function () {
    'use strict';
    var header = document.querySelector('.app-header');
    if (!header) return;

    // Create sentinel element at top of page
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px;width:100%;position:absolute;top:0;left:0;pointer-events:none;';
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                header.classList.remove('scrolled');
            } else {
                header.classList.add('scrolled');
            }
        });
    }, { threshold: 0 });

    observer.observe(sentinel);
})();
