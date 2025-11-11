# Quick Start Guide

## ✅ Will the code run locally?

**Partially yes** - The frontend will start, but you need configuration for full functionality.

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd shop-viz-gen
npm install
```

### Step 2: Create `.env` file
```bash
# Copy the template
cp env.template .env
```

Then edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Get these from:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

### Step 3: Start the dev server
```bash
npm run dev
```

The app will open at `http://localhost:8080`

## ⚠️ What Works Without Full Setup

✅ **Frontend UI** - All pages and components will render
✅ **Navigation** - All routes work
✅ **Basic pages** - Landing page, 404 page, etc.

❌ **Authentication** - Won't work without Supabase credentials
❌ **Image upload** - Won't work without Supabase storage
❌ **Image generation** - Won't work without Edge Functions
❌ **Payment** - Won't work without Razorpay setup

## 🔧 Full Setup (For Complete Functionality)

See `SETUP_INSTRUCTIONS.md` for complete setup including:
- Database migrations
- Edge Function deployment
- Razorpay configuration
- API keys

## 📝 Current Status

- ✅ Code is complete and ready
- ✅ Dependencies are installed
- ⚠️ Need `.env` file with Supabase credentials
- ⚠️ Need database migrations run
- ⚠️ Need Edge Functions deployed
- ⚠️ Need Razorpay setup

## 🎯 Next Steps

1. **Create `.env` file** (required for basic functionality)
2. **Run database migrations** (required for auth and storage)
3. **Deploy Edge Functions** (required for image generation)
4. **Set up Razorpay** (required for payments)

