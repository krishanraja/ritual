/**
 * AuthDebugPanel
 * 
 * Development-only panel that shows current auth state, session info,
 * and route guard decisions. Only renders in development mode.
 * 
 * @created 2025-12-22
 */

import { useState } from 'react';
import { useCouple } from '@/contexts/CoupleContext';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Only render in development
const isDev = import.meta.env.DEV;

export function AuthDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  
  const {
    user,
    session,
    couple,
    partnerProfile,
    userProfile,
    currentCycle,
    cycleState,
    loading,
    hasKnownSession,
    authState,
    onboardingState,
    isSessionExpired,
  } = useCouple();

  // Don't render in production
  if (!isDev) return null;

  const debugData = {
    authState,
    onboardingState,
    isSessionExpired,
    loading,
    hasKnownSession,
    currentRoute: location.pathname,
    user: user ? {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    } : null,
    session: session ? {
      expiresAt: session.expires_at,
      tokenType: session.token_type,
    } : null,
    couple: couple ? {
      id: couple.id,
      hasPartnerTwo: !!couple.partner_two,
      isActive: couple.is_active,
      preferredCity: couple.preferred_city,
    } : null,
    partnerProfile: partnerProfile ? {
      id: partnerProfile.id,
      name: partnerProfile.name,
    } : null,
    userProfile,
    cycleState,
    currentCycle: currentCycle ? {
      id: currentCycle.id,
      weekStartDate: currentCycle.week_start_date,
      hasPartnerOneInput: !!currentCycle.partner_one_input,
      hasPartnerTwoInput: !!currentCycle.partner_two_input,
      hasSynthesizedOutput: !!currentCycle.synthesized_output,
      agreementReached: currentCycle.agreement_reached,
    } : null,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auth state color coding
  const getAuthStateColor = () => {
    switch (authState) {
      case 'authenticated': return 'bg-green-500';
      case 'anonymous': return 'bg-gray-500';
      case 'session_expired': return 'bg-amber-500';
      case 'initializing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Collapsed state - just a small badge */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors text-xs font-mono"
        >
          <Bug className="w-4 h-4" />
          <span className={`w-2 h-2 rounded-full ${getAuthStateColor()}`} />
          <span>{authState}</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Expanded state - full debug panel */}
      {isExpanded && (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl w-80 max-h-96 overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <span className="font-semibold">Auth Debug</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 overflow-y-auto max-h-80 space-y-3">
            {/* State badges */}
            <div className="flex flex-wrap gap-1">
              <span className={`px-2 py-0.5 rounded text-white ${getAuthStateColor()}`}>
                {authState}
              </span>
              {onboardingState && (
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white">
                  {onboardingState}
                </span>
              )}
              {loading && (
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                  loading
                </span>
              )}
              {isSessionExpired && (
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white">
                  expired
                </span>
              )}
            </div>

            {/* Route */}
            <div>
              <span className="text-gray-400">Route:</span>{' '}
              <span className="text-cyan-400">{location.pathname}</span>
            </div>

            {/* User */}
            <div>
              <span className="text-gray-400">User:</span>{' '}
              {user ? (
                <span className="text-green-400">{user.id.slice(0, 8)}...</span>
              ) : (
                <span className="text-red-400">null</span>
              )}
            </div>

            {/* Couple */}
            <div>
              <span className="text-gray-400">Couple:</span>{' '}
              {couple ? (
                <span className="text-green-400">
                  {couple.id.slice(0, 8)}... ({couple.partner_two ? 'paired' : 'waiting'})
                </span>
              ) : (
                <span className="text-red-400">null</span>
              )}
            </div>

            {/* Cycle State */}
            <div>
              <span className="text-gray-400">Cycle:</span>{' '}
              <span className="text-yellow-400">{cycleState}</span>
            </div>

            {/* Session expiry */}
            {session?.expires_at && (
              <div>
                <span className="text-gray-400">Session expires:</span>{' '}
                <span className="text-gray-300">
                  {new Date(session.expires_at * 1000).toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Raw JSON toggle */}
            <details className="mt-2">
              <summary className="cursor-pointer text-gray-400 hover:text-white">
                Show raw data
              </summary>
              <pre className="mt-2 p-2 bg-gray-800 rounded overflow-x-auto text-[10px]">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthDebugPanel;


