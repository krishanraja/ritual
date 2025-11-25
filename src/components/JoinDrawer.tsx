import { useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '@/contexts/CoupleContext';

interface JoinDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinDrawer = ({ open, onOpenChange }: JoinDrawerProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { refreshCouple, user } = useCouple();

  useEffect(() => {
    if (open) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } else {
      setCode('');
      setLoading(false);
    }
  }, [open]);

  const handleJoin = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const cleanCode = code.replace(/-/g, '').toUpperCase();
    
    if (cleanCode.length !== 8) {
      toast.error('Code must be 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Format to XXXX-XXXX
      const formattedCode = `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;

      // Single simple query - no .or(), no timeout, no legacy support
      const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('id, partner_one, partner_two')
        .eq('couple_code', formattedCode)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Validation
      if (!couple) {
        throw new Error('Code not found. Check with your partner.');
      }

      if (couple.partner_two) {
        throw new Error('This couple is already complete.');
      }

      if (couple.partner_one === user.id) {
        throw new Error("You can't join your own code!");
      }

      // Update partner_two
      const { error: updateError } = await supabase
        .from('couples')
        .update({ partner_two: user.id })
        .eq('id', couple.id);

      if (updateError) throw updateError;

      await refreshCouple();
      
      toast.success('Successfully joined! 🎉');
      onOpenChange(false);
      navigate('/input');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join couple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-gradient-warm border-none">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-2xl font-bold">Join a Couple</DrawerTitle>
          <p className="text-muted-foreground mt-2">
            Enter your partner's code to get started
          </p>
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Couple Code</Label>
            <Input
              ref={codeInputRef}
              id="code"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(e) => {
                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (val.length > 4) {
                  val = val.slice(0, 4) + '-' + val.slice(4);
                }
                setCode(val.slice(0, 9));
              }}
              maxLength={9}
              className="h-16 text-center text-2xl font-bold font-mono tracking-widest rounded-xl"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={loading || code.replace(/-/g, '').length !== 8}
              className="flex-1 bg-gradient-ritual text-white hover:opacity-90 h-12 rounded-xl"
            >
              {loading ? 'Joining...' : 'Join Couple'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
