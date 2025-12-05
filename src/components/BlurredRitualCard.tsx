import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlurredRitualCardProps {
  title?: string;
  onClick: () => void;
  className?: string;
}

export function BlurredRitualCard({ title, onClick, className }: BlurredRitualCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Card className={cn(
        "cursor-pointer relative overflow-hidden",
        className
      )}>
        <CardContent className="p-3">
          {/* Blurred content placeholder */}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-muted rounded blur-sm w-3/4" />
              <div className="h-3 bg-muted/70 rounded blur-sm w-full" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded blur-sm" />
                <div className="h-5 w-12 bg-muted rounded blur-sm" />
              </div>
            </div>
            <div className="flex-none w-10 h-10 rounded-full bg-muted flex items-center justify-center blur-sm">
              <span className="text-xs text-muted-foreground">+</span>
            </div>
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/90 to-background/80 flex items-center justify-center">
            <div className="text-center space-y-2 px-4">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-primary">
                Unlock to see this ritual
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface LockedRitualsPromptProps {
  count: number;
  onClick: () => void;
}

export function LockedRitualsPrompt({ count, onClick }: LockedRitualsPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Card 
        onClick={onClick}
        className="cursor-pointer border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {count} more ritual{count > 1 ? 's' : ''} available
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to see all your weekly options
              </p>
            </div>
            <Lock className="w-4 h-4 text-primary" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
