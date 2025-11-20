import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCouple } from '@/contexts/CoupleContext';
import { TokenPosition, TokenType, PartnerPresence } from '@/types/magneticCanvas';

interface SyncMessage {
  type: 'token_move' | 'token_snap' | 'canvas_complete';
  userId: string;
  tokenId?: TokenType;
  position?: TokenPosition;
  canvasState?: any;
}

export const useMagneticSync = (weeklyCycleId: string) => {
  const { user, couple } = useCouple();
  const [partnerPresence, setPartnerPresence] = useState<PartnerPresence | null>(null);
  const [partnerTokens, setPartnerTokens] = useState<Map<TokenType, TokenPosition>>(new Map());
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);

  const broadcastTokenMove = useCallback((tokenId: TokenType, position: TokenPosition) => {
    if (!user) return;
    
    const channel = supabase.channel(`canvas:${weeklyCycleId}`);
    channel.send({
      type: 'broadcast',
      event: 'token_move',
      payload: {
        type: 'token_move',
        userId: user.id,
        tokenId,
        position
      } as SyncMessage
    });
  }, [user, weeklyCycleId]);

  const broadcastTokenSnap = useCallback((tokenId: TokenType, position: TokenPosition) => {
    if (!user) return;
    
    const channel = supabase.channel(`canvas:${weeklyCycleId}`);
    channel.send({
      type: 'broadcast',
      event: 'token_snap',
      payload: {
        type: 'token_snap',
        userId: user.id,
        tokenId,
        position
      } as SyncMessage
    });
  }, [user, weeklyCycleId]);

  const broadcastCanvasComplete = useCallback(async (canvasState: any) => {
    if (!user || !couple) return;
    
    const isPartnerOne = couple.partner_one === user.id;
    const updateField = isPartnerOne ? 'canvas_state_one' : 'canvas_state_two';
    
    await supabase
      .from('weekly_cycles')
      .update({ [updateField]: canvasState })
      .eq('id', weeklyCycleId);

    const channel = supabase.channel(`canvas:${weeklyCycleId}`);
    channel.send({
      type: 'broadcast',
      event: 'canvas_complete',
      payload: {
        type: 'canvas_complete',
        userId: user.id,
        canvasState
      } as SyncMessage
    });
  }, [user, couple, weeklyCycleId]);

  useEffect(() => {
    if (!user || !couple) return;

    const channel = supabase.channel(`canvas:${weeklyCycleId}`);
    const partnerId = couple.partner_one === user.id ? couple.partner_two : couple.partner_one;

    channel
      .on('broadcast', { event: 'token_move' }, ({ payload }: { payload: SyncMessage }) => {
        if (payload.userId === partnerId && payload.tokenId && payload.position) {
          setPartnerTokens(prev => {
            const updated = new Map(prev);
            updated.set(payload.tokenId!, payload.position!);
            return updated;
          });
          setPartnerPresence({
            position: payload.position,
            activeToken: payload.tokenId
          });
        }
      })
      .on('broadcast', { event: 'token_snap' }, ({ payload }: { payload: SyncMessage }) => {
        if (payload.userId === partnerId && payload.tokenId && payload.position) {
          setPartnerTokens(prev => {
            const updated = new Map(prev);
            updated.set(payload.tokenId!, payload.position!);
            return updated;
          });
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences = Object.values(state).flat() as any[];
        const partner = presences.find((p: any) => p.user_id === partnerId);
        setIsPartnerOnline(!!partner);
      })
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        const partner = newPresences.find((p: any) => p.user_id === partnerId);
        if (partner) setIsPartnerOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        const partner = leftPresences.find((p: any) => p.user_id === partnerId);
        if (partner) setIsPartnerOnline(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, couple, weeklyCycleId]);

  return {
    partnerPresence,
    partnerTokens,
    isPartnerOnline,
    broadcastTokenMove,
    broadcastTokenSnap,
    broadcastCanvasComplete
  };
};
