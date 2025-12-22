/**
 * OfflineBanner
 * 
 * Displays a user-friendly banner when the user goes offline.
 * Uses the browser's online/offline events for detection.
 * 
 * @created 2025-12-22
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" message briefly if user was offline
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const handleRetry = () => {
    // Force a network check by attempting to fetch
    fetch('/api/health', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        setIsOnline(true);
        setWasOffline(false);
      })
      .catch(() => {
        setIsOnline(false);
      });
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  You're offline
                </p>
                <p className="text-xs text-gray-400">
                  Some features may not work. Check your connection.
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="flex-shrink-0 border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* "Back online" toast */}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 shadow-lg"
        >
          <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
            <span className="text-sm font-medium">✓ Back online</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;


