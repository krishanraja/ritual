/**
 * StreakBadge Component
 * 
 * Displays the couple's current streak with visual progression.
 * Badge evolves based on streak length.
 * 
 * @updated 2025-12-11 - Added visual evolution for streaks
 */

import { useEffect, useState } from 'react';
import { Flame, TrendingUp, Lock, Sparkles, Gem, Sprout, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCouple } from '@/contexts/CoupleContext';
import { motion } from 'framer-motion';
import { usePremium } from '@/hooks/usePremium';
import { UpgradeModal } from './UpgradeModal';

interface StreakBadgeProps {
  showInsightsPrompt?: boolean;
}

// Streak tier configuration
const STREAK_TIERS = [
  { min: 0, max: 0, icon: Sprout, label: 'Ready to begin', color: 'from-primary/60 to-pink-400', emoji: '✨' },
  { min: 1, max: 1, icon: Sprout, label: 'Seedling', color: 'from-green-400 to-emerald-500', emoji: '🌱' },
  { min: 2, max: 3, icon: Leaf, label: 'Growing', color: 'from-emerald-400 to-teal-500', emoji: '🌿' },
  { min: 4, max: 7, icon: Flame, label: 'On Fire', color: 'from-orange-500 to-red-500', emoji: '🔥' },
  { min: 8, max: 15, icon: Sparkles, label: 'Blazing', color: 'from-amber-400 to-orange-500', emoji: '✨' },
  { min: 16, max: Infinity, icon: Gem, label: 'Legendary', color: 'from-violet-500 to-purple-600', emoji: '💎' },
];

const getStreakTier = (streak: number) => {
  return STREAK_TIERS.find(tier => streak >= tier.min && streak <= tier.max) || STREAK_TIERS[0];
};

export const StreakBadge = ({ showInsightsPrompt = false }: StreakBadgeProps) => {
  const { couple } = useCouple();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isPremium } = usePremium();

  useEffect(() => {
    if (couple?.id) {
      fetchStreak();
    }
  }, [couple?.id]);

  const fetchStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('ritual_streaks')
        .select('current_streak, longest_streak')
        .eq('couple_id', couple!.id)
        .maybeSingle();

      if (error) throw error;
      setStreak(data?.current_streak || 0);
      setLongestStreak(data?.longest_streak || 0);
    } catch (error) {
      console.error('[StreakBadge] Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !couple) return null;

  const tier = getStreakTier(streak);
  const Icon = tier.icon;

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="space-y-2"
      >
        {/* Main badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`inline-flex items-center gap-2 bg-gradient-to-r ${tier.color} text-white px-4 py-2 rounded-full shadow-lg cursor-default`}
        >
          <Icon className="w-5 h-5" />
          {streak === 0 ? (
            <span className="font-bold text-sm">{tier.label}</span>
          ) : (
            <>
              <span className="font-bold">{streak} Week{streak !== 1 ? 's' : ''}</span>
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                {tier.label}
              </span>
            </>
          )}
        </motion.div>
        
        {/* Premium insights or upgrade prompt */}
        {showInsightsPrompt && (
          isPremium ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Longest: {longestStreak} week{longestStreak !== 1 ? 's' : ''}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <Lock className="w-3 h-3" />
              <span>See patterns & progress</span>
            </button>
          )
        )}
      </motion.div>
      
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        highlightFeature="streaks"
      />
    </>
  );
};
