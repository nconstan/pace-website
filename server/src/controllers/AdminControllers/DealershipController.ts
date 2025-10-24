import { Request, Response } from 'express';
import { prisma } from '../../config/db.js';
import { asyncHandler } from '../../middleware/error.js';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { JWT_SECRET } from '../../config/env.js';
import { formatDataForResponse } from '../../services/utilities.js';


export const getDealerships = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const userRoles = req.user.roles || [];
    const userId = req.user.id;

    console.log(userRoles)
    
    let dealerships: any[] = [];
    
    // Role 1 or 2: Only return dealerships where user is active in seller_dealerships
    if (userRoles.includes(1) || userRoles.includes(2)) {
        dealerships = await prisma.dealerships.findMany({
            where: {
                seller_dealerships: {
                    some: {
                        seller_id: BigInt(userId),
                    }
                }
            },
            include: {
                dealer_groups: true,
                contacts: true,
            },
            
        });
    }
    // Role 3: Return all dealerships in user's dealer group
    else if (userRoles.includes(3)) {
        const userAccount = await prisma.accounts.findUnique({
            where: { id: BigInt(userId) },
            select: { dealer_group_id: true }
        });
        
        if (userAccount?.dealer_group_id) {
            dealerships = await prisma.dealerships.findMany({
                where: {
                    dealer_group_id: userAccount.dealer_group_id
                },
                include: {
                    dealer_groups: true,
                    contacts: true
                }
            });
        } else {
            dealerships = [];
        }
    }
    // Role 4: Return all dealerships
    else if (userRoles.includes(4) || userRoles.includes(12)) {
        dealerships = await prisma.dealerships.findMany({
            include: {
                dealer_groups: true,
                contacts: true
            }
        });
    }
    // Default: Return empty array
    else {
        dealerships = [];
    }
    console.log(dealerships)
    
    // Get all secondary contact IDs from all dealerships
    const allSecondaryContactIds = dealerships.flatMap((dealership: any) => 
        dealership.secondary_contact_ids || []
    );
    
    // Fetch all secondary contacts in one query
    const secondaryContacts = await prisma.contacts.findMany({
        where: {
            id: {
                in: allSecondaryContactIds
            }
        }
    });
    
    // Create a map for quick lookup
    const secondaryContactsMap = new Map(
        secondaryContacts.map(contact => [contact.id.toString(), contact])
    );
    
    const formattedDealerships = dealerships.map((dealership: any) => ({
        id: dealership.id.toString(),
        name: dealership.name,
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
        } : null,
        primary_contact: dealership.contacts ? formatDataForResponse(dealership.contacts) : null,
        secondary_contacts: (dealership.secondary_contact_ids || []).map((contactId: any) => 
            formatDataForResponse(secondaryContactsMap.get(contactId.toString()))
        ).filter(Boolean)
    }));
    
    res.json(formattedDealerships);
});

export const createDealership = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { name, dealer_group_id, address_1, address_2, city, province, postal_code, primary_contact_ids, secondary_contact_ids, licensed_seller, products } = req.body;

    const newDealership = await prisma.dealerships.create({
        data: {
            name: name,
            dealer_group_id: BigInt(dealer_group_id),
            address_1: address_1,
            address_2: address_2,
            city: city,
            province: province,
            postal_code: postal_code,
            primary_contact_ids: BigInt(primary_contact_ids),
            secondary_contact_ids: secondary_contact_ids.map((contact: any) => BigInt(contact)),
            licensed_seller: licensed_seller,
            products: products,
            change_logs: [{createdBy:req.user.id, createdAt:new Date(), content:"created dealership"}]
        }
    });
    
    // Create the connection in the dealerships_group junction table
    await prisma.dealerships_dealer_groups.create({
        data: {
            dealership_id: newDealership.id,
            dealer_group_id: BigInt(dealer_group_id),
            active:true,
        }
    });
    
    res.json({ message: "Dealership created successfully" });
});

export const updateDealership = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, nickname, licensed_seller, address_1, address_2, city, province, postal_code, primary_contact_ids, secondary_contact_ids, products } = req.body;
    
    // First, get the existing dealership to access current change_logs
    const existingDealership = await prisma.dealerships.findUnique({
        where: { id: BigInt(id) }
    });

    if(!existingDealership) {
        res.status(404).json({ message: "Dealership not found" });
        return;
    }

    const before: any = {};
    const after: any = {};

    for(const key in req.body) {
        if(req.body[key] !== existingDealership[key as keyof typeof existingDealership]) {
            before[key] = existingDealership[key as keyof typeof existingDealership];
            after[key] = req.body[key];
        }
    }
    
    // Prepare the new change log entry
    const newChangeLog = {createdBy:req.user.id, createdAt:new Date(), content:"updated dealership", before:before, after:after};
    
    // Combine existing change logs with the new one
    const existingChangeLogs = existingDealership?.change_logs as any[] || [];
    const updatedChangeLogs = [
        ...existingChangeLogs,
        newChangeLog
    ];

    const data: any = {}
    for(const key in req.body) {
        if(req.body[key] !== existingDealership[key as keyof typeof existingDealership]) {
            data[key] = req.body[key];
        }
    }
    data.change_logs = updatedChangeLogs;
    
    const updatedDealership = await prisma.dealerships.update({
        where: { id: BigInt(id) },
        data: data
    });
    
    res.json({ message: "Dealership updated successfully", data: updatedDealership });
});

export const deleteDealership = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await prisma.dealerships.delete({
        where: { id: BigInt(id) }
    });
    
    res.json({ message: "Dealership deleted successfully" });
});