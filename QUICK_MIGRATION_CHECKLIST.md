# Quick Migration Checklist - New Supabase Project

## ⚡ Quick Steps

### 1. Create New Supabase Project
- [ ] Log in to your other Supabase account
- [ ] Create new project
- [ ] Note your new Project ID: `_________________`
- [ ] Save database password: `_________________`

### 2. Get API Keys
- [ ] Go to: Settings → API
- [ ] Copy Project URL: `https://_______________.supabase.co`
- [ ] Copy anon public key: `eyJ...`
- [ ] Copy service_role key: `eyJ...` (keep secret!)

### 3. Run Database Migrations
- [ ] Go to SQL Editor in new project
- [ ] Run: `SUPABASE_SETUP_COMPLETE.sql`
- [ ] OR run migrations one by one from `supabase/migrations/` folder

### 4. Update Configuration Files

#### Update `supabase/config.toml`:
```toml
project_id = "YOUR_NEW_PROJECT_ID"
```

#### Update `.env` file:
```env
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_new_anon_key
```

### 5. Set Edge Function Secrets
Go to: Edge Functions → Secrets

Set these secrets:
- [ ] `SUPABASE_URL` = `https://YOUR_NEW_PROJECT_ID.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = Your new anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Your new service_role key
- [ ] `LOVABLE_API_KEY` = Your Lovable API key (same as before)
- [ ] `STRIPE_SECRET_KEY` = (if using Stripe)
- [ ] `STRIPE_WEBHOOK_SECRET` = (if using Stripe)
- [ ] `RAZORPAY_KEY_ID` = (if using Razorpay)
- [ ] `RAZORPAY_KEY_SECRET` = (if using Razorpay)
- [ ] `RAZORPAY_WEBHOOK_SECRET` = (if using Razorpay)

### 6. Deploy Edge Functions
- [ ] Deploy `generate-product-image`
- [ ] Deploy `create-payment`
- [ ] Deploy `stripe-webhook` (if using Stripe)
- [ ] Deploy `razorpay-webhook` (if using Razorpay)

### 7. Test Application
- [ ] Restart dev server: `npm run dev`
- [ ] Test sign up
- [ ] Test sign in
- [ ] Test image upload
- [ ] Test image generation
- [ ] Test payment (if applicable)

### 8. Migrate Data (If Needed)
- [ ] Export data from old project (if needed)
- [ ] Import data to new project (if needed)

## 🎯 Quick Command Reference

### Using Supabase CLI:
```bash
# Link to new project
npx supabase link --project-ref YOUR_NEW_PROJECT_ID

# Deploy functions
npx supabase functions deploy generate-product-image
npx supabase functions deploy create-payment
```

### Using Script (Linux/Mac):
```bash
chmod +x scripts/setup-new-supabase-project.sh
./scripts/setup-new-supabase-project.sh YOUR_NEW_PROJECT_ID
```

## 📝 Notes
- Old project ID: `cyjnttrmhpzspkqigzmk`
- New project ID: `_________________`
- Database password: `_________________`

## 🔗 Useful Links
- Supabase Dashboard: https://supabase.com/dashboard
- API Settings: https://supabase.com/dashboard/project/YOUR_NEW_PROJECT_ID/settings/api
- Edge Functions: https://supabase.com/dashboard/project/YOUR_NEW_PROJECT_ID/functions
- SQL Editor: https://supabase.com/dashboard/project/YOUR_NEW_PROJECT_ID/sql/new

