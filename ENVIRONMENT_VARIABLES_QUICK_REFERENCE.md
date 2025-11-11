# Environment Variables Quick Reference

## 🚀 Quick Start

### 1. Frontend (.env file)
Create a `.env` file in the root directory with:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### 2. Supabase Edge Function Secrets
Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
LOVABLE_API_KEY=your_lovable_api_key
```

---

## 📍 Where to Get Each Key

### Supabase Keys
**Location**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
- `VITE_SUPABASE_URL` → Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (⚠️ Keep secret!)

### Razorpay Keys
**Location**: https://dashboard.razorpay.com/app/keys
- `RAZORPAY_KEY_ID` → Settings → API Keys → Key ID
- `RAZORPAY_KEY_SECRET` → Settings → API Keys → Key Secret
- `RAZORPAY_WEBHOOK_SECRET` → Settings → Webhooks → Webhook Secret
- **Pricing** → Already configured in code (₹10, ₹79, ₹499)

### Lovable AI Gateway
**Location**: https://lovable.dev (or check your Lovable project dashboard)
- `LOVABLE_API_KEY` → Project Settings → API Keys

---

## 🔧 Setup Commands

### Using Supabase CLI
```bash
# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Set secrets
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set RAZORPAY_KEY_ID=rzp_test_your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set LOVABLE_API_KEY=your_lovable_key
```

---

## ✅ Checklist

- [ ] Created `.env` file with frontend variables
- [ ] Set all 7 Supabase Edge Function secrets
- [ ] Generated Razorpay API keys
- [ ] Pricing already configured in code (₹10, ₹79, ₹499)
- [ ] Set up Razorpay webhook endpoint
- [ ] Deployed Edge Functions

---

For detailed instructions, see `API_KEYS_SETUP.md`

