/**
 * Unit tests for auth state machine
 * 
 * Tests the state transitions and selectors.
 * 
 * Run with: npx vitest run src/__tests__/authState.test.ts
 * 
 * @created 2025-12-22
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState,
  createAnonymousState,
  createAuthenticatedState,
  createSessionExpiredState,
  createErrorState,
  isAuthenticated,
  isPaired,
  isLoading,
  needsSessionRefresh,
  isValidTransition,
  getStatusMessage,
  deriveCycleOnboardingState,
  type AppAuthState,
} from '../lib/authState';
import type { User, Session } from '@supabase/supabase-js';

// Mock user and session
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
};

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
};

describe('State Factory Functions', () => {
  describe('createInitialState', () => {
    it('creates a loading state', () => {
      const state = createInitialState();
      expect(state.authState).toBe('initializing');
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('createAnonymousState', () => {
    it('creates an anonymous state', () => {
      const state = createAnonymousState();
      expect(state.authState).toBe('anonymous');
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.onboardingState).toBeNull();
    });
  });

  describe('createAuthenticatedState', () => {
    it('creates authenticated state with user and session', () => {
      const state = createAuthenticatedState(mockUser, mockSession);
      expect(state.authState).toBe('authenticated');
      expect(state.user).toBe(mockUser);
      expect(state.session).toBe(mockSession);
      expect(state.error).toBeNull();
    });

    it('includes couple data when provided', () => {
      const state = createAuthenticatedState(mockUser, mockSession, {
        coupleId: 'couple-123',
        isPartnerOne: true,
        hasPartner: true,
      });
      expect(state.coupleId).toBe('couple-123');
      expect(state.isPartnerOne).toBe(true);
      expect(state.hasPartner).toBe(true);
    });

    it('derives onboarding state as "no_couple" when no couple data', () => {
      const state = createAuthenticatedState(mockUser, mockSession);
      expect(state.onboardingState).toBe('no_couple');
    });

    it('derives onboarding state as "waiting_for_partner" when couple but no partner', () => {
      const state = createAuthenticatedState(mockUser, mockSession, {
        coupleId: 'couple-123',
        isPartnerOne: true,
        hasPartner: false,
      });
      expect(state.onboardingState).toBe('waiting_for_partner');
    });

    it('derives onboarding state as "paired" when couple with partner', () => {
      const state = createAuthenticatedState(mockUser, mockSession, {
        coupleId: 'couple-123',
        isPartnerOne: true,
        hasPartner: true,
      });
      expect(state.onboardingState).toBe('paired');
    });
  });

  describe('createSessionExpiredState', () => {
    it('creates session expired state', () => {
      const state = createSessionExpiredState(mockUser);
      expect(state.authState).toBe('session_expired');
      expect(state.user).toBe(mockUser);
      expect(state.session).toBeNull();
      expect(state.error).toContain('session has expired');
    });
  });

  describe('createErrorState', () => {
    it('creates error state with message', () => {
      const state = createErrorState('Test error message');
      expect(state.authState).toBe('error');
      expect(state.error).toBe('Test error message');
      expect(state.user).toBeNull();
    });
  });
});

describe('State Selectors', () => {
  describe('isAuthenticated', () => {
    it('returns true for authenticated state with user and session', () => {
      const state = createAuthenticatedState(mockUser, mockSession);
      expect(isAuthenticated(state)).toBe(true);
    });

    it('returns false for anonymous state', () => {
      const state = createAnonymousState();
      expect(isAuthenticated(state)).toBe(false);
    });

    it('returns false for expired session state', () => {
      const state = createSessionExpiredState(mockUser);
      expect(isAuthenticated(state)).toBe(false);
    });
  });

  describe('isPaired', () => {
    it('returns true for authenticated state with partner', () => {
      const state = createAuthenticatedState(mockUser, mockSession, {
        coupleId: 'couple-123',
        isPartnerOne: true,
        hasPartner: true,
      });
      expect(isPaired(state)).toBe(true);
    });

    it('returns false for authenticated state without partner', () => {
      const state = createAuthenticatedState(mockUser, mockSession, {
        coupleId: 'couple-123',
        isPartnerOne: true,
        hasPartner: false,
      });
      expect(isPaired(state)).toBe(false);
    });

    it('returns false for anonymous state', () => {
      const state = createAnonymousState();
      expect(isPaired(state)).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('returns true for initializing state', () => {
      const state = createInitialState();
      expect(isLoading(state)).toBe(true);
    });

    it('returns false for authenticated state', () => {
      const state = createAuthenticatedState(mockUser, mockSession);
      expect(isLoading(state)).toBe(false);
    });
  });

  describe('needsSessionRefresh', () => {
    it('returns true for session_expired state', () => {
      const state = createSessionExpiredState(mockUser);
      expect(needsSessionRefresh(state)).toBe(true);
    });

    it('returns false for authenticated state', () => {
      const state = createAuthenticatedState(mockUser, mockSession);
      expect(needsSessionRefresh(state)).toBe(false);
    });
  });

  describe('getStatusMessage', () => {
    it('returns loading message for initializing', () => {
      const state = createInitialState();
      expect(getStatusMessage(state)).toBe('Loading...');
    });

    it('returns expiry message for session_expired', () => {
      const state = createSessionExpiredState();
      expect(getStatusMessage(state)).toContain('session has expired');
    });

    it('returns error message for error state', () => {
      const state = createErrorState('Custom error');
      expect(getStatusMessage(state)).toBe('Custom error');
    });

    it('returns null for authenticated state', () => {
      const state = createAuthenticatedState(mockUser, mockSession);
      expect(getStatusMessage(state)).toBeNull();
    });
  });
});

describe('State Transitions', () => {
  describe('isValidTransition', () => {
    it('allows initializing -> anonymous', () => {
      expect(isValidTransition('initializing', 'anonymous')).toBe(true);
    });

    it('allows initializing -> authenticated', () => {
      expect(isValidTransition('initializing', 'authenticated')).toBe(true);
    });

    it('allows authenticated -> anonymous (sign out)', () => {
      expect(isValidTransition('authenticated', 'anonymous')).toBe(true);
    });

    it('allows authenticated -> session_expired', () => {
      expect(isValidTransition('authenticated', 'session_expired')).toBe(true);
    });

    it('allows session_expired -> authenticated (refresh success)', () => {
      expect(isValidTransition('session_expired', 'authenticated')).toBe(true);
    });

    it('allows session_expired -> anonymous (re-login)', () => {
      expect(isValidTransition('session_expired', 'anonymous')).toBe(true);
    });

    it('disallows anonymous -> session_expired (invalid)', () => {
      expect(isValidTransition('anonymous', 'session_expired')).toBe(false);
    });

    it('allows any state -> error', () => {
      expect(isValidTransition('initializing', 'error')).toBe(true);
      expect(isValidTransition('anonymous', 'error')).toBe(true);
      expect(isValidTransition('authenticated', 'error')).toBe(true);
    });
  });
});

describe('deriveCycleOnboardingState', () => {
  it('returns "waiting_for_partner" when not paired', () => {
    expect(deriveCycleOnboardingState(false, false, false, false, false)).toBe('waiting_for_partner');
  });

  it('returns "needs_input" when paired but user has not submitted', () => {
    expect(deriveCycleOnboardingState(true, false, false, false, false)).toBe('needs_input');
  });

  it('returns "waiting_partner_input" when user submitted but partner has not', () => {
    expect(deriveCycleOnboardingState(true, true, false, false, false)).toBe('waiting_partner_input');
  });

  it('returns "generating" when both submitted and generating', () => {
    expect(deriveCycleOnboardingState(true, true, true, true, false)).toBe('generating');
  });

  it('returns "ready" when rituals exist', () => {
    expect(deriveCycleOnboardingState(true, true, true, false, true)).toBe('ready');
  });
});


