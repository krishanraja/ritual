/**
 * StatusIndicator Component
 * 
 * Shows current status in the app header.
 * 
 * CRITICAL FIX (2026-01-03):
 * - Added timeout tracking for "Creating rituals..." state
 * - Shows error state when synthesis takes too long
 * - Includes retry option
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '@/contexts/CoupleContext';
import { AlertCircle, CheckCircle, Clock, Heart, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Timeout configuration
const SYNTHESIS_TIMEOUT_MS = 30000; // 30 seconds

export const StatusIndicator = () => {
  const { user, couple, partnerProfile, currentCycle, refreshCycle } = useCouple();
  const navigate = useNavigate();
  
  // Timeout tracking state
  const [synthesisStartTime, setSynthesisStartTime] = useState<number | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Computed states
  const hasPartnerOne = !!currentCycle?.partner_one_input;
  const hasPartnerTwo = !!currentCycle?.partner_two_input;
  const userIsPartnerOne = couple?.partner_one === user?.id;
  const userSubmitted = userIsPartnerOne ? hasPartnerOne : hasPartnerTwo;
  const partnerSubmitted = userIsPartnerOne ? hasPartnerTwo : hasPartnerOne;
  const hasSynthesized = !!currentCycle?.synthesized_output;
  const isGenerating = userSubmitted && partnerSubmitted && !hasSynthesized;

  // Track when synthesis starts
  useEffect(() => {
    if (isGenerating && !synthesisStartTime) {
      setSynthesisStartTime(Date.now());
      setIsTimedOut(false);
    } else if (!isGenerating && synthesisStartTime) {
      setSynthesisStartTime(null);
      setIsTimedOut(false);
    }
  }, [isGenerating, synthesisStartTime]);

  // Check for timeout
  useEffect(() => {
    if (!synthesisStartTime) return;

    const checkTimeout = () => {
      const elapsed = Date.now() - synthesisStartTime;
      if (elapsed >= SYNTHESIS_TIMEOUT_MS && !isTimedOut) {
        console.warn('[StatusIndicator] Synthesis timeout');
        setIsTimedOut(true);
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);

    return () => clearInterval(interval);
  }, [synthesisStartTime, isTimedOut]);

  // Retry handler
  const handleRetry = useCallback(async () => {
    if (!currentCycle?.id || isRetrying) return;

    setIsRetrying(true);
    setSynthesisStartTime(Date.now());
    setIsTimedOut(false);

    try {
      await supabase.functions.invoke('trigger-synthesis', {
        body: { cycleId: currentCycle.id, forceRetry: true }
      });
      await refreshCycle();
    } catch (err) {
      console.error('[StatusIndicator] Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [currentCycle?.id, isRetrying, refreshCycle]);

  // Handle click on status (navigate to flow page)
  const handleClick = useCallback(() => {
    if (isGenerating || isTimedOut) {
      navigate('/flow');
    }
  }, [isGenerating, isTimedOut, navigate]);

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3 h-3" />
        <span>Not signed in</span>
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Heart className="w-3 h-3" />
        <span>Solo mode</span>
      </div>
    );
  }

  if (!couple.partner_two) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-amber-600 dark:text-amber-400">Waiting for partner</span>
      </div>
    );
  }

  if (hasSynthesized) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle className="w-3 h-3 text-green-600" />
        <span className="text-green-600 dark:text-green-400">Rituals ready</span>
      </div>
    );
  }

  // Both submitted but timed out - show error with retry
  if (isGenerating && isTimedOut) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Retrying...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>Tap to retry</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Both submitted, generating - show with click to view
  if (isGenerating) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Clock className="w-3 h-3 animate-pulse" />
        <span>Creating rituals...</span>
      </button>
    );
  }

  if (userSubmitted && !partnerSubmitted) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">
          Waiting for {partnerProfile?.name || 'partner'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-muted-foreground">Connected</span>
    </div>
  );
};
