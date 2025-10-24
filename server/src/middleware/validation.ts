import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CustomError } from './error';

// Zod schemas for validation
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const createAccountSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  nickname: z.string().optional(),
  primary_email: z.string().email('Invalid email format'),
  secondary_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  primary_phone_number: z.string().min(1, 'Primary phone number is required'),
  secondary_phone_number: z.string().optional().or(z.literal('')),
  address_1: z.string().min(1, 'Address is required'),
  address_2: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  birthday: z.string().optional().or(z.literal('')),
  roles: z.array(z.number().int().min(1).max(15)).min(1, 'At least one role is required').refine((roles) => {
    // Check if roles are between 1-15
    const validRoles = roles.every(role => role >= 1 && role <= 15);
    if (!validRoles) {
      return false;
    }
    
    // Check if user has role 1, 2, or 3
    const hasLowRole = roles.some(role => [1, 2, 3].includes(role));
    
    if (hasLowRole) {
      // If they have role 1, 2, or 3, they can only have 1 role
      return roles.length === 1;
    } else {
      // If they have role 4 or higher, they can have multiple roles but not 1, 2, or 3
      const hasForbiddenRole = roles.some(role => [1, 2, 3].includes(role));
      return !hasForbiddenRole;
    }
  }, {
    message: 'Invalid role combination.'
  }),
  dealerships: z.array(z.string()).optional(),
  dealer_group_id: z.string().optional().or(z.literal(''))
}).refine((data) => {
  const roles = data.roles;
  const hasLowRole = roles.some((role: number) => [1, 2, 3].includes(role));
  const hasRole1Or2 = roles.some((role: number) => [1, 2].includes(role));
  
  // If they have roles 1, 2, or 3, dealer_group_id is required
  if (hasLowRole && (!data.dealer_group_id || data.dealer_group_id === '')) {
    return false;
  }
  
  // If they have roles 1 or 2, dealerships are required
  if (hasRole1Or2 && (!data.dealerships || data.dealerships.length === 0)) {
    return false;
  }
  
  return true;
}, {
  message: 'Dealer group is required for Sellers, Dealership Managers, and Dealer Group Admins. Assigned Dealerships are required for Sellers and Dealership Managers.'
});

export const setupPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const createDealershipSchema = z.object({
  name: z.string().min(1, 'Dealership name is required'),
  province: z.string().optional()
});

export const createPolicySchema = z.object({
  applicant: z.object({
    isOrganization: z.boolean().optional(),
    primaryName: z.string().min(1, 'Primary name is required').min(2, 'Primary name must be at least 2 characters'),
    secondaryName: z.string().optional(),
    postalCode: z.string().optional(),
    street: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    customerNumber: z.string().optional()
  }),
  contactInfo: z.object({
    primary: z.object({
      name: z.object({
        value: z.string().min(1, 'Primary contact name is required'),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      phoneNumber: z.object({
        value: z.string().min(1, 'Primary phone number is required'),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      secondaryPhoneNumber: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      email: z.object({
        value: z.string().email('Invalid email format').min(1, 'Primary email is required'),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      secondaryEmail: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      })
    }),
    secondary: z.object({
      name: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      phoneNumber: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      secondaryPhoneNumber: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      email: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      }),
      secondaryEmail: z.object({
        value: z.string().optional(),
        optional: z.boolean().optional(),
        rules: z.array(z.string()).optional()
      })
    })
  }),
  vehicle: z.object({
    vin: z.string().min(1, 'VIN is required'),
    odometer: z.union([z.string(), z.number()]),
    purchaseMethod: z.string(),
    purchasePrice: z.number(),
    make: z.string().optional(),
    model: z.string().optional(),
    series: z.string().optional(),
    modelYear: z.union([z.string(), z.number()])
  }),
  debtInfo: z.object({
    totalAmount: z.number().optional(),
    interestRate: z.number().optional(),
    debtTerm: z.number().optional(),
    monthlyPayment: z.number().optional(),
    residualValue: z.number().optional(),
    rolledInNegativeEquity: z.number().optional(),
    downPayment: z.number().optional()
  }),
  selectedProducts: z.array(z.object({
    productName: z.string(),
    productTerm: z.string(),
    price: z.number()
  })),
  paymentInfo: z.object({
    paymentMethod: z.string().optional(),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    cardHolderName: z.string().optional(),
    billingAddress: z.string().optional(),
    financingMethod: z.string().optional(),
    lienholderName: z.string().optional(),
    loanNumber: z.string().optional(),
    accountHolderName: z.string().optional(),
    bankName: z.string().optional(),
    bankNumber: z.string().optional(),
    branchNumber: z.string().optional(),
    accountNumber: z.string().optional(),
    bankAddress: z.string().optional(),
    PFATerm: z.number().optional(),
    dealerReference: z.string().optional(),
    dealerFinanceReference: z.string().optional()
  }),
  dealership: z.union([z.string(), z.number()]).optional(),
  transfered_from: z.string().optional()
});

export const quickQuoteSchema = z.object({
  policy: z.any(), // Can be more specific based on your needs
  currentStep: z.number().int().min(1, 'Current step must be at least 1')
});

export const updateUserSettingsSchema = z.object({
  email: z.string().email('Invalid email format'),
  notifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional()
});

// Generic validation middleware using Zod
export const validateWithZod = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const errorMessages = zodError.issues.map((err: any) => {
          const path = err.path.join('.');
          const received = err.received;
          const expected = err.expected;
          return `${path}: expected ${expected}, received ${JSON.stringify(received)}`;
        }).join(', ');
        throw new CustomError(`Validation error: ${errorMessages}`, 400);
      }
      throw new CustomError('Validation failed', 400);
    }
  };
};

// Validation middleware for required fields (legacy - can be replaced with Zod)
export const validateRequiredFields = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const missingFields = fields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            throw new CustomError(`Missing required fields: ${missingFields.join(', ')}`, 400);
        }
        
        next();
    };
};

// Validation middleware for role-based access
export const validateRole = (allowedRoles: number[]) => {
    return (req: any, res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new CustomError('User not authenticated', 401);
        }
        if (!allowedRoles.includes(req.user.account_type) && !allowedRoles.includes(0) && !req.user.roles.includes(12)) {
            throw new CustomError('Insufficient permissions', 403);
        }
        
        next();
    };
};

// Validation middleware for dealership access
export const validateDealershipAccess = (req: any, res: Response, next: NextFunction): void => {
    const user = req.user;

    console.log("user.roles", user.roles)
    console.log("has access", Math.max(...user.roles.map((r: string) => Number(r))) >= 4)
    
    // Admin users (role 4+) have access to all dealerships
    if (user.roles && Math.max(...user.roles.map((r: string) => Number(r))) >= 4) {
        return next();
    }
    
    // Check if user has dealership access from JWT claims
    if (!user.dealerships || user.dealerships.length === 0) {
        throw new CustomError('No dealership access', 403);
    }
    
    // If specific dealership is being accessed, validate it
    const targetDealership = req.params.dealershipId || req.body.dealershipId;
    if (targetDealership && !user.dealerships.includes(targetDealership)) {
        throw new CustomError('Access denied to this dealership', 403);
    }
    
    next();
};

// Validation middleware for dealer group access
export const validateDealerGroupAccess = (req: any, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    // Admin users (role 4+) have access to all dealer groups
    if (user.roles && Math.max(...user.roles.map((r: string) => Number(r))) >= 4) {
        return next();
    }
    
    // Check if user has dealer group access from JWT claims
    if (!user.dealerGroupId) {
        throw new CustomError('No dealer group access', 403);
    }
    
    // If specific dealer group is being accessed, validate it
    const targetDealerGroup = req.params.dealerGroupId || req.body.dealerGroupId;
    if (targetDealerGroup && user.dealerGroupId !== targetDealerGroup) {
        throw new CustomError('Access denied to this dealer group', 403);
    }
    
    next();
};

// Validation middleware for specific dealership access
export const validateSpecificDealershipAccess = (dealershipId: string) => {
    return (req: any, res: Response, next: NextFunction): void => {
        const user = req.user;
        
        // Admin users (role 4+) have access to all dealerships
        if (user.roles && Math.max(...user.roles.map((r: string) => Number(r))) >= 4) {
            return next();
        }
        
        // Check if user has access to the specific dealership
        if (!user.dealerships || !user.dealerships.includes(dealershipId)) {
            throw new CustomError('Access denied to this dealership', 403);
        }
        
        next();
    };
};

// Validation middleware for specific dealer group access
export const validateSpecificDealerGroupAccess = (dealerGroupId: string) => {
    return (req: any, res: Response, next: NextFunction): void => {
        const user = req.user;
        
        // Admin users (role 4+) have access to all dealer groups
        if (user.roles && Math.max(...user.roles.map((r: string) => Number(r))) >= 4) {
            return next();
        }
        
        // Check if user has access to the specific dealer group
        if (!user.dealerGroupId || user.dealerGroupId !== dealerGroupId) {
            throw new CustomError('Access denied to this dealer group', 403);
        }
        
        next();
    };
};

// Contact validation schema using Zod
export const createContactSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'First name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  nickname: z.string().optional(),
  
  primary_email: z.string()
    .min(1, 'Primary email is required')
    .email('Please enter a valid primary email address'),
  
  secondary_email: z.string()
    .email('Please enter a valid secondary email address')
    .optional()
    .or(z.literal('')),
  
  primary_phone_number: z.string()
    .min(1, 'Primary phone number is required')
    .refine((val) => {
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }, 'Primary phone number must have between 10 and 15 digits'),
  
  secondary_phone_number: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }, 'Secondary phone number must have between 10 and 15 digits')
    .optional()
    .or(z.literal('')),
  
  address_1: z.string()
    .min(1, 'Address is required')
    .min(5, 'Address must be at least 5 characters'),
  
  address_2: z.string().optional(),
  
  city: z.string()
    .min(1, 'City is required')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'City can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  province: z.string()
    .min(1, 'Province is required'),
  
  postal_code: z.string()
    .min(1, 'Postal code is required')
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Please enter a valid Canadian postal code (e.g., A1A 1A1)'),
  
  birthday: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const birthDate = new Date(val);
      if (isNaN(birthDate.getTime())) return false;
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;
    }, 'Please enter a valid birthday (age must be between 0 and 120)')
    .optional()
    .or(z.literal(''))
});

// Contact validation middleware using Zod
export const validateContactFields = validateWithZod(createContactSchema);