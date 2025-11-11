#!/bin/bash

# ============================================
# Supabase Edge Functions Deployment Script
# ============================================
# This script deploys all Edge Functions to Supabase
# Make sure you have Supabase CLI installed and are logged in

set -e

echo "🚀 Deploying Supabase Edge Functions..."
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

# Deploy functions
echo "📦 Deploying generate-product-image..."
supabase functions deploy generate-product-image

echo "📦 Deploying create-payment..."
supabase functions deploy create-payment

echo "📦 Deploying stripe-webhook..."
supabase functions deploy stripe-webhook

echo ""
echo "✅ All Edge Functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify functions are deployed in Supabase Dashboard"
echo "   2. Test each function"
echo "   3. Configure Stripe webhook endpoint"
echo ""

