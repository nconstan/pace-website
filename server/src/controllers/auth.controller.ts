import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { asyncHandler } from '../middleware/error.js';
import { CustomError } from '../middleware/error.js';

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    
    const user = await prisma.accounts.findFirst({
        where: {
            username: username,
        },
        include: {
            contacts_accounts_contact_idTocontacts: true,
            seller_dealerships: {
                include: {
                    dealerships: {
                        include: {
                            dealer_groups: true
                        }
                    }
                }
            }
        }
    });

    if(user?.active === false){
        throw new CustomError('Account is not active', 401);
    }
    
    if (!user) {
        throw new CustomError('Invalid username or password', 401);
    }
    
    // Verify password using Argon2id
    if (!user.password) {
        throw new CustomError('Invalid username or password', 401);
    }
    
    try {
        const isValidPassword = await argon2.verify(user.password, password);
        if (!isValidPassword) {
            throw new CustomError('Invalid username or password', 401);
        }
    } catch (error) {
        throw new CustomError('Invalid username or password', 401);
    }
    
    // Extract dealership IDs for JWT claims
    const dealershipIds = user.seller_dealerships?.map((sd: any) => sd.dealerships.id.toString()) || [];
    
    // Extract dealer group ID from dealership associations (users can only have one dealer group)
    const dealerGroupId = user.seller_dealerships?.[0]?.dealerships?.dealer_groups?.id?.toString() || null;
    
    // Generate JWT token with dealership and dealer group access
    const token = jwt.sign(
        { 
            id: user.id.toString(), 
            username: user.username, 
            roles: user.roles,
            dealerships: dealershipIds, // Include dealership access in token
            dealerGroupId: dealerGroupId, // Include single dealer group access in token
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
    );
    
    // Return user with account_type field for frontend compatibility (using first role)
    const userResponse = {
        id: user.id.toString(),
        username: user.username,
        roles: user.roles,
        dealerships: dealershipIds, // Include in response for frontend
        dealerGroupId: dealerGroupId, // Include in response for frontend
        email: user.contacts_accounts_contact_idTocontacts?.primary_email || '',
        first_name: user.contacts_accounts_contact_idTocontacts?.first_name || '',
        last_name: user.contacts_accounts_contact_idTocontacts?.last_name || '',
    };
    
    res.json({ user: userResponse, token });
});


// Helper function to hash passwords using Argon2id
const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MiB
        timeCost: 1, // 1 iterations
        parallelism: 1 // 1 thread
    });
};

export const validateToken = asyncHandler(async (req: any, res: Response): Promise<void> => {
    // Get the full user data from database including contact information, dealerships, and dealer groups
    const user = await prisma.accounts.findFirst({
        where: {
            id: BigInt(req.user.id)
        },
        include: {
            contacts_accounts_contact_idTocontacts: true,
            seller_dealerships: {
                include: {
                    dealerships: {
                        include: {
                            dealer_groups: true
                        }
                    }
                }
            }
        }
    });
    
    if (!user) {
        throw new CustomError('Invalid token', 401);
    }
    
    // Extract dealership IDs
    const dealershipIds = user.seller_dealerships?.map((sd: any) => sd.dealerships.id.toString()) || [];
    
    // Extract dealer group ID from dealership associations (users can only have one dealer group)
    const dealerGroupId = user.seller_dealerships?.[0]?.dealerships?.dealer_groups?.id?.toString() || null;
    
    // Return user with all required fields for frontend compatibility
    const userResponse = {
        id: user.id.toString(),
        username: user.username,
        roles: user.roles,
        dealerships: dealershipIds, // Include dealership access
        dealerGroupId: dealerGroupId, // Include dealer group access
        email: user.contacts_accounts_contact_idTocontacts?.primary_email || '',
        first_name: user.contacts_accounts_contact_idTocontacts?.first_name || '',
        last_name: user.contacts_accounts_contact_idTocontacts?.last_name || '',
    };
    
    res.json({ user: userResponse });
});



// Function to change password (for future use)
export const changePassword = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    
    // Get current user
    const user = await prisma.accounts.findFirst({
        where: {
            id: BigInt(req.user!.id)
        }
    });
    
    if (!user || !user.password) {
        throw new CustomError('User not found', 404);
    }
    
    // Verify current password
    try {
        const isValidPassword = await argon2.verify(user.password, currentPassword);
        if (!isValidPassword) {
            throw new CustomError('Current password is incorrect', 401);
        }
    } catch (error) {
        throw new CustomError('Current password is incorrect', 401);
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Update password
    await prisma.accounts.update({
        where: {
            id: BigInt(req.user!.id)
        },
        data: {
            password: hashedNewPassword
        }
    });
    
    res.json({ message: "Password changed successfully" });
});

export const setupPassword = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { token, password } = req.body;
    
    if (!token || !password) {
        throw new CustomError('Token and password are required', 400);
    }
    
    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        if (decoded.type !== 'password_setup') {
            throw new CustomError('Invalid token type', 401);
        }
        
        // Find the account by contact ID
        const account = await prisma.accounts.findFirst({
            where: {
                contact_id: BigInt(decoded.id),
                username: decoded.username,
                active: false
            }
        });
        
        if (!account) {
            throw new CustomError('Account not found or already activated', 404);
        }
        
        // Hash the new password
        const hashedPassword = await hashPassword(password);
        
        // Update the account with the password and activate it
        await prisma.accounts.update({
            where: {
                id: account.id
            },
            data: {
                password: hashedPassword,
                active: true,
                change_log: [
                    ...(account.change_log as any[] || []),
                    {createdBy:account.id.toString(), createdAt:new Date(), content:"password setup completed"}
                ]
            }
        });
        
        res.json({ message: "Password set successfully. You can now log in to your account." });
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError('Invalid or expired token', 401);
        }
        throw error;
    }
}); 