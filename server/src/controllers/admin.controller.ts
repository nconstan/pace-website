import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { JWT_SECRET } from '../config/env.js';
import { formatDataForResponse } from '../services/utilities.js';

// Contact Management
export { getContacts, createContact,} from './AdminControllers/ContactsController.js';

// Dealer Group Management
export { getDealerGroups, createDealerGroup, updateDealerGroup, deleteDealerGroup } from './AdminControllers/DealerGroupController.js';

// Dealership Management
export { getDealerships, createDealership, updateDealership, deleteDealership } from './AdminControllers/DealershipController.js';

// Account Management
export { getAccounts, createAccount, updateAccount } from './AdminControllers/AccountController.js';

// Applicant Management - Limited data for customer lookup
export const getApplicantByCustomerNumber = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { customerNumber } = req.params;
    
    const applicant = await prisma.applicants.findUnique({
        where: {
            customer_number: BigInt(customerNumber)
        },
        select: {
            first_name_1: true,
            first_name_2: true,
            postal_code: true,
            address_1: true,
            address_2: true,
            city: true,
            province: true,
            is_company: true,
            phone_number_1: true,
            email_1: true,
            phone_number_2: true,
            email_2: true,
            customer_number: true
        }
    });
    
    if (!applicant) {
        res.status(404).json({ message: 'Applicant not found' });
        return;
    }
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedApplicant = {
        ...applicant,
        customer_number: applicant.customer_number.toString()
    };
    
    res.json(serializedApplicant);
});