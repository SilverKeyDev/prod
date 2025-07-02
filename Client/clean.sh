#!/bin/bash

echo "🔁 Clearing all caches and reinstalling dependencies..."

# Clean node_modules and lockfile
rm -rf node_modules package-lock.json yarn.lock

# Clean Vite cache (default + custom if configured)
rm -rf .vite .vite-cache

# Reinstall dependencies
npm install

echo "✅ Dependencies reinstalled."