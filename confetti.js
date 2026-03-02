/**
 * Confetti animation for high ATS scores (≥85).
 * Canvas-based, no dependencies. Auto-cleanup after 3 seconds.
 */
(function () {
    'use strict';

    window.fireConfetti = function () {
        var canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var particles = [];
        var colors = ['#A3C4DC', '#E3A8B3', '#A3DCA7', '#DCE3A8', '#10b981', '#f59e0b'];

        for (var i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 200,
                w: 4 + Math.random() * 6,
                h: 6 + Math.random() * 10,
                vx: (Math.random() - 0.5) * 6,
                vy: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        var startTime = Date.now();
        function animate() {
            var elapsed = Date.now() - startTime;
            if (elapsed > 3000) {
                canvas.remove();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var fadeStart = 2000;

            particles.forEach(function (p) {
                p.x += p.vx;
                p.vy += 0.1; // gravity
                p.y += p.vy;
                p.rotation += p.rotSpeed;
                if (elapsed > fadeStart) {
                    p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / 1000);
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            requestAnimationFrame(animate);
        }
        animate();
    };
})();
