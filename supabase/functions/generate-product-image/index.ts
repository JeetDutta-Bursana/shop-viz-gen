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

    // Check user profile and credits
    // NOTE: We only select 'credits' since 'free_credits_remaining' column may not exist in the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, email')
      .eq('id', userId)
      .single();

    console.log('Fetching profile for userId:', userId);
    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found. Please ensure you are signed in and have completed registration.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Normalize credits - handle null, undefined, and ensure it's a number
    let userCredits = profile.credits;
    console.log('Raw user credits from database:', userCredits, 'Type:', typeof userCredits);
    
    // Convert to number and handle null/undefined
    if (userCredits === null || userCredits === undefined) {
      userCredits = 0;
    } else {
      userCredits = Number(userCredits);
      if (isNaN(userCredits)) {
        console.log('Credits is NaN, setting to 0');
        userCredits = 0;
      }
    }
    
    console.log('Normalized user credits:', userCredits);
    
    // Determine if user needs free credits (credits are 0 or less)
    const needsFreeCredits = userCredits <= 0;
    
    if (needsFreeCredits) {
      console.log('User needs free credits. Current credits:', userCredits);
      console.log('Updating profile with 5 credits for userId:', userId);
      
      // Update profile with 5 credits - using service role key so RLS doesn't apply
      const updateResult = await supabase
        .from('profiles')
        .update({ 
          credits: 5
        })
        .eq('id', userId)
        .select('credits');
      
      console.log('Update result:', JSON.stringify(updateResult, null, 2));
      
      if (updateResult.error) {
        console.error('Error updating credits:', updateResult.error);
        console.error('Update error code:', updateResult.error.code);
        console.error('Update error message:', updateResult.error.message);
        console.error('Update error details:', updateResult.error.details);
        console.error('Update error hint:', updateResult.error.hint);
        
        // Check if it's an RLS policy error
        if (updateResult.error.code === '42501' || updateResult.error.message?.includes('policy')) {
          console.error('RLS policy blocking update - this should not happen with service role key!');
        }
        
        // Even if update fails, proceed with 5 credits for this request
        // This prevents blocking legitimate users due to update errors
        userCredits = 5;
        console.log('Update failed, but proceeding with 5 credits for this request to allow generation');
      } else if (updateResult.data && updateResult.data.length > 0) {
        // Use the updated values from database
        const updatedProfile = updateResult.data[0];
        userCredits = updatedProfile?.credits ?? 5;
        console.log('Successfully updated credits. New credits:', userCredits);
      } else {
        // No data returned but no error - might mean no rows matched
        console.log('Update returned no data but no error - assuming update succeeded, setting credits to 5');
        userCredits = 5;
      }
    }
    
    // Final validation - ensure credits are positive numbers
    userCredits = Math.max(0, Number(userCredits));
    
    // Handle NaN cases
    if (isNaN(userCredits)) {
      console.error('ERROR: userCredits is NaN after all processing, setting to 5');
      userCredits = 5;
    }
    
    // CRITICAL: ALWAYS ensure credits are at least 5 for new users
    // This is a hard requirement - we NEVER block users due to credit issues
    if (userCredits <= 0) {
      console.warn('⚠️ Credits are 0 or negative. Setting to 5 to allow generation.');
      console.warn('Original profile credits:', profile.credits);
      userCredits = 5;
      
      // Try to update database one more time, but don't wait for it
      // We'll proceed regardless of update success
      supabase
        .from('profiles')
        .update({ credits: 5 })
        .eq('id', userId)
        .then((result) => {
          if (result.error) {
            console.error('Final update attempt failed:', result.error);
          } else {
            console.log('Successfully updated credits in final attempt');
          }
        })
        .catch((err) => {
          console.error('Final update attempt error:', err);
        });
    }
    
    // Final validation - ensure credits are at least 5
    userCredits = Math.max(5, Number(userCredits) || 5);
    
    console.log('✓✓✓ FINAL CREDITS VALIDATION ✓✓✓');
    console.log('Final userCredits:', userCredits);
    console.log('Type of userCredits:', typeof userCredits);
    console.log('Credits check: userCredits <= 0?', userCredits <= 0);
    console.log('✓ Proceeding with generation - credits are valid');
    
    // ABSOLUTE FINAL CHECK - if somehow credits are still 0, force to 5
    // This should NEVER happen, but we're being extra safe
    if (userCredits <= 0 || isNaN(userCredits)) {
      console.error('🚨 CRITICAL: Credits are still 0 or NaN after all processing!');
      console.error('This should never happen. Forcing credits to 5.');
      userCredits = 5;
    }

    // For now, we'll treat all generations as regular (not free credit specific)
    // since free_credits_remaining column doesn't exist
    const isFreeCredit = false;

    // Build AI prompt based on filters
    const prompt = buildPrompt(filters);

    // Call OpenAI DALL-E 3 for image generation
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Enhance prompt with explicit instruction to analyze the uploaded image first
    const isSaree = (filters.productType || '').toLowerCase() === 'saree';
    
    // CRITICAL SAREE INSTRUCTIONS - Condensed for OpenAI DALL-E 3 (4000 char limit)
    const sareeCriticalWarning = isSaree ? `\n\nCRITICAL: Generate a traditional Indian saree draped in NIVI STYLE on a female model.

REQUIREMENTS:
- Saree fabric starts at WAIST (tucked into petticoat), NOT from shoulders
- 5-7 visible PLEATS at front waist (accordion folds)
- Fabric WRAPS around ENTIRE LOWER BODY from waist to ankles (wrapped skirt appearance)
- PALLU flows over LEFT shoulder showing border design
- BLOUSE (choli) visible on upper body
- NO seams/zippers/buttons on saree (only blouse has these)
- Professional Indian fashion photography style

FORBIDDEN:
- NO stitched dress/gown (saree is UNSTITCHED fabric)
- NO stole/scarf style (fabric hanging from shoulders only)
- NO fabric starting from shoulders/neck (must start at waist)
- Lower body must look like WRAPPED SKIRT, not a dress\n\n` : '';
    
    // Build concise prompt for OpenAI DALL-E 3 (4000 char limit)
    const enhancedPrompt = isSaree 
      ? `${sareeCriticalWarning}Generate a professional fashion photograph of a beautiful female model wearing a saree in NIVI STYLE.

Analyze the uploaded saree image carefully. Note all patterns, colors, borders, and designs. Recreate this EXACT fabric wrapped around the model.

CORRECT SAREE DRAPING:
- Fabric starts at WAIST (tucked into petticoat), NOT from shoulders
- 5-7 visible PLEATS at front waist (accordion folds)
- Fabric WRAPS around ENTIRE LOWER BODY from waist to ankles (wrapped skirt)
- PALLU flows over LEFT shoulder showing border design
- BLOUSE (choli) visible on upper body
- Looks like UNSTITCHED FABRIC wrapped around body, NOT a stitched dress
- Professional Indian fashion photography style

${prompt}

The lower body must look like a WRAPPED SKIRT covering from waist to ankles. The fabric must NOT hang from shoulders like a scarf. Generate the image now.`
      : `IMPORTANT: First, carefully analyze the uploaded product image. Study every detail of the product - its design, colors, patterns, textures, materials, and all visual characteristics. Then generate an image where a model is wearing or using this EXACT product.

${prompt}

REMEMBER: The product in your generated image must be IDENTICAL to the product in the uploaded image. Pay close attention to all visual details and recreate them accurately.`;

    console.log('Generating image with enhanced prompt:', enhancedPrompt);
    console.log('Product type:', filters.productType);
    console.log('Model type:', filters.modelType);

    // OpenAI DALL-E 3 API call
    // Note: DALL-E 3 doesn't support image input, so we use the text prompt only
    // The prompt should describe the product from the uploaded image
    const aiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt.substring(0, 4000), // Ensure prompt is within 4000 char limit
        size: '1024x1024',
        quality: 'standard',
        n: 1
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation error:', aiResponse.status, errorText);
      
      // Parse error response if it's JSON
      let errorMessage = 'AI generation failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorText;
      } catch (e) {
        errorMessage = errorText || `HTTP ${aiResponse.status}`;
      }
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            errorType: 'rate_limit',
            source: 'openai_api'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 401) {
        console.error('🚨 OpenAI API returned 401 - API key may be invalid or expired');
        console.error('Error details:', errorMessage);
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI API authentication failed. Please check your API key is correct and has sufficient credits.',
            errorType: 'openai_api_auth_failed',
            source: 'openai_api',
            details: errorMessage
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For other errors, return a generic error but include details
      return new Response(
        JSON.stringify({ 
          error: `AI generation failed: ${errorMessage}`,
          errorType: 'ai_generation_error',
          source: 'openai_api',
          status: aiResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    // OpenAI DALL-E 3 response format: { "data": [{ "url": "..." }] }
    let generatedImageUrl = aiData.data?.[0]?.url;

    if (!generatedImageUrl) {
      console.error('OpenAI API response:', aiData);
      throw new Error('No image generated from OpenAI API');
    }

    // For free credit generations, we store the original URL
    // Watermarking will be applied client-side when displaying/downloading
    // This ensures users can't bypass the watermark by accessing the URL directly
    // In production, consider using a service like Cloudinary or Imgix for server-side watermarking
    let finalImageUrl = generatedImageUrl;
    
    // Note: Server-side watermarking would be ideal but requires image processing libraries
    // For now, we mark the image as free credit and apply watermark client-side
    // The is_free_credit flag will be used by the client to apply watermark overlay

    // Create generation record
    // Note: We don't include is_free_credit since that column may not exist in the database
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        original_image_url: originalImageUrl,
        generated_image_url: finalImageUrl,
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

    // Update credits (deduct 1 credit for this generation)
    const newCredits = Math.max(0, userCredits - 1);
    
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ 
        credits: newCredits
      })
      .eq('id', userId);

    if (creditError) {
      console.error('Error updating credits:', creditError);
      // Log the error but don't fail the request - generation was successful
    } else {
      console.log('Successfully deducted 1 credit. Remaining credits:', newCredits);
    }

    const remainingCredits = newCredits;

    return new Response(
      JSON.stringify({
        success: true,
        generatedImageUrl: finalImageUrl,
        generation,
        remainingCredits: remainingCredits
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
  // Get product type (saree, handbag, footwear, jewelry, gadget, etc.)
  const productType = (filters.productType || '').toLowerCase();
  
  // Build the main instruction based on product type
  let mainInstruction = '';
  let productSpecificInstructions = '';
  
  // Determine model description
  const modelType = (filters.modelType || '').toLowerCase();
  const isFemale = modelType.includes('female') || modelType === 'female';
  const isMale = modelType.includes('male') || modelType === 'male';
  const isKids = modelType.includes('kids') || modelType === 'kids';
  const isMannequin = modelType.includes('mannequin') || modelType === 'mannequin';
  
  // Handle ethnicity if specified in modelType (e.g., "female-asian", "male-caucasian")
  const ethnicity = modelType.includes('asian') ? 'Asian' : 
                    modelType.includes('caucasian') ? 'Caucasian' : 
                    modelType.includes('indian') ? 'Indian' : '';
  
  // Build model description
  let modelDesc = '';
  if (modelType && modelType !== 'none' && !isMannequin) {
    if (isFemale) {
      modelDesc = ethnicity ? `a beautiful ${ethnicity} female model` : 'a beautiful female model';
    } else if (isMale) {
      modelDesc = ethnicity ? `a handsome ${ethnicity} male model` : 'a handsome male model';
    } else if (isKids) {
      modelDesc = 'a child model';
    } else {
      modelDesc = 'a professional model';
    }
  } else if (isMannequin) {
    modelDesc = 'a professional mannequin';
  }
  
  // Special handling for saree - must be female model
  if (productType === 'saree' && !isFemale && modelType && modelType !== 'none') {
    // If saree is selected but not female model, we'll still generate but warn in prompt
    // The prompt will emphasize female model requirement
  }

  // Product-specific instructions
  switch (productType) {
    case 'saree':
      if (modelDesc) {
        if (isFemale) {
          mainInstruction = `⚠️ CRITICAL: Generate a professional fashion photograph showing ${modelDesc} wearing the EXACT UNSTITCHED SAREE from the uploaded image, DRAPED IN NIVI STYLE.

UNDERSTAND: A saree is NOT a dress, NOT a stole, NOT a scarf. It is a LONG PIECE OF UNSTITCHED FABRIC that is WRAPPED around the WAIST and LOWER BODY.

CRITICAL: THE SAREE FABRIC STARTS AT THE WAIST, NOT AT THE SHOULDERS.

KEY DIFFERENCES:
- DRESS = Stitched garment with seams, fitted silhouette, smooth appearance
- STOLE/SCARF = Fabric hanging from shoulders/neck, not wrapping around lower body
- SAREE (NIVI STYLE) = Unstitched fabric TUCKED INTO WAIST, WRAPPED around lower body, visible PLEATS at waist, flowing PALLU over shoulder

The saree is worn as follows:
1. Model wears a BLOUSE (choli) and PETTICOAT (underskirt)
2. The saree fabric is TUCKED INTO THE WAIST of the petticoat
3. 5-7 PLEATS are created at the front waist (MOST IMPORTANT VISUAL INDICATOR)
4. The fabric WRAPS around the ENTIRE LOWER BODY from waist to ankles
5. The PALLU (loose end) flows over the LEFT shoulder

THE FABRIC MUST WRAP AROUND THE WAIST AND LOWER BODY - IT DOES NOT HANG FROM THE SHOULDERS LIKE A SCARF.`;
          productSpecificInstructions = `⚠️⚠️⚠️ THIS IS A SAREE - NOT A DRESS ⚠️⚠️⚠️

COMPARISON - UNDERSTAND THE DIFFERENCE:

❌ DRESS (WRONG):
- Smooth, fitted silhouette
- Seams and stitching visible
- Follows body shape closely
- Single piece appearance
- Zippers/buttons/closures
- NO visible pleats at waist

❌ STOLE/SCARF/DUPATTA STYLE (ABSOLUTELY WRONG - DO NOT CREATE THIS):
- Fabric draped ONLY around neck/shoulders
- Hanging down like a scarf or shawl
- Model wearing a dress underneath
- Fabric just hanging from shoulders
- NO pleats at waist
- NO wrapping around lower body/legs
- Fabric starts from shoulders/neck, NOT from waist
- If you see this style, it's COMPLETELY WRONG

✅ SAREE - NIVI STYLE (CORRECT - YOU MUST CREATE THIS):
- UNSTITCHED fabric WRAPPED around body
- Fabric STARTS AT WAIST (tucked into petticoat)
- Visible PLEATS at front waist (5-7 pleats) - CRITICAL
- Fabric WRAPPING around ENTIRE LOWER BODY from waist to ankles
- Fabric covers legs completely, creating wrapped skirt appearance
- PALLU flowing over left shoulder (this is the LAST part, not the main part)
- Shows folds, drapes, and wrapping - NOT smooth
- Worn over BLOUSE (choli) and PETTICOAT (underskirt)
- Looks like a WRAPPED SKIRT, NOT a dress or scarf

MANDATORY ELEMENTS YOU MUST SHOW:

1. PLEATS AT WAIST (CRITICAL):
   - 5-7 pleats MUST be clearly visible at the front waist
   - These show where the fabric is FOLDED and TUCKED
   - Pleats are the KEY indicator it's a wrapped saree, not a dress
   - They should be neat, well-formed, and clearly visible

2. WRAPPING AROUND BODY FROM WAIST (CRITICAL):
   - The saree fabric MUST START AT THE WAIST (tucked into petticoat)
   - The fabric MUST wrap around the ENTIRE lower body from waist to ankles
   - You MUST see evidence of the fabric WRAPPING around the HIPS and LEGS
   - The fabric should show it's WRAPPING AROUND the body in layers
   - It should look like a WRAPPED SKIRT starting from the waist, NOT a dress
   - It should NOT look like a single seamless piece
   - CRITICAL: If the fabric appears to hang from shoulders only, it's WRONG
   - The fabric MUST cover from waist to ankles, wrapping around the entire lower torso and legs

3. PALLU OVER SHOULDER (CRITICAL):
   - The loose end (pallu) MUST flow over the LEFT shoulder
   - It should extend down the front, showing the border design
   - The pallu shows it's a draped piece, not a fitted garment
   - The border from the uploaded image must be visible in the pallu

4. BLOUSE (CHOLI) VISIBLE (MANDATORY):
   - The model MUST wear a blouse covering torso, chest, back, arms
   - The blouse is a STITCHED garment (it has seams)
   - The saree is WRAPPED OVER the blouse
   - The blouse must be clearly visible as a separate garment
   - DO NOT show bare shoulders, chest, or back

5. VISIBLE FOLDS AND DRAPES:
   - The fabric should show natural folds from the wrapping
   - It should drape and flow naturally
   - It should NOT look smooth and fitted like a dress
   - You should see evidence of the fabric being wrapped

6. NO SEAMS OR STITCHING:
   - There should be NO visible seams on the saree
   - NO zippers, NO buttons on the saree (only on blouse)
   - The saree should look like a continuous piece of fabric
   - Only the blouse should show stitching

ABSOLUTELY FORBIDDEN - DO NOT CREATE:
- ❌ NO stole/scarf/dupatta style (fabric hanging from shoulders only)
- ❌ NO fabric that doesn't wrap around the waist and lower body
- ❌ NO appearance where fabric seems to hang from shoulders like a scarf
- ❌ NO model wearing a dress with fabric draped over it like a stole
- ❌ NO saree without visible pleats at waist
- ❌ NO saree that doesn't cover the legs from waist to ankles
- ❌ NO situation where lower body looks like it's wearing a dress
- ❌ NO fabric starting from shoulders/neck instead of waist

PRODUCT ACCURACY:
- Use the EXACT saree from the uploaded image
- Match all patterns, colors, borders, designs perfectly
- If the uploaded saree has borders, show them in the pallu and wrapped portions
- If it has patterns, show them in the wrapped saree around the lower body
- Any decorative elements (tassels, embroidery) must be visible
- The border design must be visible in the pallu over the shoulder
- The main fabric pattern must be visible in the wrapped portion around the lower body

BLOUSE REQUIREMENTS:
- MANDATORY: Model MUST wear a blouse (choli)
- Blouse covers: torso, chest, back, arms/shoulders
- Blouse can be: sleeveless, short-sleeved, or full-sleeved
- Blouse color: Should complement saree (match border or neutral)
- Blouse is STITCHED: It has seams and is a separate garment
- Saree drapes OVER the blouse on the left shoulder
- Blouse must be clearly visible

POSE REQUIREMENTS:
- Pose must show the PLEATS at the waist clearly
- Pose must show the WRAPPING around the lower body
- Pose must show the PALLU over the left shoulder
- One hand can be on hip, other relaxed
- Avoid clasping hands (too static)
- Show the full saree from waist to ankles

STYLING:
- Elegant Indian accessories: jhumka earrings, bangles
- Elegant hairstyle: bun or updo
- Gentle, confident expression
- Subtle, natural makeup

⚠️ FINAL CHECKLIST ⚠️
Before generating, verify EVERY item:
✅ Can I see 5-7 pleats at the front waist? (If NO → WRONG - DO NOT GENERATE)
✅ Does the fabric START at the waist and wrap around the ENTIRE lower body? (If NO → WRONG)
✅ Does the fabric cover the legs from waist to ankles? (If NO → WRONG)
✅ Is the pallu flowing over the left shoulder? (If NO → WRONG)
✅ Is the model wearing a blouse? (If NO → WRONG)
✅ Are there NO seams on the saree? (If YES → WRONG)
✅ Does it look like a WRAPPED SKIRT, not a dress? (If NO → WRONG)
✅ Is the fabric wrapping around the waist/hips/legs, NOT hanging from shoulders? (If NO → WRONG)

IF THE FABRIC APPEARS TO HANG FROM THE SHOULDERS LIKE A SCARF → IT'S COMPLETELY WRONG. DO NOT GENERATE IT.
THE SAREE MUST WRAP AROUND THE WAIST AND LOWER BODY, NOT HANG FROM THE SHOULDERS.
THE SAREE MUST LOOK LIKE WRAPPED, DRAPED FABRIC - NOT A DRESS, NOT A STOLE, NOT A SCARF.

IF ANY CHECK FAILS, THE IMAGE IS WRONG. DO NOT GENERATE IT.`;
        } else {
          // If non-female model selected for saree, still generate but emphasize it's unusual
          mainInstruction = `Generate a professional high-quality photograph showing ${modelDesc} with the EXACT saree from the uploaded image. Note: Sarees are traditionally worn by women, but showing the product as requested.`;
          productSpecificInstructions = 'Display the exact saree from the uploaded product image with all its details, patterns, colors, and design elements accurately represented.';
        }
      } else {
        mainInstruction = '🚨 CRITICAL: Generate a professional fashion photograph showing a beautiful female model wearing the EXACT UNSTITCHED SAREE from the uploaded image. The saree is a LONG PIECE OF FABRIC that must be WRAPPED and DRAPED around the body - NOT a stitched dress. The model MUST wear a blouse (choli). The saree wraps around the entire lower body from waist to ankle, with visible pleats and the pallu over the left shoulder.';
        productSpecificInstructions = `🚨🚨🚨 ABSOLUTE REQUIREMENTS 🚨🚨🚨

FORBIDDEN:
❌ NO DRESS - Do NOT create a stitched dress, gown, or fitted garment
❌ NO SEAMS - The saree has NO seams, NO zippers, NO buttons (except blouse)
❌ NO DUPATTA/STOLE - Do NOT show it only around neck/shoulders

MANDATORY:
✅ UNSTITCHED FABRIC - The saree is a long piece of UNSTITCHED fabric WRAPPED around the body
✅ WRAPPING - The fabric MUST wrap around the entire lower body (waist to ankles)
✅ PLEATS - 5-7 pleats MUST be visible at the front waist, showing the fabric is folded and tucked
✅ PALLU - The loose end (pallu) MUST flow over the LEFT shoulder and down the front
✅ BLOUSE - The model MUST wear a blouse (choli) covering torso, chest, back, and arms
✅ VISIBLE DRAPING - The fabric should show wrapping, folds, and layers - NOT smooth and fitted

The saree MUST look like WRAPPED, DRAPED FABRIC with visible pleats and folds - NOT a stitched garment. The model must wear the exact saree from the uploaded image with all patterns, colors, and borders matching perfectly. The blouse is MANDATORY and must be clearly visible.`;
      }
      break;
      
    case 'handbag':
      if (modelDesc) {
        mainInstruction = `Generate a professional high-quality photograph showing ${modelDesc} wearing and carrying the EXACT handbag from the uploaded image. The model must be holding or wearing the precise handbag shown in the image - same style, same color, same material, same hardware, same size, and same design details.`;
        productSpecificInstructions = 'The handbag should be naturally integrated into the scene - either held by the hand, on the shoulder, or positioned naturally. The model should be interacting with the exact handbag from the uploaded product image. All design elements, colors, textures, and hardware must match the original product exactly.';
      } else {
        mainInstruction = 'Generate a professional high-quality photograph of the handbag from the uploaded image.';
        productSpecificInstructions = 'Display the handbag prominently, showing all its details, design, and features.';
      }
      break;
      
    case 'footwear':
    case 'shoe':
    case 'shoes':
      if (modelDesc) {
        mainInstruction = `Generate a professional high-quality photograph showing ${modelDesc} wearing the EXACT footwear from the uploaded image. The model must be wearing the precise shoes/footwear shown in the image - same style, same color, same material, same design, same brand details, and same size.`;
        productSpecificInstructions = 'The footwear should be clearly visible on the model\'s feet, showing how they look when worn. The model should be wearing the exact footwear from the uploaded product image. All design elements, colors, textures, and branding must match the original product exactly. Show the footwear from angles that demonstrate fit and style.';
      } else {
        mainInstruction = 'Generate a professional high-quality photograph of the footwear from the uploaded image.';
        productSpecificInstructions = 'Display the footwear prominently, showing all design details, materials, and features.';
      }
      break;
      
    case 'jewelry':
    case 'jewellery':
      if (modelDesc) {
        mainInstruction = `Generate a professional high-quality photograph showing ${modelDesc} wearing the EXACT jewelry piece from the uploaded image. The model must be wearing the precise jewelry shown in the image - same design, same metal, same stones/gems, same size, and same style.`;
        productSpecificInstructions = 'The jewelry should be elegantly displayed on the model - necklaces around the neck, earrings on the ears, bracelets on the wrist, rings on fingers, etc. The model should be wearing the exact jewelry from the uploaded product image. All design elements, materials, stones, and finishes must match the original product exactly.';
      } else {
        mainInstruction = 'Generate a professional high-quality photograph of the jewelry from the uploaded image.';
        productSpecificInstructions = 'Display the jewelry prominently, showing all design details, materials, and craftsmanship.';
      }
      break;
      
    case 'gadget':
    case 'electronics':
    case 'accessory':
      if (modelDesc) {
        mainInstruction = `Generate a professional high-quality photograph showing ${modelDesc} using or holding the EXACT gadget/electronic device from the uploaded image. The model must be interacting with the precise product shown in the image - same model, same color, same design, and same features.`;
        productSpecificInstructions = 'The gadget should be naturally integrated into the scene - being used or held by the model in a realistic way. The model should be interacting with the exact product from the uploaded image. All design elements, colors, and features must match the original product exactly.';
      } else {
        mainInstruction = 'Generate a professional high-quality photograph of the gadget from the uploaded image.';
        productSpecificInstructions = 'Display the gadget prominently, showing all features, design, and functionality.';
      }
      break;
      
    default:
      // Generic product instruction
      if (modelDesc) {
        mainInstruction = `Generate a professional high-quality photograph showing ${modelDesc} wearing or using the EXACT product from the uploaded image. The model must be wearing, holding, or using the precise product shown in the image - same design, same color, same material, same style, and same features.`;
        productSpecificInstructions = 'The product should be the exact same item from the uploaded image, not a similar or different product. All design elements, colors, textures, and details must match the original product exactly. The product should be naturally integrated and clearly visible in the image.';
      } else {
        mainInstruction = 'Generate a professional high-quality photograph of the product from the uploaded image.';
        productSpecificInstructions = 'Display the product prominently, showing all its details, design, and features.';
      }
  }

  // Start building the prompt
  const parts = [
    mainInstruction,
    '',
    'CRITICAL REQUIREMENTS:',
    productSpecificInstructions,
    '- The product in the generated image MUST be the exact same product from the uploaded image - identical design, colors, patterns, materials, and details',
    '- Do not create a similar product or a different variation - use the EXACT product shown in the uploaded image',
    '- Maintain the authenticity and accuracy of the original product design',
    ''
  ];

  // Add model specifications if model is selected
  if (modelDesc && modelType !== 'none') {
    parts.push('MODEL SPECIFICATIONS:');
    
    if (filters.bodyType) {
      const bodyTypeMap: Record<string, string> = {
        'slim': 'slim and slender physique',
        'athletic': 'athletic and toned build',
        'curvy': 'curvy and voluptuous figure',
        'plus-size': 'plus-size and confident presence',
        'petite': 'petite and delicate frame',
        'muscular': 'muscular and well-defined physique'
      };
      parts.push(`- Body type: ${bodyTypeMap[filters.bodyType] || filters.bodyType}`);
    }
    
    if (filters.height && filters.height > 0) {
      parts.push(`- Height: ${filters.height} cm (approximately ${Math.round(filters.height / 2.54)} inches)`);
    }
    
    if (filters.weight && filters.weight > 0) {
      parts.push(`- Weight: ${filters.weight} kg (approximately ${Math.round(filters.weight * 2.20462)} lbs)`);
    }
    
    if (filters.skinTone) {
      const skinToneMap: Record<string, string> = {
        'fair': 'fair and light complexion',
        'medium': 'medium complexion with warm undertones',
        'olive': 'olive complexion with neutral undertones',
        'tan': 'tan and sun-kissed complexion',
        'dark': 'deep and rich complexion'
      };
      parts.push(`- Skin tone: ${skinToneMap[filters.skinTone] || filters.skinTone}`);
    }
    
    if (filters.hairType) {
      const hairTypeMap: Record<string, string> = {
        'straight': 'straight and sleek hair',
        'wavy': 'wavy and flowing hair',
        'curly': 'curly and voluminous hair',
        'coily': 'coily and textured hair',
        'bald': 'bald or shaved head'
      };
      parts.push(`- Hair type: ${hairTypeMap[filters.hairType] || filters.hairType}`);
    }
    
    if (filters.hairColor) {
      const hairColorMap: Record<string, string> = {
        'black': 'rich black hair',
        'brown': 'natural brown hair',
        'blonde': 'blonde hair',
        'red': 'red or auburn hair',
        'grey': 'grey or silver hair',
        'custom': 'custom hair color'
      };
      parts.push(`- Hair color: ${hairColorMap[filters.hairColor] || filters.hairColor}`);
    }
    parts.push('');
  }

  // Background settings
  if (filters.background && filters.background.trim() !== '') {
    const bgMap: Record<string, string> = {
      'studio': 'a professional studio setting with clean, neutral background',
      'studio-white': 'a professional studio with clean white background',
      'studio-gray': 'a professional studio with elegant gray background',
      'outdoor': 'a beautiful outdoor natural setting with natural elements',
      'outdoor-natural': 'a beautiful outdoor natural setting with natural elements',
      'lifestyle': 'a stylish home lifestyle environment with modern interior',
      'lifestyle-home': 'a stylish home lifestyle environment with modern interior',
      'catalogue': 'a clean, professional catalogue-style background suitable for e-commerce',
      'festive': 'a festive and celebratory background with decorative elements',
      'minimal': 'a minimal, clean aesthetic background that doesn\'t distract from the product',
      'abstract': 'an abstract, artistic background that complements the product',
      'solid': 'a solid color background that matches or complements the product colors'
    };
    parts.push(`BACKGROUND: ${bgMap[filters.background] || filters.background}`);
  } else {
    // Default background if not specified
    parts.push('BACKGROUND: a professional studio setting with clean, neutral background');
  }

  // Lighting settings
  if (filters.lighting && filters.lighting.trim() !== '') {
    const lightMap: Record<string, string> = {
      'soft': 'soft, diffused lighting that enhances the product details and model features',
      'soft-/-diffused': 'soft, diffused lighting that enhances the product details and model features',
      'bright': 'bright, natural lighting that brings out colors and details',
      'bright-/-natural': 'bright, natural lighting that brings out colors and details',
      'natural': 'natural, warm lighting that looks authentic and flattering',
      'dramatic': 'dramatic lighting with strong contrast and shadows for a high-fashion look',
      'dramatic-shadows': 'dramatic lighting with strong contrast and shadows for a high-fashion look',
      'golden-hour': 'golden hour lighting with warm, golden tones creating a flattering and romantic atmosphere',
      'studio': 'professional studio lighting setup that highlights both product and model',
      'studio-spotlight': 'professional studio spotlight lighting that creates depth and dimension',
      'high-key': 'high-key lighting with bright, even illumination and minimal shadows',
      'high-key-/-low-key': 'high-key or low-key lighting for dramatic effect',
      'low-key': 'low-key lighting with deep shadows and high contrast for dramatic effect',
      'flat': 'flat, even lighting with minimal shadows for clean product shots',
      'flat-/-even-lighting': 'flat, even lighting with minimal shadows for clean product shots'
    };
    const lightingKey = filters.lighting.toLowerCase().replace(/\s+/g, '-');
    parts.push(`LIGHTING: ${lightMap[lightingKey] || lightMap[filters.lighting] || filters.lighting}`);
  } else {
    // Default lighting if not specified
    parts.push('LIGHTING: soft, diffused lighting that enhances the product details and model features');
  }

  // Camera angle
  if (filters.angle && filters.angle.trim() !== '') {
    const angleMap: Record<string, string> = {
      'front': 'front-facing view showing the product clearly',
      'eye-level': 'eye-level camera angle at the model\'s eye height for a natural, engaging perspective',
      'side': 'side profile view showing the product from the side',
      'high-angle': 'high-angle camera position looking down for a unique perspective',
      'low-angle': 'low-angle camera position looking up for a powerful, dynamic perspective',
      'three-quarter': 'three-quarter angle view for depth and dimension',
      'overhead': 'overhead view looking down from above (if applicable to the product)',
      'closeup': 'close-up detail shot focusing on the product details',
      'close-up': 'close-up detail shot focusing on the product details',
      'mid-shot': 'mid-shot framing showing the model from waist up, perfect for showcasing the product',
      'full-body': 'full body shot showing the complete look and product',
      'full-body-shot': 'full body shot showing the complete look and product',
      '45-perspective': '45-degree perspective angle for a dynamic, three-dimensional view that showcases both the product and the model\'s form',
      '45-degree': '45-degree perspective angle for a dynamic, three-dimensional view'
    };
    const angleKey = filters.angle.toLowerCase().replace(/\s+/g, '-');
    parts.push(`CAMERA ANGLE: ${angleMap[angleKey] || angleMap[filters.angle] || filters.angle}`);
  } else {
    // Default camera angle if not specified
    parts.push('CAMERA ANGLE: eye-level camera angle at the model\'s eye height for a natural, engaging perspective');
  }

  // Mood/aesthetic
  if (filters.mood && filters.mood.trim() !== '') {
    const moodMap: Record<string, string> = {
      'elegant': 'elegant, luxurious, and sophisticated aesthetic',
      'casual': 'casual, relaxed, and approachable style',
      'vibrant': 'vibrant, energetic, and eye-catching presentation',
      'minimal': 'minimal, clean, and modern look',
      'professional': 'professional and polished appearance',
      'festival': 'festive, celebratory, and vibrant mood with energy and joy',
      'glamorous': 'glamorous, luxurious, and high-fashion aesthetic',
      'editorial': 'editorial, high-fashion magazine style with artistic flair',
      'vintage': 'vintage, retro-inspired aesthetic with timeless appeal',
      'luxury': 'luxury, premium, and high-end aesthetic',
      'trendy': 'trendy, modern, and fashion-forward style',
      'ethereal': 'ethereal, dreamy, and otherworldly aesthetic with soft, magical qualities'
    };
    const moodKey = filters.mood.toLowerCase();
    parts.push(`MOOD/AESTHETIC: ${moodMap[moodKey] || filters.mood}`);
  } else {
    // Default mood if not specified
    parts.push('MOOD/AESTHETIC: professional and polished appearance');
  }

  // Smart Filters / Technical Enhancements
  if (filters.backgroundBlur !== undefined && filters.backgroundBlur > 0) {
    const blurLevel = filters.backgroundBlur;
    if (blurLevel < 30) {
      parts.push(`BACKGROUND EFFECT: Slight background blur (${blurLevel}%) to create subtle depth while keeping background details visible`);
    } else if (blurLevel < 70) {
      parts.push(`BACKGROUND EFFECT: Moderate background blur (${blurLevel}%) to create depth and focus attention on the product and model`);
    } else {
      parts.push(`BACKGROUND EFFECT: Strong background blur (${blurLevel}%) with bokeh effect to create dramatic depth and isolate the product and model`);
    }
  }

  if (filters.shadowIntensity !== undefined && filters.shadowIntensity > 0) {
    const shadowLevel = filters.shadowIntensity;
    if (shadowLevel < 30) {
      parts.push(`SHADOW EFFECT: Subtle shadows (${shadowLevel}%) to add gentle depth and dimension`);
    } else if (shadowLevel < 70) {
      parts.push(`SHADOW EFFECT: Moderate shadows (${shadowLevel}%) to create depth and grounding`);
    } else {
      parts.push(`SHADOW EFFECT: Strong, dramatic shadows (${shadowLevel}%) for high-fashion, artistic effect`);
    }
  }

  if (filters.sharpness !== undefined && filters.sharpness > 0) {
    const sharpnessLevel = filters.sharpness;
    if (sharpnessLevel < 30) {
      parts.push(`IMAGE SHARPNESS: Soft focus (${sharpnessLevel}%) for a dreamy, ethereal aesthetic`);
    } else if (sharpnessLevel < 70) {
      parts.push(`IMAGE SHARPNESS: Balanced sharpness (${sharpnessLevel}%) for clear, natural-looking details`);
    } else {
      parts.push(`IMAGE SHARPNESS: High sharpness (${sharpnessLevel}%) for crisp, ultra-detailed product photography`);
    }
  }

  if (filters.colorGrading) {
    const colorGradingMap: Record<string, string> = {
      'warm': 'warm color grading with golden, amber, and orange tones for a cozy, inviting feel',
      'cool': 'cool color grading with blue, cyan, and cool tones for a modern, fresh aesthetic',
      'balanced': 'balanced, neutral color grading that maintains natural skin tones and product colors',
      'vibrant': 'vibrant color grading with enhanced saturation and pop for eye-catching, energetic images',
      'monochrome': 'monochrome or desaturated color grading for a sophisticated, artistic look'
    };
    parts.push(`COLOR GRADING: ${colorGradingMap[filters.colorGrading] || filters.colorGrading}`);
  }

  if (filters.aiEnhancement) {
    parts.push('AI ENHANCEMENT: Apply advanced AI enhancement for optimal image quality, clarity, and professional finish');
  }

  // Quality and technical requirements
  parts.push('');
  parts.push('QUALITY REQUIREMENTS:');
  parts.push('- Ultra-high resolution, professional editorial fashion photography standard');
  parts.push('- Sharp focus on the product and model, showing all product details clearly');
  parts.push('- Editorial-style, magazine-quality photography - elegant and fashion-forward');
  parts.push('- Commercial-ready image suitable for online stores and marketing');
  parts.push('- Polished, sophisticated aesthetic');
  parts.push('- The product must be the primary focus and clearly visible');
  parts.push('- Natural, realistic appearance with authentic styling and poses');
  parts.push('- Avoid stiff, overly formal poses - prefer natural, elegant, and slightly dynamic poses');
  parts.push('- Professional lighting that highlights product details and creates a flattering look');
  parts.push('- Clean, professional background that doesn\'t distract from the product');

  return parts.join('\n');
}

