export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleSupabaseError = (error: any): AppError => {
  if (error?.code === 'PGRST116') {
    return new AppError('Resource not found', 404);
  }
  
  if (error?.code === '23505') {
    return new AppError('Duplicate entry', 409);
  }
  
  if (error?.code === '42501') {
    return new AppError('Insufficient permissions', 403);
  }
  
  return new AppError(error?.message || 'Database error', 500);
};

export const logError = (error: Error, context?: string) => {
  console.error(`[${context || 'APP'}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};