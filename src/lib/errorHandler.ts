import { NextResponse } from 'next/server';
import { getUserFriendlyError } from './userMessages';

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
  userMessage: string; // User-friendly message
  type: ErrorType;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Create standardized error response with user-friendly message
export function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number,
  details?: any,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Convert technical message to user-friendly message
  const userMessage = getUserFriendlyError(message);

  const errorResponse: ErrorResponse = {
    error: message, // Keep technical message for debugging
    userMessage, // User-friendly message for display
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

// Validation error helper - user-friendly
export function validationError(message: string, details?: any): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.VALIDATION_ERROR, message, 400, details);
}

// Authentication error helper - user-friendly
export function authenticationError(message: string = 'Please sign in to continue'): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.AUTHENTICATION_ERROR, message, 401);
}

// Authorization error helper - user-friendly
export function authorizationError(message: string = "You're not allowed to do that. Please sign in or contact support."): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.AUTHORIZATION_ERROR, message, 403);
}

// Not found error helper - user-friendly
export function notFoundError(resource: string = 'Item'): NextResponse<ErrorResponse> {
  const message = `We couldn't find that ${resource.toLowerCase()}. It may have been removed or you may not have access.`;
  return createErrorResponse(ErrorType.NOT_FOUND_ERROR, message, 404);
}

// Conflict error helper - user-friendly
export function conflictError(message: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.CONFLICT_ERROR, message, 409);
}

// Rate limit error helper - user-friendly
export function rateLimitError(retryAfter: number): NextResponse<ErrorResponse> {
  const message = "You're doing that too quickly. Please wait a moment before trying again.";
  const response = createErrorResponse(
    ErrorType.RATE_LIMIT_ERROR,
    message,
    429,
    { retryAfter }
  );

  // Add rate limit headers
  response.headers.set('Retry-After', retryAfter.toString());

  return response;
}

// Database error helper - user-friendly
export function databaseError(message: string = "We're having trouble saving your data. Please try again."): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.DATABASE_ERROR, message, 500);
}

// External service error helper - user-friendly
export function externalServiceError(service: string, details?: any): NextResponse<ErrorResponse> {
  const message = "We're having some technical issues. Please try again in a few moments.";
  return createErrorResponse(ErrorType.EXTERNAL_SERVICE_ERROR, message, 502, details);
}

// Internal error helper - user-friendly
export function internalError(message: string = "Something unexpected happened. Please try again."): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorType.INTERNAL_ERROR, message, 500);
}

// Handle Supabase errors with user-friendly messages
export function handleSupabaseError(error: any): NextResponse<ErrorResponse> {
  console.error('Supabase error:', error);

  // Get user-friendly message for this error
  const userMessage = getUserFriendlyError(error);

  // Handle specific Supabase error codes with user-friendly messages
  switch (error.code) {
    case 'PGRST116': // Not found
      return notFoundError();

    case '23505': // Unique constraint violation
      return conflictError("This already exists. You may have already saved this.");

    case '42501': // Insufficient privilege
      return authorizationError("You don't have permission to do that. Please contact the event organizer.");

    case '23503': // Foreign key constraint violation
      return validationError("Something went wrong with your request. Please try again.");

    case '23514': // Check constraint violation
      return validationError("The information provided isn't valid. Please check and try again.");

    default:
      return databaseError(userMessage);
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
