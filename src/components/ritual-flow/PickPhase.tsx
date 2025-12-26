/**
 * PickPhase Component
 * 
 * Premium ritual ranking + availability selection with beautiful animations.
 * Features expressive micro-interactions and delightful selection states.
 * 
 * @created 2025-12-26
 * @updated 2025-12-26 - Premium redesign with enhanced animations
 */

import { useMemo, useState, useEffect, useRef, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Star, Check, AlertCircle, ChevronDown, ChevronUp, Calendar, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AvailabilityGrid } from './AvailabilityGrid';
import type { Ritual, RitualPreference, AvailabilitySlot, TimeSlot } from '@/types/database';

interface PickPhaseProps {
  rituals: Ritual[];
  myPicks: RitualPreference[];
  partnerPicks: RitualPreference[];
  mySlots: AvailabilitySlot[];
  partnerSlots: AvailabilitySlot[];
  onRankRitual: (ritual: Ritual, rank: number) => Promise<void>;
  onRemoveRank: (rank: number) => Promise<void>;
  onToggleSlot: (dayOffset: number, timeSlot: TimeSlot) => Promise<void>;
  onSubmit: () => Promise<void>;
  error: string | null;
}

type ActiveSection = 'rituals' | 'availability';

// Spring animation config for smooth, bouncy feel
const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

// Rank badge component with beautiful animations
const RankBadge = memo(({ rank, selected }: { rank: number; selected: boolean }) => (
  <motion.div
    initial={false}
    animate={selected ? {
      scale: [1, 1.15, 1],
      rotate: [0, -5, 5, 0],
    } : { scale: 1, rotate: 0 }}
    transition={springTransition}
    className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200",
      selected
        ? "bg-gradient-to-br from-primary via-teal to-purple-500 text-white shadow-lg shadow-primary/30"
        : "border-2 border-dashed border-muted-foreground/20 bg-muted/30"
    )}
  >
    {selected ? (
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springTransition}
      >
        {rank}
      </motion.span>
    ) : (
      <span className="text-muted-foreground/50">+</span>
    )}
  </motion.div>
));
RankBadge.displayName = 'RankBadge';

// Ritual card component with premium styling
const RitualCard = memo(({ 
  ritual, 
  rank, 
  partnerPicked, 
  isExpanded, 
  onSelect, 
  onToggleExpand 
}: {
  ritual: Ritual;
  rank: number | undefined;
  partnerPicked: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: (e: React.MouseEvent) => void;
}) => {
  const isSelected = rank !== undefined;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card 
        variant="interactive"
        className={cn(
          "transition-all duration-200 overflow-hidden",
          isSelected && "ring-2 ring-primary/60 shadow-glow bg-primary/5",
          partnerPicked && !isSelected && "ring-1 ring-purple-400/50 bg-purple-50/50"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Card content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base leading-tight">{ritual.title}</h3>
                {partnerPicked && (
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium flex items-center gap-1"
                  >
                    <Heart className="w-3 h-3" fill="currentColor" />
                    Partner
                  </motion.span>
                )}
              </div>
              
              {/* Description */}
              <p className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !isExpanded && "line-clamp-2"
              )}>
                {ritual.description}
              </p>
              
              {/* Meta badges */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-muted/60 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {ritual.time_estimate}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-muted/60 rounded-lg">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  {ritual.budget_band}
                </span>
              </div>
              
              {/* Expandable "why" section */}
              {ritual.why && (
                <>
                  <button
                    onClick={onToggleExpand}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline underline-offset-2"
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Why this ritual? <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-lg border border-border/50">
                          ✨ {ritual.why}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
            
            {/* Rank indicator */}
            <RankBadge rank={rank || 0} selected={isSelected} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
RitualCard.displayName = 'RitualCard';

export function PickPhase({
  rituals,
  myPicks,
  partnerPicks,
  mySlots,
  partnerSlots,
  onRankRitual,
  onRemoveRank,
  onToggleSlot,
  onSubmit,
  error
}: PickPhaseProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRitual, setExpandedRitual] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('rituals');
  const hasAutoTransitioned = useRef(false);
  
  // Build lookup for my picks
  const myPicksByRitual = useMemo(() => {
    const map = new Map<string, number>();
    myPicks.forEach(p => map.set(p.ritual_title, p.rank));
    return map;
  }, [myPicks]);
  
  // Check if partner has picked this ritual
  const partnerPickedRituals = useMemo(() => {
    return new Set(partnerPicks.map(p => p.ritual_title));
  }, [partnerPicks]);
  
  // Validation
  const hasAllPicks = myPicks.length >= 3;
  const hasAvailability = mySlots.length > 0;
  const canSubmit = hasAllPicks && hasAvailability;
  
  // Find overlapping slots
  const hasOverlap = useMemo(() => {
    const myKeys = new Set(mySlots.map(s => `${s.day_offset}-${s.time_slot}`));
    return partnerSlots.some(s => myKeys.has(`${s.day_offset}-${s.time_slot}`));
  }, [mySlots, partnerSlots]);
  
  // Auto-transition to availability when all picks are done
  useEffect(() => {
    if (hasAllPicks && !hasAutoTransitioned.current) {
      hasAutoTransitioned.current = true;
      const timer = setTimeout(() => {
        setActiveSection('availability');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [hasAllPicks]);
  
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);
  
  const handleRankClick = useCallback(async (ritual: Ritual) => {
    const currentRank = myPicksByRitual.get(ritual.title);
    
    if (currentRank) {
      await onRemoveRank(currentRank);
    } else {
      const usedRanks = new Set(myPicks.map(p => p.rank));
      const nextRank = [1, 2, 3].find(r => !usedRanks.has(r));
      if (nextRank) {
        await onRankRitual(ritual, nextRank);
      }
    }
  }, [myPicksByRitual, myPicks, onRankRitual, onRemoveRank]);
  
  // Get selected ritual names for summary
  const selectedRitualNames = useMemo(() => 
    myPicks
      .sort((a, b) => a.rank - b.rank)
      .map(p => p.ritual_title.split(' ').slice(0, 2).join(' ')),
    [myPicks]
  );
  
  return (
    <div className="h-full flex flex-col bg-gradient-calm">
      {/* Header */}
      <div className="flex-none px-5 py-4">
        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-3 border border-destructive/20"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Title section */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold tracking-tight">Choose Your Rituals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tap to select your top 3 favorites
          </p>
        </div>
        
        {/* Selected ranks indicator */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map(rank => {
            const pick = myPicks.find(p => p.rank === rank);
            return (
              <motion.button
                key={rank}
                onClick={() => pick && onRemoveRank(rank)}
                className={cn(
                  "h-12 px-4 rounded-xl flex items-center justify-center gap-2 transition-all",
                  "min-w-[90px] border-2",
                  pick 
                    ? "bg-primary/10 border-primary/40 text-primary shadow-sm" 
                    : "border-dashed border-muted-foreground/25 bg-muted/30"
                )}
                whileTap={pick ? { scale: 0.95 } : {}}
                transition={springTransition}
              >
                {pick ? (
                  <>
                    <Star className="w-4 h-4" fill="currentColor" />
                    <span className="text-xs font-semibold truncate max-w-[60px]">
                      {pick.ritual_title.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground/60">#{rank}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="space-y-4 pb-4">
          
          {/* SECTION 1: Ritual Selection */}
          <Card variant="elevated" className="overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => setActiveSection(activeSection === 'rituals' ? 'availability' : 'rituals')}
              className={cn(
                "w-full flex items-center justify-between p-4 transition-all duration-200",
                activeSection === 'rituals' 
                  ? "bg-gradient-to-r from-primary/5 to-transparent" 
                  : "hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm",
                    hasAllPicks 
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md" 
                      : "bg-primary/15 text-primary"
                  )}
                  animate={hasAllPicks ? { scale: [1, 1.1, 1] } : {}}
                  transition={springTransition}
                >
                  {hasAllPicks ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </motion.div>
                <div className="text-left">
                  <div className="font-semibold">Select Rituals</div>
                  {hasAllPicks && activeSection !== 'rituals' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground truncate max-w-[200px]"
                    >
                      {selectedRitualNames.join(' • ')}
                    </motion.div>
                  )}
                </div>
              </div>
              <motion.div
                animate={{ rotate: activeSection === 'rituals' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            
            {/* Ritual cards */}
            <AnimatePresence>
              {activeSection === 'rituals' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-3">
                    {rituals.map((ritual) => {
                      const myRank = myPicksByRitual.get(ritual.title);
                      const partnerPicked = partnerPickedRituals.has(ritual.title);
                      const isExpanded = expandedRitual === ritual.title;
                      
                      return (
                        <RitualCard
                          key={ritual.title}
                          ritual={ritual}
                          rank={myRank}
                          partnerPicked={partnerPicked}
                          isExpanded={isExpanded}
                          onSelect={() => handleRankClick(ritual)}
                          onToggleExpand={(e) => {
                            e.stopPropagation();
                            setExpandedRitual(isExpanded ? null : ritual.title);
                          }}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* SECTION 2: Availability Selection */}
          <Card variant="elevated" className="overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => setActiveSection(activeSection === 'availability' ? 'rituals' : 'availability')}
              className={cn(
                "w-full flex items-center justify-between p-4 transition-all duration-200",
                activeSection === 'availability' 
                  ? "bg-gradient-to-r from-primary/5 to-transparent" 
                  : "hover:bg-muted/30",
                !hasAllPicks && "opacity-50 cursor-not-allowed"
              )}
              disabled={!hasAllPicks}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm",
                    hasAvailability 
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md" 
                      : hasAllPicks 
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                  animate={hasAvailability ? { scale: [1, 1.1, 1] } : {}}
                  transition={springTransition}
                >
                  {hasAvailability ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                </motion.div>
                <div className="text-left">
                  <div className="font-semibold">Pick Your Times</div>
                  {hasAvailability && activeSection !== 'availability' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground"
                    >
                      {mySlots.length} slot{mySlots.length !== 1 ? 's' : ''}
                      {hasOverlap && <span className="text-emerald-600 ml-1.5 font-medium">• Match!</span>}
                    </motion.div>
                  )}
                </div>
              </div>
              <motion.div
                animate={{ rotate: activeSection === 'availability' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            
            {/* Availability grid */}
            <AnimatePresence>
              {activeSection === 'availability' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0">
                    <AvailabilityGrid
                      mySlots={mySlots}
                      partnerSlots={partnerSlots}
                      onToggle={onToggleSlot}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="flex-none px-4 py-4 pb-safe bg-background/90 backdrop-blur-lg border-t border-border/50">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          variant="gradient"
          size="xl"
          loading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            'Saving your picks...'
          ) : !hasAllPicks ? (
            `Pick ${3 - myPicks.length} more ritual${3 - myPicks.length > 1 ? 's' : ''}`
          ) : !hasAvailability ? (
            'Select your availability'
          ) : !hasOverlap && partnerSlots.length > 0 ? (
            'Continue without matching times'
          ) : (
            <>
              <Check className="w-5 h-5" />
              See Your Results
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
