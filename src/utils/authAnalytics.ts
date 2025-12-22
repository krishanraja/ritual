/**
 * Auth Analytics
 * 
 * Structured analytics events for auth flows.
 * Privacy-safe: no PII in event properties.
 * 
 * @created 2025-12-22
 */

import { logger } from './logger';

/**
 * Auth event types
 */
export type AuthEventType = 
  | 'auth_page_view'
  | 'sign_in_attempt'
  | 'sign_in_success'
  | 'sign_in_error'
  | 'sign_up_attempt'
  | 'sign_up_success'
  | 'sign_up_error'
  | 'sign_out'
  | 'session_expired'
  | 'session_restored'
  | 'token_refreshed'
  | 'couple_created'
  | 'couple_joined'
  | 'couple_left'
  | 'input_submitted'
  | 'input_draft_saved'
  | 'input_draft_restored'
  | 'route_guard_redirect';

/**
 * Auth event properties (privacy-safe)
 */
interface AuthEventProperties {
  // Auth state
  has_session?: boolean;
  auth_state?: string;
  onboarding_state?: string;
  
  // Flow context
  is_login?: boolean;
  is_signup?: boolean;
  has_couple?: boolean;
  has_partner?: boolean;
  
  // Error context (no sensitive data)
  error_code?: string;
  error_category?: 'validation' | 'network' | 'auth' | 'server' | 'unknown';
  
  // Navigation context
  from_route?: string;
  to_route?: string;
  redirect_reason?: string;
  
  // Timing
  duration_ms?: number;
  
  // Feature context
  feature?: string;
  action?: string;
}

/**
 * Analytics provider abstraction
 * Replace implementation with your analytics provider (e.g., PostHog, Amplitude, etc.)
 */
interface AnalyticsProvider {
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
}

// Default provider logs to console in dev, no-op in production
const defaultProvider: AnalyticsProvider = {
  track: (event, properties) => {
    if (import.meta.env.DEV) {
      logger.debug(`[ANALYTICS] ${event}`, properties);
    }
  },
  identify: (userId, traits) => {
    if (import.meta.env.DEV) {
      logger.debug(`[ANALYTICS] identify`, { userId, ...traits });
    }
  },
  reset: () => {
    if (import.meta.env.DEV) {
      logger.debug('[ANALYTICS] reset');
    }
  },
};

// Current provider instance
let provider: AnalyticsProvider = defaultProvider;

/**
 * Initialize analytics with a provider
 */
export function initAuthAnalytics(customProvider: AnalyticsProvider): void {
  provider = customProvider;
}

/**
 * Track an auth-related event
 */
export function trackAuthEvent(
  event: AuthEventType, 
  properties?: AuthEventProperties
): void {
  const safeProperties: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    ...properties,
  };
  
  // Remove any undefined values
  Object.keys(safeProperties).forEach(key => {
    if (safeProperties[key] === undefined) {
      delete safeProperties[key];
    }
  });
  
  provider.track(`auth.${event}`, safeProperties);
}

/**
 * Identify user for analytics (privacy-safe - no PII)
 */
export function identifyUser(
  userId: string,
  traits?: {
    has_couple?: boolean;
    has_partner?: boolean;
    account_age_days?: number;
  }
): void {
  provider.identify(userId, traits);
}

/**
 * Reset analytics identity on logout
 */
export function resetAnalytics(): void {
  provider.reset();
}

// Convenience functions for common events

export function trackSignInAttempt(isLogin: boolean): void {
  trackAuthEvent(isLogin ? 'sign_in_attempt' : 'sign_up_attempt', { 
    is_login: isLogin,
    is_signup: !isLogin,
  });
}

export function trackSignInSuccess(
  isLogin: boolean, 
  durationMs?: number
): void {
  trackAuthEvent(isLogin ? 'sign_in_success' : 'sign_up_success', {
    is_login: isLogin,
    is_signup: !isLogin,
    duration_ms: durationMs,
  });
}

export function trackSignInError(
  isLogin: boolean, 
  errorCode: string, 
  category: AuthEventProperties['error_category'] = 'unknown'
): void {
  trackAuthEvent(isLogin ? 'sign_in_error' : 'sign_up_error', {
    is_login: isLogin,
    is_signup: !isLogin,
    error_code: errorCode,
    error_category: category,
  });
}

export function trackSignOut(): void {
  trackAuthEvent('sign_out');
  resetAnalytics();
}

export function trackSessionExpired(): void {
  trackAuthEvent('session_expired');
}

export function trackSessionRestored(): void {
  trackAuthEvent('session_restored');
}

export function trackRouteGuardRedirect(
  fromRoute: string, 
  toRoute: string, 
  reason: string
): void {
  trackAuthEvent('route_guard_redirect', {
    from_route: fromRoute,
    to_route: toRoute,
    redirect_reason: reason,
  });
}

export function trackCoupleCreated(): void {
  trackAuthEvent('couple_created', { has_couple: true });
}

export function trackCoupleJoined(): void {
  trackAuthEvent('couple_joined', { has_couple: true, has_partner: true });
}

export function trackInputSubmitted(hasPartner: boolean): void {
  trackAuthEvent('input_submitted', { has_partner: hasPartner });
}

export function trackInputDraftSaved(): void {
  trackAuthEvent('input_draft_saved');
}

export function trackInputDraftRestored(): void {
  trackAuthEvent('input_draft_restored');
}

export default {
  initAuthAnalytics,
  trackAuthEvent,
  identifyUser,
  resetAnalytics,
  trackSignInAttempt,
  trackSignInSuccess,
  trackSignInError,
  trackSignOut,
  trackSessionExpired,
  trackSessionRestored,
  trackRouteGuardRedirect,
  trackCoupleCreated,
  trackCoupleJoined,
  trackInputSubmitted,
  trackInputDraftSaved,
  trackInputDraftRestored,
};


