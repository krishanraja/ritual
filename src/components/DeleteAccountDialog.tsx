import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export function DeleteAccountDialog({ open, onOpenChange, userEmail }: Props) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [canConfirm, setCanConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmEmail('');
      setCountdown(5);
      setCanConfirm(false);
      setError(null);
      
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

  const handleDelete = async () => {
    if (confirmEmail !== userEmail || !canConfirm) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-account');
      
      if (fnError) throw fnError;
      
      // Sign out after deletion
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again or contact support.');
      setLoading(false);
    }
  };

  const isValid = confirmEmail === userEmail && canConfirm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-destructive">This action is permanent</p>
                <p className="text-muted-foreground mt-1">
                  Your account and all associated data will be permanently deleted. This includes:
                </p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground ml-7 space-y-1 list-disc">
              <li>Your profile and preferences</li>
              <li>All couple connections</li>
              <li>Ritual history and memories</li>
              <li>Bucket list items</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type your email to confirm:
            </label>
            <Input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={userEmail}
              type="email"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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
              onClick={handleDelete}
              disabled={!isValid || loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : countdown > 0 ? (
                `Wait ${countdown}s...`
              ) : (
                'Delete Account'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
