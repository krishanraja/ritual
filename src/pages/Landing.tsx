import { useNavigate } from 'react-router-dom';
import { useCouple } from '@/contexts/CoupleContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { RitualLogo } from '@/components/RitualLogo';
import { useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useCouple();
  const [showAuthBanner, setShowAuthBanner] = useState(true);

  return (
    <div className="h-screen bg-gradient-warm overflow-hidden flex flex-col">
      {/* Authenticated User Banner */}
      {user && showAuthBanner && (
        <div className="flex-none px-4 py-2 bg-primary/10 backdrop-blur-sm border-b border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground">
              You're signed in! <button onClick={() => navigate('/home')} className="underline font-semibold">Go to Dashboard →</button>
            </p>
            <button onClick={() => setShowAuthBanner(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main content - vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        {/* Logo */}
        <RitualLogo size="xl" className="max-w-[280px]" />
        
        {/* Heading */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Create Rituals Together</h1>
          <p className="text-sm text-foreground/70 max-w-sm mx-auto">
            Build weekly rituals with someone special. Both contribute, AI synthesizes your perfect week.
          </p>
        </div>
        
        {/* CTA */}
        <Button 
          onClick={() => navigate('/auth')}
          size="lg"
          className="h-14 px-12 text-lg"
        >
          Get Started
        </Button>
        
        {/* Sign in link */}
        <p className="text-xs text-muted-foreground">
          Already have an account? <button onClick={() => navigate('/auth')} className="underline">Sign In</button>
        </p>
      </div>
    </div>
  );
}
