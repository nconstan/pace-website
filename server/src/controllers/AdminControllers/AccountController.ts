import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { asyncHandler } from '../../middleware/error';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { JWT_SECRET } from '../../config/env';
import { formatDataForResponse } from '../../services/utilities';


export const getAccounts = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const userRoles = req.user.roles;
    const highestRole = Math.max(...userRoles.filter((role: number) => [1, 2, 3, 4, 12].includes(role)));
    const userDealerships = req.user.dealerships || [];
    const userDealerGroupId = req.user.dealerGroupId;

    let whereClause: any = {
        
    };

    // Role 12: Can see all accounts
    if (highestRole === 12){}
    else if (highestRole === 4)  whereClause.roles = { hasSome: [1, 2, 3] };
    else if (highestRole === 3) {
        whereClause.roles = {
            hasSome: [1, 2, 3]
        };
        whereClause.dealer_group_id = BigInt(userDealerGroupId);
    }
    else if (highestRole === 2) whereClause.roles = { hasSome: [1, 2, 3] };
    else {
        res.json([]);
        return;
    }

    const accountsData = await prisma.accounts.findMany({
        where: whereClause,
        include: {
            contacts_accounts_contact_idTocontacts: true,
            dealer_groups: true,
            seller_dealerships: {
                include: {
                    dealerships: true,
                }
            }
        }
    });

    let accounts = accountsData.map((account: any) => {
        const accountHighestRole = Math.max(...account.roles);
        
        // For role 2 users, filter dealerships to only show shared ones
        let dealerships = account.seller_dealerships.map((sellerDealership: any) => ({
            id: sellerDealership.dealerships.id.toString(),
            name: sellerDealership.dealerships.name,
            nickname: sellerDealership.dealerships.nickname,
            active: sellerDealership.active
        }));

        // For role 2 users, only show dealerships they share with the seller
        if (highestRole === 2) {
            dealerships = dealerships.filter((dealership: any) => 
                userDealerships.includes(dealership.id)
            );
        }

        const formattedAccount: any = {
            id: account.id.toString(),
            username: account.username,
            roles: account.roles,
            active: account.active,
            dealerships: dealerships || [],
            dealer_group_id: account.dealer_group_id?.toString() || null,
            dealer_group: account.dealer_groups ? {
                id: account.dealer_groups.id.toString(),
                name: account.dealer_groups.full_name,
                nickname: account.dealer_groups.nickname,
            } : null,
            contact: account.contacts_accounts_contact_idTocontacts ? {
                id: account.contacts_accounts_contact_idTocontacts.id.toString(),
                first_name: account.contacts_accounts_contact_idTocontacts.first_name,
                last_name: account.contacts_accounts_contact_idTocontacts.last_name,
                nickname: account.contacts_accounts_contact_idTocontacts.nickname,
                primary_email: account.contacts_accounts_contact_idTocontacts.primary_email,
                secondary_email: account.contacts_accounts_contact_idTocontacts.secondary_email,
                primary_phone_number: account.contacts_accounts_contact_idTocontacts.primary_phone_number,
                secondary_phone_number: account.contacts_accounts_contact_idTocontacts.secondary_phone_number,
                address_1: account.contacts_accounts_contact_idTocontacts.address_1,
                address_2: account.contacts_accounts_contact_idTocontacts.address_2,
                city: account.contacts_accounts_contact_idTocontacts.city,
                province: account.contacts_accounts_contact_idTocontacts.province,
                postal_code: account.contacts_accounts_contact_idTocontacts.postal_code,
                birthday: account.contacts_accounts_contact_idTocontacts.birthday,
            } : null
        };

        // For role 2 users, add editable flag
        if (highestRole === 2) {
            if (accountHighestRole === 3) {
                formattedAccount.editable = false;
            } else {
                // Check if seller has any dealerships in common with the user
                const hasSharedDealerships = account.seller_dealerships.some((sellerDealership: any) => 
                    userDealerships.includes(sellerDealership.dealerships.id.toString())
                );
                formattedAccount.editable = hasSharedDealerships;
            }
        }

        return formattedAccount;
    });

    // For role 2 users, filter results based on dealership access
    if (highestRole === 2) {
        accounts = accounts.filter((account: any) => {
            const accountHighestRole = Math.max(...account.roles);
            
            // Role 3 accounts are always included (but not editable)
            if (accountHighestRole === 3) {
                return true;
            }
            
            // Role 1-2 accounts must have shared dealerships
            return account.dealerships.length > 0;
        });
    }

    res.json(accounts);
});

export const createAccount = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { username, primary_email,secondary_email, nickname, primary_phone_number, secondary_phone_number, address_1, address_2, city, province, postal_code, birthday, roles, first_name, last_name,dealer_group_id, dealerships } = req.body;
    
    const dealerGroup = await prisma.dealer_groups.findUnique({
        where: {
            id: BigInt(dealer_group_id)
        }
    });

    if(!validateRolePermissions(req, roles, dealerships, dealer_group_id)) {
        res.status(403).json({ message: "You do not have permission to create this account" });
        return;
    }

    if(!dealerGroup) {
        res.status(404).json({ message: "Dealer group not found" });
        return;
    }

    // Create contact first
    const contactData: any = {
        first_name: first_name,
        last_name: last_name,
        primary_email: primary_email,
        secondary_email: secondary_email,
        nickname: nickname,
        primary_phone_number: primary_phone_number,
        secondary_phone_number: secondary_phone_number,
        address_1: address_1,
        address_2: address_2,
        city: city,
        province: province,
        postal_code: postal_code,
        birthday: birthday ? new Date(birthday) : null,
    };

    // Note: dealer_group_id is only set on accounts, not contacts
    // The dealer group relationship is handled through the accounts table

    const contact = await prisma.contacts.create({
        data: contactData
    });
    
    // Generate a JWT token for password setup (7 days expiration)
    const setupToken = jwt.sign(
        { 
            id: contact.id.toString(),
            username: username,
            email: primary_email,
            roles: roles,
            type: 'password_setup'
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
    );
    
    // Hash the token for storage
    const hashedToken = await argon2.hash(setupToken, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 1,
        parallelism: 1
    });
    
    const accountData: any = {
        username: username,
        password: null, // No password yet - will be set during setup
        roles: roles, // roles is already an array, don't wrap it
        created_by: req.user!.id,
        contact_id: contact.id,
        active: false, // Account is inactive until password is set
        change_log: [{createdBy:req.user.id, createdAt:new Date(), content:"created account"}],
    };

    // Only set dealer_group_id if it's provided and valid
    if (dealer_group_id && dealer_group_id !== '') {
        try {
            const dealerGroupId = BigInt(dealer_group_id);
            accountData.dealer_group_id = dealerGroupId;
        } catch (error) {
            console.error('Error setting dealer_group_id on account:', error);
            // Don't set dealer_group_id if conversion fails
        }
    }

    const newAccount = await prisma.accounts.create({
        data: accountData
    });

    await prisma.contacts.update({
        where: { id: contact.id },
        data: { linked_account: newAccount.id }
    });

    // Create seller-dealership relationships in the junction table
    if (dealerships && dealerships.length > 0) {
        const sellerDealershipData = dealerships.map((dealershipId: string) => ({
            seller_id: newAccount.id,
            dealership_id: BigInt(dealershipId)
        }));

        await prisma.seller_dealerships.createMany({
            data: sellerDealershipData
        });
    }
    
    // Send setup email
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup-password?token=${setupToken}`;
    const emailSubject = 'Complete Your Account Setup';
    const emailBody = `
        <h2>Welcome to AEI Insurance!</h2>
        <p>Hello ${username},</p>
        <p>Your account has been created successfully. To complete your registration, please click the link below to set up your password:</p>
        <p><a href="${setupUrl}" style="background-color: #ffa242; color: #2A525A; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Set Up Password</a></p>
        <p>This link will expire in 7 days.</p>
        <p>If you didn't request this account, please ignore this email.</p>
        <p>Best regards,<br>AEI Insurance Team</p>
    `;
    
    try {
        // Import and use the email sender
        const { sendEmail } = await import('../../services/emailSender');
        await sendEmail(primary_email, emailSubject, emailBody);
        console.log(`Setup email sent successfully to ${primary_email}`);
    } catch (error) {
        console.error('Failed to send setup email:', error);
        // Don't fail the request if email fails, but log it
    }
    
         res.json({ 
         message: "Account created successfully. A setup email has been sent to their email address.",
     });
 });

 export const updateAccount = asyncHandler(async (req: any, res: Response): Promise<void> => {
     const { id } = req.params;
     const { username, primary_email, secondary_email, nickname, primary_phone_number, secondary_phone_number, address_1, address_2, city, province, postal_code, birthday, roles, first_name, last_name, dealer_group_id, dealerships } = req.body;
     
     // Find the existing account
     const existingAccount = await prisma.accounts.findUnique({
         where: { id: BigInt(id) },
         include: {
             contacts_accounts_contact_idTocontacts: true
         }
     });

     if(!validateRolePermissions(req, roles, dealerships, dealer_group_id)) {
        res.status(403).json({ message: "You do not have permission to update this account" });
        return;
    }
     
     if (!existingAccount) {
         res.status(404).json({ message: "Account not found" });
         return;
     }
     // Update contact information
     if (existingAccount.contacts_accounts_contact_idTocontacts) {
         await prisma.contacts.update({
             where: { id: existingAccount.contacts_accounts_contact_idTocontacts.id },
             data: {
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
                 birthday: birthday ? new Date(birthday) : null,
             }
         });
     }
     
     // Update account information
     const accountUpdateData: any = {
         username,
         roles,
         change_log: [
             ...(existingAccount.change_log as any[] || []),
             { createdBy: req.user.id, createdAt: new Date(), content: "updated account" }
         ]
     };
     
     // Update dealer group if provided
     if (dealer_group_id && dealer_group_id !== '') {
         try {
             const dealerGroupId = BigInt(dealer_group_id);
             accountUpdateData.dealer_group_id = dealerGroupId;
         } catch (error) {
             console.error('Error setting dealer group id on account:', error);
         }
     }
     
     await prisma.accounts.update({
         where: { id: BigInt(id) },
         data: accountUpdateData
     });
     
     // Update seller-dealership relationships
     if (dealerships) {
         // Delete existing relationships
         await prisma.seller_dealerships.deleteMany({
             where: { seller_id: BigInt(id) }
         });
         
         // Create new relationships
         if (dealerships.length > 0) {
             const sellerDealershipData = dealerships.map((dealershipId: string) => ({
                 seller_id: BigInt(id),
                 dealership_id: BigInt(dealershipId)
             }));
             
             await prisma.seller_dealerships.createMany({
                 data: sellerDealershipData
             });
         }
     }
     
     res.json({ message: "Account updated successfully" });
 });


// Custom validation middleware for role-based permissions
const validateRolePermissions = (req: any, roles: number[], dealerships: string[], dealer_group_id: string): boolean => {
    const userRoles = req.user.roles.filter((role: number) => [1, 2, 3, 4, 12].includes(role));
    const userHighestRole = Math.max(...userRoles);
    const targetRoles = roles;
  
    if (userHighestRole <= 1) return false
  
    // Role 2 users can only create/edit accounts with roles 1 or 2
    if (userHighestRole === 2) {
      const hasInvalidRole = targetRoles.some((role: number) => ![1, 2].includes(role));
      if (hasInvalidRole) {
        return false
      }
    }
    if(userHighestRole === 3) {
        const userDealerGroupId = req.user.dealerGroupId;
        if(userDealerGroupId === dealer_group_id) return true
    }

    if(userHighestRole === 4 || userHighestRole === 12) {
        return true
    }
  
    return false
  };