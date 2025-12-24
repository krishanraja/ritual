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
  // #region agent log
  fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:17',message:'ensureProfileExists called',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    // Verify user is authenticated and matches userId
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:25',message:'Auth user check',data:{hasUser:!!user,userId:user?.id,matches:user?.id===userId,userError:userError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (userError || !user || user.id !== userId) {
      console.error('[PROFILE] Failed to get user data or user mismatch:', userError);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:30',message:'Auth check failed',data:{userError:userError?.message,hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    // Check if profile exists
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:38',message:'Profile check result',data:{exists:!!existing,checkErrorCode:checkError?.code,checkErrorMessage:checkError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (existing) {
      console.log('[PROFILE] Profile already exists for user:', userId);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:42',message:'Profile exists, returning true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // Profile doesn't exist - check if it's a "not found" error or a real error
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if profile doesn't exist
      console.error('[PROFILE] Error checking profile:', checkError);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:48',message:'Profile check error (not PGRST116)',data:{errorCode:checkError.code,errorMessage:checkError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    // Try RPC function first (more secure, bypasses RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('ensure_profile_exists');
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:54',message:'RPC call result',data:{rpcResult,rpcErrorCode:rpcError?.code,rpcErrorMessage:rpcError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!rpcError && rpcResult === true) {
      console.log('[PROFILE] Successfully created profile via RPC for user:', userId);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:59',message:'RPC success, returning true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // Fallback: Try direct INSERT (requires INSERT policy)
    console.warn('[PROFILE] RPC failed, trying direct INSERT:', rpcError?.message);
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || null
      });
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:72',message:'Direct INSERT result',data:{insertErrorCode:insertError?.code,insertErrorMessage:insertError?.message,insertErrorDetails:insertError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (insertError) {
      // 23505 is unique constraint violation (duplicate) - ignore it (race condition)
      if (insertError.code === '23505') {
        console.log('[PROFILE] Profile already exists (race condition):', userId);
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:78',message:'Race condition detected, returning true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return true;
      }
      console.error('[PROFILE] Failed to create profile:', insertError);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:83',message:'INSERT failed, returning false',data:{errorCode:insertError.code,errorMessage:insertError.message,errorDetails:insertError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    console.log('[PROFILE] Successfully created profile via direct INSERT for user:', userId);
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:88',message:'Direct INSERT success, returning true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return true;
  } catch (error) {
    console.error('[PROFILE] Unexpected error in ensureProfileExists:', error);
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:92',message:'Exception caught',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return false;
  }
}




