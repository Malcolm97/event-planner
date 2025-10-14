import { ErrorResponse, ErrorType } from './errorHandler';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
  success: boolean;
}

// Rate limit info
export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Enhanced fetch wrapper with error handling and rate limiting
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const rateLimitInfo: RateLimitInfo = {
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '100'),
      resetTime: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
    };

    // Check for rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      return {
        success: false,
        error: {
          error: 'Too many requests',
          type: ErrorType.RATE_LIMIT_ERROR,
          details: { retryAfter, ...rateLimitInfo },
          timestamp: new Date().toISOString(),
        }
      };
    }

    // Handle successful responses
    if (response.ok) {
      try {
        const data = await response.json();
        return { data, success: true };
      } catch (error) {
        // Handle empty responses (like 204 No Content)
        return { success: true };
      }
    }

    // Handle error responses
    try {
      const errorData = await response.json() as ErrorResponse;
      return {
        success: false,
        error: errorData
      };
    } catch (error) {
      // Fallback for non-JSON error responses
      return {
        success: false,
        error: {
          error: response.statusText || 'Unknown error',
          type: ErrorType.INTERNAL_ERROR,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = this.baseURL + endpoint;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = this.baseURL + endpoint;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = this.baseURL + endpoint;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = this.baseURL + endpoint;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Helper functions for common API operations
export const apiHelpers = {
  // Get auth headers for authenticated requests
  getAuthHeaders: async (): Promise<Record<string, string>> => {
    try {
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`,
        };
      }
    } catch (error) {
      console.error('Failed to get auth headers:', error);
    }

    return {};
  },

  // Handle API errors with user-friendly messages
  handleApiError: (error: ErrorResponse | undefined): string => {
    if (!error) return 'An unknown error occurred';

    switch (error.type) {
      case 'VALIDATION_ERROR':
        return error.details?.message || error.error;
      case 'AUTHENTICATION_ERROR':
        return 'Please sign in to continue';
      case 'AUTHORIZATION_ERROR':
        return 'You do not have permission to perform this action';
      case 'NOT_FOUND_ERROR':
        return 'The requested resource was not found';
      case 'RATE_LIMIT_ERROR':
        const retryAfter = error.details?.retryAfter;
        return retryAfter
          ? `Too many requests. Please wait ${retryAfter} seconds.`
          : 'Too many requests. Please try again later.';
      case 'DATABASE_ERROR':
        return 'A database error occurred. Please try again.';
      case 'EXTERNAL_SERVICE_ERROR':
        return 'A service is temporarily unavailable. Please try again later.';
      default:
        return error.error || 'An error occurred. Please try again.';
    }
  },

  // Check if error is retryable
  isRetryableError: (error: ErrorResponse | undefined): boolean => {
    if (!error) return false;

    return [
      'DATABASE_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'INTERNAL_ERROR'
    ].includes(error.type);
  },

  // Get rate limit info from error
  getRateLimitInfo: (error: ErrorResponse | undefined): RateLimitInfo | null => {
    if (!error || error.type !== 'RATE_LIMIT_ERROR') return null;

    return error.details as RateLimitInfo;
  }
};
