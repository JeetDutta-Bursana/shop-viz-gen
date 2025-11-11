# Setup Instructions

This guide will help you get the AI Product Image Generator up and running.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Razorpay account
- Lovable API key (or alternative AI service)

## Step 1: Install Dependencies

```bash
cd shop-viz-gen
npm install
```

## Step 2: Configure Frontend Environment

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

   **Where to get these:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
   - Copy **Project URL** → `VITE_SUPABASE_URL`
   - Copy **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

## Step 3: Set Up Supabase Database

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Option B: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to: SQL Editor
3. Copy and paste the contents of `supabase/migrations/20251025121450_7bf66a84-0232-4dfe-ac1b-4431ce2ed07c.sql`
4. Run the SQL
5. Repeat for the other migration files

## Step 4: Set Up Supabase Edge Function Secrets

You need to set 7 secrets for the Edge Functions:

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set RAZORPAY_KEY_ID=rzp_test_your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set LOVABLE_API_KEY=your_lovable_key
```

**Or via Dashboard:**
1. Go to: Supabase Dashboard → Edge Functions → Settings → Secrets
2. Add each secret individually

**Where to get each secret:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: Razorpay Dashboard → Settings → API Keys
- `RAZORPAY_WEBHOOK_SECRET`: Razorpay Dashboard → Settings → Webhooks (after creating webhook)
- `LOVABLE_API_KEY`: Lovable Dashboard → Project Settings → API Keys

## Step 5: Deploy Edge Functions

```bash
supabase functions deploy generate-product-image
supabase functions deploy create-payment
supabase functions deploy razorpay-webhook
```

## Step 6: Set Up Razorpay

### 6.1 Generate API Keys

1. Go to: https://dashboard.razorpay.com/app/keys
2. For Test Mode: Click **"Generate Test Key"**
3. For Live Mode: Complete KYC first, then **"Generate Live Key"**
4. Copy the **Key ID** (starts with `rzp_test_` or `rzp_live_`)
5. Copy the **Key Secret** (shown only once - save it!)
6. Add to Supabase secrets:
   - `supabase secrets set RAZORPAY_KEY_ID=rzp_test_your_key_id`
   - `supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret`

### 6.2 Pricing

✅ **Already Configured** - Pricing is set directly in code:
- Single Image: ₹10 (1 credit)
- 10-Pack: ₹79 (10 credits)
- Pro Plan: ₹499/mo (unlimited)

No Price IDs needed - prices are configured in `src/pages/Pricing.tsx`

### 6.3 Set Up Webhook

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click **"Create Webhook"**
3. Enter endpoint URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/razorpay-webhook`
4. Select event: `payment.captured`
5. Click **"Create Webhook"**
6. Copy the **Webhook Secret**
7. Add to Supabase secrets: `supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret`

## Step 7: Start Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:8080`

## Step 8: Test the Application

1. **Test Authentication:**
   - Go to `/auth`
   - Create a new account
   - Verify you're redirected to dashboard

2. **Test Image Upload:**
   - Upload a product image
   - Verify it appears in the preview

3. **Test Image Generation:**
   - Select filters (model type, background, etc.)
   - Click "Generate Image"
   - Wait for generation to complete
   - Verify image appears in gallery

4. **Test Payment:**
   - Click "Buy Credits" or click on credit display
   - Select a package
   - Complete payment (use Razorpay test mode)
   - Verify credits are added after payment

## Troubleshooting

### "Environment variables not found"
- Make sure `.env` file exists in the root directory
- Restart the dev server after creating `.env`

### "Supabase function not found"
- Make sure Edge Functions are deployed
- Check function names match exactly

### "Insufficient credits"
- Check if user profile was created
- Verify database trigger is working
- Check credits in Supabase dashboard

### "Payment failed"
- Verify Razorpay API keys are set correctly
- Check Razorpay webhook is configured
- Ensure pricing is correct (₹10, ₹79, ₹499)

### "Image generation failed"
- Check LOVABLE_API_KEY is set
- Verify API key is valid
- Check function logs in Supabase dashboard

## Next Steps

- Customize the UI/UX
- Add more filter options
- Implement analytics
- Set up production environment
- Configure custom domain

## Support

For detailed API key setup, see `ALL_API_KEYS_AND_CONNECTIONS.md`

For troubleshooting, see `API_KEYS_SETUP.md`

---

**Happy Coding! 🚀**

