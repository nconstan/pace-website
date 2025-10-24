import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';

export const getDashboardStats = asyncHandler(async (req: any, res: Response): Promise<void> => {
    // Get policy count for the dealership
    const policyCount = await prisma.policies.count({
        where: {
            seller_id: req.user!.id
        }
    });
    
    // Get quick quote count for the dealership
    const quickQuoteCount = await prisma.quick_quotes.count({
        where: {
            seller_id: req.user!.id
        }
    });
    
    // Get recent policies
    const recentPolicies = await prisma.policies.findMany({
        where: {
            seller_id: req.user!.id
        },
        orderBy: {
            created_at: 'desc'
        },
        take: 5
    });
    
    res.json({
        stats: {
            totalPolicies: policyCount,
            totalQuickQuotes: quickQuoteCount
        },
        recentPolicies
    });
}); 

export const getCoreUserData = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const userId = req.user.id;
    
    // Get user's account information including roles and dealer group ID
    const userAccount = await prisma.accounts.findUnique({
        where: { id: BigInt(userId) },
        include: {
            contacts_accounts_contact_idTocontacts: true
        }
    });
    
    if (!userAccount) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    
    const userRoles = userAccount.roles;
    const userContact = userAccount.contacts_accounts_contact_idTocontacts;
    const userDealerGroupId = userContact?.dealer_group_id;
    
    let dealerGroups: any[] = [];
    let dealerships: any[] = [];
    
    // Determine what data to fetch based on user roles and dealer group association
    if (userRoles.includes(12) || userRoles.includes(4)) {
        // Admin roles (12, 4) - get all dealer groups and all dealerships
        dealerGroups = await prisma.dealer_groups.findMany({
            include: {
                dealerships: true
            }
        });
        
        dealerships = await prisma.dealerships.findMany({
            include: {
                dealer_groups: true
            }
        });
    } else if (userRoles.includes(3) && userDealerGroupId) {
        // Role 3 with dealer group - get their specific dealer group and associated dealerships
        const dealerGroup = await prisma.dealer_groups.findUnique({
            where: { id: userDealerGroupId },
            include: {
                dealerships: true
            }
        });
        
        if (dealerGroup) {
            dealerGroups = [dealerGroup];
            dealerships = dealerGroup.dealerships;
        }
    } else {
        // Role 3 without dealer group or other roles - no access to dealer groups or dealerships
        dealerGroups = [];
        dealerships = [];
    }
    
    // Format the response
    const formattedDealerGroups = dealerGroups.map((group: any) => ({
        id: group.id.toString(),
        name: group.full_name,
        nickname: group.nickname,
        address_1: group.address_1,
        address_2: group.address_2,
        postal_code: group.postal_code,
        dealer_margin: group.dealer_margin,
        dealer_group_split: group.dealer_group_split,
        referral_fee_rate: group.referral_fee_rate,
        dealerships: group.dealerships?.map((dealership: any) => ({
            id: dealership.id.toString(),
            name: dealership.name || dealership.nickname || 'Unnamed Dealership',
            province: dealership.province,
            address: `${dealership.address_1}${dealership.address_2 ? ', ' + dealership.address_2 : ''}, ${dealership.city}, ${dealership.province}`,
            postal_code: dealership.postal_code,
        })) || []
    }));
    
    const formattedDealerships = dealerships.map((dealership: any) => ({
        id: dealership.id.toString(),
        name: dealership.name || dealership.nickname || 'Unnamed Dealership',
        nickname: dealership.nickname,
        address_1: dealership.address_1,
        address_2: dealership.address_2,
        city: dealership.city,
        province: dealership.province,
        postal_code: dealership.postal_code,
        dealer_group: dealership.dealer_groups ? {
            id: dealership.dealer_groups.id.toString(),
            name: dealership.dealer_groups.full_name,
            nickname: dealership.dealer_groups.nickname
        } : null
    }));
    
    res.json({
        user: {
            id: userAccount.id.toString(),
            username: userAccount.username,
            roles: userAccount.roles,
            dealer_group_id: userDealerGroupId?.toString() || null
        },
        dealer_groups: formattedDealerGroups,
        dealerships: formattedDealerships
    });
}); 