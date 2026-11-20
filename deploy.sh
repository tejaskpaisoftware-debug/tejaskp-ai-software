#!/bin/bash
echo "🚀 Deploying to Vercel (via GitHub)..."

# Add all changes
git add .

# Commit with timestamp
git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# Push to main branch
git push origin main

echo "✅ Changes pushed to GitHub! Vercel should start building shortly."
