'use client';

import React, { Component, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { ErrorResponse, ErrorType } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Here you could integrate with error tracking services like Sentry, LogRocket, etc.
    // For now, we'll just log to console with structured data
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    console.error('Error Report:', errorReport);

    // In production, you might want to send this to your error tracking service:
    // errorTrackingService.captureException(error, { extra: errorReport });
  };

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    // Limit retry attempts to prevent infinite loops
    if (newRetryCount > 3) {
      console.warn('Max retry attempts reached, not retrying');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });

    // Add a small delay before retry to prevent rapid retries
    const timeout = setTimeout(() => {
      this.forceUpdate();
    }, 1000);

    this.retryTimeouts.push(timeout);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <FiAlertTriangle size={24} className="text-red-600" />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. This has been reported and we're working to fix it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw size={16} />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FiHome size={16} />
                Go Home
              </button>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-4">
                Retry attempts: {this.state.retryCount}/3
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling API errors in components
export const useApiErrorHandler = () => {
  const [apiError, setApiError] = React.useState<ErrorResponse | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleApiError = React.useCallback((error: ErrorResponse) => {
    setApiError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setApiError(null);
  }, []);

  const retry = React.useCallback(async (retryFn: () => Promise<void>) => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      await retryFn();
      clearError();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, clearError]);

  // Auto-clear error after 10 seconds
  React.useEffect(() => {
    if (apiError) {
      const timeout = setTimeout(clearError, 10000);
      return () => clearTimeout(timeout);
    }
  }, [apiError, clearError]);

  return {
    apiError,
    isRetrying,
    handleApiError,
    clearError,
    retry,
    hasError: !!apiError,
    errorMessage: apiError ? getErrorMessage(apiError) : null
  };
};

// Helper function to get user-friendly error messages
function getErrorMessage(error: ErrorResponse): string {
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
      return error.details?.message || error.error;
    case ErrorType.AUTHENTICATION_ERROR:
      return 'Please sign in to continue';
    case ErrorType.AUTHORIZATION_ERROR:
      return 'You do not have permission to perform this action';
    case ErrorType.NOT_FOUND_ERROR:
      return 'The requested resource was not found';
    case ErrorType.RATE_LIMIT_ERROR:
      const retryAfter = error.details?.retryAfter;
      return retryAfter
        ? `Too many requests. Please wait ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
    case ErrorType.DATABASE_ERROR:
      return 'A database error occurred. Please try again.';
    case ErrorType.EXTERNAL_SERVICE_ERROR:
      return 'A service is temporarily unavailable. Please try again later.';
    default:
      return error.error || 'An error occurred. Please try again.';
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
