/**
 * useSyncEngine Hook
 *
 * Unified state synchronization engine for ritual flow.
 * Replaces 3 conflicting update mechanisms with single coordinated system.
 *
 * Architecture:
 * - Realtime-first: Primary state updates via Supabase realtime
 * - Polling backup: Activates only when realtime fails
 * - Update deduplication: Prevents duplicate state updates
 * - Debouncing: 500ms window to batch rapid updates
 *
 * @created 2026-01-22
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WeeklyCycle, RitualPreference, AvailabilitySlot } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

const HEARTBEAT_INTERVAL_MS = 10000; // Check realtime health every 10s
const POLLING_INTERVAL_MS = 5000; // Poll every 5s when realtime is down
const DEBOUNCE_WINDOW_MS = 500; // Batch updates within 500ms
const REALTIME_TIMEOUT_MS = 15000; // Consider realtime dead after 15s of no updates

interface UseSyncEngineOptions {
  cycleId: string | null;
  userId: string | null;
  partnerId: string | null;
  onCycleUpdate: (cycle: WeeklyCycle) => void;
  onPicksUpdate: (myPicks: RitualPreference[], partnerPicks: RitualPreference[]) => void;
  onSlotsUpdate: (mySlots: AvailabilitySlot[], partnerSlots: AvailabilitySlot[]) => void;
}

interface UseSyncEngineReturn {
  isRealtimeConnected: boolean;
  lastSyncTime: Date | null;
  forceSync: () => Promise<void>;
  isSyncing: boolean;
}

export function useSyncEngine(options: UseSyncEngineOptions): UseSyncEngineReturn {
  const {
    cycleId,
    userId,
    partnerId,
    onCycleUpdate,
    onPicksUpdate,
    onSlotsUpdate,
  } = options;

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateTimestampRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRealtimeActivityRef = useRef<number>(Date.now());

  // ============================================================================
  // Core Sync Function
  // ============================================================================

  const syncFromServer = useCallback(async () => {
    if (!cycleId || !userId || !partnerId) return;

    try {
      setIsSyncing(true);

      // Fetch cycle data
      const { data: cycleData } = await supabase
        .from('weekly_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (cycleData) {
        onCycleUpdate(cycleData as WeeklyCycle);
      }

      // Fetch picks for both partners
      const { data: picksData } = await supabase
        .from('ritual_preferences')
        .select('*')
        .eq('weekly_cycle_id', cycleId)
        .order('rank', { ascending: true });

      if (picksData) {
        const myPicks = picksData.filter(p => p.user_id === userId);
        const partnerPicks = picksData.filter(p => p.user_id === partnerId);
        onPicksUpdate(myPicks, partnerPicks);
      }

      // Fetch slots for both partners
      const { data: slotsData } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('weekly_cycle_id', cycleId);

      if (slotsData) {
        const mySlots = slotsData.filter(s => s.user_id === userId);
        const partnerSlots = slotsData.filter(s => s.user_id === partnerId);
        onSlotsUpdate(mySlots, partnerSlots);
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('[useSyncEngine] Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [cycleId, userId, partnerId, onCycleUpdate, onPicksUpdate, onSlotsUpdate]);

  // ============================================================================
  // Debounced Update Handler
  // ============================================================================

  const scheduleUpdate = useCallback((updateFn: () => void) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule update after debounce window
    debounceTimerRef.current = setTimeout(() => {
      const now = Date.now();

      // Deduplicate: Only update if enough time has passed since last update
      if (now - lastUpdateTimestampRef.current > DEBOUNCE_WINDOW_MS) {
        lastUpdateTimestampRef.current = now;
        updateFn();
      }
    }, DEBOUNCE_WINDOW_MS);
  }, []);

  // ============================================================================
  // Realtime Subscription
  // ============================================================================

  useEffect(() => {
    if (!cycleId || !userId) return;

    console.log('[useSyncEngine] Setting up realtime subscription for cycle:', cycleId);

    const channel = supabase.channel(`sync-engine-${cycleId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'weekly_cycles',
        filter: `id=eq.${cycleId}`
      }, (payload) => {
        console.log('[useSyncEngine] 🔴 Realtime: Cycle updated');
        lastRealtimeActivityRef.current = Date.now();
        scheduleUpdate(() => {
          onCycleUpdate(payload.new as WeeklyCycle);
          setLastSyncTime(new Date());
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ritual_preferences',
        filter: `weekly_cycle_id=eq.${cycleId}`
      }, () => {
        console.log('[useSyncEngine] 🔴 Realtime: Picks updated');
        lastRealtimeActivityRef.current = Date.now();
        scheduleUpdate(async () => {
          const { data } = await supabase
            .from('ritual_preferences')
            .select('*')
            .eq('weekly_cycle_id', cycleId)
            .order('rank', { ascending: true });

          if (data && partnerId) {
            const myPicks = data.filter(p => p.user_id === userId);
            const partnerPicks = data.filter(p => p.user_id === partnerId);
            onPicksUpdate(myPicks, partnerPicks);
            setLastSyncTime(new Date());
          }
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability_slots',
        filter: `weekly_cycle_id=eq.${cycleId}`
      }, () => {
        console.log('[useSyncEngine] 🔴 Realtime: Slots updated');
        lastRealtimeActivityRef.current = Date.now();
        scheduleUpdate(async () => {
          const { data } = await supabase
            .from('availability_slots')
            .select('*')
            .eq('weekly_cycle_id', cycleId);

          if (data && partnerId) {
            const mySlots = data.filter(s => s.user_id === userId);
            const partnerSlots = data.filter(s => s.user_id === partnerId);
            onSlotsUpdate(mySlots, partnerSlots);
            setLastSyncTime(new Date());
          }
        });
      })
      .subscribe((status) => {
        console.log('[useSyncEngine] Realtime subscription status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED') {
          lastRealtimeActivityRef.current = Date.now();
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[useSyncEngine] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [cycleId, userId, partnerId, scheduleUpdate, onCycleUpdate, onPicksUpdate, onSlotsUpdate]);

  // ============================================================================
  // Heartbeat Monitor
  // ============================================================================

  useEffect(() => {
    if (!cycleId) return;

    const checkRealtimeHealth = () => {
      const timeSinceLastActivity = Date.now() - lastRealtimeActivityRef.current;

      if (timeSinceLastActivity > REALTIME_TIMEOUT_MS) {
        console.warn('[useSyncEngine] ⚠️ Realtime appears inactive, may need polling backup');
        setIsRealtimeConnected(false);
      }
    };

    heartbeatIntervalRef.current = setInterval(checkRealtimeHealth, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [cycleId]);

  // ============================================================================
  // Polling Backup (Only When Realtime Fails)
  // ============================================================================

  useEffect(() => {
    if (!cycleId || isRealtimeConnected) {
      // Clear polling if realtime is healthy
      if (pollingIntervalRef.current) {
        console.log('[useSyncEngine] ✅ Realtime healthy, stopping polling backup');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Realtime is down, activate polling backup
    console.log('[useSyncEngine] 🔄 Realtime unavailable, activating polling backup');

    const poll = async () => {
      console.log('[useSyncEngine] 🔵 Polling: Checking for updates...');
      await syncFromServer();
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL_MS);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [cycleId, isRealtimeConnected, syncFromServer]);

  // ============================================================================
  // Manual Force Sync
  // ============================================================================

  const forceSync = useCallback(async () => {
    console.log('[useSyncEngine] 🔄 Force sync requested');
    await syncFromServer();
  }, [syncFromServer]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    isRealtimeConnected,
    lastSyncTime,
    forceSync,
    isSyncing,
  };
}
