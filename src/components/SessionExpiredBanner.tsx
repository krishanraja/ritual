/**
 * SessionExpiredBanner
 * 
 * Shows when the user's session has expired and prompts them to sign in again.
 * Non-destructive: preserves URL for post-login redirect.
 * 
 * @created 2025-12-22
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCouple } from '@/contexts/CoupleContext';

export function SessionExpiredBanner() {
  const { isSessionExpired } = useCouple();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = () => {
    // Preserve the current path for post-login redirect
    const returnTo = location.pathname + location.search;
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <AnimatePresence>
      {isSessionExpired && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 shadow-md"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Session expired
                </p>
                <p className="text-xs text-amber-700">
                  Please sign in to continue
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSignIn}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SessionExpiredBanner;


