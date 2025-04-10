import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errorHandler';

/**
 * Middleware for validating query parameters
 * @param requiredParams - Array of required query parameters
 */
export const validateQueryParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of requiredParams) {
      if (!req.query[param]) {
        return next(new ApiError(400, `Missing required query parameter: ${param}`));
      }
    }
    next();
  };
};

/**
 * Middleware for validating request parameters
 * @param requiredParams - Array of required request parameters
 */
export const validateRequestParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of requiredParams) {
      if (!req.params[param]) {
        return next(new ApiError(400, `Missing required parameter: ${param}`));
      }
    }
    next();
  };
};

/**
 * Middleware for validating request body
 * @param requiredFields - Array of required fields in the request body
 */
export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      return next(new ApiError(400, 'Invalid request body'));
    }
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined) {
        return next(new ApiError(400, `Missing required field in request body: ${field}`));
      }
    }
    next();
  };
}; 