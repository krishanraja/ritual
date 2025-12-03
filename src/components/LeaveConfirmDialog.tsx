import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Heart, Calendar, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  partnerName?: string;
}

export function LeaveConfirmDialog({ open, onOpenChange, onConfirm, partnerName }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [canConfirm, setCanConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setCountdown(5);
      setCanConfirm(false);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanConfirm(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (confirmText !== 'LEAVE' || !canConfirm) return;
    
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const isValid = confirmText === 'LEAVE' && canConfirm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Leave Couple?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. You will permanently lose access to:
          </p>

          <div className="space-y-2 bg-destructive/5 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <Heart className="w-4 h-4 text-destructive" />
              <span>All shared ritual history with {partnerName || 'your partner'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-destructive" />
              <span>Your weekly ritual preferences and inputs</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Star className="w-4 h-4 text-destructive" />
              <span>Your couple's streak data and traditions</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">LEAVE</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="LEAVE"
              className="font-mono"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValid || loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : countdown > 0 ? (
                `Wait ${countdown}s...`
              ) : (
                'Leave Couple'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
