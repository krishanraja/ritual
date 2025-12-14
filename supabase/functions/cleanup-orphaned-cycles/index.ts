/**
 * FIX #5: Orphaned State Cleanup Edge Function
 * 
 * Detects and cleans up cycles where one partner has abandoned input.
 * Runs as a scheduled job or can be called manually.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (level: string, message: string, data?: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: 'cleanup-orphaned-cycles',
    message,
    ...data,
  }));
};

serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('info', 'Function invoked', { requestId });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Find cycles where one partner submitted but the other hasn't in 24+ hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: orphanedCycles, error: fetchError } = await supabaseClient
      .from('weekly_cycles')
      .select('id, couple_id, partner_one_input, partner_two_input, partner_one_submitted_at, partner_two_submitted_at, created_at')
      .or('partner_one_submitted_at.lt.' + twentyFourHoursAgo + ',partner_two_submitted_at.lt.' + twentyFourHoursAgo)
      .is('synthesized_output', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!orphanedCycles || orphanedCycles.length === 0) {
      log('info', 'No orphaned cycles found', { requestId });
      return new Response(
        JSON.stringify({ cleaned: 0, message: 'No orphaned cycles found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'Found orphaned cycles', { requestId, count: orphanedCycles.length });

    let cleaned = 0;
    const cleanedCycleIds: string[] = [];

    for (const cycle of orphanedCycles) {
      // Check if only one partner submitted
      const hasPartnerOne = !!cycle.partner_one_input;
      const hasPartnerTwo = !!cycle.partner_two_input;
      const onlyOneSubmitted = (hasPartnerOne && !hasPartnerTwo) || (!hasPartnerOne && hasPartnerTwo);

      if (!onlyOneSubmitted) continue;

      // Check if submission is older than 24 hours
      const submittedAt = hasPartnerOne ? cycle.partner_one_submitted_at : cycle.partner_two_submitted_at;
      if (!submittedAt) continue;

      const submittedDate = new Date(submittedAt);
      const hoursSinceSubmission = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceSubmission < 24) continue;

      // Mark as abandoned by clearing the submitted input
      // This allows the cycle to be reused for a new week
      const updateField = hasPartnerOne ? 'partner_one_input' : 'partner_two_input';
      const submittedField = hasPartnerOne ? 'partner_one_submitted_at' : 'partner_two_submitted_at';

      const { error: updateError } = await supabaseClient
        .from('weekly_cycles')
        .update({
          [updateField]: null,
          [submittedField]: null,
        })
        .eq('id', cycle.id);

      if (updateError) {
        log('error', 'Failed to clean cycle', { requestId, cycleId: cycle.id, error: updateError.message });
        continue;
      }

      cleaned++;
      cleanedCycleIds.push(cycle.id);
      log('info', 'Cleaned orphaned cycle', { requestId, cycleId: cycle.id, hoursSinceSubmission: Math.round(hoursSinceSubmission) });
    }

    log('info', 'Cleanup complete', { requestId, cleaned, total: orphanedCycles.length });

    return new Response(
      JSON.stringify({ 
        cleaned,
        total: orphanedCycles.length,
        cycleIds: cleanedCycleIds,
        message: `Cleaned ${cleaned} orphaned cycles`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    log('error', 'Function failed', { requestId, error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
