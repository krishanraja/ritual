import { useState, useEffect } from 'react';
import { SAMPLE_RITUALS, getRitualsByCity } from '@/data/sampleRituals';
import { useCouple } from '@/contexts/CoupleContext';
import { supabase } from '@/integrations/supabase/client';

interface Ritual {
  id: string | number;
  title: string;
  description: string;
  time_estimate: string;
  budget_band: string;
  category?: string;
  is_sample?: boolean;
}

export function useSampleRituals() {
  const { user, couple, currentCycle } = useCouple();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [isShowingSamples, setIsShowingSamples] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);

  // Fetch user's preferred city
  useEffect(() => {
    const fetchUserCity = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('preferred_city')
        .eq('id', user.id)
        .single();
      
      setUserCity(data?.preferred_city || null);
    };

    fetchUserCity();
  }, [user]);

  useEffect(() => {
    // Safety check: if we have synthesized_output, always show real rituals
    if (currentCycle?.synthesized_output) {
      const output = currentCycle.synthesized_output as any;
      const realRituals = output.rituals || [];
      
      // Only update if we actually have rituals
      if (realRituals.length > 0) {
        setRituals(realRituals);
        setIsShowingSamples(false);
        return;
      }
    }
    
    // If couple exists but no partner yet, or no synthesized output, show samples
    if (couple) {
      const filteredRituals = userCity ? getRitualsByCity(userCity) : SAMPLE_RITUALS;
      setRituals(filteredRituals);
      setIsShowingSamples(true);
    }
    // If no couple at all, show samples
    else {
      const filteredRituals = userCity ? getRitualsByCity(userCity) : SAMPLE_RITUALS;
      setRituals(filteredRituals);
      setIsShowingSamples(true);
    }
  }, [couple, currentCycle, userCity]);

  return {
    rituals,
    isShowingSamples,
    hasSamples: rituals.length > 0,
  };
}
