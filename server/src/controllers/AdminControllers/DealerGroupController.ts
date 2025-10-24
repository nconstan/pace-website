import { Request, Response } from 'express';
import prisma from '../../config/db.js';
import { asyncHandler } from '../../middleware/error.js';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { JWT_SECRET } from '../../config/env.js';
import { formatDataForResponse } from '../../services/utilities.js';

// Dealer Group Management
export const getDealerGroups = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const dealerGroups = await prisma.dealer_groups.findMany({
        include: {
            dealerships: true
        }
    });
    
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
        dealerships: group.dealerships.map((dealership: any) => ({
            id: dealership.id.toString(),
            name: dealership.entity_name || dealership.entity_nickname || 'Unnamed Dealership',
            province: dealership.province,
            address: `${dealership.address_1}${dealership.address_2 ? ', ' + dealership.address_2 : ''}, ${dealership.city}, ${dealership.province}`,
            postal_code: dealership.postal_code,
        }))
    }));
    
    res.json(formattedDealerGroups);
});

export const createDealerGroup = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { full_name, nickname, dealer_margin, dealer_group_split, referral_fee_rate, primary_contact_data, secondary_contact_data, address_1, address_2, postal_code } = req.body;
    
    // Combine primary and secondary contacts into one array
    const allContacts = [primary_contact_data, ...secondary_contact_data];

    // Create all contacts in one loop
    const contactIds = [];
    for (const contactData of allContacts) {
        const contactDataForDb: any = {};
        Object.keys(contactData).forEach(key => {
            if (key === 'birthday' && contactData[key]) {
                contactDataForDb[key] = new Date(contactData[key]);
            } else {
                contactDataForDb[key] = contactData[key];
            }
        });

        const contact = await prisma.contacts.create({ data: contactDataForDb });
        contactIds.push(contact.id);
    }
    const newDealerGroup = await prisma.dealer_groups.create({
        data: {
            primary_contact_ids: contactIds[0],
            secondary_contact_ids: contactIds.slice(1) || null,
            dealer_margin,
            dealer_group_split,
            referral_fee_rate: parseFloat(referral_fee_rate),
            full_name,
            nickname,
            notes: [{createdBy:req.user.id, createdAt:new Date(), content:"created dealer group"}],
            address_1,
            address_2,
            postal_code
        }
    });
    
    res.json({ message: "Dealer group created successfully" });
});

export const updateDealerGroup = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    const { dealer_margin, dealer_group_split, referral_fee_rate } = req.body;
    
    const updatedDealerGroup = await prisma.dealer_groups.update({
        where: { id: BigInt(id) },
        data: {
            dealer_margin,
            dealer_group_split,
            referral_fee_rate
        }
    });
    
    res.json({ message: "Dealer group updated successfully", data: updatedDealerGroup });
});

export const deleteDealerGroup = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await prisma.dealer_groups.delete({
        where: { id: BigInt(id) }
    });
    
    res.json({ message: "Dealer group deleted successfully" });
}); 