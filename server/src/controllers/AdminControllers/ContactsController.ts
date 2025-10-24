import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { asyncHandler } from '../../middleware/error';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { JWT_SECRET } from '../../config/env';
import { formatDataForResponse } from '../../services/utilities';

export const getContacts = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { search = '', dealerGroupId } = req.query;
    
    let whereClause: any = {};
    
    // Filter by dealer group if provided
    if (dealerGroupId) {
        whereClause.dealer_group_id = BigInt(dealerGroupId);
    }
    
    // Add search functionality
    if (search) {
        whereClause.OR = [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { primary_email: { contains: search, mode: 'insensitive' } },
            { secondary_email: { contains: search, mode: 'insensitive' } }
        ];
    }
    
    const contacts = await prisma.contacts.findMany({
        where: whereClause,
        orderBy: [
            { first_name: 'asc' },
            { last_name: 'asc' }
        ]
    });
    
    const formattedContacts = contacts.map((contact: any) => ({
        id: contact.id.toString(),
        first_name: contact.first_name,
        last_name: contact.last_name,
        nickname: contact.nickname,
        primary_email: contact.primary_email,
        secondary_email: contact.secondary_email,
        primary_phone_number: contact.primary_phone_number,
        secondary_phone_number: contact.secondary_phone_number,
        address_1: contact.address_1,
        address_2: contact.address_2,
        city: contact.city,
        province: contact.province,
        postal_code: contact.postal_code,
        birthday: contact.birthday,
        dealer_group_id: contact.dealer_group_id?.toString()
    }));
    
    res.json(formattedContacts);
});

export const createContact = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { first_name, last_name, nickname, primary_email, secondary_email, primary_phone_number, secondary_phone_number, address_1, address_2, city, province, postal_code, birthday } = req.body;
    
    // Get dealer group ID from user context (optional)
    const dealerGroupId = req.user.dealerGroupId;
    
    const contactData: any = {
        first_name,
        last_name,
        nickname,
        primary_email,
        secondary_email,
        primary_phone_number,
        secondary_phone_number,
        address_1,
        address_2,
        city,
        province,
        postal_code,
        birthday: birthday ? new Date(birthday) : null
    };
    
    // Only set dealer_group_id if user has one
    if (dealerGroupId) {
        contactData.dealer_group_id = BigInt(dealerGroupId);
    }
    
    const newContact = await prisma.contacts.create({
        data: contactData
    });
    
    const formattedContact = formatDataForResponse(newContact);
    
    res.status(201).json({ 
        message: "Contact created successfully", 
        data: formattedContact 
    });
});