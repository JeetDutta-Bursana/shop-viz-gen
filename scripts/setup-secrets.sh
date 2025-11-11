#!/bin/bash

# ============================================
# Supabase Edge Functions Secrets Setup Script
# ============================================
# This script helps you set up all required secrets for Edge Functions
# You'll need to provide the values when prompted

set -e

echo "🔐 Setting up Supabase Edge Function Secrets..."
echo ""
echo "⚠️  Make sure you have:"
echo "   - Supabase project URL"
echo "   - Supabase Anon Key"
echo "   - Supabase Service Role Key"
echo "   - Stripe Secret Key"
echo "   - Stripe Webhook Secret"
echo "   - Lovable API Key"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase."
    echo "   Login with: supabase login"
    exit 1
fi

# Prompt for secrets
read -p "Enter Supabase Project URL: " SUPABASE_URL
read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY
read -sp "Enter Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -sp "Enter Stripe Secret Key: " STRIPE_SECRET_KEY
echo ""
read -sp "Enter Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
echo ""
read -sp "Enter Lovable API Key: " LOVABLE_API_KEY
echo ""

# Set secrets
echo "📝 Setting secrets..."
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
supabase secrets set LOVABLE_API_KEY="$LOVABLE_API_KEY"

echo ""
echo "✅ All secrets set successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify secrets in Supabase Dashboard → Edge Functions → Secrets"
echo "   2. Deploy Edge Functions"
echo "   3. Test functions"
echo ""

