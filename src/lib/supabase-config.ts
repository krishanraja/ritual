/**
 * Centralized Supabase Configuration
 * 
 * This module provides validated, type-safe access to Supabase configuration.
 * All Supabase client initialization should use values from this module.
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Full Supabase project URL (e.g., https://xxx.supabase.co)
 * - VITE_SUPABASE_PUBLISHABLE_KEY: Anon/public JWT key (safe to expose in client)
 * - VITE_SUPABASE_PROJECT_ID: Project ID (for localStorage keys and identification)
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

let cachedConfig: SupabaseConfig | null = null;

/**
 * Validates that a value is a non-empty string
 */
function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Missing or invalid ${name} environment variable. ` +
      `Please check your .env file and ensure ${name} is set correctly. ` +
      `This is required for the application to function.`
    );
  }
  return value.trim();
}

/**
 * Validates that a URL is a valid Supabase project URL
 */
function validateSupabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.endsWith('.supabase.co')) {
      throw new Error('URL must be a Supabase project URL (ending with .supabase.co)');
    }
    if (urlObj.protocol !== 'https:') {
      throw new Error('URL must use HTTPS protocol');
    }
    return url;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid Supabase URL format: ${url}`);
    }
    throw error;
  }
}

/**
 * Validates that a key is a JWT token (basic format check)
 */
function validateJWT(key: string, name: string): string {
  // JWT tokens have 3 parts separated by dots
  const parts = key.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `Invalid ${name} format. Expected JWT token with 3 parts separated by dots. ` +
      `Please verify you're using the anon/public key from Supabase dashboard, not the service role key.`
    );
  }
  return key;
}

/**
 * Gets and validates Supabase configuration from environment variables.
 * Results are cached after first call.
 * 
 * @throws Error if any required environment variable is missing or invalid
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const url = validateString(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
  const anonKey = validateString(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  );
  const projectId = validateString(
    import.meta.env.VITE_SUPABASE_PROJECT_ID,
    'VITE_SUPABASE_PROJECT_ID'
  );

  // Additional validation
  const validatedUrl = validateSupabaseUrl(url);
  const validatedKey = validateJWT(anonKey, 'VITE_SUPABASE_PUBLISHABLE_KEY');

  // Extract project ID from URL if provided, but prefer explicit env var
  const urlProjectId = validatedUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (urlProjectId && urlProjectId !== projectId) {
    console.warn(
      `[Supabase Config] Project ID mismatch: URL contains "${urlProjectId}" but ` +
      `VITE_SUPABASE_PROJECT_ID is "${projectId}". Using VITE_SUPABASE_PROJECT_ID.`
    );
  }

  cachedConfig = {
    url: validatedUrl,
    anonKey: validatedKey,
    projectId,
  };

  return cachedConfig;
}

/**
 * Gets the Supabase project URL
 */
export function getSupabaseUrl(): string {
  return getSupabaseConfig().url;
}

/**
 * Gets the Supabase anon/public key
 */
export function getSupabaseAnonKey(): string {
  return getSupabaseConfig().anonKey;
}

/**
 * Gets the Supabase project ID
 */
export function getSupabaseProjectId(): string {
  return getSupabaseConfig().projectId;
}

/**
 * Resets the cached configuration (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
