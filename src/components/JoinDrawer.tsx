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
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const codeInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { refreshCouple, user } = useCouple();

  useEffect(() => {
    if (open) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const formattedCode = code.replace('-', '');
    if (formattedCode.length === 8) {
      validateCode();
    } else {
      setIsCodeValid(null);
      setErrorMessage('');
    }
  }, [code]);

  const validateCode = async () => {
    setValidating(true);
    setErrorMessage('');
    try {
      const { data } = await supabase
        .from('couples')
        .select('id, partner_two, code_expires_at, is_active')
        .eq('couple_code', code)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!data) {
        setIsCodeValid(false);
        setErrorMessage('Invalid code');
        return;
      }

      if (data.partner_two) {
        setIsCodeValid(false);
        setErrorMessage('Code already used');
        return;
      }

      // Check expiration
      if (new Date(data.code_expires_at) < new Date()) {
        setIsCodeValid(false);
        setErrorMessage('Code expired');
        return;
      }

      setIsCodeValid(true);
    } catch (error) {
      setIsCodeValid(false);
      setErrorMessage('Error validating code');
    } finally {
      setValidating(false);
    }
  };

  const handleJoin = async () => {
    const formattedCode = code.replace('-', '');
    if (!name.trim() || formattedCode.length !== 8) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isCodeValid) {
      toast.error(errorMessage || 'Invalid code');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');

      // Update profile name
      await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user.id);

      // Find and join couple
      const { data: couple } = await supabase
        .from('couples')
        .select('*')
        .eq('couple_code', code)
        .eq('is_active', true)
        .single();

      if (!couple) throw new Error('Invalid code');
      if (couple.partner_two) throw new Error('Code already used');
      if (couple.partner_one === user.id) throw new Error("Can't join your own code");
      if (new Date(couple.code_expires_at) < new Date()) throw new Error('Code expired');

      await supabase
        .from('couples')
        .update({ partner_two: user.id })
        .eq('id', couple.id)
        .is('partner_two', null);

      await refreshCouple();
      toast.success('Successfully joined! 🎉');
      onOpenChange(false);
      setCode('');
      setName('');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join');
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="h-12 text-lg rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Couple Code</Label>
              <div className="relative">
                <Input
                  ref={codeInputRef}
                  id="code"
                  placeholder="XXXX-XXXX"
                  value={code}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                    // Auto-format with dash
                    if (val.length > 4 && !val.includes('-')) {
                      val = val.slice(0, 4) + '-' + val.slice(4);
                    }
                    setCode(val.slice(0, 9)); // Max length with dash
                  }}
                  maxLength={9}
                  className={`h-16 text-center text-2xl font-bold font-mono tracking-widest rounded-xl ${
                    code.replace('-', '').length === 8
                      ? isCodeValid 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-destructive bg-destructive/10'
                      : ''
                  }`}
                />
                {validating && code.replace('-', '').length === 8 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {code.replace('-', '').length === 8 && !validating && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              {code.replace('-', '').length === 8 && isCodeValid && (
                <p className="text-sm text-green-600">Code is valid! ✓</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={loading || !isCodeValid || !name.trim()}
            className="w-full bg-gradient-ritual text-white hover:opacity-90 h-12 rounded-xl"
          >
            {loading ? 'Joining...' : 'Join Couple'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};