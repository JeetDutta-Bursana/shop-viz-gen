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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Check for Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData?.user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const user = userData.user;
    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "User email not available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { amount, credits, currency = "INR" } = await req.json();
    if (!amount || !credits) {
      return new Response(
        JSON.stringify({ error: "Amount and credits are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Stripe API credentials
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!STRIPE_SECRET_KEY) {
      console.error("Stripe secret key missing");
      return new Response(
        JSON.stringify({ 
          error: "Stripe credentials not configured. Please set STRIPE_SECRET_KEY in Supabase Edge Function secrets." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Convert amount to smallest currency unit (paise for INR, cents for USD)
    // For INR: 1 rupee = 100 paise, so multiply by 100
    // For USD: 1 dollar = 100 cents, so multiply by 100
    // For JPY and other zero-decimal currencies, don't multiply
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND', 'XAF', 'XOF', 'BIF', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'VUV', 'XPF'];
    const amountInSmallestUnit = zeroDecimalCurrencies.includes(currency.toUpperCase()) 
      ? Math.round(amount) 
      : Math.round(amount * 100);

    // Create success and cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:8080";
    const successUrl = `${origin}/pricing?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?payment=canceled`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${credits} Credits Package`,
              description: `Purchase ${credits} credits for AI Product Studio`,
            },
            unit_amount: amountInSmallestUnit,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email || undefined,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        email: user.email || "",
      },
    });

    // Return session ID for Stripe Checkout
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Payment creation error:", error);
    const errorMessage = error?.message || "An unexpected error occurred while creating payment";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
