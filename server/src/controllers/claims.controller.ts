import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { uploadToClaimsBucket, deleteFromClaimsBucket, supabase } from '../config/supabase.js';
import { scheduleCommand } from '../services/actionQueue.js';
import multer from 'multer';

const prisma = new PrismaClient();

// Helper function to add change log entry
const addChangeLogEntry = (changeLog: any[], action: string, details: any, userId?: string) => {
    const entry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        userId: userId || 'system'
    };
    changeLog.push(entry);
    return changeLog;
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, Word docs, and text files are allowed.'));
    }
  }
});

export const getClaims = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const claims = await prisma.claims_details.findMany({
        include: {
            policies: true,
            applicants: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedClaims = claims.map(claim => ({
        ...claim,
        id: claim.id.toString(),
        from_customer: claim.from_customer.toString(),
        from_policy: claim.from_policy.toString(),
        policies: claim.policies ? {
            ...claim.policies,
            id: claim.policies.id.toString(),
            applicant_id: claim.policies.applicant_id.toString(),
            seller_id: claim.policies.seller_id?.toString(),
            dealership_id: claim.policies.dealership_id?.toString(),
            dealer_group_id: claim.policies.dealership_id?.toString(),
            created_by_id: claim.policies.created_by_id.toString(),
            transfered_from: claim.policies.transfered_from?.toString(),
            transfered_to: claim.policies.transfered_to?.toString(),
            primary_insurer_id: claim.policies.primary_insurer_id?.toString(),
            vehicle_details: claim.policies.vehicle_details?.toString(),
            price_calculation_data: claim.policies.price_calculation_data?.toString(),
            pricing_details: claim.policies.pricing_details?.toString(),
            cancelation_details: claim.policies.cancelation_details?.toString()
        } : null,
        applicants: claim.applicants ? {
            ...claim.applicants,
            id: claim.applicants.id.toString(),
            customer_number: claim.applicants.customer_number.toString(),
            policy_ids: claim.applicants.policy_ids.map(id => id.toString())
        } : null
    }));
    
    res.json(serializedClaims);
});

export const getClaim = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const claim = await prisma.claims_details.findUnique({
        where: { id: BigInt(id) },
        include: {
            policies: true,
            applicants: true
        }
    });
    
    if (!claim) {
        res.status(404).json({ message: 'Claim not found' });
        return;
    }
    
        // Convert BigInt fields to strings for JSON serialization
        const serializedClaim = {
            ...claim,
            id: claim.id.toString(),
            from_customer: claim.from_customer.toString(),
            from_policy: claim.from_policy.toString(),
            policies: (claim as any).policies ? {
                ...(claim as any).policies,
                id: (claim as any).policies.id.toString(),
                applicant_id: (claim as any).policies.applicant_id.toString(),
                seller_id: (claim as any).policies.seller_id?.toString(),
                dealership_id: (claim as any).policies.dealership_id?.toString(),
                dealer_group_id: (claim as any).policies.dealership_id?.toString(),
                created_by_id: (claim as any).policies.created_by_id.toString(),
                transfered_from: (claim as any).policies.transfered_from?.toString(),
                transfered_to: (claim as any).policies.transfered_to?.toString(),
                primary_insurer_id: (claim as any).policies.primary_insurer_id?.toString(),
                vehicle_details: (claim as any).policies.vehicle_details?.toString(),
                price_calculation_data: (claim as any).policies.price_calculation_data?.toString(),
                pricing_details: (claim as any).policies.pricing_details?.toString(),
                cancelation_details: (claim as any).policies.cancelation_details?.toString()
            } : null,
            applicants: (claim as any).applicants ? {
                ...(claim as any).applicants,
                id: (claim as any).applicants.id.toString(),
                customer_number: (claim as any).applicants.customer_number.toString(),
                policy_ids: (claim as any).applicants.policy_ids.map((id: any) => id.toString())
            } : null
        };
    
    res.json(serializedClaim);
});

export const createClaim = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const {
        from_customer,
        from_policy
    } = req.body;

    console.log('Creating claim for customer:', from_customer, 'policy:', from_policy);
    
    // First, find the applicant by customer number
    const applicant = await prisma.applicants.findUnique({
        where: {
            customer_number: BigInt(from_customer)
        }
    });
    
    if (!applicant) {
        res.status(404).json({ message: 'Applicant not found with customer number: ' + from_customer });
        return;
    }
    
    console.log('Found applicant:', applicant.id);
    
    // Check if the policy exists and has the correct status
    const policy = await prisma.policies.findUnique({
        where: { id: BigInt(from_policy) }
    });

    if (!policy) {
        res.status(404).json({ message: 'Policy not found' });
        return;
    }

    if (policy.policy_status !== 1) {
        res.status(400).json({
            message: 'Policy must have status 1 (Active) to create a claim. Current status: ' + policy.policy_status
        });
        return;
    }

    // Check if there's already an active claim on this policy
    const existingActiveClaim = await prisma.claims_details.findFirst({
        where: {
            from_policy: BigInt(from_policy),
            active: 1
        }
    });

    if (existingActiveClaim) {
        res.status(400).json({
            message: 'An active claim already exists for this policy. Please complete the existing claim before creating a new one.'
        });
        return;
    }
    
        const claim = await prisma.claims_details.create({
            data: {
                from_customer: applicant.id, // Use the applicant's ID, not customer number
                from_policy: BigInt(from_policy),
                documents: {},
                active: 1,
                last_update: new Date(),
                change_log: [{
                    timestamp: new Date().toISOString(),
                    action: 'CLAIM_CREATED',
                    details: {
                        customerNumber: from_customer,
                        policyId: from_policy,
                        applicantId: applicant.id.toString()
                    },
                    userId: req.user?.id || 'system'
                }] as any
            },
            include: {
                policies: true,
                applicants: true
            }
        });

    // Update the policy status to 9 (claim status)
    await prisma.policies.update({
        where: { id: BigInt(from_policy) },
        data: { policy_status: 9 }
    });

    // Schedule a reminder email for today
    try {
        await scheduleCommand(
            'sendReminderEmail',
            new Date(), // Today
            {
                claim_id: claim.id.toString(),
                email_1: applicant.email_1,
                email_2: applicant.email_2
            }
        );
        console.log(`Reminder email scheduled for claim ${claim.id}`);
    } catch (error) {
        console.error('Failed to schedule reminder email:', error);
        // Don't fail the claim creation if reminder scheduling fails
    }
    
        // Convert BigInt fields to strings for JSON serialization
        const serializedClaim = {
            ...claim,
            id: claim.id.toString(),
            from_customer: claim.from_customer.toString(),
            from_policy: claim.from_policy.toString(),
            policies: (claim as any).policies ? {
                ...(claim as any).policies,
                id: (claim as any).policies.id.toString(),
                applicant_id: (claim as any).policies.applicant_id.toString(),
                seller_id: (claim as any).policies.seller_id?.toString(),
                dealership_id: (claim as any).policies.dealership_id?.toString(),
                dealer_group_id: (claim as any).policies.dealership_id?.toString(),
                created_by_id: (claim as any).policies.created_by_id.toString(),
                transfered_from: (claim as any).policies.transfered_from?.toString(),
                transfered_to: (claim as any).policies.transfered_to?.toString(),
                primary_insurer_id: (claim as any).policies.primary_insurer_id?.toString(),
                vehicle_details: (claim as any).policies.vehicle_details?.toString(),
                price_calculation_data: (claim as any).policies.price_calculation_data?.toString(),
                pricing_details: (claim as any).policies.pricing_details?.toString(),
                cancelation_details: (claim as any).policies.cancelation_details?.toString()
            } : null,
            applicants: (claim as any).applicants ? {
                ...(claim as any).applicants,
                id: (claim as any).applicants.id.toString(),
                customer_number: (claim as any).applicants.customer_number.toString(),
                policy_ids: (claim as any).applicants.policy_ids.map((id: any) => id.toString())
            } : null
        };
    
    res.status(201).json(serializedClaim);
});

export const updateClaim = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get current claim to compare changes
    const currentClaim = await prisma.claims_details.findUnique({
        where: { id: BigInt(id) }
    });
    
    if (!currentClaim) {
        res.status(404).json({ message: 'Claim not found' });
        return;
    }
    
    // Convert BigInt fields if present
    if (updateData.from_customer) {
        updateData.from_customer = BigInt(updateData.from_customer);
    }
    
    if (updateData.from_policy) {
        updateData.from_policy = BigInt(updateData.from_policy);
    }
    
    // Track changes for logging
    const changes: any = {};
    const currentChangeLog = (currentClaim as any).change_log || [];
    
    // Compare fields and track changes
    Object.keys(updateData).forEach(key => {
        if (key !== 'change_log' && updateData[key] !== currentClaim[key as keyof typeof currentClaim]) {
            changes[key] = {
                from: currentClaim[key as keyof typeof currentClaim],
                to: updateData[key]
            };
        }
    });
    
    // Add change log entry if there are changes
    if (Object.keys(changes).length > 0) {
        updateData.change_log = addChangeLogEntry(
            [...currentChangeLog],
            'CLAIM_UPDATED',
            { changes },
            req.user?.id
        );
        updateData.last_update = new Date();
    }
    
    const claim = await prisma.claims_details.update({
        where: { id: BigInt(id) },
        data: updateData,
        include: {
            policies: true,
            applicants: true
        }
    });
    
        // Convert BigInt fields to strings for JSON serialization
        const serializedClaim = {
            ...claim,
            id: claim.id.toString(),
            from_customer: claim.from_customer.toString(),
            from_policy: claim.from_policy.toString(),
            policies: (claim as any).policies ? {
                ...(claim as any).policies,
                id: (claim as any).policies.id.toString(),
                applicant_id: (claim as any).policies.applicant_id.toString(),
                seller_id: (claim as any).policies.seller_id?.toString(),
                dealership_id: (claim as any).policies.dealership_id?.toString(),
                dealer_group_id: (claim as any).policies.dealership_id?.toString(),
                created_by_id: (claim as any).policies.created_by_id.toString(),
                transfered_from: (claim as any).policies.transfered_from?.toString(),
                transfered_to: (claim as any).policies.transfered_to?.toString(),
                primary_insurer_id: (claim as any).policies.primary_insurer_id?.toString(),
                vehicle_details: (claim as any).policies.vehicle_details?.toString(),
                price_calculation_data: (claim as any).policies.price_calculation_data?.toString(),
                pricing_details: (claim as any).policies.pricing_details?.toString(),
                cancelation_details: (claim as any).policies.cancelation_details?.toString()
            } : null,
            applicants: (claim as any).applicants ? {
                ...(claim as any).applicants,
                id: (claim as any).applicants.id.toString(),
                customer_number: (claim as any).applicants.customer_number.toString(),
                policy_ids: (claim as any).applicants.policy_ids.map((id: any) => id.toString())
            } : null
        };
    
    res.json(serializedClaim);
});

export const deleteClaim = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await prisma.claims_details.delete({
        where: { id: BigInt(id) }
    });
    
    res.json({ message: 'Claim deleted successfully' });
});

export const uploadDocument = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    const { documentName } = req.body;
    
    if (!documentName) {
        res.status(400).json({ message: 'Document name is required' });
        return;
    }
    
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    
    const claim = await prisma.claims_details.findUnique({
        where: { id: BigInt(id) }
    });
    
    if (!claim) {
        res.status(404).json({ message: 'Claim not found' });
        return;
    }
    
    try {
        // Upload file to Supabase bucket
        const uploadResult = await uploadToClaimsBucket(req.file, id, documentName);
        
        // Update documents JSON field
        const currentDocuments = claim.documents as any || {};
        currentDocuments[documentName] = {
            uploaded: true,
            uploadedAt: new Date().toISOString(),
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            filePath: uploadResult.path,
            fileUrl: uploadResult.url
        };
        
        // Update change log
        const currentChangeLog = (claim as any).change_log || [];
        const updatedChangeLog = addChangeLogEntry(
            [...currentChangeLog],
            'DOCUMENT_UPLOADED',
            {
                documentName,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                filePath: uploadResult.path
            },
            req.user?.id
        );
        
        const updatedClaim = await prisma.claims_details.update({
            where: { id: BigInt(id) },
            data: {
                documents: currentDocuments,
                change_log: updatedChangeLog as any,
                last_update: new Date()
            },
            include: {
                policies: true,
                applicants: true
            }
        });
        
        // Convert BigInt fields to strings for JSON serialization
        const serializedClaim = {
            ...updatedClaim,
            id: updatedClaim.id.toString(),
            from_customer: updatedClaim.from_customer.toString(),
            from_policy: updatedClaim.from_policy.toString(),
            policies: updatedClaim.policies ? {
                ...updatedClaim.policies,
                id: updatedClaim.policies.id.toString(),
                applicant_id: updatedClaim.policies.applicant_id.toString(),
                seller_id: updatedClaim.policies.seller_id?.toString(),
                dealership_id: updatedClaim.policies.dealership_id?.toString(),
                dealer_group_id: updatedClaim.policies.dealership_id?.toString(),
                created_by_id: updatedClaim.policies.created_by_id.toString(),
                transfered_from: updatedClaim.policies.transfered_from?.toString(),
                transfered_to: updatedClaim.policies.transfered_to?.toString(),
                primary_insurer_id: updatedClaim.policies.primary_insurer_id?.toString(),
                vehicle_details: updatedClaim.policies.vehicle_details?.toString(),
                price_calculation_data: updatedClaim.policies.price_calculation_data?.toString(),
                pricing_details: updatedClaim.policies.pricing_details?.toString(),
                cancelation_details: updatedClaim.policies.cancelation_details?.toString()
            } : null,
            applicants: updatedClaim.applicants ? {
                ...updatedClaim.applicants,
                id: updatedClaim.applicants.id.toString(),
                customer_number: updatedClaim.applicants.customer_number.toString(),
                policy_ids: updatedClaim.applicants.policy_ids.map(id => id.toString())
            } : null
        };
        
        res.json(serializedClaim);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Failed to upload document' });
    }
});

export const downloadDocument = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    const { documentName } = req.query;
    
    if (!documentName) {
        res.status(400).json({ message: 'Document name is required' });
        return;
    }
    
    const claim = await prisma.claims_details.findUnique({
        where: { id: BigInt(id) }
    });
    
    if (!claim) {
        res.status(404).json({ message: 'Claim not found' });
        return;
    }
    
    const currentDocuments = claim.documents as any || {};
    const documentData = currentDocuments[documentName as string];
    
    if (!documentData || !documentData.filePath) {
        res.status(404).json({ message: 'Document not found' });
        return;
    }
    
    try {
        // Download file from Supabase bucket
        const { data, error } = await supabase.storage
            .from('claims_documents')
            .download(documentData.filePath);
        
        if (error) {
            console.error('Error downloading file from Supabase:', error);
            res.status(500).json({ message: 'Failed to download document' });
            return;
        }
        
        if (!data) {
            res.status(404).json({ message: 'Document not found in storage' });
            return;
        }
        
        // Convert blob to buffer
        const buffer = Buffer.from(await data.arrayBuffer());
        
        // Set appropriate headers
        res.setHeader('Content-Type', documentData.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${documentData.fileName || documentName}"`);
        res.setHeader('Content-Length', buffer.length);
        
        // Send the file
        res.send(buffer);
        
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ message: 'Failed to download document' });
    }
});

export const deleteDocument = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { id } = req.params;
    const { documentName } = req.body;
    
    if (!documentName) {
        res.status(400).json({ message: 'Document name is required' });
        return;
    }
    
    const claim = await prisma.claims_details.findUnique({
        where: { id: BigInt(id) }
    });
    
    if (!claim) {
        res.status(404).json({ message: 'Claim not found' });
        return;
    }
    
    const currentDocuments = claim.documents as any || {};
    const documentData = currentDocuments[documentName];
    
    if (!documentData) {
        res.status(404).json({ message: 'Document not found' });
        return;
    }
    
    try {
        // Mark document as replaced instead of deleting
        currentDocuments[documentName] = {
            ...documentData,
            status: 'replaced',
            replacedAt: new Date().toISOString(),
            replacedBy: req.user?.id || 'system'
        };
        
        // Update change log
        const currentChangeLog = (claim as any).change_log || [];
        const updatedChangeLog = addChangeLogEntry(
            [...currentChangeLog],
            'DOCUMENT_REPLACED',
            {
                documentName,
                fileName: documentData.fileName,
                fileSize: documentData.fileSize,
                mimeType: documentData.mimeType,
                filePath: documentData.filePath,
                replacedBy: req.user?.id || 'system'
            },
            req.user?.id
        );
        
        const updatedClaim = await prisma.claims_details.update({
            where: { id: BigInt(id) },
            data: {
                documents: currentDocuments,
                change_log: updatedChangeLog as any,
                last_update: new Date()
            },
            include: {
                policies: true,
                applicants: true
            }
        });
        
        // Convert BigInt fields to strings for JSON serialization
        const serializedClaim = {
            ...updatedClaim,
            id: updatedClaim.id.toString(),
            from_customer: updatedClaim.from_customer.toString(),
            from_policy: updatedClaim.from_policy.toString(),
            policies: updatedClaim.policies ? {
                ...updatedClaim.policies,
                id: updatedClaim.policies.id.toString(),
                applicant_id: updatedClaim.policies.applicant_id.toString(),
                seller_id: updatedClaim.policies.seller_id?.toString(),
                dealership_id: updatedClaim.policies.dealership_id?.toString(),
                dealer_group_id: updatedClaim.policies.dealership_id?.toString(),
                created_by_id: updatedClaim.policies.created_by_id.toString(),
                transfered_from: updatedClaim.policies.transfered_from?.toString(),
                transfered_to: updatedClaim.policies.transfered_to?.toString(),
                primary_insurer_id: updatedClaim.policies.primary_insurer_id?.toString(),
                vehicle_details: updatedClaim.policies.vehicle_details?.toString(),
                price_calculation_data: updatedClaim.policies.price_calculation_data?.toString(),
                pricing_details: updatedClaim.policies.pricing_details?.toString(),
                cancelation_details: updatedClaim.policies.cancelation_details?.toString()
            } : null,
            applicants: updatedClaim.applicants ? {
                ...updatedClaim.applicants,
                id: updatedClaim.applicants.id.toString(),
                customer_number: updatedClaim.applicants.customer_number.toString(),
                policy_ids: updatedClaim.applicants.policy_ids.map(id => id.toString())
            } : null
        };
        
        res.json(serializedClaim);
    } catch (error) {
        console.error('Error replacing document:', error);
        res.status(500).json({ message: 'Failed to replace document' });
    }
});

export const getClaimsByEmail = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { email } = req.params;
    
    const claims = await prisma.claims_details.findMany({
        where: {
            applicants: {
                email_1: email
            }
        },
        include: {
            policies: true,
            applicants: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedClaims = claims.map(claim => ({
        ...claim,
        id: claim.id.toString(),
        from_customer: claim.from_customer.toString(),
        from_policy: claim.from_policy.toString(),
        policies: claim.policies ? {
            ...claim.policies,
            id: claim.policies.id.toString(),
            applicant_id: claim.policies.applicant_id.toString(),
            seller_id: claim.policies.seller_id?.toString(),
            dealership_id: claim.policies.dealership_id?.toString(),
            dealer_group_id: claim.policies.dealership_id?.toString(),
            created_by_id: claim.policies.created_by_id.toString(),
            transfered_from: claim.policies.transfered_from?.toString(),
            transfered_to: claim.policies.transfered_to?.toString(),
            primary_insurer_id: claim.policies.primary_insurer_id?.toString(),
            vehicle_details: claim.policies.vehicle_details?.toString(),
            price_calculation_data: claim.policies.price_calculation_data?.toString(),
            pricing_details: claim.policies.pricing_details?.toString(),
            cancelation_details: claim.policies.cancelation_details?.toString()
        } : null,
        applicants: claim.applicants ? {
            ...claim.applicants,
            id: claim.applicants.id.toString(),
            customer_number: claim.applicants.customer_number.toString(),
            policy_ids: claim.applicants.policy_ids.map(id => id.toString())
        } : null
    }));
    
    res.json(serializedClaims);
});

export const getClaimsByCustomerNumber = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { customerNumber } = req.params;
    
    const claims = await prisma.claims_details.findMany({
        where: {
            applicants: {
                customer_number: BigInt(customerNumber)
            }
        },
        include: {
            policies: true,
            applicants: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedClaims = claims.map(claim => ({
        ...claim,
        id: claim.id.toString(),
        from_customer: claim.from_customer.toString(),
        from_policy: claim.from_policy.toString(),
        policies: claim.policies ? {
            ...claim.policies,
            id: claim.policies.id.toString(),
            applicant_id: claim.policies.applicant_id.toString(),
            seller_id: claim.policies.seller_id?.toString(),
            dealership_id: claim.policies.dealership_id?.toString(),
            dealer_group_id: claim.policies.dealership_id?.toString(),
            created_by_id: claim.policies.created_by_id.toString(),
            transfered_from: claim.policies.transfered_from?.toString(),
            transfered_to: claim.policies.transfered_to?.toString(),
            primary_insurer_id: claim.policies.primary_insurer_id?.toString(),
            vehicle_details: claim.policies.vehicle_details?.toString(),
            price_calculation_data: claim.policies.price_calculation_data?.toString(),
            pricing_details: claim.policies.pricing_details?.toString(),
            cancelation_details: claim.policies.cancelation_details?.toString()
        } : null,
        applicants: claim.applicants ? {
            ...claim.applicants,
            id: claim.applicants.id.toString(),
            customer_number: claim.applicants.customer_number.toString(),
            policy_ids: claim.applicants.policy_ids.map(id => id.toString())
        } : null
    }));
    
    res.json(serializedClaims);
});

// Export multer middleware for use in routes
export { upload }; 