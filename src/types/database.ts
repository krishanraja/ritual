/**
 * Database Types
 * 
 * Core type definitions for the Ritual app.
 * Updated with explicit cycle_status enum and flow types.
 * 
 * @updated 2025-12-26 - Complete rewrite for bulletproof multiplayer flow
 */

import { Tables } from '@/integrations/supabase/types';

// ============================================================================
// BASE TYPES (from Supabase schema)
// ============================================================================

export type Couple = Tables<'couples'>;
export type Profile = Tables<'profiles'>;
export type WeeklyCycle = Tables<'weekly_cycles'>;
export type RitualPreference = Tables<'ritual_preferences'>;
export type Completion = Tables<'completions'>;
export type RitualStreak = Tables<'ritual_streaks'>;
export type RitualMemory = Tables<'ritual_memories'>;
export type RitualFeedback = Tables<'ritual_feedback'>;
export type RitualSuggestion = Tables<'ritual_suggestions'>;
export type RitualLibrary = Tables<'ritual_library'>;

// Partial profile type for security - only exposes safe fields to partners
export type PartnerProfile = Pick<Profile, 'id' | 'name'>;

// ============================================================================
// CYCLE STATUS - Explicit state machine
// ============================================================================

/**
 * Cycle status enum - matches database enum.
 * This is the single source of truth for cycle state.
 */
export type CycleStatus =
  | 'awaiting_both_input'
  | 'awaiting_partner_one'
  | 'awaiting_partner_two'
  | 'generating'
  | 'generation_failed'
  | 'awaiting_both_picks'
  | 'awaiting_partner_one_pick'
  | 'awaiting_partner_two_pick'
  | 'awaiting_agreement'
  | 'agreed'
  | 'completed';

// ============================================================================
// AVAILABILITY TYPES
// ============================================================================

/** Time slots for the availability grid */
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

/** Availability slot record from database */
export interface AvailabilitySlot {
  id: string;
  weekly_cycle_id: string;
  user_id: string;
  day_offset: number; // 0-6, where 0 is today
  time_slot: TimeSlot;
  created_at: string;
}

// ============================================================================
// RITUAL TYPES
// ============================================================================

/** Ritual from synthesis */
export interface Ritual {
  id?: string | number;
  title: string;
  description: string;
  time_estimate: string;
  budget_band: string;
  category?: string;
  why?: string;
  surprise_factor?: number;
}

/** User input data stored in weekly_cycles */
export interface RitualInput {
  cards: string[];
  desire: string | null;
  inputType: 'cards';
}

/** Synthesized output from AI */
export interface SynthesizedOutput {
  rituals: Ritual[];
  generated_at?: string;
}

// ============================================================================
// FLOW TYPES
// ============================================================================

/**
 * Flow phase - computed from status + user progress.
 * Used by UI to determine which component to render.
 */
export type FlowPhase = 
  | 'input'      // User needs to submit input
  | 'waiting'    // User done, waiting for partner
  | 'generating' // AI synthesis in progress
  | 'pick'       // User needs to pick rituals + availability
  | 'match'      // Both picked, showing results
  | 'confirmed'; // Ritual agreed

/** User's progress in the flow */
export interface UserProgress {
  inputDone: boolean;
  inputData: RitualInput | null;
  picksDone: boolean;
  picks: RitualPreference[];
  availabilityDone: boolean;
  availability: AvailabilitySlot[];
}

/** Match result computed from both partners' picks */
export interface MatchResult {
  matchedRitual: Ritual | null;
  matchedSlot: { dayOffset: number; timeSlot: TimeSlot } | null;
  hasTimeConflict: boolean;
  rankings: Array<{
    ritual: Ritual;
    myRank: number | null;
    partnerRank: number | null;
    combinedScore: number;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compute the current flow phase from cycle status and user progress.
 * This determines which UI component to show.
 */
export function computeFlowPhase(
  status: CycleStatus,
  isPartnerOne: boolean,
  myProgress: UserProgress
): FlowPhase {
  switch (status) {
    case 'awaiting_both_input':
      return 'input';
    
    case 'awaiting_partner_one':
      return isPartnerOne ? 'input' : 'waiting';
    
    case 'awaiting_partner_two':
      return isPartnerOne ? 'waiting' : 'input';
    
    case 'generating':
    case 'generation_failed':
      return 'generating';
    
    case 'awaiting_both_picks':
      return 'pick';
    
    case 'awaiting_partner_one_pick':
      return isPartnerOne ? 'pick' : 'waiting';
    
    case 'awaiting_partner_two_pick':
      return isPartnerOne ? 'waiting' : 'pick';
    
    case 'awaiting_agreement':
      return 'match';
    
    case 'agreed':
    case 'completed':
      return 'confirmed';
    
    default:
      return 'input';
  }
}

/**
 * Get status message for display in UI.
 */
export function getStatusMessage(
  status: CycleStatus,
  partnerName: string,
  isPartnerOne: boolean
): { title: string; subtitle: string } {
  switch (status) {
    case 'awaiting_both_input':
      return {
        title: 'Ready for this week?',
        subtitle: 'Share your mood to get personalized rituals'
      };
    
    case 'awaiting_partner_one':
      return isPartnerOne
        ? { title: 'Your turn!', subtitle: `${partnerName} is waiting for you` }
        : { title: `Waiting for ${partnerName}`, subtitle: "You'll be notified when they're done" };
    
    case 'awaiting_partner_two':
      return isPartnerOne
        ? { title: `Waiting for ${partnerName}`, subtitle: "You'll be notified when they're done" }
        : { title: 'Your turn!', subtitle: `${partnerName} is waiting for you` };
    
    case 'generating':
      return {
        title: 'Creating rituals...',
        subtitle: 'This usually takes 15-20 seconds'
      };
    
    case 'generation_failed':
      return {
        title: 'Something went wrong',
        subtitle: 'Tap to try again'
      };
    
    case 'awaiting_both_picks':
      return {
        title: 'Rituals ready!',
        subtitle: 'Pick your top 3 and select when you\'re free'
      };
    
    case 'awaiting_partner_one_pick':
      return isPartnerOne
        ? { title: 'Your turn to pick!', subtitle: `${partnerName} has made their selections` }
        : { title: `Waiting for ${partnerName}`, subtitle: 'They\'re choosing their favorites...' };
    
    case 'awaiting_partner_two_pick':
      return isPartnerOne
        ? { title: `Waiting for ${partnerName}`, subtitle: 'They\'re choosing their favorites...' }
        : { title: 'Your turn to pick!', subtitle: `${partnerName} has made their selections` };
    
    case 'awaiting_agreement':
      return {
        title: 'Great Minds! ✨',
        subtitle: 'You both have rituals in common'
      };
    
    case 'agreed':
      return {
        title: "It's Locked In! 🎉",
        subtitle: 'Your ritual is confirmed'
      };
    
    case 'completed':
      return {
        title: 'Ritual complete!',
        subtitle: 'How did it go?'
      };
    
    default:
      return {
        title: 'Loading...',
        subtitle: ''
      };
  }
}

/**
 * Compute match from both partners' picks and availability.
 * Returns the best matched ritual and time slot.
 */
export function computeMatch(
  myPicks: RitualPreference[],
  partnerPicks: RitualPreference[],
  mySlots: AvailabilitySlot[],
  partnerSlots: AvailabilitySlot[],
  rituals: Ritual[]
): MatchResult {
  // Build ritual score map (lower is better)
  const ritualScores = new Map<string, { myRank: number | null; partnerRank: number | null }>();
  
  // Initialize with all rituals
  for (const ritual of rituals) {
    ritualScores.set(ritual.title, { myRank: null, partnerRank: null });
  }
  
  // Add my picks
  for (const pick of myPicks) {
    const existing = ritualScores.get(pick.ritual_title);
    if (existing) {
      existing.myRank = pick.rank;
    }
  }
  
  // Add partner picks
  for (const pick of partnerPicks) {
    const existing = ritualScores.get(pick.ritual_title);
    if (existing) {
      existing.partnerRank = pick.rank;
    }
  }
  
  // Compute rankings - only include rituals that at least one person picked
  const rankings = [...ritualScores.entries()]
    .map(([title, scores]) => {
      const ritual = rituals.find(r => r.title === title);
      if (!ritual) return null;
      const combinedScore = (scores.myRank || 999) + (scores.partnerRank || 999);
      return {
        ritual,
        myRank: scores.myRank,
        partnerRank: scores.partnerRank,
        combinedScore
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && (r.myRank !== null || r.partnerRank !== null))
    .sort((a, b) => a.combinedScore - b.combinedScore);
  
  // Best matched ritual is the one with lowest combined score where both picked
  const matchedRitual = rankings.find(r => r.myRank !== null && r.partnerRank !== null)?.ritual || 
                        rankings[0]?.ritual || null;
  
  // Find time overlap
  const mySlotKeys = new Set(mySlots.map(s => `${s.day_offset}-${s.time_slot}`));
  const overlapping = partnerSlots.filter(s => 
    mySlotKeys.has(`${s.day_offset}-${s.time_slot}`)
  );
  
  // Sort by day then time (morning=0, afternoon=1, evening=2)
  const slotOrder: Record<TimeSlot, number> = { morning: 0, afternoon: 1, evening: 2 };
  const sortedSlots = overlapping.sort((a, b) => {
    if (a.day_offset !== b.day_offset) return a.day_offset - b.day_offset;
    return slotOrder[a.time_slot as TimeSlot] - slotOrder[b.time_slot as TimeSlot];
  });
  
  const matchedSlot = sortedSlots[0] 
    ? { dayOffset: sortedSlots[0].day_offset, timeSlot: sortedSlots[0].time_slot as TimeSlot }
    : null;
  
  return {
    matchedRitual,
    matchedSlot,
    hasTimeConflict: overlapping.length === 0 && mySlots.length > 0 && partnerSlots.length > 0,
    rankings
  };
}

/**
 * Convert day offset to actual date.
 */
export function dayOffsetToDate(dayOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date;
}

/**
 * Get time range for a slot.
 */
export function getSlotTimeRange(slot: TimeSlot): { start: string; end: string } {
  switch (slot) {
    case 'morning':
      return { start: '08:00', end: '12:00' };
    case 'afternoon':
      return { start: '12:00', end: '17:00' };
    case 'evening':
      return { start: '17:00', end: '22:00' };
  }
}

/**
 * Get display name for a time slot.
 */
export function getSlotDisplayName(slot: TimeSlot): string {
  switch (slot) {
    case 'morning':
      return 'Morning (8am-12pm)';
    case 'afternoon':
      return 'Afternoon (12pm-5pm)';
    case 'evening':
      return 'Evening (5pm-10pm)';
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy cycle state type - kept for backwards compatibility.
 * @deprecated Use CycleStatus and computeFlowPhase instead.
 */
export type CycleState = 
  | 'no_cycle'
  | 'waiting_for_self'
  | 'waiting_for_partner'
  | 'both_complete'
  | 'generating'
  | 'ready'
  | 'picking_self'
  | 'picking_partner'
  | 'resolving'
  | 'pending_confirmation'
  | 'agreed'
  | 'failed';

/**
 * Legacy state derivation function - kept for backwards compatibility.
 * @deprecated Use CycleStatus from DB directly with computeFlowPhase.
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

  if (hasAgreed) {
    return 'agreed';
  }

  if (hasOutput) {
    return 'ready';
  }

  if (userInput && partnerInput) {
    if (cycle.generated_at) {
      const generatedTime = new Date(cycle.generated_at).getTime();
      const timeSinceGenerated = Date.now() - generatedTime;
      if (timeSinceGenerated > 120000) {
        return 'failed';
      }
      return 'generating';
    }
    return 'both_complete';
  }

  if (!userInput) {
    return 'waiting_for_self';
  }

  return 'waiting_for_partner';
}

/**
 * Check if synthesis retry is allowed.
 */
export function canRetrySynthesis(cycle: WeeklyCycle | null): boolean {
  if (!cycle) return false;
  const hasInput = cycle.partner_one_input && cycle.partner_two_input;
  const hasOutput = !!cycle.synthesized_output;
  return hasInput && !hasOutput;
}

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export interface CoupleWithProfiles extends Couple {
  partner_one_profile?: Profile;
  partner_two_profile?: Profile;
}

export interface WeeklyCycleWithData extends WeeklyCycle {
  couple?: Couple;
  preferences?: RitualPreference[];
  completions?: Completion[];
}
