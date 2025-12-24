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
    // Check if RPC function exists by trying to call it
    let rpcWorked = false;
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('ensure_profile_exists');
      
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:71',message:'RPC call result',data:{rpcResult,rpcErrorCode:rpcError?.code,rpcErrorMessage:rpcError?.message,rpcErrorDetails:rpcError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // RPC function exists and succeeded
      if (!rpcError && rpcResult === true) {
        console.log('[PROFILE] Successfully created profile via RPC for user:', userId);
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:77',message:'RPC success, returning true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:95',message:'RPC exception',data:{errorMessage:rpcException instanceof Error ? rpcException.message : String(rpcException)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
    
    // Fallback: Try direct INSERT (requires INSERT policy)
    console.log('[PROFILE] Attempting direct INSERT for user:', userId);
    
    const profileData = {
      id: userId,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || null
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:103',message:'Attempting direct INSERT',data:{profileData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData);
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:110',message:'Direct INSERT result',data:{insertErrorCode:insertError?.code,insertErrorMessage:insertError?.message,insertErrorDetails:insertError,insertErrorHints:insertError?.hints},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (insertError) {
      // 23505 is unique constraint violation (duplicate) - ignore it (race condition)
      if (insertError.code === '23505') {
        console.log('[PROFILE] Profile already exists (race condition):', userId);
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:118',message:'Race condition detected, returning true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return true;
      }
      
      // Check if it's an RLS policy violation
      if (insertError.code === '42501' || insertError.message?.includes('permission denied') || insertError.message?.includes('policy')) {
        console.error('[PROFILE] RLS policy violation - INSERT policy may be missing:', insertError);
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:125',message:'RLS violation detected',data:{errorCode:insertError.code,errorMessage:insertError.message,errorDetails:insertError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        console.error('[PROFILE] Failed to create profile:', insertError);
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/1e40f760-cc38-4a6c-aac8-84efd2c161d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profileUtils.ts:131',message:'INSERT failed, returning false',data:{errorCode:insertError.code,errorMessage:insertError.message,errorDetails:insertError,errorHints:insertError.hints},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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




