import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalImageUrl, filters, userId } = await req.json();
    
    if (!originalImageUrl || !filters || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.credits <= 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build AI prompt based on filters
    const prompt = buildPrompt(filters);
    
    console.log('Generating image with prompt:', prompt);

    // Call Lovable AI Gateway for image generation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: originalImageUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service payment required. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error('No image generated from AI');
    }

    // Create generation record
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        original_image_url: originalImageUrl,
        generated_image_url: generatedImageUrl,
        model_type: filters.modelType,
        background_type: filters.background,
        lighting_style: filters.lighting,
        camera_angle: filters.angle,
        mood: filters.mood,
        status: 'completed'
      })
      .select()
      .single();

    if (generationError) {
      console.error('Error creating generation record:', generationError);
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', userId);

    if (creditError) {
      console.error('Error updating credits:', creditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        generatedImageUrl,
        generation,
        remainingCredits: profile.credits - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-product-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(filters: any): string {
  const parts = [
    'Transform this product image into a professional, high-quality product photograph with the following specifications:'
  ];

  if (filters.modelType && filters.modelType !== 'none') {
    const modelMap: Record<string, string> = {
      'female-asian': 'a female Asian model wearing or holding',
      'female-caucasian': 'a female Caucasian model wearing or holding',
      'male-asian': 'a male Asian model wearing or holding',
      'male-caucasian': 'a male Caucasian model wearing or holding'
    };
    parts.push(`- Feature ${modelMap[filters.modelType] || 'a model with'} the product`);
  } else {
    parts.push('- Display the product prominently without a model');
  }

  if (filters.background) {
    const bgMap: Record<string, string> = {
      'studio-white': 'a professional studio with clean white background',
      'studio-gray': 'a professional studio with elegant gray background',
      'outdoor-natural': 'a beautiful outdoor natural setting',
      'lifestyle-home': 'a stylish home lifestyle environment',
      'minimal': 'a minimal, clean aesthetic background'
    };
    parts.push(`- Background: ${bgMap[filters.background] || filters.background}`);
  }

  if (filters.lighting) {
    const lightMap: Record<string, string> = {
      'soft': 'soft, diffused lighting that enhances the product details',
      'dramatic': 'dramatic lighting with strong contrast and shadows',
      'natural': 'natural, warm lighting that looks authentic',
      'studio': 'professional studio lighting setup'
    };
    parts.push(`- Lighting: ${lightMap[filters.lighting] || filters.lighting}`);
  }

  if (filters.angle) {
    const angleMap: Record<string, string> = {
      'front': 'front-facing view',
      'side': 'side profile view',
      'three-quarter': 'three-quarter angle view',
      'overhead': 'overhead flat lay view',
      'closeup': 'close-up detail shot'
    };
    parts.push(`- Camera angle: ${angleMap[filters.angle] || filters.angle}`);
  }

  if (filters.mood) {
    const moodMap: Record<string, string> = {
      'elegant': 'elegant, luxurious, and sophisticated',
      'casual': 'casual, relaxed, and approachable',
      'vibrant': 'vibrant, energetic, and eye-catching',
      'minimal': 'minimal, clean, and modern'
    };
    parts.push(`- Mood: ${moodMap[filters.mood] || filters.mood}`);
  }

  parts.push('- Maintain ultra-high quality, professional e-commerce standard');
  parts.push('- Ensure the product remains the focal point');
  parts.push('- Create a polished, commercial-ready image suitable for online stores and marketing');

  return parts.join('\n');
}
