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
  if (!cycle || !userId) {
    return 'no_cycle';
  }

  const userInput = isPartnerOne ? cycle.partner_one_input : cycle.partner_two_input;
  const partnerInput = isPartnerOne ? cycle.partner_two_input : cycle.partner_one_input;
  const hasOutput = !!cycle.synthesized_output;
  const hasAgreed = cycle.agreement_reached && cycle.agreed_ritual;

  // Check for agreed state first
  if (hasAgreed) {
    return 'agreed';
  }

  // Check if rituals are ready
  if (hasOutput) {
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
        return 'failed';
      }
      return 'generating';
    }
    return 'both_complete';
  }

  // Check individual submission states
  if (!userInput) {
    return 'waiting_for_self';
  }

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
