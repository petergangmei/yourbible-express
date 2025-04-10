"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../../utils/errorHandler");
describe('Error Handler Utilities', () => {
    describe('ApiError Class', () => {
        it('should create an error with status code and message', () => {
            const statusCode = 404;
            const message = 'Not Found';
            const error = new errorHandler_1.ApiError(statusCode, message);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(errorHandler_1.ApiError);
            expect(error.statusCode).toBe(statusCode);
            expect(error.message).toBe(message);
            expect(error.name).toBe('ApiError');
        });
    });
    describe('createErrorResponse Function', () => {
        it('should create an error response object with required fields', () => {
            const statusCode = 500;
            const message = 'Internal Server Error';
            const response = (0, errorHandler_1.createErrorResponse)(statusCode, message);
            expect(response).toHaveProperty('status', 'error');
            expect(response).toHaveProperty('statusCode', statusCode);
            expect(response).toHaveProperty('message', message);
            expect(response).toHaveProperty('timestamp');
        });
        it('should include details if provided', () => {
            const statusCode = 400;
            const message = 'Bad Request';
            const details = { field: 'username', issue: 'required' };
            const response = (0, errorHandler_1.createErrorResponse)(statusCode, message, details);
            expect(response).toHaveProperty('details', details);
        });
    });
});
