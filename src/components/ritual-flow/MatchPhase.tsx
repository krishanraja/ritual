/**
 * MatchPhase Component
 * 
 * Shows the matched ritual and time slot after both partners have picked.
 * Allows either partner to confirm the match.
 * 
 * @created 2025-12-26
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MatchResult, dayOffsetToDate, getSlotDisplayName } from '@/types/database';

interface MatchPhaseProps {
  matchResult: MatchResult;
  partnerName: string;
  onConfirm: () => Promise<void>;
  error: string | null;
}

export function MatchPhase({
  matchResult,
  partnerName,
  onConfirm,
  error
}: MatchPhaseProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };
  
  const { matchedRitual, matchedSlot, hasTimeConflict, rankings } = matchResult;
  
  // Get the date string for the matched slot
  const matchedDate = matchedSlot ? dayOffsetToDate(matchedSlot.dayOffset) : null;
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 py-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-1"
        >
          Great Minds! ✨
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          You both have rituals in common
        </motion.p>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Time conflict warning */}
      {hasTimeConflict && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>No overlapping times yet. You may need to adjust your availability.</span>
        </div>
      )}
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="space-y-3 pb-4">
          {/* Rankings list */}
          {rankings.map((item, idx) => {
            const isBestMatch = idx === 0 && item.myRank !== null && item.partnerRank !== null;
            
            return (
              <motion.div
                key={item.ritual.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <Card className={cn(
                  "transition-all",
                  isBestMatch && "ring-2 ring-green-500 bg-green-50"
                )}>
                  <CardContent className="p-4">
                    {isBestMatch && (
                      <span className="inline-block mb-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        Best Match
                      </span>
                    )}
                    
                    <h3 className="font-bold text-base mb-2">{item.ritual.title}</h3>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        You: <span className="font-semibold text-foreground">#{item.myRank || '—'}</span>
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1">
                        {partnerName}: <span className="font-semibold text-foreground">#{item.partnerRank || '—'}</span>
                      </span>
                    </div>
                    
                    {isBestMatch && matchedSlot && (
                      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-green-700">
                          <Calendar className="w-4 h-4" />
                          {matchedDate && format(matchedDate, 'EEE, MMM d')}
                        </span>
                        <span className="flex items-center gap-1.5 text-green-700">
                          <Clock className="w-4 h-4" />
                          {getSlotDisplayName(matchedSlot.timeSlot)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Confirm button */}
      <div className="flex-none px-4 py-3 pb-safe bg-background/95 backdrop-blur-sm border-t">
        <Button
          onClick={handleConfirm}
          disabled={!matchedRitual || !matchedSlot || isConfirming}
          className="w-full h-12 bg-gradient-to-r from-primary to-purple-500 text-white"
        >
          {isConfirming ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Locking in...
            </span>
          ) : !matchedSlot ? (
            'No matching time slot'
          ) : (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Go with {matchedRitual?.title?.split(' ').slice(0, 3).join(' ')}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

