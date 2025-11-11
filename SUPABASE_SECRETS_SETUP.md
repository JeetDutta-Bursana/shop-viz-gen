# Supabase Edge Functions Secrets Setup

This is a quick reference for setting up Supabase Edge Function secrets.

## Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Set all secrets at once
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co \
  SUPABASE_ANON_KEY=your_anon_key \
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  RAZORPAY_KEY_ID=rzp_test_your_key_id \
  RAZORPAY_KEY_SECRET=your_razorpay_secret \
  RAZORPAY_WEBHOOK_SECRET=your_webhook_secret \
  LOVABLE_API_KEY=your_lovable_key
```

## Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to: Edge Functions → Settings → Secrets
3. Add each secret individually

## Verify Secrets

```bash
# List all secrets (without values)
supabase secrets list
```

## Required Secrets

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Public/anonymous key | Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (⚠️ secret) | Settings → API → service_role key |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Razorpay Dashboard → Settings → API Keys → Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Razorpay Dashboard → Settings → API Keys → Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | Razorpay Dashboard → Settings → Webhooks → Webhook Secret |
| `LOVABLE_API_KEY` | Lovable AI Gateway API key | Lovable Dashboard → API Keys |

