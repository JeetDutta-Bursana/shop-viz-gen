import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signature) {
      console.error("Stripe signature missing");
      return new Response(JSON.stringify({ error: "Signature missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Stripe
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Stripe secret key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      // Stripe SDK for Deno accepts string body for webhook verification
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        console.error("Missing metadata in session");
        return new Response(JSON.stringify({ error: "Invalid session data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = metadata.user_id;
      const credits = parseInt(metadata.credits || "0");

      if (!userId || credits <= 0) {
        console.error("Missing user_id or credits in session metadata");
        return new Response(JSON.stringify({ error: "Invalid payment data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Processing payment for user ${userId}: ${credits} credits`);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Fetch user profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("credits, free_credits_remaining")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        throw fetchError;
      }

      // Update credits (purchased credits don't affect free_credits_remaining)
      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits + credits;
      // Keep free_credits_remaining unchanged when purchasing credits
      const freeCreditsRemaining = profile?.free_credits_remaining ?? 0;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          credits: newCredits,
          free_credits_remaining: freeCreditsRemaining // Preserve free credits
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        throw updateError;
      }

      console.log(
        `Successfully updated credits for user ${userId}: ${currentCredits} -> ${newCredits} (free credits remaining: ${freeCreditsRemaining})`
      );
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

