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

    // Call Lovable AI Gateway for image generation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Enhance prompt with explicit instruction to analyze the uploaded image first
    const isSaree = (filters.productType || '').toLowerCase() === 'saree';
    
    // CRITICAL SAREE INSTRUCTIONS - Must be at the very beginning and repeated multiple times
    const sareeCriticalWarning = isSaree ? `\n\n🚨🚨🚨🚨🚨 CRITICAL: GENERATE A PROPERLY DRAPED SAREE IN NIVI STYLE 🚨🚨🚨🚨🚨\n\n
STOP. READ THIS ENTIRE SECTION BEFORE GENERATING.

YOU MUST GENERATE A TRADITIONAL INDIAN SAREE DRAPED IN NIVI STYLE (THE MOST COMMON AND CORRECT WAY).

REFERENCE: The output should look like professional fashion photography of Indian women wearing sarees - with pleats at the waist, fabric wrapping around the entire lower body, and pallu over the shoulder.

THE UPLOADED IMAGE SHOWS A FLAT PIECE OF FABRIC - THIS IS A SAREE. YOU MUST DRAPE IT PROPERLY ON A FEMALE MODEL.

VISUAL REFERENCE OF CORRECT SAREE DRAPING:
- The saree fabric STARTS at the WAIST (tucked into petticoat waistband)
- 5-7 neat PLEATS are created at the front waist and tucked in
- The fabric WRAPS AROUND the entire LOWER BODY from waist to ankles
- The fabric covers the LEGS COMPLETELY, creating a WRAPPED SKIRT appearance
- The PALLU (loose end) flows over the LEFT SHOULDER and down the front/back
- A BLOUSE (choli) is worn underneath and is clearly visible
- The lower body from waist to ankles is COMPLETELY COVERED by the wrapped saree fabric
- You can see the fabric WRAPPING around the hips and legs in layers

❌❌❌ ABSOLUTELY FORBIDDEN - DO NOT CREATE ANY OF THESE: ❌❌❌

1. STITCHED DRESS/GOWN (WRONG):
   - Stitched garment with seams
   - Fitted silhouette that follows body shape
   - Zippers, buttons, or closures
   - Smooth, seamless appearance
   - Tailored to fit the body
   - Looks like a single piece of clothing
   - NO visible pleats at waist
   - Fabric appears stitched/sewn

2. STOLE/DUPATTA/SCARF STYLE (ABSOLUTELY WRONG - THIS IS WHAT YOU MUST AVOID):
   - ❌ Fabric draped ONLY around neck/shoulders
   - ❌ Hanging down like a scarf or shawl
   - ❌ NOT wrapping around the lower body
   - ❌ Model wearing a dress underneath with fabric just hanging from shoulders
   - ❌ NO pleats at waist
   - ❌ NO wrapping around legs
   - ❌ Fabric starts from shoulders/neck, NOT from waist
   - ❌ If the fabric is hanging from shoulders like a scarf → THIS IS COMPLETELY WRONG
   - ❌ If the model appears to be wearing a dress with fabric draped over it → THIS IS WRONG
   - ❌ If there's no fabric wrapping around the waist/hips → THIS IS WRONG
   
   THE SAREE DOES NOT HANG FROM SHOULDERS. IT WRAPS FROM THE WAIST DOWNWARDS.

3. WRAP DRESS (WRONG):
   - Stitched wrap-style dress
   - Fabric tied or wrapped but still stitched
   - Smooth appearance with no pleats
   - Looks like a modern dress design

✅✅✅ CORRECT SAREE DRAPING - NIVI STYLE (YOU MUST CREATE THIS EXACTLY): ✅✅✅

VISUAL DESCRIPTION OF CORRECT SAREE DRAPING:

FROM BOTTOM TO TOP - HOW IT SHOULD LOOK:

1. LOWER BODY (WAIST TO ANKLES) - THE MAIN PART:
   - The saree fabric WRAPS AROUND THE ENTIRE LOWER BODY from waist to ankles
   - The fabric covers the LEGS COMPLETELY - you cannot see the legs through the fabric
   - It looks like a WRAPPED SKIRT - the fabric goes around the hips and legs in layers
   - The fabric is wrapped tightly around the lower body, creating a skirt-like silhouette
   - From the front view, you see the fabric covering from waist down to ankles
   - From the side view, you can see the fabric wrapping around the body
   - The fabric shows natural folds and drapes from the wrapping

2. WAIST AREA - PLEATS (MOST IMPORTANT VISUAL INDICATOR):
   - At the front waist, there are 5-7 neat, vertical PLEATS
   - These pleats are clearly visible - they look like folds or accordion folds
   - The pleats are tucked into the waistband of the petticoat
   - The pleats prove that the fabric starts at the waist and is wrapped
   - Without visible pleats, it's NOT a properly draped saree

3. UPPER BODY - BLOUSE:
   - The model wears a BLOUSE (choli) - a stitched top
   - The blouse covers the torso, chest, back, and arms
   - The blouse is clearly visible as a separate garment
   - The blouse can be sleeveless, short-sleeved, or full-sleeved
   - The blouse color complements the saree

4. SHOULDER - PALLU (THE LOOSE END):
   - The PALLU (loose end of the saree) flows over the LEFT shoulder
   - It extends down the front or back, showing the border design
   - The pallu is the decorative end that shows the saree's border and patterns
   - The pallu is draped AFTER the main wrapping is done

WHAT THE FINAL IMAGE SHOULD SHOW:
✅ A female model standing gracefully
✅ Lower body (waist to ankles) COMPLETELY COVERED by wrapped saree fabric
✅ 5-7 CLEARLY VISIBLE PLEATS at the front waist
✅ Fabric WRAPPING around hips and legs, creating a wrapped skirt appearance
✅ PALLU flowing over the left shoulder
✅ BLOUSE visible on the upper body
✅ Professional fashion photography style
✅ The saree looks like UNSTITCHED FABRIC that has been WRAPPED, not a stitched dress
✅ Natural folds and drapes from the wrapping
✅ NO seams, NO zippers, NO buttons on the saree itself

MANDATORY VISUAL ELEMENTS - ALL MUST BE PRESENT:

1. PLEATS AT WAIST (MOST CRITICAL - WITHOUT THIS, IT'S WRONG):
   - 5-7 pleats MUST be clearly visible at the front waist area
   - These pleats show where the fabric is FOLDED and TUCKED into the waist
   - Pleats are the PRIMARY indicator that this is a wrapped saree, not a dress or stole
   - The pleats should be neat, well-formed, and CLEARLY VISIBLE
   - They appear as vertical folds at the front waist
   - If you don't see pleats at the waist, it's NOT a saree - IT'S WRONG
   - The pleats prove the fabric starts at the waist and wraps from there

2. FULL LOWER BODY WRAPPING FROM WAIST (CRITICAL):
   - The saree fabric MUST START AT THE WAIST (tucked into petticoat)
   - The fabric MUST wrap around the ENTIRE lower body from waist to ankles
   - The saree MUST cover the legs completely, creating a wrapped skirt appearance
   - You MUST see evidence of the fabric WRAPPING around the HIPS and LEGS
   - It should look like a WRAPPED SKIRT starting from the waist, NOT a dress
   - The fabric should show it's WRAPPING AROUND the body in layers
   - If the fabric appears to hang from shoulders/neck only → IT'S COMPLETELY WRONG
   - If there's no fabric wrapping around the waist/hips/legs → IT'S WRONG
   - The fabric MUST cover from waist to ankles, wrapping around the entire lower torso and legs

3. PALLU OVER SHOULDER (CRITICAL):
   - The loose end (pallu) MUST flow over the LEFT shoulder
   - It should extend down the front, showing the border design
   - The pallu shows it's a draped piece, not a fitted garment
   - The border from the uploaded image must be visible in the pallu
   - The pallu should be clearly separate from the main body wrapping

4. BLOUSE (CHOLI) VISIBLE (MANDATORY):
   - The model MUST wear a blouse (choli) covering torso, chest, back, arms
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

ABSOLUTELY FORBIDDEN - DO NOT CREATE ANY OF THESE:
- ❌ NO dress, gown, or stitched garment (saree is UNSTITCHED)
- ❌ NO seams, zippers, or buttons on the saree (only blouse has these)
- ❌ NO fitted, tailored, or smooth silhouette (saree shows wrapping and pleats)
- ❌ NO dupatta/stole/scarf style (NOT just around neck/shoulders)
- ❌ NO fabric hanging only from shoulders/neck (WRONG - fabric starts at waist)
- ❌ NO model wearing a dress with fabric draped over it (WRONG)
- ❌ NO model without a blouse (blouse is MANDATORY)
- ❌ NO saree that doesn't wrap around the lower body from waist (WRONG)
- ❌ NO saree without visible pleats at waist (WRONG - pleats are CRITICAL)
- ❌ NO fabric that doesn't cover the legs from waist to ankles (WRONG)
- ❌ NO appearance where fabric seems to hang from shoulders like a scarf (WRONG)
- ❌ NO situation where the lower body looks like it's wearing a dress (WRONG)

IF THE RESULT LOOKS LIKE:
- A dress or stitched garment → WRONG
- A stole/dupatta draped around neck → WRONG
- A wrap dress → WRONG
- Fabric only around shoulders, not wrapping lower body → WRONG
- No pleats visible at waist → WRONG
- Smooth, fitted appearance → WRONG

THE SAREE MUST SHOW CLEAR EVIDENCE OF:
✅ Pleats at waist (5-7 visible pleats)
✅ Full wrapping around lower body (waist to ankles)
✅ Pallu over left shoulder
✅ Blouse visible underneath
✅ Folds and drapes from wrapping
✅ NO seams or stitching on saree
✅ Fabric covering legs completely\n\n` : '';
    
    const enhancedPrompt = isSaree 
      ? `${sareeCriticalWarning}=== YOUR TASK ===
Generate a professional fashion photograph of a beautiful female model wearing a SAREE, exactly like professional Indian fashion photography.

REFERENCE STYLE: The output should look like high-end Indian fashion magazines - elegant, graceful, with proper traditional draping.

VISUAL REFERENCE - CORRECT SAREE DRAPING LOOKS LIKE:
- A female model standing gracefully
- Lower body (from waist to ankles) COMPLETELY COVERED by saree fabric wrapped around it
- 5-7 neat, vertical PLEATS clearly visible at the front waist area
- The fabric wraps around the hips and legs, creating a wrapped skirt appearance
- The pallu (decorative end) flows elegantly over the left shoulder
- A blouse (choli) is clearly visible on the upper body
- The saree looks like unstitched fabric that has been wrapped around the body
- Professional fashion photography quality with proper lighting and composition
- The overall appearance is of a traditional Indian saree properly draped in nivi style

=== STEP 1: ANALYZE THE UPLOADED SAREE IMAGE ===
- Study the uploaded saree image VERY CAREFULLY
- Note ALL patterns, colors, borders, designs, motifs, textures
- Identify the border design, colors, and patterns
- Note any decorative elements (embroidery, tassels, etc.)
- Study the fabric texture and material appearance
- This is the EXACT fabric you must recreate on the model
- Match EVERY detail: patterns, colors, borders, designs

=== STEP 2: UNDERSTAND WHAT A SAREE IS ===
A SAREE is a LONG PIECE OF UNSTITCHED FABRIC (typically 5-9 meters) that is WRAPPED around a woman's body in NIVI STYLE.

CORRECT SAREE DRAPING:
✅ UNSTITCHED fabric (no seams, no zippers, no buttons on saree)
✅ WRAPPED around the WAIST and LOWER BODY
✅ Starts at WAIST (tucked into petticoat waistband)
✅ Shows visible PLEATS at the front waist (5-7 pleats)
✅ Fabric wraps around ENTIRE LOWER BODY from waist to ankles
✅ Fabric covers LEGS COMPLETELY - creating a wrapped skirt
✅ PALLU (loose end) flows over LEFT shoulder
✅ Worn over BLOUSE (choli) and PETTICOAT (underskirt)
✅ Looks like a WRAPPED SKIRT, NOT a dress

WRONG - DO NOT CREATE:
❌ Stitched dress or gown
❌ Stole/scarf/dupatta (fabric hanging from shoulders only)
❌ Wrap dress (stitched fabric)
❌ Fabric that hangs from shoulders like a scarf
❌ Lower body that looks like it's wearing a dress

=== STEP 3: CREATE THE CORRECT DRAPING (NIVI STYLE) ===

HOW TO DRAPE THE SAREE:

1. BASE GARMENTS (WORN FIRST):
   - Model wears a PETTICOAT: A fitted underskirt from waist to ankles
   - Model wears a BLOUSE (choli): A stitched top covering upper body, chest, back, arms

2. WRAPPING THE SAREE FABRIC:
   
   A) START AT WAIST (CRITICAL):
      - The saree fabric is TUCKED INTO THE WAIST of the petticoat
      - The fabric starts wrapping from the WAIST, NOT from the shoulders
      - This is the MOST IMPORTANT part - the fabric MUST start at the waist
   
   B) CREATE PLEATS AT WAIST (CRITICAL VISUAL INDICATOR):
      - Fold the fabric into 5-7 neat, vertical PLEATS at the front waist
      - These pleats look like accordion folds
      - Tuck these pleats into the waistband
      - These pleats MUST be CLEARLY VISIBLE in the final image
      - The pleats prove the fabric starts at the waist
   
   C) WRAP AROUND LOWER BODY (CRITICAL):
      - Continue wrapping the fabric around the HIPS
      - Then wrap it around the LEGS
      - The fabric wraps around the ENTIRE LOWER BODY from waist to ankles
      - The fabric covers the LEGS COMPLETELY - you cannot see the legs
      - Wrap it so it looks like a WRAPPED SKIRT covering from waist to ankles
      - The fabric shows natural folds and drapes from the wrapping
      - From the front view: you see fabric covering the entire lower body
      - From the side view: you see the fabric wrapping around the body
   
   D) DRAPE THE PALLU:
      - Take the remaining loose end (pallu) over the LEFT shoulder
      - Let it flow down the front or back
      - The pallu shows the border design and patterns from the uploaded saree
      - The border must be clearly visible in the pallu

3. FINAL VISUAL APPEARANCE:
   - Lower body (waist to ankles): COMPLETELY COVERED by wrapped saree fabric
   - Front waist: 5-7 CLEARLY VISIBLE PLEATS (accordion-style folds)
   - Upper body: BLOUSE (choli) clearly visible as a separate garment
   - Left shoulder: PALLU flowing over it, showing border design
   - Overall: Looks like a WRAPPED SKIRT, NOT a dress or scarf
   - The fabric shows it's been WRAPPED around the body, not stitched
   - Natural folds, drapes, and wrapping are visible
   - Professional fashion photography quality
   - Elegant, graceful pose

=== VISUAL CHECKLIST - THE IMAGE MUST SHOW ===
✅ Lower body from waist to ankles is COMPLETELY COVERED by wrapped saree fabric
✅ 5-7 PLEATS are clearly visible at the front waist (like accordion folds)
✅ Fabric is WRAPPING around the hips and legs (wrapped skirt appearance)
✅ Fabric covers the legs completely - creating a skirt-like silhouette
✅ PALLU is flowing over the left shoulder, showing border design
✅ BLOUSE is visible on the upper body as a separate garment
✅ The saree looks like UNSTITCHED FABRIC that has been WRAPPED
✅ Natural folds and drapes from the wrapping are visible
✅ NO seams, NO zippers, NO buttons on the saree itself
✅ Professional fashion photography style
✅ The exact patterns, colors, borders from the uploaded saree are visible

=== COMMON MISTAKES - DO NOT CREATE THESE ===

❌❌❌ MISTAKE 1: STOLE/SCARF/DUPATTA STYLE (COMPLETELY WRONG)
   What it looks like:
   - Fabric draped ONLY around neck/shoulders
   - Hanging down like a scarf or shawl
   - Model appears to be wearing a dress underneath
   - Fabric just hanging from shoulders, not wrapping around body
   - NO pleats at waist
   - NO fabric wrapping around lower body/legs
   - Lower body looks like it's wearing a separate dress
   → THIS IS COMPLETELY WRONG. The saree MUST wrap around the waist and lower body.

❌❌❌ MISTAKE 2: STITCHED DRESS (WRONG)
   What it looks like:
   - Fabric appears stitched/sewn into a dress
   - Smooth, fitted silhouette following body shape
   - No visible pleats at waist
   - Looks like a modern stitched garment
   - Seams or stitching visible
   → THIS IS WRONG. The saree is UNSTITCHED and must show pleats and wrapping.

❌❌❌ MISTAKE 3: WRAP DRESS (WRONG)
   What it looks like:
   - Fabric wrapped but appears stitched
   - Smooth appearance with no pleats
   - Looks like a modern wrap-style dress
   → THIS IS WRONG. The saree must show clear pleats and wrapping.

❌❌❌ MISTAKE 4: FABRIC HANGING FROM SHOULDERS (COMPLETELY WRONG)
   What it looks like:
   - Fabric starts from shoulders/neck
   - Hangs down like a cape or shawl
   - Lower body not covered by wrapped fabric
   - No wrapping around waist/hips/legs
   → THIS IS COMPLETELY WRONG. The saree fabric MUST start at the waist and wrap around the lower body.

=== MANDATORY VISUAL REQUIREMENTS - ALL MUST BE PRESENT ===

1. LOWER BODY COMPLETELY COVERED (MOST CRITICAL):
   - The saree fabric MUST wrap around the ENTIRE LOWER BODY from waist to ankles
   - The fabric MUST cover the LEGS COMPLETELY - you should not see legs through the fabric
   - It should look like a WRAPPED SKIRT covering from waist to ankles
   - The fabric wraps around the HIPS and LEGS in layers
   - From the front view: fabric covers the entire lower body
   - From the side view: you can see the fabric wrapping around the body
   - If the lower body is not completely covered by wrapped fabric, it's WRONG

2. PLEATS AT WAIST (CRITICAL VISUAL INDICATOR):
   - 5-7 pleats MUST be clearly visible at the front waist
   - These pleats look like vertical folds or accordion folds
   - They are tucked into the waistband
   - Pleats prove the fabric starts at the waist and is wrapped
   - If you don't see clear pleats at the waist, it's WRONG

3. FABRIC WRAPPING AROUND BODY:
   - The fabric must show evidence of WRAPPING around the hips and legs
   - You should see the fabric going around the body in layers
   - It should NOT look like a single seamless piece (like a dress)
   - Natural folds and drapes from the wrapping should be visible
   - The fabric should look like it's been WRAPPED, not stitched

4. PALLU OVER SHOULDER:
   - The loose end (pallu) MUST flow over the LEFT shoulder
   - It extends down the front or back, showing the border design
   - The border from the uploaded image must be visible in the pallu
   - The pallu is draped AFTER the main wrapping

5. BLOUSE (CHOLI) VISIBLE:
   - Model MUST wear a blouse covering torso, chest, back, arms
   - Blouse is a STITCHED garment (has seams) - this is different from the saree
   - The saree is wrapped OVER the blouse
   - Blouse must be clearly visible as a separate garment
   - Blouse color should complement the saree

6. NO SEAMS OR STITCHING ON SAREE:
   - NO visible seams on the saree itself
   - NO zippers, NO buttons on the saree
   - Only the blouse should show stitching
   - The saree should look like a continuous piece of unstitched fabric

=== STUDY THE UPLOADED SAREE ===
- Note all patterns, colors, borders, designs
- Identify the border color and design
- Note any decorative elements (tassels, embroidery, etc.)
- Study the fabric texture and pattern
- This EXACT fabric must be used, wrapped around the model

${prompt}

=== FINAL VERIFICATION - CHECK EVERYTHING BEFORE GENERATING ===

Ask yourself these questions. If ANY answer is NO, DO NOT GENERATE THE IMAGE:

1. ✅ Will the LOWER BODY (waist to ankles) be COMPLETELY COVERED by wrapped saree fabric?
   - The fabric must wrap around the entire lower body
   - The legs must be completely covered
   - It must look like a wrapped skirt
   → If NO, DO NOT GENERATE

2. ✅ Will there be 5-7 CLEARLY VISIBLE PLEATS at the front waist?
   - The pleats must be clearly visible as vertical folds
   - They prove the fabric starts at the waist
   → If NO, DO NOT GENERATE

3. ✅ Will the fabric WRAP around the hips and legs, not hang from shoulders?
   - The fabric must wrap around the body
   - It must NOT hang from shoulders like a scarf
   → If NO, DO NOT GENERATE

4. ✅ Will the PALLU flow over the left shoulder?
   - The pallu must be draped over the left shoulder
   - It must show the border design
   → If NO, DO NOT GENERATE

5. ✅ Will the model wear a BLOUSE that's clearly visible?
   - The blouse must be visible as a separate garment
   - It covers the upper body
   → If NO, DO NOT GENERATE

6. ✅ Will the saree look like UNSTITCHED FABRIC that's been WRAPPED?
   - It must NOT look like a stitched dress
   - It must show wrapping and draping
   - NO seams, NO zippers, NO buttons on the saree
   → If NO, DO NOT GENERATE

7. ✅ Will it look like a WRAPPED SKIRT, NOT a dress or scarf?
   - Lower body must look like wrapped fabric
   - Must NOT look like a stitched garment
   - Must NOT look like fabric hanging from shoulders
   → If NO, DO NOT GENERATE

CRITICAL: If the image shows fabric hanging from shoulders like a scarf, or if the lower body looks like it's wearing a dress, the image is COMPLETELY WRONG. DO NOT GENERATE IT.

THE CORRECT OUTPUT:
- Lower body (waist to ankles): COMPLETELY COVERED by wrapped saree fabric
- Front waist: 5-7 CLEARLY VISIBLE PLEATS
- Fabric: WRAPPING around hips and legs (wrapped skirt appearance)
- Pallu: Flowing over left shoulder
- Blouse: Visible on upper body
- Overall: Professional fashion photography of a properly draped saree

=== FINAL INSTRUCTIONS - GENERATE THE IMAGE NOW ===

CONCRETE VISUAL DESCRIPTION OF WHAT TO CREATE:

Imagine a beautiful female model standing gracefully. She is wearing:
1. A BLOUSE (choli) on her upper body - a stitched top covering her torso, chest, back, and arms
2. A PETTICOAT (underskirt) on her lower body - a fitted skirt from waist to ankles
3. The SAREE FABRIC wrapped around her:

   THE LOWER BODY (FROM WAIST TO ANKLES):
   - The saree fabric is TUCKED INTO HER WAIST
   - It wraps around her ENTIRE LOWER BODY from waist to ankles
   - The fabric covers her LEGS COMPLETELY - you cannot see her legs
   - It looks like a WRAPPED SKIRT covering from waist to ankles
   - You can see the fabric wrapping around her hips and legs in layers
   - The fabric shows natural folds and drapes from the wrapping
   
   THE WAIST AREA:
   - At the front waist, there are 5-7 neat, vertical PLEATS
   - These pleats look like accordion folds
   - They are clearly visible and prove the fabric starts at the waist
   
   THE SHOULDER:
   - The PALLU (loose end) flows over her LEFT shoulder
   - It extends down, showing the border design from the uploaded saree
   
   THE OVERALL APPEARANCE:
   - The lower body looks like a WRAPPED SKIRT, NOT a dress
   - The saree looks like UNSTITCHED FABRIC that has been WRAPPED
   - The fabric does NOT hang from the shoulders like a scarf
   - Professional fashion photography style

GENERATE THE IMAGE WITH:
- The EXACT saree fabric from the uploaded image (all patterns, colors, borders)
- Properly draped in NIVI STYLE (wrapped around waist and lower body)
- Lower body COMPLETELY COVERED by wrapped fabric (waist to ankles)
- 5-7 CLEARLY VISIBLE PLEATS at the front waist
- PALLU flowing over the left shoulder with border design
- BLOUSE (choli) visible on the upper body
- Professional Indian fashion photography quality

REMEMBER: The fabric MUST wrap around the WAIST and LOWER BODY. It does NOT hang from the shoulders like a scarf. The lower body must look like a WRAPPED SKIRT, not a dress.

NOW GENERATE THE IMAGE.`
      : `IMPORTANT: First, carefully analyze the uploaded product image. Study every detail of the product - its design, colors, patterns, textures, materials, and all visual characteristics. Then generate an image where a model is wearing or using this EXACT product.

${prompt}

REMEMBER: The product in your generated image must be IDENTICAL to the product in the uploaded image. Pay close attention to all visual details and recreate them accurately.`;
    
    console.log('Generating image with enhanced prompt:', enhancedPrompt);
    console.log('Product type:', filters.productType);
    console.log('Model type:', filters.modelType);

    // For saree, add system message to reinforce instructions
    const messages = isSaree ? [
      {
        role: 'system',
        content: 'You are an expert in traditional Indian fashion photography. You specialize in generating images of sarees draped in nivi style - the most common and correct way to wear a saree. A saree is unstitched fabric that wraps around the waist and lower body, with visible pleats at the waist and a pallu over the shoulder. It does NOT hang from the shoulders like a scarf or stole. Always generate properly draped sarees with the fabric wrapping around the entire lower body from waist to ankles.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: enhancedPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: originalImageUrl
            }
          }
        ]
      }
    ] : [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: enhancedPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: originalImageUrl
            }
          }
        ]
      }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: messages,
        modalities: ['image', 'text']
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
            source: 'lovable_api'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        console.error('🚨 Lovable API returned 402 - API key may need payment or has expired');
        console.error('Error details:', errorMessage);
        return new Response(
          JSON.stringify({ 
            error: 'Lovable AI service payment required. Your Lovable API key needs to be upgraded or has reached its usage limit. Please check your Lovable account or contact support.',
            errorType: 'lovable_api_payment_required',
            source: 'lovable_api',
            details: errorMessage
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For other errors, return a generic error but include details
      return new Response(
        JSON.stringify({ 
          error: `AI generation failed: ${errorMessage}`,
          errorType: 'ai_generation_error',
          source: 'lovable_api',
          status: aiResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    let generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error('No image generated from AI');
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

