# Migrate to New Supabase Project

## Overview
This guide will help you migrate from your current Supabase project (`cyjnttrmhpzspkqigzmk`) to a new Supabase project in a different account.

## Steps to Migrate

### Step 1: Create New Supabase Project

1. **Log in to your new Supabase account**
   - Go to https://supabase.com
   - Sign in with your other account

2. **Create a new project**
   - Click "New Project"
   - Choose a name for your project
   - Set a database password (save this!)
   - Select a region
   - Wait for the project to be created

3. **Note your new project details**
   - Project ID (will be in the URL: `https://supabase.com/dashboard/project/YOUR_NEW_PROJECT_ID`)
   - Project URL: `https://YOUR_NEW_PROJECT_ID.supabase.co`

### Step 2: Get API Keys from New Project

1. Go to: `Settings` → `API`
2. Copy the following:
   - **Project URL**: `https://YOUR_NEW_PROJECT_ID.supabase.co`
   - **anon public key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) ⚠️ Keep this secret!

### Step 3: Run Database Migrations

1. **Go to SQL Editor** in your new Supabase project
2. **Run the migration files in order**:
   - `supabase/migrations/20251025121450_7bf66a84-0232-4dfe-ac1b-4431ce2ed07c.sql`
   - `supabase/migrations/20250101000000_add_admin_role.sql`
   - `supabase/migrations/20250108000000_ensure_5_free_credits.sql`
   - `supabase/migrations/20250109000000_add_watermark_support.sql`
   - `supabase/migrations/20251025121503_7fb494f4-4063-412d-8703-e8c18ce5afea.sql`
   - `supabase/migrations/20251025121513_e9d4e2cb-3d80-4a7d-b070-068767f16de1.sql`

   **OR** use the complete setup script:
   - Copy and paste `SUPABASE_SETUP_COMPLETE.sql` into SQL Editor
   - Run it

### Step 4: Update Configuration Files

#### 4.1 Update `supabase/config.toml`
```toml
project_id = "YOUR_NEW_PROJECT_ID"
```

#### 4.2 Update Frontend `.env` file
Create or update `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_new_anon_key_here
```

#### 4.3 Update Edge Function Secrets

Go to your new Supabase project → `Edge Functions` → `Secrets`

Set these secrets:
- `SUPABASE_URL` = `https://YOUR_NEW_PROJECT_ID.supabase.co`
- `SUPABASE_ANON_KEY` = Your new anon key
- `SUPABASE_SERVICE_ROLE_KEY` = Your new service_role key
- `LOVABLE_API_KEY` = Your Lovable API key (same as before)
- `STRIPE_SECRET_KEY` = Your Stripe secret key (if using Stripe)
- `STRIPE_WEBHOOK_SECRET` = Your Stripe webhook secret (if using Stripe)
- `RAZORPAY_KEY_ID` = Your Razorpay key ID (if using Razorpay)
- `RAZORPAY_KEY_SECRET` = Your Razorpay key secret (if using Razorpay)
- `RAZORPAY_WEBHOOK_SECRET` = Your Razorpay webhook secret (if using Razorpay)

### Step 5: Deploy Edge Functions to New Project

#### Option A: Using Supabase Dashboard
1. Go to `Edge Functions` in your new project
2. For each function:
   - Click "Create Function" or "Deploy"
   - Copy the code from `supabase/functions/FUNCTION_NAME/index.ts`
   - Paste and deploy

#### Option B: Using Supabase CLI
```bash
# Link to new project
npx supabase link --project-ref YOUR_NEW_PROJECT_ID

# Deploy all functions
npx supabase functions deploy generate-product-image
npx supabase functions deploy create-payment
npx supabase functions deploy stripe-webhook
# etc.
```

### Step 6: Migrate Existing Data (Optional)

If you have existing users/data in the old project:

1. **Export data from old project**:
   - Go to old project → SQL Editor
   - Run queries to export data from `profiles` and `generations` tables

2. **Import data to new project**:
   - Go to new project → SQL Editor
   - Insert the exported data

**OR** use Supabase CLI:
```bash
# Export from old project
supabase db dump -f backup.sql

# Import to new project (after linking)
supabase db reset
psql < backup.sql
```

### Step 7: Update Application

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the application**:
   - Sign up with a new account
   - Test image upload
   - Test image generation
   - Test payment (if applicable)

### Step 8: Update Production Environment

If you have a production deployment:

1. Update production environment variables
2. Redeploy your application
3. Test production environment

## Checklist

- [ ] New Supabase project created
- [ ] API keys copied from new project
- [ ] Database migrations run on new project
- [ ] `supabase/config.toml` updated
- [ ] `.env` file updated with new credentials
- [ ] Edge Function secrets set in new project
- [ ] Edge Functions deployed to new project
- [ ] Application tested with new project
- [ ] Existing data migrated (if needed)
- [ ] Production environment updated (if applicable)

## Important Notes

1. **Database Password**: Make sure you save the database password when creating the new project
2. **Service Role Key**: Never expose this key in frontend code
3. **Data Migration**: If you have important user data, make sure to export/import it
4. **Storage**: Images stored in Supabase Storage will need to be migrated separately if needed
5. **Environment Variables**: Update all environments (development, staging, production)

## Troubleshooting

### Issue: Functions not deploying
- Check that you're logged into the correct Supabase account
- Verify the project ID is correct
- Check that all secrets are set

### Issue: Authentication not working
- Verify the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check that the new project has Authentication enabled
- Verify email templates are configured (if using email auth)

### Issue: Database errors
- Make sure all migrations have been run
- Check that RLS policies are set correctly
- Verify the database schema matches the code

## Next Steps

After migration:
1. Test all functionality
2. Monitor for any errors
3. Update documentation
4. Consider deactivating the old project after confirming everything works

