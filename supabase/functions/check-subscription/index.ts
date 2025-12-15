import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Database configuration missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    console.log("[CHECK-SUBSCRIPTION] Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    console.log("[CHECK-SUBSCRIPTION] User:", user.id);

    // Get user's couple
    const { data: couple, error: coupleError } = await supabaseClient
      .from("couples")
      .select("id, stripe_customer_id, premium_expires_at")
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .eq("is_active", true)
      .single();

    if (coupleError || !couple) {
      return new Response(JSON.stringify({ subscribed: false, reason: "no_couple" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If we have a stored customer ID, check their subscription
    if (couple.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: couple.stripe_customer_id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const expiresAt = new Date(subscription.current_period_end * 1000);

        // Update couple's premium status if needed
        if (!couple.premium_expires_at || new Date(couple.premium_expires_at) < expiresAt) {
          await supabaseClient
            .from("couples")
            .update({
              premium_expires_at: expiresAt.toISOString(),
              subscription_id: subscription.id,
            })
            .eq("id", couple.id);
        }

        console.log("[CHECK-SUBSCRIPTION] Active subscription found");
        return new Response(JSON.stringify({
          subscribed: true,
          subscription_end: expiresAt.toISOString(),
          subscription_id: subscription.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Fallback: check by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log("[CHECK-SUBSCRIPTION] No customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    
    // Store customer ID if we didn't have it
    if (!couple.stripe_customer_id) {
      await supabaseClient
        .from("couples")
        .update({ stripe_customer_id: customerId })
        .eq("id", couple.id);
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const expiresAt = new Date(subscription.current_period_end * 1000);

      await supabaseClient
        .from("couples")
        .update({
          premium_expires_at: expiresAt.toISOString(),
          subscription_id: subscription.id,
          stripe_customer_id: customerId,
        })
        .eq("id", couple.id);

      console.log("[CHECK-SUBSCRIPTION] Active subscription found via email");
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_end: expiresAt.toISOString(),
        subscription_id: subscription.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[CHECK-SUBSCRIPTION] No active subscription");
    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
