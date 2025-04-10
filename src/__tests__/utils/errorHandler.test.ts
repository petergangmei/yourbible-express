import { ApiError, createErrorResponse } from '../../utils/errorHandler';

describe('Error Handler Utilities', () => {
  describe('ApiError Class', () => {
    it('should create an error with status code and message', () => {
      const statusCode = 404;
      const message = 'Not Found';
      const error = new ApiError(statusCode, message);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(statusCode);
      expect(error.message).toBe(message);
      expect(error.name).toBe('ApiError');
    });
  });
  
  describe('createErrorResponse Function', () => {
    it('should create an error response object with required fields', () => {
      const statusCode = 500;
      const message = 'Internal Server Error';
      const response = createErrorResponse(statusCode, message);
      
      expect(response).toHaveProperty('status', 'error');
      expect(response).toHaveProperty('statusCode', statusCode);
      expect(response).toHaveProperty('message', message);
      expect(response).toHaveProperty('timestamp');
    });
    
    it('should include details if provided', () => {
      const statusCode = 400;
      const message = 'Bad Request';
      const details = { field: 'username', issue: 'required' };
      const response = createErrorResponse(statusCode, message, details);
      
      expect(response).toHaveProperty('details', details);
    });
  });
}); 