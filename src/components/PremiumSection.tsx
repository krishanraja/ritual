import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Settings, Calendar, Check, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePremium, PREMIUM_PRICE } from '@/hooks/usePremium';
import { UpgradeModal } from './UpgradeModal';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function PremiumSection() {
  const { isPremium, expiresAt, isLoading } = usePremium();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {}
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening portal:', err);
    } finally {
      setManagingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-white/90">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded w-full" />
        </div>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/30">
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">Premium Active</span>
          </div>
          
          {expiresAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Renews {format(expiresAt, 'MMM d, yyyy')}</span>
            </div>
          )}

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>5 weekly rituals</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Photo memories</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Unlimited nudges</span>
            </div>
          </div>

          <Button
            onClick={handleManageSubscription}
            disabled={managingPortal}
            variant="outline"
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            {managingPortal ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Free tier view
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card 
          onClick={() => setShowUpgrade(true)}
          className="cursor-pointer p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40 transition-colors"
        >
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-ritual">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Upgrade to Premium</p>
                <p className="text-xs text-muted-foreground">
                  Unlock the full experience for {PREMIUM_PRICE}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>5 weekly rituals</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>Photo memories</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>Unlimited nudges</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>Advanced insights</span>
              </div>
            </div>

            <Button className="w-full bg-gradient-ritual text-white hover:opacity-90">
              See All Benefits
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <UpgradeModal 
        open={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
      />
    </>
  );
}
