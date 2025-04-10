import { Request, Response, NextFunction } from 'express';
import { ApiError, createErrorResponse } from '../utils/errorHandler';

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handling middleware
 */
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error with additional request context
  console.error(`[ERROR] ${statusCode} - ${message}`);
  console.error(`Request: ${req.method} ${req.originalUrl}`);
  
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // Send a formatted error response
  res.status(statusCode).json(createErrorResponse(
    statusCode, 
    message,
    process.env.NODE_ENV !== 'production' ? err.stack : undefined
  ));
}; 