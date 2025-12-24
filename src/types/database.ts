import { Tables } from '@/integrations/supabase/types';

// Type aliases for better readability
export type Couple = Tables<'couples'>;
export type Profile = Tables<'profiles'>;
export type WeeklyCycle = Tables<'weekly_cycles'>;

// Partial profile type for security - only exposes safe fields to partners
export type PartnerProfile = Pick<Profile, 'id' | 'name'>;
export type RitualPreference = Tables<'ritual_preferences'>;
export type Completion = Tables<'completions'>;
export type RitualStreak = Tables<'ritual_streaks'>;
export type RitualMemory = Tables<'ritual_memories'>;
export type RitualFeedback = Tables<'ritual_feedback'>;
export type RitualSuggestion = Tables<'ritual_suggestions'>;
export type RitualLibrary = Tables<'ritual_library'>;

// ============================================================================
// CYCLE STATE MACHINE - Explicit states for two-partner flow
// ============================================================================

/**
 * Derived cycle state based on weekly_cycles data.
 * This provides a single source of truth for the UI to render.
 */
export type CycleState = 
  | 'no_cycle'           // No weekly cycle exists yet
  | 'waiting_for_self'   // Current user hasn't submitted input
  | 'waiting_for_partner' // Current user submitted, partner hasn't
  | 'both_complete'      // Both submitted, synthesis not started
  | 'generating'         // Synthesis in progress (generated_at set, no output yet)
  | 'ready'              // Rituals generated, ready to pick
  | 'picking'            // Both partners need to rank rituals
  | 'agreed'             // Agreement reached, ritual scheduled
  | 'failed';            // Synthesis failed (timeout or error)

/**
 * Derives the current cycle state from a WeeklyCycle and user context.
 * This is the canonical state derivation logic used across all components.
 */
export function deriveCycleState(
  cycle: WeeklyCycle | null,
  userId: string | undefined,
  isPartnerOne: boolean
): CycleState {
  const logData = {
    location: 'database.ts:41',
    message: 'deriveCycleState called',
    data: {
      hasCycle: !!cycle,
      hasUserId: !!userId,
      cycleId: cycle?.id,
      userId,
      isPartnerOne,
      cycleData: cycle ? JSON.stringify(cycle) : null
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'H3'
  };
  
  console.log('[DEBUG] deriveCycleState called:', logData);
  
  // #region agent log
  fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  // #endregion
  
  if (!cycle || !userId) {
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:46',message:'deriveCycleState: no cycle or userId',data:{hasCycle:!!cycle,hasUserId:!!userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return 'no_cycle';
  }

  const userInput = isPartnerOne ? cycle.partner_one_input : cycle.partner_two_input;
  const partnerInput = isPartnerOne ? cycle.partner_two_input : cycle.partner_one_input;
  const hasOutput = !!cycle.synthesized_output;
  const hasAgreed = cycle.agreement_reached && cycle.agreed_ritual;
  
  // #region agent log
  const outputData = cycle.synthesized_output as any;
  fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:52',message:'deriveCycleState: Inputs checked',data:{cycleId:cycle.id,hasUserInput:!!userInput,hasPartnerInput:!!partnerInput,hasOutput,hasAgreed,generatedAt:cycle.generated_at,userInputType:typeof userInput,partnerInputType:typeof partnerInput,ritualCount:outputData?.rituals?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  // Check for agreed state first
  if (hasAgreed) {
    return 'agreed';
  }

  // Check if rituals are ready
  if (hasOutput) {
    // #region agent log
    const outputDataForLog = cycle.synthesized_output as any;
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:61',message:'deriveCycleState returning ready',data:{cycleId:cycle?.id,hasOutput:true,outputType:typeof cycle?.synthesized_output,ritualCount:outputDataForLog?.rituals?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return 'ready';
  }

  // Check if both partners have submitted
  if (userInput && partnerInput) {
    // Both submitted but no output yet
    // Check if synthesis seems stuck (generated_at set but no output after timeout)
    if (cycle.generated_at) {
      const generatedTime = new Date(cycle.generated_at).getTime();
      const timeSinceGenerated = Date.now() - generatedTime;
      // If more than 2 minutes since generation started, consider it failed
      if (timeSinceGenerated > 120000) {
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:76',message:'deriveCycleState: Returning failed (timeout)',data:{timeSinceGenerated,generatedAt:cycle.generated_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        return 'failed';
      }
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:79',message:'deriveCycleState: Returning generating',data:{generatedAt:cycle.generated_at,timeSinceGenerated:Date.now() - new Date(cycle.generated_at).getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return 'generating';
    }
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:81',message:'deriveCycleState: Returning both_complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return 'both_complete';
  }

  // Check individual submission states
  if (!userInput) {
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:85',message:'deriveCycleState: Returning waiting_for_self',data:{hasUserInput:!!userInput,hasPartnerInput:!!partnerInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return 'waiting_for_self';
  }

  // #region agent log
  fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:89',message:'deriveCycleState: Returning waiting_for_partner',data:{hasUserInput:!!userInput,hasPartnerInput:!!partnerInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  return 'waiting_for_partner';
}

/**
 * Check if a synthesis retry is allowed based on the cycle state.
 */
export function canRetrySynthesis(cycle: WeeklyCycle | null): boolean {
  if (!cycle) return false;
  
  const hasInput = cycle.partner_one_input && cycle.partner_two_input;
  const hasOutput = !!cycle.synthesized_output;
  
  // Can retry if both inputs exist but no output
  return hasInput && !hasOutput;
}

// Extended types with relationships
export interface CoupleWithProfiles extends Couple {
  partner_one_profile?: Profile;
  partner_two_profile?: Profile;
}

export interface WeeklyCycleWithData extends WeeklyCycle {
  couple?: Couple;
  preferences?: RitualPreference[];
  completions?: Completion[];
}
