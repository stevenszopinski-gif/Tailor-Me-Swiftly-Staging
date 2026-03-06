#!/bin/bash
set -e

echo "=== Step 1: Generate pSEO landing pages ==="
node scripts/generate-seo-pages.js

echo "=== Step 2: Generate sitemap.xml ==="
node scripts/generate-sitemap.js

echo "=== Step 3: Assemble deploy directory ==="
mkdir -p deploy
rsync -a \
  --exclude='react-upgrade' \
  --exclude='deploy' \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.claude' \
  --exclude='.gemini' \
  --exclude='node_modules' \
  --exclude='supabase' \
  --exclude='tests' \
  --exclude='test-results' \
  --exclude='playwright.config.js' \
  --exclude='vitest.config.js' \
  --exclude='package.json' \
  --exclude='package-lock.json' \
  --exclude='.gitignore' \
  --exclude='supabase_schema.sql' \
  --exclude='shared' \
  --exclude='scripts' \
  --exclude='vercel.json' \
  --exclude='.vercel' \
  ./ deploy/

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
