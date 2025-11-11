# Watermark Implementation Guide

## Overview
This document describes the watermark implementation for free credit images in the Bursana AI application.

## How It Works

### Free Credits vs Paid Credits
- **Free Credits**: New users receive 5 free credits. Images generated with free credits are watermarked with the BURSANA logo.
- **Paid Credits**: When users purchase credits, their images are generated without watermarks.

### Database Schema
- `profiles.free_credits_remaining`: Tracks how many free credits a user has left (starts at 5)
- `generations.is_free_credit`: Boolean flag indicating if an image was generated with free credits

### Watermarking Flow

1. **Image Generation**:
   - When a user generates an image, the system checks if they have free credits remaining
   - If `free_credits_remaining > 0`, the image is marked as `is_free_credit: true`
   - The `free_credits_remaining` is decremented for free credit generations
   - Purchased credits don't affect `free_credits_remaining`

2. **Display**:
   - Free credit images show a watermark overlay in the gallery using CSS
   - The BURSANA logo is overlaid in the bottom-right corner
   - A "Watermarked" badge is displayed on free credit images

3. **Download**:
   - When downloading a free credit image, the watermark is applied using Canvas API
   - The watermarked image is created client-side and then downloaded
   - Paid credit images are downloaded without watermark

### Files Modified

1. **Database Migration** (`supabase/migrations/20250109000000_add_watermark_support.sql`):
   - Adds `free_credits_remaining` column to `profiles` table
   - Adds `is_free_credit` column to `generations` table
   - Updates `handle_new_user` function to set `free_credits_remaining: 5`

2. **Backend** (`supabase/functions/generate-product-image/index.ts`):
   - Checks `free_credits_remaining` to determine if generation uses free credits
   - Sets `is_free_credit` flag in generation record
   - Decrements `free_credits_remaining` for free credit generations

3. **Frontend Utilities** (`src/utils/watermark.ts`):
   - `addWatermarkToImage()`: Adds BURSANA logo watermark to an image using Canvas API
   - `downloadImageWithWatermark()`: Downloads an image with watermark if it's a free credit image

4. **Components**:
   - `ImageGallery.tsx`: Displays watermark overlay for free credit images and handles watermarked downloads
   - `Dashboard.tsx`: Shows watermarked images in the gallery

5. **Stripe Webhook** (`supabase/functions/stripe-webhook/index.ts`):
   - Preserves `free_credits_remaining` when users purchase credits
   - Only updates total `credits` when payment is received

### Logo File
- **Location**: `public/bursana-logo.svg`
- **Format**: SVG with transparent background
- **Access**: Available at `/bursana-logo.svg` in the application

### Security Considerations

**Current Implementation (Client-Side)**:
- Watermark is applied client-side using Canvas API
- Users could potentially bypass the watermark by accessing the image URL directly
- Suitable for demonstration and basic protection

**Production Recommendation**:
- Implement server-side watermarking using a service like:
  - **Cloudinary**: Image transformation and watermarking service
  - **Imgix**: On-the-fly image processing with watermarking
  - **Sharp**: Node.js image processing library (requires server setup)
- Server-side watermarking ensures watermarks cannot be bypassed
- Store both watermarked and non-watermarked versions
- Serve watermarked version for free credits, non-watermarked for paid credits

### Testing

1. **Free Credit Generation**:
   - Create a new account (should have 5 free credits)
   - Generate an image
   - Verify watermark appears in gallery
   - Verify watermark is applied when downloading
   - Verify `free_credits_remaining` decreases

2. **Paid Credit Generation**:
   - Purchase credits
   - Generate an image after free credits are used
   - Verify no watermark appears
   - Verify no watermark when downloading
   - Verify `free_credits_remaining` remains unchanged

3. **Credit Tracking**:
   - Verify `free_credits_remaining` starts at 5 for new users
   - Verify `free_credits_remaining` decreases with free credit generations
   - Verify `free_credits_remaining` is preserved when purchasing credits
   - Verify total `credits` increases when purchasing

### Migration Steps

1. Run the database migration:
   ```sql
   -- Run supabase/migrations/20250109000000_add_watermark_support.sql
   ```

2. Deploy the updated Edge Functions:
   ```bash
   supabase functions deploy generate-product-image
   supabase functions deploy stripe-webhook
   ```

3. Ensure the logo file is in the public folder:
   - `public/bursana-logo.svg` should exist

4. Test the implementation:
   - Create a new account
   - Generate images with free credits
   - Purchase credits and generate images
   - Verify watermarking behavior

### Future Enhancements

1. **Server-Side Watermarking**:
   - Integrate Cloudinary or Imgix for server-side watermarking
   - Store watermarked images in storage
   - Serve appropriate version based on credit type

2. **Watermark Customization**:
   - Allow customization of watermark position, size, and opacity
   - Support different watermark styles

3. **Batch Watermarking**:
   - Apply watermarks to existing free credit images
   - Migrate to server-side watermarking for all images

4. **Analytics**:
   - Track watermark application
   - Monitor free vs paid credit usage
   - Analyze conversion from free to paid

