/**
 * PickPhase Component
 * 
 * Combined ritual ranking + availability selection.
 * All on one screen for faster completion.
 * 
 * @created 2025-12-26
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Star, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
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
  
  // Build lookup for my picks
  const myPicksByRitual = useMemo(() => {
    const map = new Map<string, number>();
    myPicks.forEach(p => map.set(p.ritual_title, p.rank));
    return map;
  }, [myPicks]);
  
  // Check if partner has picked this ritual (show indicator but not rank)
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
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRankClick = async (ritual: Ritual) => {
    const currentRank = myPicksByRitual.get(ritual.title);
    
    if (currentRank) {
      // Already ranked - remove it
      await onRemoveRank(currentRank);
    } else {
      // Not ranked - assign next available rank
      const usedRanks = new Set(myPicks.map(p => p.rank));
      const nextRank = [1, 2, 3].find(r => !usedRanks.has(r));
      if (nextRank) {
        await onRankRitual(ritual, nextRank);
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 py-3">
        {error && (
          <div className="mb-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-1">Pick Your Top 3</h2>
          <p className="text-sm text-muted-foreground">
            Tap to rank: 1st choice, 2nd choice, 3rd choice
          </p>
        </div>
        
        {/* Selected ranks indicator */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
          {[1, 2, 3].map(rank => {
            const pick = myPicks.find(p => p.rank === rank);
            return (
              <button
                key={rank}
                onClick={() => pick && onRemoveRank(rank)}
                className={cn(
                  "h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all px-2",
                  pick 
                    ? "bg-primary/10 border-primary hover:bg-primary/20" 
                    : "border-dashed border-muted-foreground/30"
                )}
              >
                {pick ? (
                  <div className="flex items-center gap-1 w-full">
                    <Star className="w-3 h-3 text-primary flex-shrink-0" fill="currentColor" />
                    <span className="text-xs font-medium truncate">
                      {pick.ritual_title.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">#{rank}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="space-y-4 pb-4">
          {/* Ritual cards */}
          <div className="space-y-2">
            {rituals.map((ritual, idx) => {
              const myRank = myPicksByRitual.get(ritual.title);
              const partnerPicked = partnerPickedRituals.has(ritual.title);
              const isExpanded = expandedRitual === ritual.title;
              
              return (
                <motion.div
                  key={ritual.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className={cn(
                      "transition-all cursor-pointer overflow-hidden",
                      myRank && "ring-2 ring-primary bg-primary/5",
                      partnerPicked && !myRank && "ring-1 ring-purple-300"
                    )}
                    onClick={() => handleRankClick(ritual)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm truncate">{ritual.title}</h3>
                            {partnerPicked && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">
                                Partner likes
                              </span>
                            )}
                          </div>
                          
                          <p className={cn(
                            "text-xs text-muted-foreground mb-2",
                            isExpanded ? "" : "line-clamp-2"
                          )}>
                            {ritual.description}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded">
                              <Clock className="w-3 h-3" />
                              {ritual.time_estimate}
                            </span>
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded">
                              <DollarSign className="w-3 h-3" />
                              {ritual.budget_band}
                            </span>
                          </div>
                          
                          {ritual.why && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRitual(isExpanded ? null : ritual.title);
                              }}
                              className="text-xs text-primary mt-2 hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>Show less <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <>Why this ritual? <ChevronDown className="w-3 h-3" /></>
                              )}
                            </button>
                          )}
                          
                          {isExpanded && ritual.why && (
                            <p className="text-xs text-muted-foreground mt-2 italic bg-muted/50 p-2 rounded">
                              {ritual.why}
                            </p>
                          )}
                        </div>
                        
                        {/* Rank indicator */}
                        <div className="flex-shrink-0">
                          {myRank ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                              {myRank}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">+</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          {/* Availability section */}
          <div className="pt-4 border-t">
            <AvailabilityGrid
              mySlots={mySlots}
              partnerSlots={partnerSlots}
              onToggle={onToggleSlot}
            />
          </div>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="flex-none px-4 py-3 pb-safe bg-background/95 backdrop-blur-sm border-t">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full h-12 bg-gradient-to-r from-primary to-purple-500 text-white"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : !hasAllPicks ? (
            `Pick ${3 - myPicks.length} more ritual${3 - myPicks.length > 1 ? 's' : ''}`
          ) : !hasAvailability ? (
            'Select your availability'
          ) : !hasOverlap && partnerSlots.length > 0 ? (
            'No matching times - adjust or continue'
          ) : (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Done - See Results
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

