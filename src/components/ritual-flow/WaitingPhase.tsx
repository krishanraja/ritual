/**
 * WaitingPhase Component
 * 
 * Shows while waiting for partner to complete their step.
 * Displays user's own progress and what they're waiting for.
 * 
 * @created 2025-12-26
 */

import { motion } from 'framer-motion';
import { Clock, Star, Check, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CycleStatus, UserProgress } from '@/types/database';

interface WaitingPhaseProps {
  status: CycleStatus;
  partnerName: string;
  myProgress: UserProgress;
  statusMessage: { title: string; subtitle: string };
  onNudge?: () => void;
}

export function WaitingPhase({
  status,
  partnerName,
  myProgress,
  statusMessage,
  onNudge
}: WaitingPhaseProps) {
  const isWaitingForInput = status === 'awaiting_partner_one' || status === 'awaiting_partner_two';
  const isWaitingForPicks = status === 'awaiting_partner_one_pick' || status === 'awaiting_partner_two_pick';
  
  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-sm"
      >
        {/* Animated icon */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
        >
          {isWaitingForInput ? (
            <Clock className="w-10 h-10 text-white" />
          ) : (
            <Star className="w-10 h-10 text-white" fill="currentColor" />
          )}
        </motion.div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">{statusMessage.title}</h2>
          <p className="text-muted-foreground">
            {statusMessage.subtitle}
          </p>
        </div>
        
        {/* Show user's own submissions */}
        {isWaitingForInput && myProgress.inputDone && myProgress.inputData && (
          <div className="space-y-2 text-left bg-white/80 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Your Input Submitted
            </p>
            <div className="flex flex-wrap gap-1">
              {myProgress.inputData.cards?.slice(0, 5).map((cardId, i) => (
                <span key={i} className="px-2 py-1 bg-primary/10 rounded-full text-xs text-primary">
                  {cardId}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {isWaitingForPicks && myProgress.picksDone && (
          <div className="space-y-2 text-left bg-white/80 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Your Selections
            </p>
            {myProgress.picks.slice(0, 3).map((pick, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {pick.rank}
                </div>
                <span className="text-sm font-medium truncate">{pick.ritual_title}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Nudge button (optional) */}
        {onNudge && (
          <Button
            onClick={onNudge}
            variant="outline"
            className="gap-2"
          >
            <Bell className="w-4 h-4" />
            Send a gentle nudge
          </Button>
        )}
        
        <p className="text-xs text-muted-foreground">
          You'll be notified when {partnerName} is done
        </p>
      </motion.div>
    </div>
  );
}

