/**
 * NetworkStatus Component
 *
 * Shows connection quality indicator to users.
 * Only displays when connection is degraded or offline.
 *
 * @created 2026-01-22
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { WifiOff, Wifi } from 'lucide-react';

interface NetworkStatusProps {
  isRealtimeConnected: boolean;
  lastSyncTime: Date | null;
}

export function NetworkStatus({ isRealtimeConnected, lastSyncTime }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const timeSinceSync = lastSyncTime ? Date.now() - lastSyncTime.getTime() : Infinity;

  // Connection quality: excellent | good | degraded | offline
  const quality =
    !isOnline ? 'offline' :
    !isRealtimeConnected ? 'degraded' :
    timeSinceSync > 30000 ? 'degraded' :
    timeSinceSync > 10000 ? 'good' :
    'excellent';

  // Only show if not excellent
  if (quality === 'excellent') return null;

  return (
    <div className={cn(
      "fixed top-2 left-1/2 -translate-x-1/2 z-50",
      "px-3 py-1 rounded-full text-xs font-medium",
      "flex items-center gap-1.5",
      "backdrop-blur-sm",
      quality === 'offline' && "bg-red-100/90 text-red-700",
      quality === 'degraded' && "bg-amber-100/90 text-amber-700",
      quality === 'good' && "bg-blue-100/90 text-blue-600"
    )}>
      {quality === 'offline' ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <div className={cn(
          "w-2 h-2 rounded-full",
          quality === 'degraded' && "bg-amber-500 animate-pulse",
          quality === 'good' && "bg-blue-500"
        )} />
      )}
      <span>
        {quality === 'offline' && 'Offline'}
        {quality === 'degraded' && 'Connection degraded'}
        {quality === 'good' && 'Reconnecting...'}
      </span>
    </div>
  );
}
