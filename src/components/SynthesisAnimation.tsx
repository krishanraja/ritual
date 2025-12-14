import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import ritualIcon from '@/assets/ritual-icon.png';
import confetti from 'canvas-confetti';
import { useCouple } from '@/contexts/CoupleContext';
import { supabase } from '@/integrations/supabase/client';
import { SAMPLE_RITUALS } from '@/data/sampleRituals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type StoredPartnerInput = Record<string, unknown>;

type WeeklyCycleSynthesisSnapshot = {
  id: string;
  partner_one_input: unknown | null;
  partner_two_input: unknown | null;
  synthesized_output: unknown | null;
};

type WeeklyCyclesRealtimePayload = {
  new: {
    synthesized_output?: unknown | null;
  };
};

const PHASES = [
  { message: "Reading your vibes...", duration: 4000 },
  { message: "Matching your energy...", duration: 5000 },
  { message: "Crafting perfect rituals...", duration: 6000 },
  { message: "Almost there! ✨", duration: 15000 },
  { message: "Taking a bit longer, hang tight!", duration: 30000 },
];

const MAX_WAIT_TIME = 90000; // 90 seconds max
const SHOW_REFRESH_AFTER = 30000; // Show refresh button after 30s

export const SynthesisAnimation = () => {
  const navigate = useNavigate();
  const { currentCycle, refreshCycle, couple } = useCouple();
  const [phase, setPhase] = useState(0);
  const [currentRitualIndex, setCurrentRitualIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoTriggering, setIsAutoTriggering] = useState(false);
  const [startTime] = useState(Date.now());
  const synthesisAttemptedForCycleRef = useRef<string | null>(null);

  // Get city-relevant rituals or mix
  const city = couple?.preferred_city || 'New York';
  const relevantRituals = SAMPLE_RITUALS.filter(r => r.city === city);
  const displayRituals = relevantRituals.length >= 4 ? relevantRituals : SAMPLE_RITUALS;

  // Phase progression
  useEffect(() => {
    let totalTime = 0;
    const timers: NodeJS.Timeout[] = [];
    
    PHASES.forEach((p, idx) => {
      totalTime += p.duration;
      const timer = setTimeout(() => {
        setPhase(idx);
      }, totalTime - p.duration);
      timers.push(timer);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Show refresh button after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isComplete && !hasError && !isAutoTriggering) {
        setShowRefreshButton(true);
      }
    }, SHOW_REFRESH_AFTER);

    return () => clearTimeout(timer);
  }, [isComplete, hasError, isAutoTriggering]);

  // Timeout after max wait time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isComplete && !hasError && !isAutoTriggering) {
        console.log('[SYNTHESIS] Max wait time exceeded');
        setHasError(true);
        setErrorMessage('Taking longer than expected. Your rituals may still be generating in the background.');
      }
    }, MAX_WAIT_TIME);

    return () => clearTimeout(timer);
  }, [isComplete, hasError, isAutoTriggering]);

  // Rotate through sample rituals
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRitualIndex(prev => (prev + 1) % displayRituals.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [displayRituals.length]);

  const handleComplete = useCallback(async () => {
    if (isComplete) return;
    
    console.log('[SYNTHESIS] Rituals detected, completing...');
    setIsComplete(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    await refreshCycle();
    setTimeout(() => {
      navigate('/picker');
    }, 1200);
  }, [isComplete, navigate, refreshCycle]);

  const normalizePartnerInput = useCallback((input: unknown): StoredPartnerInput | null => {
    if (!input || typeof input !== 'object') return null;
    const obj = input as Record<string, unknown>;

    // Support both the current stored shape ({ inputType: 'cards', cards: [...] })
    // and potential future shape ({ selectedCards: [...] }).
    if (Array.isArray(obj.selectedCards)) {
      return { inputType: 'cards', cards: obj.selectedCards, desire: obj.desire ?? null };
    }
    if (obj.inputType === 'cards' && Array.isArray(obj.cards)) {
      return obj;
    }
    return obj;
  }, []);

  // If both partners submitted but synthesis was never triggered (race condition),
  // proactively trigger it here so users never get stuck on an infinite loading screen.
  useEffect(() => {
    if (!currentCycle?.id || !couple?.id) return;
    if (isComplete || hasError) return;
    if (synthesisAttemptedForCycleRef.current === currentCycle.id) return;
    synthesisAttemptedForCycleRef.current = currentCycle.id;

    const maybeTriggerSynthesis = async () => {
      try {
        const { data, error } = await supabase
          .from('weekly_cycles')
          .select('id, partner_one_input, partner_two_input, synthesized_output')
          .eq('id', currentCycle.id)
          .single();

        if (error) throw error;
        const cycle = data as WeeklyCycleSynthesisSnapshot;

        if (cycle?.synthesized_output) {
          await handleComplete();
          return;
        }

        const partnerOneInput = normalizePartnerInput(cycle?.partner_one_input);
        const partnerTwoInput = normalizePartnerInput(cycle?.partner_two_input);

        if (!partnerOneInput || !partnerTwoInput) {
          // Not ready yet - wait for realtime/poll.
          return;
        }

        console.log('[SYNTHESIS] Both inputs present but no output; triggering synthesis from loading screen');
        setIsAutoTriggering(true);

        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('synthesize-rituals', {
          body: {
            coupleId: couple.id,
            partnerOneInput,
            partnerTwoInput,
            userCity: couple.preferred_city || 'New York',
          },
        });

        console.log('[SYNTHESIS] Edge function response (loading screen):', { data: invokeData, error: invokeError });
        if (invokeError) throw invokeError;
        const rituals = (invokeData as { rituals?: unknown })?.rituals;
        if (!Array.isArray(rituals) || rituals.length === 0) {
          throw new Error('Synthesis returned no rituals');
        }

        // Only save if still empty to avoid overwriting in double-trigger scenarios.
        const { data: saved, error: saveError } = await supabase
          .from('weekly_cycles')
          .update({
            synthesized_output: { rituals },
            generated_at: new Date().toISOString(),
            sync_completed_at: new Date().toISOString(),
          })
          .eq('id', currentCycle.id)
          .is('synthesized_output', null)
          .select('id')
          .maybeSingle();

        if (saveError) throw saveError;

        // If another client saved first, we’ll rely on polling/realtime to detect it.
        if (saved?.id) {
          await handleComplete();
        }
      } catch (err: unknown) {
        console.error('[SYNTHESIS] Auto-trigger error:', err);
        setHasError(true);
        const message = err instanceof Error ? err.message : 'Something went wrong generating your rituals. Please try again.';
        setErrorMessage(message);
      } finally {
        setIsAutoTriggering(false);
      }
    };

    maybeTriggerSynthesis();
  }, [currentCycle?.id, couple?.id, couple?.preferred_city, handleComplete, hasError, isComplete, normalizePartnerInput]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log('[SYNTHESIS] Manual refresh triggered');
    
    try {
      const { data } = await supabase
        .from('weekly_cycles')
        .select('synthesized_output')
        .eq('id', currentCycle?.id)
        .single();

      if (data?.synthesized_output) {
        await handleComplete();
      } else {
        setErrorMessage('Rituals not ready yet. Please wait or go back and try again.');
        setHasError(true);
      }
    } catch (error) {
      console.error('[SYNTHESIS] Refresh error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Realtime subscription for synthesis completion
  useEffect(() => {
    if (!currentCycle?.id) return;

    console.log('[SYNTHESIS] Setting up realtime listener for cycle:', currentCycle.id);

    const channel = supabase
      .channel(`synthesis-${currentCycle.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'weekly_cycles',
        filter: `id=eq.${currentCycle.id}`
      }, async (payload: WeeklyCyclesRealtimePayload) => {
        console.log('[SYNTHESIS] Realtime update:', payload);
        if (payload.new.synthesized_output) {
          await handleComplete();
        }
      })
      .subscribe((status) => {
        console.log('[SYNTHESIS] Channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCycle?.id, handleComplete]);

  // Poll as backup (every 3 seconds)
  useEffect(() => {
    if (!currentCycle?.id || isComplete || hasError) return;

    const pollInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      console.log('[SYNTHESIS] Polling... elapsed:', Math.round(elapsed / 1000), 's');
      
      const { data } = await supabase
        .from('weekly_cycles')
        .select('synthesized_output')
        .eq('id', currentCycle.id)
        .single();

      if (data?.synthesized_output) {
        await handleComplete();
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentCycle?.id, isComplete, hasError, startTime, handleComplete]);

  const currentRitual = displayRituals[currentRitualIndex];
  const nextRitual = displayRituals[(currentRitualIndex + 1) % displayRituals.length];
  const prevRitual = displayRituals[(currentRitualIndex - 1 + displayRituals.length) % displayRituals.length];

  // Error state UI
  if (hasError) {
    return (
      <div className="h-full flex flex-col bg-gradient-warm items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2">Something's taking too long</h2>
            <p className="text-muted-foreground text-sm">
              {errorMessage}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-full bg-gradient-ritual"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Again
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Don't worry — your inputs are saved. Rituals may appear on your dashboard soon.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-warm overflow-hidden">
      {/* Header with phase message */}
      <div className="flex-none px-6 pt-8 pb-4 text-center">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-2"
        >
          <motion.div
            animate={{ 
              rotate: isComplete ? 0 : 360,
              scale: isComplete ? [1, 1.3, 1] : [1, 1.05, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: isComplete ? 0 : Infinity, ease: 'linear' },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-purple-200/30 flex items-center justify-center"
          >
            {isComplete ? (
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            ) : (
              <img src={ritualIcon} alt="" className="w-12 h-12 object-contain" />
            )}
          </motion.div>
          
          <h2 className="text-xl font-bold">
            {isComplete ? "Rituals Ready! 🎉" : PHASES[phase].message}
          </h2>
          
          {!isComplete && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Usually takes ~15 seconds</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cascading Ritual Cards */}
      <div className="flex-1 relative overflow-hidden px-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {/* Previous card (fading out top) */}
            <motion.div
              key={`prev-${currentRitualIndex}`}
              initial={{ opacity: 0, y: -100, scale: 0.8 }}
              animate={{ opacity: 0.3, y: -120, scale: 0.75 }}
              exit={{ opacity: 0, y: -200, scale: 0.6 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-full max-w-xs"
            >
              <Card className="bg-card/60 border-border/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="font-semibold text-sm opacity-60">{prevRitual.title}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Current card (center, prominent) */}
            <motion.div
              key={`current-${currentRitualIndex}`}
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.3, y: -120, scale: 0.75 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-full max-w-xs z-10"
            >
              <Card className="bg-card shadow-lg border-primary/20">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-lg">{currentRitual.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {currentRitual.description}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded-full">
                      {currentRitual.time_estimate}
                    </span>
                    <span className="px-2 py-1 bg-muted rounded-full">
                      {currentRitual.budget_band}
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {currentRitual.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next card (coming from bottom) */}
            <motion.div
              key={`next-${currentRitualIndex}`}
              initial={{ opacity: 0, y: 200, scale: 0.6 }}
              animate={{ opacity: 0.4, y: 130, scale: 0.8 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-full max-w-xs"
            >
              <Card className="bg-card/60 border-border/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="font-semibold text-sm opacity-60">{nextRitual.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Refresh button and helper text */}
      <div className="flex-none pb-8 px-6">
        {showRefreshButton && !isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Taking too long? Refresh
                </>
              )}
            </Button>
          </motion.div>
        )}
        
        <p className="text-center text-xs text-muted-foreground mt-3">
          Creating personalized rituals from your combined preferences
        </p>
      </div>
    </div>
  );
};