import { NextResponse } from 'next/server';

// Error types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Error response interface
export interface ErrorResponse {
  error: string;
  type: ErrorType;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Create standardized error response
export function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number,
  details?: any,
  requestId?: string
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: message,
    type,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(requestId && { requestId })
  };

  // Log error for monitoring (in production, send to logging service)
  console.error(`[${type}] ${message}`, {
    statusCode,
    details,
    requestId,
    timestamp: errorResponse.timestamp
  });

  return NextResponse.json(errorResponse, { status: statusCode });
}

// Validation error helper
export function validationError(message: string, details?: any): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.VALIDATION_ERROR, message, 400, details);
}

// Authentication error helper
export function authenticationError(message: string = 'Authentication required'): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.AUTHENTICATION_ERROR, message, 401);
}

// Authorization error helper
export function authorizationError(message: string = 'Insufficient permissions'): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.AUTHORIZATION_ERROR, message, 403);
}

// Not found error helper
export function notFoundError(resource: string = 'Resource'): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.NOT_FOUND_ERROR, `${resource} not found`, 404);
}

// Conflict error helper
export function conflictError(message: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.CONFLICT_ERROR, message, 409);
}

// Rate limit error helper
export function rateLimitError(retryAfter: number): NextResponse<ErrorResponse> {
  const response = createErrorResponse(
    ErrorType.RATE_LIMIT_ERROR,
    'Too many requests',
    429,
    { retryAfter }
  );

  // Add rate limit headers
  response.headers.set('Retry-After', retryAfter.toString());

  return response;
}

// Database error helper
export function databaseError(message: string = 'Database operation failed'): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.DATABASE_ERROR, message, 500);
}

// External service error helper
export function externalServiceError(service: string, details?: any): NextResponse<ErrorResponse> {
  return createErrorResponse(
    ErrorType.EXTERNAL_SERVICE_ERROR,
    `${service} service unavailable`,
    502,
    details
  );
}

// Internal error helper
export function internalError(message: string = 'Internal server error'): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.INTERNAL_ERROR, message, 500);
}

// Handle Supabase errors
export function handleSupabaseError(error: any): NextResponse<ErrorResponse> {
  console.error('Supabase error:', error);

  // Handle specific Supabase error codes
  switch (error.code) {
    case 'PGRST116': // Not found
      return notFoundError();

    case '23505': // Unique constraint violation
      return conflictError('Resource already exists');

    case '42501': // Insufficient privilege
      return authorizationError('Database access denied');

    case '23503': // Foreign key constraint violation
      return validationError('Invalid reference to related resource');

    case '23514': // Check constraint violation
      return validationError('Data validation failed');

    default:
      return databaseError('Database operation failed');
  }
}

// Handle generic errors
export function handleError(error: any): NextResponse<ErrorResponse> {
  console.error('Unhandled error:', error);

  // Check if it's a known error type
  if (error.name === 'ValidationError') {
    return validationError(error.message, error.details);
  }

  if (error.name === 'UnauthorizedError') {
    return authenticationError(error.message);
  }

  if (error.name === 'ForbiddenError') {
    return authorizationError(error.message);
  }

  // Default to internal error
  return internalError();
}

// Success response helper
export function successResponse<T>(data: T, statusCode: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status: statusCode });
}

// Created response helper
export function createdResponse<T>(data: T): NextResponse<T> {
  return successResponse(data, 201);
}

// No content response helper
export function noContentResponse(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

// Wrapper for API route handlers to catch errors
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

// Validate required fields
export function validateRequiredFields(data: any, requiredFields: string[]): string[] {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  return missing;
}

// Sanitize string input
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate date format
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Validate price format
export function validatePrice(price: any): boolean {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
}
