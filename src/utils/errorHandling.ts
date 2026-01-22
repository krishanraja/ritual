/**
 * Error Handling Utility
 * 
 * Centralized error mapping and user-friendly messaging for ritual flow.
 * Maps technical errors to actionable user messages.
 * 
 * @created 2026-01-22
 */

export interface ErrorContext {
  type: 'network' | 'server' | 'timeout' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
  retryDelay?: number;
}

/**
 * Map edge function errors to user-friendly messages
 */
export function mapEdgeFunctionError(error: any): ErrorContext {
  // Network errors (no response from server)
  if (!error.message && !error.status) {
    return {
      type: 'network',
      message: 'Unable to connect to server. Please check your internet connection and try again.',
      retryable: true,
      retryDelay: 2000,
    };
  }

  // HTTP status code errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return {
          type: 'validation',
          message: error.message || 'Invalid request. Please try again or contact support.',
          retryable: false,
        };
      
      case 401:
      case 403:
        return {
          type: 'validation',
          message: 'Session expired. Please sign in again.',
          retryable: false,
        };
      
      case 404:
        return {
          type: 'server',
          message: 'Service not found. Please refresh the page or contact support.',
          retryable: true,
          retryDelay: 5000,
        };
      
      case 429:
        return {
          type: 'server',
          message: 'Too many requests. Please wait a moment and try again.',
          retryable: true,
          retryDelay: 10000,
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          message: 'Server error. We\'re working on it. Please try again in a moment.',
          retryable: true,
          retryDelay: 5000,
        };
      
      default:
        return {
          type: 'unknown',
          message: `Unexpected error (${error.status}). Please try again or contact support.`,
          retryable: true,
          retryDelay: 3000,
        };
    }
  }

  // Edge function returned error message
  if (error.message) {
    // Check for specific error patterns
    if (error.message.toLowerCase().includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please try again.',
        retryable: true,
        retryDelay: 3000,
      };
    }

    if (error.message.toLowerCase().includes('network')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        retryable: true,
        retryDelay: 2000,
      };
    }

    if (error.message.toLowerCase().includes('rate limit')) {
      return {
        type: 'server',
        message: 'Too many requests. Please wait a moment and try again.',
        retryable: true,
        retryDelay: 10000,
      };
    }

    // Generic error with message
    return {
      type: 'server',
      message: error.message,
      retryable: true,
      retryDelay: 3000,
    };
  }

  // Fallback for unknown errors
  return {
    type: 'unknown',
    message: 'Something went wrong. Please try again or contact support.',
    retryable: true,
    retryDelay: 3000,
  };
}

/**
 * Map network/fetch errors to user-friendly messages
 */
export function mapNetworkError(error: any): ErrorContext {
  if (error instanceof TypeError) {
    // Network request failed (offline, CORS, etc.)
    return {
      type: 'network',
      message: 'Unable to connect. Please check your internet connection.',
      retryable: true,
      retryDelay: 2000,
    };
  }

  if (error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      retryable: true,
      retryDelay: 3000,
    };
  }

  return mapEdgeFunctionError(error);
}

/**
 * Determine if an error should be automatically retried
 */
export function shouldRetry(errorContext: ErrorContext, attemptNumber: number): boolean {
  // Don't retry non-retryable errors
  if (!errorContext.retryable) {
    return false;
  }

  // Don't retry validation errors
  if (errorContext.type === 'validation') {
    return false;
  }

  // Limit retry attempts
  const maxAttempts = 3;
  if (attemptNumber >= maxAttempts) {
    return false;
  }

  // Retry network and server errors
  return errorContext.type === 'network' || errorContext.type === 'server' || errorContext.type === 'timeout';
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return baseDelay * Math.pow(2, attemptNumber);
}

/**
 * Format error for logging/debugging
 */
export function formatErrorForLogging(error: any, context?: Record<string, any>): string {
  const errorInfo: Record<string, any> = {
    timestamp: new Date().toISOString(),
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    ...context,
  };

  // Include edge function specific info
  if (error?.status) {
    errorInfo.httpStatus = error.status;
  }

  if (error?.data) {
    errorInfo.responseData = error.data;
  }

  return JSON.stringify(errorInfo, null, 2);
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Get user-friendly message for synthesis-specific errors
 */
export function mapSynthesisError(error: any): ErrorContext {
  const context = mapEdgeFunctionError(error);

  // Enhance message for synthesis-specific scenarios
  if (context.type === 'timeout') {
    return {
      ...context,
      message: 'Ritual generation is taking longer than expected. Please try again.',
    };
  }

  if (context.type === 'server') {
    return {
      ...context,
      message: 'Unable to generate rituals right now. Please try again in a moment.',
    };
  }

  return context;
}

/**
 * LEGACY FUNCTION: Converts technical error messages to user-friendly messages
 * @deprecated Use mapEdgeFunctionError or mapNetworkError for better error context
 */
export function getUserFriendlyError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('timeout')) {
    return 'Connection error. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lowerMessage.includes('user already registered') || lowerMessage.includes('already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lowerMessage.includes('email rate limit') || lowerMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (lowerMessage.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (lowerMessage.includes('email not confirmed')) {
    return 'Please check your email and confirm your account.';
  }

  // Supabase errors
  if (lowerMessage.includes('jwt') || lowerMessage.includes('token')) {
    return 'Session expired. Please sign in again.';
  }
  if (lowerMessage.includes('row-level security') || lowerMessage.includes('rls')) {
    return 'Permission denied. Please ensure you have access to this resource.';
  }
  if (lowerMessage.includes('foreign key') || lowerMessage.includes('constraint')) {
    return 'Invalid data. Please check your input and try again.';
  }

  // Storage errors
  if (lowerMessage.includes('storage') || lowerMessage.includes('upload')) {
    if (lowerMessage.includes('file size')) {
      return 'File is too large. Please choose a smaller image (max 5MB).';
    }
    if (lowerMessage.includes('file type') || lowerMessage.includes('mime type')) {
      return 'Invalid file type. Please upload a JPEG, PNG, or WebP image.';
    }
    return 'Upload failed. Please check your connection and try again.';
  }

  // API errors
  if (lowerMessage.includes('api') || lowerMessage.includes('function')) {
    if (lowerMessage.includes('not configured') || lowerMessage.includes('missing')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    return 'Service error. Please try again in a moment.';
  }

  // Generic fallback
  return message.length > 100 ? 'An error occurred. Please try again.' : message;
}
