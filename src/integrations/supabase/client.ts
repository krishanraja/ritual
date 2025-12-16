/**
 * Supabase Client
 * 
 * Centralized Supabase client instance for the application.
 * Uses validated configuration from @/lib/supabase-config
 * 
 * Import the supabase client like this:
 * import { supabase } from "@/integrations/supabase/client";
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase-config';

// Get validated configuration (will throw if env vars are missing)
const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});