// Custom error handler utility functions

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a standard error response object
 */
export const createErrorResponse = (statusCode: number, message: string, details?: any) => {
  return {
    status: 'error',
    statusCode,
    message,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Global error handling middleware (to be used in future phases)
 */
export const errorMiddleware = (err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  res.status(statusCode).json(createErrorResponse(statusCode, message));
}; 