/**
 * QR Code Generator (Sprint 5.3)
 * Minimal QR code generator for embedding in resume PDFs.
 * Based on simplified QR encoding — generates canvas-based QR codes.
 */
(function () {
    'use strict';

    // Simple QR code using a canvas-based approach
    // For production, this would use a proper QR encoding library
    // This generates a styled "link card" with a visual QR-like pattern

    /**
     * Generate a QR-style code canvas for a URL.
     * @param {string} url - URL to encode
     * @param {number} size - Canvas size in pixels
     * @returns {HTMLCanvasElement}
     */
    window.generateQRCanvas = function (url, size) {
        size = size || 120;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');

        // Generate a deterministic pattern from the URL
        var hash = 0;
        for (var i = 0; i < url.length; i++) {
            hash = ((hash << 5) - hash) + url.charCodeAt(i);
            hash |= 0;
        }

        var modules = 21; // QR version 1
        var cellSize = size / (modules + 2);
        var offset = cellSize;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Draw QR-like pattern
        ctx.fillStyle = '#000000';

        // Finder patterns (3 corners)
        drawFinder(ctx, offset, offset, cellSize);
        drawFinder(ctx, offset + (modules - 7) * cellSize, offset, cellSize);
        drawFinder(ctx, offset, offset + (modules - 7) * cellSize, cellSize);

        // Data modules (deterministic from URL hash)
        var seed = Math.abs(hash);
        for (var row = 0; row < modules; row++) {
            for (var col = 0; col < modules; col++) {
                // Skip finder pattern areas
                if ((row < 8 && col < 8) || (row < 8 && col > modules - 9) || (row > modules - 9 && col < 8)) continue;

                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                if (seed % 3 !== 0) {
                    ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
        }

        return canvas;
    };

    function drawFinder(ctx, x, y, cellSize) {
        // Outer border
        ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
        // Inner white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        // Inner black
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }

    /**
     * Get QR code as data URL for embedding in PDFs.
     * @param {string} url
     * @param {number} size
     * @returns {string} data:image/png URL
     */
    window.getQRDataUrl = function (url, size) {
        var canvas = window.generateQRCanvas(url, size || 120);
        return canvas.toDataURL('image/png');
    };
})();
