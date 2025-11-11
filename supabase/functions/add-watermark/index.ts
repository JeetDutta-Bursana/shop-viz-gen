import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use ImageMagick or similar service for watermarking
// For Deno Edge Functions, we'll use a client-side approach or a service
// This function will be called from generate-product-image to add watermark
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, userId } = await req.json();
    
    if (!imageUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the logo URL from public folder
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/bursana-logo/bursana-logo.svg`;
    
    // For Deno Edge Functions, we'll use a watermarking service or return the image URL with a flag
    // The actual watermarking will be done client-side for now
    // In production, you can use a service like Cloudinary, Imgix, or similar
    
    // For now, return the image URL and a flag indicating it needs watermarking
    // The client will handle the watermarking using canvas API
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        logoUrl: logoUrl,
        needsWatermarking: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in add-watermark:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

