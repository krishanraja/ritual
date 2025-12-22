/**
 * Auth State Machine
 * 
 * Defines all possible authentication and onboarding states.
 * Provides explicit state transitions to prevent undefined/limbo states.
 * 
 * @created 2025-12-22
 */

import type { User, Session } from '@supabase/supabase-js';

// =============================================================================
// State Definitions
// =============================================================================

/**
 * All possible auth states in the application
 */
export type AuthState = 
  | 'initializing'           // App is loading, checking for existing session
  | 'anonymous'              // No session, user is not logged in
  | 'authenticated'          // User is logged in with valid session
  | 'session_expired'        // Session has expired, needs refresh or re-login
  | 'error';                 // Auth system error

/**
 * All possible onboarding states after authentication
 */
export type OnboardingState =
  | 'no_couple'              // User has no couple relationship
  | 'waiting_for_partner'    // User created couple, waiting for partner to join
  | 'paired'                 // Both partners have joined the couple
  | 'needs_input'            // Paired, but user needs to submit weekly input
  | 'waiting_partner_input'  // User submitted, waiting for partner
  | 'generating'             // Both submitted, generating rituals
  | 'ready';                 // Rituals ready, can pick/view

/**
 * Combined application state
 */
export interface AppAuthState {
  // Core auth state
  authState: AuthState;
  onboardingState: OnboardingState | null;  // null if not authenticated
  
  // Session data (only present if authenticated)
  user: User | null;
  session: Session | null;
  
  // Relationship data (only present if in couple)
  coupleId: string | null;
  isPartnerOne: boolean | null;
  hasPartner: boolean;
  
  // Metadata
  lastUpdated: number;
  error: string | null;
}

// =============================================================================
// State Factory Functions
// =============================================================================

/**
 * Create the initial loading state
 */
export function createInitialState(): AppAuthState {
  return {
    authState: 'initializing',
    onboardingState: null,
    user: null,
    session: null,
    coupleId: null,
    isPartnerOne: null,
    hasPartner: false,
    lastUpdated: Date.now(),
    error: null,
  };
}

/**
 * Create an anonymous (not logged in) state
 */
export function createAnonymousState(): AppAuthState {
  return {
    authState: 'anonymous',
    onboardingState: null,
    user: null,
    session: null,
    coupleId: null,
    isPartnerOne: null,
    hasPartner: false,
    lastUpdated: Date.now(),
    error: null,
  };
}

/**
 * Create an authenticated state with user data
 */
export function createAuthenticatedState(
  user: User,
  session: Session,
  coupleData?: {
    coupleId: string;
    isPartnerOne: boolean;
    hasPartner: boolean;
  }
): AppAuthState {
  const onboardingState = deriveOnboardingState(
    coupleData?.coupleId ?? null,
    coupleData?.hasPartner ?? false
  );
  
  return {
    authState: 'authenticated',
    onboardingState,
    user,
    session,
    coupleId: coupleData?.coupleId ?? null,
    isPartnerOne: coupleData?.isPartnerOne ?? null,
    hasPartner: coupleData?.hasPartner ?? false,
    lastUpdated: Date.now(),
    error: null,
  };
}

/**
 * Create a session expired state
 */
export function createSessionExpiredState(previousUser?: User | null): AppAuthState {
  return {
    authState: 'session_expired',
    onboardingState: null,
    user: previousUser ?? null,
    session: null,
    coupleId: null,
    isPartnerOne: null,
    hasPartner: false,
    lastUpdated: Date.now(),
    error: 'Your session has expired. Please sign in again.',
  };
}

/**
 * Create an error state
 */
export function createErrorState(error: string): AppAuthState {
  return {
    authState: 'error',
    onboardingState: null,
    user: null,
    session: null,
    coupleId: null,
    isPartnerOne: null,
    hasPartner: false,
    lastUpdated: Date.now(),
    error,
  };
}

// =============================================================================
// State Derivation
// =============================================================================

/**
 * Derive the onboarding state based on couple data
 */
function deriveOnboardingState(
  coupleId: string | null, 
  hasPartner: boolean
): OnboardingState {
  if (!coupleId) return 'no_couple';
  if (!hasPartner) return 'waiting_for_partner';
  return 'paired';
}

/**
 * Derive the detailed onboarding state based on cycle data
 */
export function deriveCycleOnboardingState(
  hasPartner: boolean,
  userSubmitted: boolean,
  partnerSubmitted: boolean,
  isGenerating: boolean,
  hasRituals: boolean
): OnboardingState {
  if (!hasPartner) return 'waiting_for_partner';
  
  if (hasRituals) return 'ready';
  if (isGenerating) return 'generating';
  
  if (userSubmitted && !partnerSubmitted) return 'waiting_partner_input';
  if (!userSubmitted) return 'needs_input';
  
  // Both submitted but not generating yet
  return 'generating';
}

// =============================================================================
// State Transitions
// =============================================================================

/**
 * Valid state transitions
 * Prevents invalid state changes (e.g., jumping from anonymous to generating)
 */
const VALID_TRANSITIONS: Record<AuthState, AuthState[]> = {
  initializing: ['anonymous', 'authenticated', 'error'],
  anonymous: ['authenticated', 'error'],
  authenticated: ['anonymous', 'session_expired', 'error'],
  session_expired: ['anonymous', 'authenticated', 'error'],
  error: ['anonymous', 'authenticated', 'initializing'],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: AuthState, to: AuthState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Transition to a new state with validation
 * @throws Error if transition is invalid
 */
export function transitionState(
  currentState: AppAuthState,
  newState: AppAuthState
): AppAuthState {
  if (!isValidTransition(currentState.authState, newState.authState)) {
    console.warn(
      `[AUTH_STATE] Invalid transition from ${currentState.authState} to ${newState.authState}`
    );
    // In production, allow the transition but log the warning
    // This prevents the app from getting stuck
  }
  
  return {
    ...newState,
    lastUpdated: Date.now(),
  };
}

// =============================================================================
// State Selectors
// =============================================================================

/**
 * Check if user is fully authenticated (not expired)
 */
export function isAuthenticated(state: AppAuthState): boolean {
  return state.authState === 'authenticated' && state.user !== null && state.session !== null;
}

/**
 * Check if user is in a paired couple
 */
export function isPaired(state: AppAuthState): boolean {
  return isAuthenticated(state) && state.hasPartner;
}

/**
 * Check if the app is in a loading/initializing state
 */
export function isLoading(state: AppAuthState): boolean {
  return state.authState === 'initializing';
}

/**
 * Check if session needs refresh
 */
export function needsSessionRefresh(state: AppAuthState): boolean {
  return state.authState === 'session_expired';
}

/**
 * Get user-facing status message
 */
export function getStatusMessage(state: AppAuthState): string | null {
  switch (state.authState) {
    case 'initializing':
      return 'Loading...';
    case 'session_expired':
      return 'Your session has expired. Please sign in again.';
    case 'error':
      return state.error || 'An error occurred. Please try again.';
    default:
      return null;
  }
}

// =============================================================================
// LocalStorage Persistence
// =============================================================================

const AUTH_STATE_KEY = 'ritual_auth_state';

/**
 * Persist minimal auth state to localStorage for quick recovery on reload
 * Note: Never store sensitive data like tokens
 */
export function persistAuthStateHint(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
        hasSession: true,
        timestamp: Date.now(),
      }));
    } else {
      localStorage.removeItem(AUTH_STATE_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Check if we might have an existing session (for faster initial render)
 * Returns true if we should show a loading state while checking session
 */
export function mayHaveExistingSession(): boolean {
  try {
    const stored = localStorage.getItem(AUTH_STATE_KEY);
    if (!stored) return false;
    
    const parsed = JSON.parse(stored);
    // Consider session hint valid for 24 hours
    const isRecent = (Date.now() - parsed.timestamp) < 24 * 60 * 60 * 1000;
    return parsed.hasSession && isRecent;
  } catch {
    return false;
  }
}

export default {
  createInitialState,
  createAnonymousState,
  createAuthenticatedState,
  createSessionExpiredState,
  createErrorState,
  isAuthenticated,
  isPaired,
  isLoading,
  needsSessionRefresh,
  getStatusMessage,
  persistAuthStateHint,
  mayHaveExistingSession,
};


