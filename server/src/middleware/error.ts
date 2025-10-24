import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

// Custom error class
export class CustomError extends Error implements AppError {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error for debugging
    console.error(`Error ${statusCode}: ${message}`);
    console.error(err.stack);

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 handler
export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({ error: 'Route not found' });
}; 