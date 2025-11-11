# Complete Supabase Setup Guide

This guide will help you set up everything in Supabase for your application.

## 📋 Step-by-Step Instructions

### Step 1: Run the SQL Script

1. **Go to your Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new
   - Replace `[YOUR_PROJECT_ID]` with your actual project ID (found in your `.env` file)

2. **Copy and paste the entire contents of `SUPABASE_SETUP_COMPLETE.sql`**

3. **Click "Run"** to execute the script

4. **Verify the setup:**
   - Go to **Table Editor** → You should see `profiles` and `generations` tables
   - Go to **Storage** → You should see `product-images` bucket

### Step 2: Disable Email Verification

1. **Go to Authentication Settings:**
   - Visit: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/providers
   - Or: **Authentication** → **Settings** in the left sidebar

2. **Disable Email Confirmations:**
   - Scroll down to **"Email Auth"** section
   - Find **"Enable email confirmations"**
   - Toggle it to **OFF**
   - Click **"Save"**

   This allows users to access the app immediately after registration without email verification.

### Step 3: Set Up Edge Function Secrets

1. **Go to Edge Functions Secrets:**
   - Visit: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/functions
   - Or: **Settings** → **Edge Functions** → **Secrets**

2. **Add the following secrets:**
   - `SUPABASE_URL` = Your project URL (e.g., `https://xxxxx.supabase.co`)
   - `SUPABASE_ANON_KEY` = Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key (⚠️ Keep secret!)
   - `RAZORPAY_KEY_ID` = Your Razorpay key ID
   - `RAZORPAY_KEY_SECRET` = Your Razorpay key secret
   - `RAZORPAY_WEBHOOK_SECRET` = Your Razorpay webhook secret
   - `LOVABLE_API_KEY` = Your Lovable API key

3. **Where to find your keys:**
   - **Supabase keys:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api
   - **Razorpay keys:** https://dashboard.razorpay.com/app/keys
   - **Lovable API key:** From your Lovable account settings

### Step 4: Deploy Edge Functions (Optional)

If you need to deploy or update Edge Functions:

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Deploy functions:**
   ```bash
   supabase functions deploy generate-product-image
   supabase functions deploy create-payment
   supabase functions deploy razorpay-webhook
   ```

### Step 5: Verify Everything Works

1. **Test Database:**
   - Go to **Table Editor** → `profiles`
   - Create a test user in your app
   - Check if a profile was created automatically

2. **Test Authentication:**
   - Try registering a new user
   - Verify they can access the dashboard immediately (no email verification)

3. **Test Admin Access:**
   - Register with admin token "Admin"
   - Verify admin access is granted
   - Check if `is_admin` is set to `true` in the profiles table

## 🔍 Quick Links

- **SQL Editor:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new
- **Authentication Settings:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/providers
- **API Settings:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api
- **Edge Functions:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/functions
- **Storage:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/storage/buckets
- **Table Editor:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/editor

## ✅ Checklist

- [ ] SQL script executed successfully
- [ ] `profiles` table created with `is_admin` column
- [ ] `generations` table created
- [ ] `product-images` storage bucket created
- [ ] Email verification disabled
- [ ] Edge Function secrets configured
- [ ] Test user registration works
- [ ] Test admin registration works
- [ ] Test image upload works

## 🆘 Troubleshooting

### Issue: "Column 'is_admin' does not exist"
**Solution:** Make sure you ran the complete SQL script, especially the part that adds the `is_admin` column.

### Issue: "Email verification required"
**Solution:** Go to Authentication → Settings and disable "Enable email confirmations".

### Issue: "Storage bucket not found"
**Solution:** Run the storage bucket creation part of the SQL script again.

### Issue: "RLS policy violation"
**Solution:** Make sure all RLS policies were created correctly. Check the Table Editor → Policies section.

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase logs: **Logs** → **Postgres Logs** or **Edge Function Logs**
2. Verify all environment variables are set correctly
3. Make sure you're using the correct project ID and keys

---

**That's it!** Your Supabase setup should now be complete. 🎉

