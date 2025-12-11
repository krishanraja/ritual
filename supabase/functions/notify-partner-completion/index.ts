/**
 * notify-partner-completion Edge Function
 * 
 * Sends a push notification to a user's partner when they complete a ritual.
 * Called from the client after ritual completion.
 * 
 * @created 2025-12-11
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (level: string, message: string, data?: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: 'notify-partner-completion',
    message,
    ...data,
  }));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  log('info', 'Function invoked', { requestId });

  try {
    // Initialize Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { coupleId, ritualTitle, memoryId } = await req.json();

    if (!coupleId || !ritualTitle) {
      throw new Error("Missing required fields: coupleId, ritualTitle");
    }

    log('info', 'Processing notification', { requestId, coupleId, ritualTitle });

    // Get couple data to find partner
    const { data: couple, error: coupleError } = await supabaseClient
      .from("couples")
      .select("partner_one, partner_two")
      .eq("id", coupleId)
      .single();

    if (coupleError || !couple) {
      throw new Error("Couple not found");
    }

    // Determine partner's user ID
    const partnerId = couple.partner_one === user.id 
      ? couple.partner_two 
      : couple.partner_one;

    if (!partnerId) {
      log('info', 'No partner to notify', { requestId });
      return new Response(
        JSON.stringify({ success: true, message: "No partner to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current user's name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "Your partner";

    // Call send-push function
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    if (!internalSecret) {
      log('warn', 'INTERNAL_FUNCTION_SECRET not configured', { requestId });
      // Continue without push notification
      return new Response(
        JSON.stringify({ success: true, message: "Completion recorded, notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pushResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": internalSecret,
        },
        body: JSON.stringify({
          user_id: partnerId,
          title: "Ritual Complete! 💕",
          body: `${userName} completed "${ritualTitle}" - tap to see!`,
          url: memoryId ? `/memories#${memoryId}` : "/memories",
          type: "completion",
        }),
      }
    );

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text();
      log('warn', 'Push notification failed', { requestId, error: errorText });
    } else {
      log('info', 'Push notification sent', { requestId, partnerId });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Partner notified" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log('error', 'Function failed', { requestId, error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
