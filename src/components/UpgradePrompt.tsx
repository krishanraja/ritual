import { motion } from 'framer-motion';
import { Lock, Sparkles, Camera, Bell, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PREMIUM_PRICE } from '@/hooks/usePremium';

type PromptType = 'nudge' | 'photo' | 'streak' | 'ritual' | 'swap';

interface UpgradePromptProps {
  type: PromptType;
  onClick: () => void;
  variant?: 'inline' | 'card' | 'banner';
}

const prompts: Record<PromptType, { icon: any; title: string; message: string }> = {
  nudge: {
    icon: Bell,
    title: "You've used your weekly nudge",
    message: 'Unlimited nudges in Premium',
  },
  photo: {
    icon: Camera,
    title: 'Save photos & build your story',
    message: 'Photo memories are a Premium feature',
  },
  streak: {
    icon: TrendingUp,
    title: 'Keep going!',
    message: 'Premium shows your patterns and progress',
  },
  ritual: {
    icon: Sparkles,
    title: 'More rituals unlocked',
    message: 'Upgrade to see all your weekly options',
  },
  swap: {
    icon: Lock,
    title: 'Swaps are a Premium feature',
    message: 'Get 3+ swaps per week with Premium',
  },
};

export function UpgradePrompt({ type, onClick, variant = 'inline' }: UpgradePromptProps) {
  const { icon: Icon, title, message } = prompts[type];

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-ritual text-white rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white/20">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-white/80">{message}</p>
          </div>
          <Button
            onClick={onClick}
            size="sm"
            className="bg-white text-primary hover:bg-white/90 flex-shrink-0"
          >
            Upgrade
          </Button>
        </div>
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card 
          onClick={onClick}
          className="cursor-pointer border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <CardContent className="p-4 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <Button className="bg-gradient-ritual text-white">
              Unlock for {PREMIUM_PRICE}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Inline variant
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
        <Lock className="w-3 h-3 text-primary flex-shrink-0" />
      </div>
    </motion.button>
  );
}
