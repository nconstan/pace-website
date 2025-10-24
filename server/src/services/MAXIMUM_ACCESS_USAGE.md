# Maximum Access Control System

This document explains how to use the `getMaximumReadAccess` function for role-based access control with field-level permissions.

## Overview

The maximum access system provides:
- **Role-based filtering**: Different roles see different data based on their permissions
- **Field-level access control**: Users can only access specific fields they're authorized to see
- **Automatic where clause generation**: Role-based filtering is applied automatically
- **Filter validation**: Additional filters are validated against allowed fields

## Role Hierarchy

### Role 1 (Basic Seller)
- **Policies**: Only policies they sold in dealerships they're active at
- **Fields**: `created_at`, `policy_status`, `total_price`, `dealership_id`, `effective_date`, `products`, `policy_term`, `date_terminated`, `province`, `applicant_id`
- **Pricing Details**: `seller_commission`, `retail_price_after_tax`
- **Cancellation Details**: `created_at`, `referral_clawback`
- **Vehicle Details**: `vin`, `make`, `model`, `series`, `body`, `bought_vehicle_value`, `vehicle_state`, `vehicle_purchase_year`, `odometer`, `model_year`
- **Applicants**: Full access to applicant data
- **Accounts**: Only their own account (`username`)
- **Contacts**: Contacts from their dealer group
- **Quick Quotes**: Only their own quotes
- **Dealerships**: Only dealerships they're active at

### Role 2 (Dealership Manager)
- **Policies**: ALL policies sold in dealerships they're active at
- **Fields**: Role 1 fields + `seller_id`
- **Pricing Details**: `dealership_referral_fee`, `retail_price_after_tax` (removes `seller_commission`)
- **Cancellation Details**: `created_at`, `dealership_clawback` (removes `referral_clawback`)
- **Accounts**: Role 1 + `roles`, `active` fields, can see other role 1 accounts in their dealerships
- **Other entities**: Same as Role 1

### Role 3 (Dealer Group Manager)
- **Policies**: All policies sold by their dealer group
- **Fields**: Same as Role 2
- **Pricing Details**: `dealership_referral_fee`, `dealer_group_referral_fee`, `retail_price_after_tax` (removes `seller_commission`)
- **Cancellation Details**: `created_at`, `dealership_clawback`, `dealer_group_clawback` (removes `referral_clawback`)
- **Accounts**: Role 1 and 2 accounts in their dealer group + their own account
- **Dealerships**: All dealerships in their dealer group (removes `dealership_id` field)

### Role 12 (Super Admin)
- **Everything**: Full access to all data and fields

## Usage Examples

### Basic Usage

```typescript
import { getMaximumReadAccess } from '../services/maximumAccess';

// Get policies with role-based access
const accessResult = getMaximumReadAccess(
    user.roles, // [1, 2, 3, etc.]
    { 
        policies: 'all', 
        vehicle_details: 'all', 
        applicants: 'all' 
    },
    {}, // additional filters
    user // user object with id, dealerships, dealerGroupId
);

if (!accessResult.success) {
    return res.status(403).json({ error: accessResult.error });
}

const { where, include } = accessResult.clauses!;
const policies = await prisma.policies.findMany({ where, include });
```

### Field-Specific Access

```typescript
// Request specific fields only
const accessResult = getMaximumReadAccess(
    user.roles,
    {
        policies: ['created_at', 'policy_status', 'total_price'],
        vehicle_details: ['vin', 'make', 'model'],
        pricing_details: ['retail_price_after_tax']
    },
    {},
    user
);
```

### With Additional Filters

```typescript
const accessResult = getMaximumReadAccess(
    user.roles,
    { policies: 'all' },
    {
        policies: {
            policy_status: { in: [1, 2, 3] },
            created_at: {
                gte: new Date('2023-01-01'),
                lte: new Date('2023-12-31')
            }
        }
    },
    user
);
```

### Using the Helper Function

```typescript
import { applyMaximumAccess } from '../services/maximumAccess';

// Direct database query with access control
const policies = await applyMaximumAccess(
    prisma,
    'policies',
    user.roles,
    { policies: 'all', vehicle_details: 'all' },
    { policies: { policy_status: 1 } },
    user
);
```

## Controller Implementation

```typescript
export const getPoliciesWithAccess = asyncHandler(async (req: any, res: Response) => {
    const user = req.user!;
    const { requestedValues, additionalFilters } = req.body;
    
    try {
        const accessResult = getMaximumReadAccess(
            user.roles,
            requestedValues || { policies: 'all' },
            additionalFilters || {},
            user
        );
        
        if (!accessResult.success) {
            return res.status(403).json({ error: accessResult.error });
        }
        
        const { where, include } = accessResult.clauses!;
        const policies = await prisma.policies.findMany({ where, include });
        
        // Convert BigInt to string for JSON serialization
        const serializedPolicies = policies.map(convertBigIntToString);
        res.json(serializedPolicies);
        
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

## Request Body Examples

### Get All Policies with Full Details
```json
{
    "requestedValues": {
        "policies": "all",
        "vehicle_details": "all",
        "applicants": "all",
        "pricing_details": "all"
    },
    "additionalFilters": {}
}
```

### Get Specific Fields with Filters
```json
{
    "requestedValues": {
        "policies": ["created_at", "policy_status", "total_price"],
        "vehicle_details": ["vin", "make", "model"]
    },
    "additionalFilters": {
        "policies": {
            "policy_status": { "in": [1, 2, 3] },
            "created_at": {
                "gte": "2023-01-01T00:00:00Z",
                "lte": "2023-12-31T23:59:59Z"
            }
        }
    }
}
```

## Error Handling

The function returns an object with:
- `success`: boolean indicating if access was granted
- `error`: string describing the access denial reason
- `clauses`: object containing `where` and `include` clauses (null if access denied)

Common error scenarios:
- Requesting fields not allowed for the user's role
- Trying to filter on fields not permitted for the role
- Accessing entities not allowed for the role

## Security Notes

1. **Always validate user roles** before calling the function
2. **Check the success flag** before using the clauses
3. **Handle access denied scenarios** gracefully
4. **Log access attempts** for audit purposes
5. **Never bypass the access control** - always use the returned clauses

## Migration from Existing Code

To migrate existing endpoints:

1. Replace manual role checking with `getMaximumReadAccess`
2. Use the returned `where` and `include` clauses
3. Remove manual field filtering logic
4. Update error handling to use the new response format

Example migration:
```typescript
// Before
if (user.role === 1) {
    whereClause.seller_id = BigInt(user.id);
}

// After
const accessResult = getMaximumReadAccess(user.roles, requestedValues, additionalFilters, user);
if (!accessResult.success) {
    return res.status(403).json({ error: accessResult.error });
}
const { where, include } = accessResult.clauses!;
```
