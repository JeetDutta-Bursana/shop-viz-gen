import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0");

      if (userId && credits > 0) {
        console.log(`Adding ${credits} credits to user ${userId}`);

        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error("Error fetching profile:", fetchError);
          throw fetchError;
        }

        const currentCredits = profile?.credits || 0;
        const newCredits = currentCredits + credits;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ credits: newCredits })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating credits:", updateError);
          throw updateError;
        }

        console.log(`Successfully updated credits for user ${userId}: ${currentCredits} -> ${newCredits}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
