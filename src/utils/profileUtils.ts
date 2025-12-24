/**
 * Profile Utility Functions
 * 
 * Ensures profiles exist before operations that require them.
 * Handles profile creation if missing (idempotent).
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures a profile exists for the given user ID.
 * Creates the profile if it doesn't exist.
 * 
 * Uses RPC function for secure profile creation that bypasses RLS.
 * Falls back to direct INSERT if RPC is unavailable.
 * 
 * @param userId - The user ID to check/create profile for
 * @returns true if profile exists or was created, false otherwise
 */
export async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
    // Verify user is authenticated and matches userId
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || user.id !== userId) {
      console.error('[PROFILE] Failed to get user data or user mismatch:', userError);
      return false;
    }
    
    // Check if profile exists
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existing) {
      console.log('[PROFILE] Profile already exists for user:', userId);
      return true;
    }
    
    // Profile doesn't exist - check if it's a "not found" error or a real error
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if profile doesn't exist
      console.error('[PROFILE] Error checking profile:', checkError);
      return false;
    }
    
    // Try RPC function first (more secure, bypasses RLS)
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('ensure_profile_exists');
      
      // RPC function exists and succeeded
      if (!rpcError && rpcResult === true) {
        console.log('[PROFILE] Successfully created profile via RPC for user:', userId);
        return true;
      }
      
      // RPC function exists but returned false or had an error
      if (rpcError) {
        console.warn('[PROFILE] RPC function error:', rpcError);
        // If function doesn't exist (42883), skip to direct INSERT
        if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
          console.warn('[PROFILE] RPC function does not exist, using direct INSERT');
        } else {
          // Other RPC error - log but continue to fallback
          console.warn('[PROFILE] RPC error, falling back to direct INSERT:', rpcError.message);
        }
      } else if (rpcResult === false) {
        console.warn('[PROFILE] RPC function returned false, trying direct INSERT');
      }
    } catch (rpcException) {
      // RPC call threw an exception (function might not exist)
      console.warn('[PROFILE] RPC call exception, using direct INSERT:', rpcException);
    }
    
    // Fallback: Try direct INSERT (requires INSERT policy)
    console.log('[PROFILE] Attempting direct INSERT for user:', userId);
    
    const profileData = {
      id: userId,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || null
    };
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData);
    
    if (insertError) {
      // 23505 is unique constraint violation (duplicate) - ignore it (race condition)
      if (insertError.code === '23505') {
        console.log('[PROFILE] Profile already exists (race condition):', userId);
        return true;
      }
      
      // Check if it's an RLS policy violation
      if (insertError.code === '42501' || insertError.message?.includes('permission denied') || insertError.message?.includes('policy')) {
        console.error('[PROFILE] RLS policy violation - INSERT policy may be missing:', insertError);
      } else {
        console.error('[PROFILE] Failed to create profile:', insertError);
      }
      
      return false;
    }
    
    console.log('[PROFILE] Successfully created profile via direct INSERT for user:', userId);
    return true;
  } catch (error) {
    console.error('[PROFILE] Unexpected error in ensureProfileExists:', error);
    return false;
  }
}




