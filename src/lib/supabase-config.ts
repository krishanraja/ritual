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
 * Returns validation result instead of throwing to allow graceful handling
 */
function validateString(value: unknown, name: string): { valid: boolean; value?: string; error?: string } {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      valid: false,
      error: `Missing or invalid ${name} environment variable. ` +
        `Please check your .env file and ensure ${name} is set correctly. ` +
        `This is required for the application to function.`
    };
  }
  return { valid: true, value: value.trim() };
}

/**
 * Validates string and throws if invalid (for backward compatibility)
 */
function validateStringOrThrow(value: unknown, name: string): string {
  const result = validateString(value, name);
  if (!result.valid) {
    throw new Error(result.error || `Invalid ${name}`);
  }
  return result.value!;
}

/**
 * Validates that a URL is a valid Supabase project URL
 * Returns validation result instead of throwing
 */
function validateSupabaseUrl(url: string): { valid: boolean; value?: string; error?: string } {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.endsWith('.supabase.co')) {
      return {
        valid: false,
        error: 'URL must be a Supabase project URL (ending with .supabase.co)'
      };
    }
    if (urlObj.protocol !== 'https:') {
      return {
        valid: false,
        error: 'URL must use HTTPS protocol'
      };
    }
    return { valid: true, value: url };
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        valid: false,
        error: `Invalid Supabase URL format: ${url}`
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown URL validation error'
    };
  }
}

/**
 * Validates URL and throws if invalid (for backward compatibility)
 */
function validateSupabaseUrlOrThrow(url: string): string {
  const result = validateSupabaseUrl(url);
  if (!result.valid) {
    throw new Error(result.error || 'Invalid URL');
  }
  return result.value!;
}

/**
 * Validates that a key is a JWT token (basic format check)
 * Returns validation result instead of throwing
 */
function validateJWT(key: string, name: string): { valid: boolean; value?: string; error?: string } {
  // JWT tokens have 3 parts separated by dots
  const parts = key.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      error: `Invalid ${name} format. Expected JWT token with 3 parts separated by dots. ` +
        `Please verify you're using the anon/public key from Supabase dashboard, not the service role key.`
    };
  }
  return { valid: true, value: key };
}

/**
 * Validates JWT and throws if invalid (for backward compatibility)
 */
function validateJWTOrThrow(key: string, name: string): string {
  const result = validateJWT(key, name);
  if (!result.valid) {
    throw new Error(result.error || 'Invalid JWT');
  }
  return result.value!;
}

/**
 * Validates Supabase configuration and returns detailed validation result
 */
export function validateSupabaseConfig(): {
  valid: boolean;
  config?: SupabaseConfig;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate URL
  const urlResult = validateString(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
  if (!urlResult.valid) {
    errors.push(urlResult.error!);
  }
  
  // Validate anon key
  const keyResult = validateString(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  );
  if (!keyResult.valid) {
    errors.push(keyResult.error!);
  }
  
  // Validate project ID
  const projectIdResult = validateString(
    import.meta.env.VITE_SUPABASE_PROJECT_ID,
    'VITE_SUPABASE_PROJECT_ID'
  );
  if (!projectIdResult.valid) {
    errors.push(projectIdResult.error!);
  }
  
  // If basic validation failed, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Additional validation - normalize URL if protocol is missing or wrong
  let urlToValidate = urlResult.value!.trim();
  // Auto-fix common issues: fix malformed protocols, add https:// if protocol is missing, or convert http:// to https://
  if (urlToValidate.startsWith('ttps://')) {
    // Fix missing "h" in "https://"
    console.warn('[Supabase Config] URL has malformed protocol (ttps://), fixing to https://');
    urlToValidate = 'https://' + urlToValidate.substring(7); // Remove "ttps://" and prepend "https://"
  } else if (urlToValidate.startsWith('ttp://')) {
    // Fix missing "h" in "http://"
    console.warn('[Supabase Config] URL has malformed protocol (ttp://), fixing to https://');
    urlToValidate = 'https://' + urlToValidate.substring(6); // Remove "ttp://" and prepend "https://"
  } else if (!urlToValidate.match(/^https?:\/\//)) {
    console.warn('[Supabase Config] URL missing protocol, adding https://');
    urlToValidate = 'https://' + urlToValidate;
  } else if (urlToValidate.startsWith('http://')) {
    console.warn('[Supabase Config] URL uses http://, converting to https://');
    urlToValidate = urlToValidate.replace(/^http:\/\//, 'https://');
  }

  const urlValidation = validateSupabaseUrl(urlToValidate);
  if (!urlValidation.valid) {
    errors.push(urlValidation.error!);
  }
  
  const keyValidation = validateJWT(keyResult.value!, 'VITE_SUPABASE_PUBLISHABLE_KEY');
  if (!keyValidation.valid) {
    errors.push(keyValidation.error!);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Extract project ID from URL if provided, but prefer explicit env var
  const urlProjectId = urlValidation.value!.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (urlProjectId && urlProjectId !== projectIdResult.value) {
    console.warn(
      `[Supabase Config] Project ID mismatch: URL contains "${urlProjectId}" but ` +
      `VITE_SUPABASE_PROJECT_ID is "${projectIdResult.value}". Using VITE_SUPABASE_PROJECT_ID.`
    );
  }
  
  const config: SupabaseConfig = {
    url: urlValidation.value!, // Use normalized URL
    anonKey: keyValidation.value!,
    projectId: projectIdResult.value!,
  };
  
  return { valid: true, config, errors: [] };
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

  // Use new validation function
  const validation = validateSupabaseConfig();
  
  if (!validation.valid) {
    // Log detailed errors
    console.error('[Supabase Config] ❌ Configuration validation failed:');
    validation.errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
    
    // Throw with all errors
    throw new Error(
      `Supabase configuration is invalid:\n${validation.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required environment variables are set correctly.`
    );
  }

  cachedConfig = validation.config!;
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
