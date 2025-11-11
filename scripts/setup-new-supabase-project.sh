#!/bin/bash

# Script to setup a new Supabase project
# Usage: ./scripts/setup-new-supabase-project.sh YOUR_NEW_PROJECT_ID

set -e

NEW_PROJECT_ID=$1

if [ -z "$NEW_PROJECT_ID" ]; then
    echo "❌ Error: Please provide your new Supabase project ID"
    echo "Usage: ./scripts/setup-new-supabase-project.sh YOUR_NEW_PROJECT_ID"
    exit 1
fi

echo "🚀 Setting up new Supabase project: $NEW_PROJECT_ID"
echo ""

# Update supabase/config.toml
echo "📝 Updating supabase/config.toml..."
sed -i.bak "s/project_id = \".*\"/project_id = \"$NEW_PROJECT_ID\"/" supabase/config.toml
rm -f supabase/config.toml.bak
echo "✅ Updated supabase/config.toml"

# Update .env file if it exists
if [ -f .env ]; then
    echo "📝 Updating .env file..."
    NEW_URL="https://${NEW_PROJECT_ID}.supabase.co"
    sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$NEW_URL|" .env
    rm -f .env.bak
    echo "✅ Updated .env file"
    echo "⚠️  Don't forget to update VITE_SUPABASE_PUBLISHABLE_KEY with your new anon key!"
else
    echo "⚠️  .env file not found. Creating from template..."
    cp env.template .env
    echo "VITE_SUPABASE_URL=https://${NEW_PROJECT_ID}.supabase.co" >> .env
    echo "VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key-here" >> .env
    echo "✅ Created .env file - please update VITE_SUPABASE_PUBLISHABLE_KEY"
fi

echo ""
echo "✅ Configuration files updated!"
echo ""
echo "📋 Next steps:"
echo "1. Get your API keys from: https://supabase.com/dashboard/project/$NEW_PROJECT_ID/settings/api"
echo "2. Update .env file with your new VITE_SUPABASE_PUBLISHABLE_KEY"
echo "3. Run database migrations in your new Supabase project"
echo "4. Set Edge Function secrets in your new Supabase project"
echo "5. Deploy Edge Functions to your new project"
echo ""
echo "For detailed instructions, see: MIGRATE_TO_NEW_SUPABASE_PROJECT.md"

