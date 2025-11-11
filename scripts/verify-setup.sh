#!/bin/bash

# ============================================
# Setup Verification Script
# ============================================
# This script verifies that your setup is correct

set -e

echo "🔍 Verifying setup..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "   Create it by copying env.template: cp env.template .env"
    exit 1
else
    echo "✅ .env file exists"
fi

# Check if required environment variables are set
if ! grep -q "VITE_SUPABASE_URL" .env || grep -q "your-project-id" .env; then
    echo "❌ VITE_SUPABASE_URL not configured in .env"
    exit 1
else
    echo "✅ VITE_SUPABASE_URL is configured"
fi

if ! grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env || grep -q "your-anon-key" .env; then
    echo "❌ VITE_SUPABASE_PUBLISHABLE_KEY not configured in .env"
    exit 1
else
    echo "✅ VITE_SUPABASE_PUBLISHABLE_KEY is configured"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI is not installed (optional for deployment)"
else
    echo "✅ Supabase CLI is installed"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found"
    echo "   Run: npm install"
else
    echo "✅ Dependencies installed"
fi

echo ""
echo "✅ Basic setup verification complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Set up Supabase Edge Function secrets"
echo "   2. Deploy Edge Functions"
echo "   3. Run database migrations"
echo "   4. Test the application"
echo ""

