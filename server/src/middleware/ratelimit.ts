import { Request, Response, NextFunction } from 'express';
import { CustomError } from './error.js';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Simple in-memory rate limiter
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        
        if (!store[key] || now > store[key].resetTime) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs
            };
        } else {
            store[key].count++;
            
            // if (store[key].count > maxRequests) {
            //     throw new CustomError('Too many requests', 429);
            // }
        }
        
        next();
    };
};

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (now > store[key].resetTime) {
            delete store[key];
        }
    });
}, 60 * 1000); // Clean up every minute 