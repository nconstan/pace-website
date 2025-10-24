import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Types
export interface User {
    id: string;
    username: string;
    roles: number[];
    dealer: string;
    dealerships: string[];
    dealerGroupId?: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: User;
}

import { JWT_SECRET } from '../config/env';

// JWT Secret from environment configuration

// Authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: "Access token required" });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ error: "Invalid or expired token" });
            return;
        }
        req.user = user;
        next();
    });
};

// Sort roles to get highest information role
export const sortRoles = (roles: number[], order: number[]): number[] => {
    const result: number[] = [];
    const rolesCopy = [...roles];
    
    for (const targetRole of order) {
        const roleIndex = rolesCopy.findIndex(role => role === targetRole);
        
        if (roleIndex !== -1) {
            result.push(rolesCopy[roleIndex]);
            rolesCopy.splice(roleIndex, 1);
        }
    }
    
    result.push(...rolesCopy);
    
    return result;
}

export const validateEntityAccess = (entity: any, type: string, req: AuthenticatedRequest): boolean => {
    if (!req.user) {
        return false;
    }

    const userRoles = req.user.roles.filter((role: number) => [1,2,3,4,12].includes(role));
    const highestRole = Math.max(...userRoles);

    // Role 12: Super admin - always has access
    if (highestRole === 12) {
        return true;
    }

    // Role 4: Admin - can access all dealer groups, all dealerships, and users with role 3 or lower
    if (highestRole === 4) {
        if (type === 'dealer_group' || type === 'dealership') {
            return true;
        }
        if (type === 'seller') {
            // Check if the target seller has role 3 or lower
            const targetSellerRoles = entity.roles || [];
            const targetHighestRole = Math.max(...targetSellerRoles);
            return targetHighestRole <= 3;
        }
        if (type === 'policy') {
            // Role 4 has access to all policies
            return true;
        }
        return true;
    }

    // Role 3: Manager - can access their dealer group, dealerships in their group, and sellers in their group
    if (highestRole === 3) {
        if (type === 'dealer_group') {
            // Can only access their own dealer group
            return req.user.dealerGroupId === entity.id?.toString();
        }
        if (type === 'dealership') {
            // Can access dealerships in their dealer group
            return entity.dealer_group_id?.toString() === req.user.dealerGroupId;
        }
        if (type === 'seller') {
            // Can access sellers in their dealer group
            return entity.dealer_group_id?.toString() === req.user.dealerGroupId;
        }
        if (type === 'policy') {
            // Can access policies sold at their dealer group
            // Check if the policy's dealership belongs to their dealer group
            return entity.dealership?.dealer_group_id?.toString() === req.user.dealerGroupId;
        }
        return false;
    }

    // Role 2: Limited access - can only access dealerships they're assigned to and active on
    if (highestRole === 2) {
        if (type === 'dealership') {
            // Can only access dealerships they're assigned to and active on
            // Check if the user has an active seller_dealerships relationship with this dealership
            return req.user.dealerships.includes(entity.id?.toString());
        }
        if (type === 'seller') {
            // Can access sellers with role 2 or 1 who are assigned to dealerships they're active at
            const targetSellerRoles = entity.roles || [];
            const targetHighestRole = Math.max(...targetSellerRoles);
            
            // Check if target seller has role 2 or 1
            if (targetHighestRole > 2) {
                return false;
            }
            
            // Check if target seller is assigned to any dealership the user is active at
            const targetSellerDealerships = entity.seller_dealerships || [];
            const userDealerships = req.user.dealerships || [];
            
            return targetSellerDealerships.some((sellerDealership: any) => 
                sellerDealership.active && 
                userDealerships.includes(sellerDealership.dealership_id?.toString())
            );
        }
        if (type === 'policy') {
            // Can access policies sold at dealerships they are active at
            return req.user.dealerships.includes(entity.dealership_id?.toString());
        }
        return false;
    }

    // Role 1: Can only access policies they sold
    if (highestRole === 1) {
        if (type === 'policy') {
            // Can access policies sold by them
            return entity.seller_id?.toString() === req.user.id;
        }
        return false;
    }
    // default
    return false;
}

export { JWT_SECRET }; 