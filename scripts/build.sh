#!/bin/bash
set -e

echo "=== Step 1: Generate pSEO landing pages ==="
node scripts/generate-seo-pages.js

echo "=== Step 2: Generate sitemap.xml ==="
node scripts/generate-sitemap.js

echo "=== Step 3: Assemble deploy directory ==="
mkdir -p deploy

# Copy all files except dev/build directories (no rsync on Vercel)
for item in *; do
  case "$item" in
    react-upgrade|deploy|node_modules|supabase|tests|test-results|shared|scripts|.vercel) continue ;;
    playwright.config.js|vitest.config.js|package.json|package-lock.json|supabase_schema.sql|vercel.json) continue ;;
    *) cp -r "$item" deploy/ ;;
  esac
done
# Also skip hidden dirs
rm -rf deploy/.git deploy/.github deploy/.claude deploy/.gemini 2>/dev/null || true

# Copy shared files into deploy root
if [ -d shared ]; then
  cp -r shared/* deploy/
fi

echo "=== Step 4: Build React app ==="
cd react-upgrade
npm ci
npm run build
cd ..

echo "=== Step 5: Deploy React app to /app/ subpath ==="
mkdir -p deploy/app
cp -r react-upgrade/dist/* deploy/app/
cp style.css deploy/app/style.css
cp templates.css deploy/app/templates.css
# SPA fallback for /app/ routes
cp deploy/app/index.html deploy/app/404.html

echo "=== Build complete! ==="
ls -la deploy/ | head -20
echo "Total files in deploy:"
find deploy -type f | wc -l
