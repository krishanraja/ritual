/**
 * Production-safe logging utility
 * 
 * Redacts sensitive data in production while allowing full logging in development.
 * 
 * @created 2025-12-22
 */

const isDev = import.meta.env.DEV;

/**
 * Patterns to redact in production logs
 */
const SENSITIVE_PATTERNS = [
  // UUIDs (user IDs, couple IDs, etc.)
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Couple codes (XXXX-XXXX pattern)
  /[A-Z0-9]{4}-[A-Z0-9]{4}/g,
  // JWT tokens
  /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
];

/**
 * Redact sensitive data from a string
 */
function redactString(str: string): string {
  if (isDev) return str;
  
  let result = str;
  SENSITIVE_PATTERNS.forEach((pattern, index) => {
    const replacements = ['[ID]', '[EMAIL]', '[CODE]', '[TOKEN]'];
    result = result.replace(pattern, replacements[index] || '[REDACTED]');
  });
  return result;
}

/**
 * Recursively redact sensitive data from an object
 */
function redactObject(obj: unknown): unknown {
  if (isDev) return obj;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return redactString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Completely redact known sensitive keys
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'session'];
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactObject(value);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Format arguments for logging, redacting sensitive data in production
 */
function formatArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return redactString(arg);
    }
    if (typeof arg === 'object') {
      return redactObject(arg);
    }
    return arg;
  });
}

/**
 * Logger interface matching console methods
 */
interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

/**
 * Production-safe logger
 * 
 * In development: Logs everything as-is
 * In production: Redacts sensitive data (IDs, emails, tokens, codes)
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * logger.log('[AUTH] User signed in:', userId);
 */
export const logger: Logger = {
  log: (...args: unknown[]) => {
    console.log(...formatArgs(args));
  },
  info: (...args: unknown[]) => {
    console.info(...formatArgs(args));
  },
  warn: (...args: unknown[]) => {
    console.warn(...formatArgs(args));
  },
  error: (...args: unknown[]) => {
    console.error(...formatArgs(args));
  },
  debug: (...args: unknown[]) => {
    // Only log debug messages in development
    if (isDev) {
      console.debug(...args);
    }
  },
};

/**
 * Debug-only logging that is completely stripped in production
 */
export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log('[DEV]', ...args);
  }
}

/**
 * Diagnostic logging with structured format
 * Only outputs in development mode
 */
export function diagLog(category: string, message: string, data?: Record<string, unknown>): void {
  if (!isDev) return;
  
  console.log(`[DIAG] [${category}] ${message}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

export default logger;


