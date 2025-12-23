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
 * @param userId - The user ID to check/create profile for
 * @returns true if profile exists or was created, false otherwise
 */
export async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
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
    
    // Get user data from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.id !== userId) {
      console.error('[PROFILE] Failed to get user data:', userError);
      return false;
    }
    
    // Create profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || null
      });
    
    if (insertError) {
      // 23505 is unique constraint violation (duplicate) - ignore it
      if (insertError.code === '23505') {
        console.log('[PROFILE] Profile already exists (race condition):', userId);
        return true;
      }
      console.error('[PROFILE] Failed to create profile:', insertError);
      return false;
    }
    
    console.log('[PROFILE] Successfully created profile for user:', userId);
    return true;
  } catch (error) {
    console.error('[PROFILE] Unexpected error in ensureProfileExists:', error);
    return false;
  }
}

