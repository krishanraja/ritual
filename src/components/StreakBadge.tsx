import { useEffect, useState } from 'react';
import { Flame, TrendingUp, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCouple } from '@/contexts/CoupleContext';
import { motion } from 'framer-motion';
import { usePremium } from '@/hooks/usePremium';
import { UpgradeModal } from './UpgradeModal';

interface StreakBadgeProps {
  showInsightsPrompt?: boolean;
}

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
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !couple) return null;

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
          <Flame className="w-5 h-5" />
          <span className="font-bold">{streak} Week Streak</span>
        </div>
        
        {/* Premium insights or upgrade prompt */}
        {showInsightsPrompt && (
          isPremium ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Longest: {longestStreak} weeks</span>
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