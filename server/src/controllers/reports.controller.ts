import { Request, Response } from 'express'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../middleware/error.js'
import { CustomError } from '../middleware/error.js'

// Extend Express Request to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string
    roles: number[]
    dealerships: string[]
    dealerGroupId?: string
  }
}

// Helper function to convert BigInt to Number recursively
const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber)
  }
  
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value)
    }
    return converted
  }
  
  return obj
}

export const getPolicies = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { fromDate, toDate, limit = 1000, offset = 0 } = req.query;
  const user = req.user;

  try {
    const where: any = {};
    
    if (fromDate) where.created_at = { gte: new Date(fromDate as string) };
    if (toDate) where.created_at = { ...where.created_at, lte: new Date(toDate as string) };
    
    // Enforce role-based access
    const maxRole = Math.max(...user.roles);
    if (maxRole < 4) { // Roles 1-3: Restrict
      if (maxRole === 3 && user.dealerGroupId) {
        where.dealer_group_id = user.dealerGroupId;
      } else if (maxRole === 2 && user.dealerships.length) {
        where.dealership_id = { in: user.dealerships };
      } else if (maxRole === 1) {
        where.seller_id = user.id;
      } else {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    } // Roles 4+: No restrictions
    
    const policies = await prisma.policies.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { 
        dealerships: true, 
        dealer_groups: true, 
        accounts_policies_seller_idToaccounts: {
          include: {
            contacts_accounts_contact_idTocontacts: true
          }
        }
      },
    });

    const serializedPolicies = policies.map((policy: any) => ({
      id: policy.id.toString(),
      applicant_id: policy.applicant_id.toString(),
      seller_id: policy.seller_id?.toString(),
      dealership_id: policy.dealership_id?.toString(),
      created_by_id: policy.created_by_id?.toString(),
      dealer_group_id: policy.dealer_group_id?.toString(),
      transfered_from: policy.transfered_from?.toString(),
      transfered_to: policy.transfered_to?.toString(),
      primary_insurer_id: policy.primary_insurer_id?.toString(),
      price_calculation_data: policy.price_calculation_data?.toString(),
      pricing_details: policy.pricing_details?.toString(),
      cancelation_details: policy.cancelation_details?.toString(),
      // Include non-BigInt fields
      policy_status: policy.policy_status,
      total_price: policy.total_price,
      policy_term: policy.policy_term,
      products: policy.products,
      province: policy.province,
      effective_date: policy.effective_date,
      policy_payment_method: policy.policy_payment_method,
      jwt_token: policy.jwt_token,
      created_at: policy.created_at,
      updated_at: policy.updated_at,
      applicants: policy.applicants ? {
          ...policy.applicants,
          id: policy.applicants.id.toString(),
          customer_number: policy.applicants.customer_number.toString(),
          policy_ids: policy.applicants.policy_ids.map((id: bigint) => id.toString())
      } : null,
      vehicle_details: policy.vehicle_details_policies_vehicle_detailsTovehicle_details ? {
          ...policy.vehicle_details_policies_vehicle_detailsTovehicle_details,
          id: policy.vehicle_details_policies_vehicle_detailsTovehicle_details.id.toString(),
          from_policy: policy.vehicle_details_policies_vehicle_detailsTovehicle_details.from_policy.toString()
      } : null,
      dealerships: policy.dealerships ? {
          ...policy.dealerships,
          id: policy.dealerships.id.toString(),
          dealer_group_id: policy.dealerships.dealer_group_id?.toString()
      } : null,
      seller: policy.accounts_policies_seller_idToaccounts ? {
          id: policy.accounts_policies_seller_idToaccounts.id.toString(),
          created_by: policy.accounts_policies_seller_idToaccounts.created_by.toString(),
          first_name: policy.accounts_policies_seller_idToaccounts.contacts_accounts_contact_idTocontacts?.first_name,
          last_name: policy.accounts_policies_seller_idToaccounts.contacts_accounts_contact_idTocontacts?.last_name,
      } : null
  }));
    
    res.json(serializedPolicies);
  } catch (error) {
    console.error('Error fetching policies', { error });
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});