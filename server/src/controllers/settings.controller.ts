import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { CustomError } from '../middleware/error.js';

export const getUserSettings = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const user = await prisma.accounts.findUnique({
        where: {
            id: req.user!.id
        },
        select: {
            id: true,
            username: true,
            contacts_accounts_contact_idTocontacts: {
                select: {
                    primary_email: true
                }
            },
            roles: true,
            seller_dealerships: {
                select: {
                    dealerships: true
                }
            }
        }
    });
    
    if (!user) {
        throw new CustomError('User not found', 404);
    }
    
    res.json(user);
});

export const updateUserSettings = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { email, dealerships } = req.body;
    
    const updatedUser = await prisma.accounts.update({
        where: {
            id: req.user!.id
        },
        data: {
            contacts_accounts_contact_idTocontacts: {
                update: {
                    primary_email: email
                }
            },
            seller_dealerships: {
                connect: dealerships.map((dealership: any) => ({ dealership_id: BigInt(dealership) }))
            }
        }
    });
    
    res.json({ message: "Settings updated successfully", data: updatedUser });
}); 