import { useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '@/contexts/CoupleContext';
import { NotificationContainer } from './InlineNotification';
import { ensureProfileExists } from '@/utils/profileUtils';

// Version tracking for deployment verification
const CODE_VERSION = '2024-12-12-v3';

interface JoinDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinDrawer = ({ open, onOpenChange }: JoinDrawerProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { refreshCouple, user } = useCouple();

  useEffect(() => {
    if (open) {
      console.log('[JOIN] Drawer opened, code version:', CODE_VERSION);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } else {
      setCode('');
      setLoading(false);
    }
  }, [open]);

  const handleJoin = async () => {
    console.log('[JOIN] === Starting join flow ===');
    console.log('[JOIN] Code version:', CODE_VERSION);
    console.log('[JOIN] User:', user?.id);
    console.log('[JOIN] User email:', user?.email);
    console.log('[JOIN] Raw code input:', code);

    if (!user) {
      console.error('[JOIN] ERROR: No user authenticated');
      setNotification({ type: 'error', message: 'Not authenticated' });
      return;
    }

    // Ensure profile exists before joining couple
    console.log('[JOIN] Ensuring profile exists for user:', user.id);
    const profileExists = await ensureProfileExists(user.id);
    if (!profileExists) {
      console.error('[JOIN] ERROR: Failed to ensure profile exists');
      setNotification({ type: 'error', message: 'Unable to create profile. Please try again.' });
      setLoading(false);
      return;
    }
    console.log('[JOIN] Profile verified/created');

    const cleanCode = code.replace(/-/g, '').toUpperCase();
    console.log('[JOIN] Clean code (no dashes):', cleanCode);
    
    if (cleanCode.length !== 8) {
      console.error('[JOIN] ERROR: Code length invalid:', cleanCode.length);
      setNotification({ type: 'error', message: 'Code must be 8 characters' });
      return;
    }

    setLoading(true);
    const formattedCode = `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
    console.log('[JOIN] Formatted code for RPC:', formattedCode);

    try {
      // Step 1: Call the SECURITY DEFINER function
      console.log('[JOIN] Calling RPC join_couple_with_code...');
      const { data, error } = await supabase
        .rpc('join_couple_with_code', { input_code: formattedCode });

      console.log('[JOIN] RPC raw response - data:', data);
      console.log('[JOIN] RPC raw response - error:', error);

      if (error) {
        console.error('[JOIN] RPC error object:', JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }

      // Parse the JSONB result
      const result = data as { 
        success: boolean; 
        error?: string; 
        couple_id?: string;
        partner_one?: string;
        partner_two?: string;
        verified?: boolean;
        debug?: any;
      };

      console.log('[JOIN] Parsed RPC result:', JSON.stringify(result, null, 2));

      if (!result?.success) {
        console.error('[JOIN] RPC returned failure:', result?.error);
        if (result?.debug) {
          console.error('[JOIN] Debug info:', JSON.stringify(result.debug, null, 2));
        }
        throw new Error(result?.error || 'Failed to join couple');
      }

      console.log('[JOIN] ✅ RPC returned success');
      console.log('[JOIN] couple_id:', result.couple_id);
      console.log('[JOIN] partner_one:', result.partner_one);
      console.log('[JOIN] partner_two:', result.partner_two);
      console.log('[JOIN] verified:', result.verified);

      // Step 2: Verify the database state independently
      console.log('[JOIN] === Starting independent verification ===');
      const { data: verifyData, error: verifyError } = await supabase
        .from('couples')
        .select('id, partner_one, partner_two, is_active')
        .eq('id', result.couple_id)
        .single();

      console.log('[JOIN] Verification query result:', JSON.stringify(verifyData, null, 2));
      console.log('[JOIN] Verification query error:', verifyError);

      if (verifyError) {
        console.error('[JOIN] ❌ Verification query failed:', verifyError.message);
        throw new Error('Could not verify join. Please try again.');
      }

      if (!verifyData?.partner_two) {
        console.error('[JOIN] ❌ CRITICAL: partner_two is NULL after successful RPC!');
        console.error('[JOIN] Expected partner_two:', user.id);
        console.error('[JOIN] Actual partner_two:', verifyData?.partner_two);
        throw new Error('Join appeared to succeed but was not saved. Please try again.');
      }

      if (verifyData.partner_two !== user.id) {
        console.error('[JOIN] ❌ CRITICAL: partner_two mismatch!');
        console.error('[JOIN] Expected:', user.id);
        console.error('[JOIN] Actual:', verifyData.partner_two);
        throw new Error('Join verification failed - user ID mismatch');
      }

      console.log('[JOIN] ✅ Verification passed - partner_two is correctly set to:', verifyData.partner_two);

      // Step 3: Refresh couple data with multiple attempts
      console.log('[JOIN] === Refreshing couple data ===');
      await refreshCouple();
      console.log('[JOIN] First refresh complete');
      
      // Extra refreshes to ensure both partners sync
      setTimeout(() => {
        console.log('[JOIN] Second refresh (500ms delay)');
        refreshCouple();
      }, 500);
      setTimeout(() => {
        console.log('[JOIN] Third refresh (1500ms delay)');
        refreshCouple();
      }, 1500);
      
      setNotification({ type: 'success', message: 'Successfully joined! 🎉' });
      console.log('[JOIN] === Join flow complete, navigating to /input ===');
      
      setTimeout(() => {
        onOpenChange(false);
        navigate('/input');
      }, 1500);
    } catch (error: any) {
      console.error('[JOIN] === Join flow FAILED ===');
      console.error('[JOIN] Error type:', error?.name);
      console.error('[JOIN] Error message:', error?.message);
      console.error('[JOIN] Full error:', error);
      setNotification({ type: 'error', message: error.message || 'Failed to join couple' });
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
          {notification && (
            <NotificationContainer
              notification={notification}
              onDismiss={() => setNotification(null)}
            />
          )}
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
