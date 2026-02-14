/**
 * User-Friendly Error Messages
 * Converts technical error messages into simple, everyday language
 * that users can understand easily.
 */

// Map of technical error codes/messages to user-friendly messages
const errorMessageMap: Record<string, string> = {
  // Database errors
  'PGRST116': "We couldn't find what you're looking for. Please try again.",
  '42501': "You don't have permission to do that. Please contact the event organizer.",
  'PGRST301': "We're having trouble connecting. Please check your internet connection.",
  '23505': "This already exists. You may have already saved this event.",
  '23503': "Something went wrong with your request. Please try again.",
  '23514': "The information you provided isn't valid. Please check and try again.",
  
  // Network/connection errors
  'NETWORK_ERROR': "Unable to connect to the internet. Please check your connection.",
  'CONNECTION_FAILED': "We couldn't reach the server. Please try again in a moment.",
  'TIMEOUT': "This is taking longer than expected. Please try again.",
  'FETCH_ERROR': "Something went wrong while loading. Please refresh the page.",
  
  // Authentication errors
  'AUTH_ERROR': "Please sign in to continue.",
  'NOT_AUTHENTICATED': "Please sign in to access this feature.",
  'SESSION_EXPIRED': "Your session has ended. Please sign in again.",
  'USER_NOT_FOUND': "We couldn't find your account. Please sign in again.",
  
  // Permission errors
  'PERMISSION_DENIED': "You don't have access to this. Please check with the event organizer.",
  'INSUFFICIENT_PERMISSIONS': "You're not allowed to do that. Please contact support if this seems wrong.",
  'UNAUTHORIZED': "Please sign in to continue.",
  
  // Rate limiting
  'RATE_LIMIT': "You're doing that too quickly. Please wait a moment and try again.",
  'TOO_MANY_REQUESTS': "Please wait a moment before trying again.",
  
  // Validation errors
  'VALIDATION_ERROR': "Please check your information and try again.",
  'INVALID_EMAIL': "Please enter a valid email address.",
  'INVALID_DATE': "Please enter a valid date.",
  'REQUIRED_FIELD': "This field is required.",
  
  // Server errors
  'INTERNAL_ERROR': "Something unexpected happened. Please try again.",
  'SERVER_ERROR': "We're having some technical issues. Please try again later.",
  'DATABASE_ERROR': "We're having trouble saving your data. Please try again.",
  
  // File/Upload errors
  'UPLOAD_FAILED': "Couldn't upload your file. Please try again with a smaller file.",
  'FILE_TOO_LARGE': "This file is too large. Please choose a smaller one.",
  'INVALID_FILE_TYPE': "This type of file isn't supported. Please try a different file.",
  
  // Push notification errors
  'PUSH_NOT_SUPPORTED': "Your browser doesn't support notifications.",
  'PUSH_NOT_CONFIGURED': "Notifications aren't set up properly. Please contact support.",
  'PUSH_PERMISSION_DENIED': "Please enable notifications in your browser settings to get updates.",
  
  // Generic fallbacks
  'UNKNOWN_ERROR': "Something went wrong. Please try again.",
  'UNEXPECTED_ERROR': "Something unexpected happened. Please refresh the page.",
};

/**
 * Convert any technical error to a user-friendly message
 * @param error - The error object (can be Error, string, or any object with message/code properties)
 * @param fallbackMessage - Optional custom fallback message
 * @returns A user-friendly error message
 */
export function getUserFriendlyError(error: unknown, fallbackMessage?: string): string {
  // Handle null/undefined
  if (!error) {
    return fallbackMessage || "Something went wrong. Please try again.";
  }

  // Extract error details
  let errorCode = '';
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    errorCode = String(err.code || err.status || '');
    errorMessage = String(err.message || err.error || '');
  }

  // Check for specific error codes first
  if (errorCode && errorMessageMap[errorCode]) {
    return errorMessageMap[errorCode];
  }

  // Check for specific error patterns in the message
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('row-level security') || lowerMessage.includes('rls')) {
    return "You don't have permission to view this content.";
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return "Unable to connect to the internet. Please check your connection.";
  }
  
  if (lowerMessage.includes('timeout')) {
    return "This is taking too long. Please try again.";
  }
  
  if (lowerMessage.includes('auth') || lowerMessage.includes('session') || lowerMessage.includes('token')) {
    return "Please sign in to continue.";
  }
  
  if (lowerMessage.includes('permission') || lowerMessage.includes('denied') || lowerMessage.includes('unauthorized')) {
    return "You don't have permission to do that. Please sign in or contact support.";
  }
  
  if (lowerMessage.includes('not found') || lowerMessage.includes('doesn\'t exist')) {
    return "We couldn't find what you're looking for.";
  }
  
  if (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists')) {
    return "This already exists. You may have already saved this.";
  }
  
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return "Please check your information and try again.";
  }
  
  if (lowerMessage.includes('database') || lowerMessage.includes('supabase')) {
    return "We're having trouble saving your data. Please try again.";
  }
  
  if (lowerMessage.includes('abort') || lowerMessage.includes('cancelled')) {
    return "The request was cancelled. Please try again.";
  }

  // Check the map for partial matches
  for (const [key, value] of Object.entries(errorMessageMap)) {
    if (lowerMessage.includes(key.toLowerCase().replace(/_/g, ' '))) {
      return value;
    }
  }

  // Return fallback or generic message
  return fallbackMessage || errorMessageMap['UNKNOWN_ERROR'];
}

/**
 * Get a simple error message for display to users
 * @param errorType - The type of error
 * @returns A simple, clear error message
 */
export function getSimpleErrorMessage(errorType: string): string {
  const messages: Record<string, string> = {
    'network': "Unable to connect. Please check your internet connection.",
    'save': "Couldn't save your changes. Please try again.",
    'load': "Couldn't load the information. Please try again.",
    'delete': "Couldn't remove this. Please try again.",
    'upload': "Couldn't upload your file. Please try again.",
    'auth': "Please sign in to continue.",
    'permission': "You're not allowed to do that.",
    'validation': "Please check your information and try again.",
    'notFound': "We couldn't find what you're looking for.",
    'server': "Something went wrong on our end. Please try again later.",
    'unknown': "Something went wrong. Please try again.",
  };

  return messages[errorType] || messages['unknown'];
}

/**
 * Success messages for user feedback
 */
export const successMessages = {
  saved: "Saved successfully!",
  updated: "Updated successfully!",
  deleted: "Removed successfully!",
  uploaded: "Uploaded successfully!",
  sent: "Sent successfully!",
  created: "Created successfully!",
  copied: "Copied to clipboard!",
  shared: "Shared successfully!",
};

/**
 * Loading messages for user feedback
 */
export const loadingMessages = {
  saving: "Saving your changes...",
  loading: "Loading...",
  uploading: "Uploading your file...",
  processing: "Processing your request...",
  sending: "Sending...",
  deleting: "Removing...",
};
