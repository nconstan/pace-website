// Base permissions for role 1 (default)
const basePermissions = {
    policies: {
        allowedFields: ['created_at', 'policy_status', 'total_price', 'dealership_id', 'effective_date', 'products', 'policy_term', 'date_terminated', 'province', 'applicant_id'],
        whereClause: (user: any) => ({
            seller_id: BigInt(user.id),
            dealerships: {
                id: {
                    in: user.dealerships?.map((id: string) => BigInt(id)) || []
                }
            }
        })
    },
    pricing_details: {
        allowedFields: ['seller_commission', 'retail_price_after_tax']
    },
    cancelation_details: {
        allowedFields: ['created_at', 'referral_clawback']
    },
    vehicle_details: {
        allowedFields: ['vin', 'make', 'model', 'series', 'body', 'bought_vehicle_value', 'vehicle_state', 'vehicle_purchase_year', 'odometer', 'model_year']
    },
    applicants: {
        allowedFields: ['created_at', 'is_company', 'first_name_1', 'last_name_1', 'first_name_2', 'last_name_2', 'address_1', 'address_2', 'city', 'province', 'postal_code', 'email_1', 'email_2', 'phone_number_1', 'phone_number_2', 'customer_number', 'policy_ids']
    },
    accounts: {
        allowedFields: ['username'],
        whereClause: (user: any) => ({ id: BigInt(user.id) })
    },
    contacts: {
        allowedFields: ['first_name', 'last_name', 'nickname', 'primary_email', 'secondary_email', 'primary_phone_number', 'secondary_phone_number', 'city', 'province', 'postal_code'],
        whereClause: (user: any) => ({
            dealer_group_id: user.dealerGroupId ? BigInt(user.dealerGroupId) : undefined
        })
    },
    quick_quotes: {
        allowedFields: ['all'],
        whereClause: (user: any) => ({ seller_id: BigInt(user.id) })
    },
    dealerships: {
        allowedFields: ['dealership_id', 'province', 'address_1', 'address_2', 'city', 'postal_code', 'name', 'nickname'],
        whereClause: (user: any) => ({
            id: {
                in: user.dealerships?.map((id: string) => BigInt(id)) || []
            }
        })
    }
};

// Role modifications - what to add/remove from base permissions
const roleModifications = {
    2: {
        policies: {
            addFields: ['seller_id'],
            removeFields: [],
            whereClause: (user: any) => ({
                dealerships: {
                    id: {
                        in: user.dealerships?.map((id: string) => BigInt(id)) || []
                    }
                }
            })
        },
        pricing_details: {
            addFields: ['dealership_referral_fee'],
            removeFields: ['seller_commission']
        },
        cancelation_details: {
            addFields: ['dealership_clawback'],
            removeFields: ['referral_clawback']
        },
        accounts: {
            addFields: ['roles', 'active'],
            removeFields: [],
            whereClause: (user: any) => ({
                OR: [
                    { id: BigInt(user.id) },
                    {
                        roles: { has: 1 },
                        dealerships: {
                            some: {
                                id: {
                                    in: user.dealerships?.map((id: string) => BigInt(id)) || []
                                }
                            }
                        }
                    }
                ]
            })
        }
    },
    3: {
        policies: {
            addFields: ['seller_id'],
            removeFields: [],
            whereClause: (user: any) => ({
                dealer_group_id: user.dealerGroupId ? BigInt(user.dealerGroupId) : undefined
            })
        },
        pricing_details: {
            addFields: ['dealership_referral_fee', 'dealer_group_referral_fee'],
            removeFields: ['seller_commission']
        },
        cancelation_details: {
            addFields: ['dealership_clawback', 'dealer_group_clawback'],
            removeFields: ['referral_clawback']
        },
        accounts: {
            addFields: ['roles', 'active'],
            removeFields: [],
            whereClause: (user: any) => ({
                OR: [
                    { id: BigInt(user.id) },
                    {
                        roles: { hasSome: [1, 2] },
                        dealer_group_id: user.dealerGroupId ? BigInt(user.dealerGroupId) : undefined
                    }
                ]
            })
        },
        dealerships: {
            addFields: [],
            removeFields: ['dealership_id'],
            whereClause: (user: any) => ({
                dealer_group_id: user.dealerGroupId ? BigInt(user.dealerGroupId) : undefined
            })
        }
    },
    12: {
        // Super admin - override everything
        policies: {
            allowedFields: ['all'],
            whereClause: () => ({})
        },
        pricing_details: {
            allowedFields: ['all']
        },
        cancelation_details: {
            allowedFields: ['all']
        },
        vehicle_details: {
            allowedFields: ['all']
        },
        applicants: {
            allowedFields: ['all']
        },
        accounts: {
            allowedFields: ['all'],
            whereClause: () => ({})
        },
        contacts: {
            allowedFields: ['all'],
            whereClause: () => ({})
        },
        quick_quotes: {
            allowedFields: ['all'],
            whereClause: () => ({})
        },
        dealerships: {
            allowedFields: ['all'],
            whereClause: () => ({})
        }
    }
};

// Helper function to apply role modifications to base permissions
const applyRoleModifications = (basePermissions: any, role: number, user: any) => {
    if (role === 12) {
        // Super admin - return role 12 permissions directly
        return roleModifications[12];
    }

    if (role === 1) {
        // Role 1 - return base permissions as-is
        return basePermissions;
    }

    const modifications = roleModifications[role as keyof typeof roleModifications];
    if (!modifications) {
        return basePermissions;
    }

    const result: any = {};

    // Start with base permissions
    for (const [entity, baseConfig] of Object.entries(basePermissions)) {
        const entityModifications = modifications[entity as keyof typeof modifications];
        
        if (!entityModifications) {
            // No modifications for this entity, use base
            result[entity] = { ...(baseConfig as any) };
            continue;
        }

        // Check if this is a super admin override (role 12)
        if ('allowedFields' in entityModifications && (entityModifications as any).allowedFields === 'all') {
            result[entity] = entityModifications;
            continue;
        }

        // Apply field modifications for regular roles
        if ('addFields' in entityModifications) {
            let allowedFields = [...(baseConfig as any).allowedFields];

            if ((entityModifications as any).addFields) {
                allowedFields = [...allowedFields, ...(entityModifications as any).addFields];
            }
            if ((entityModifications as any).removeFields) {
                allowedFields = allowedFields.filter((field: string) => !(entityModifications as any).removeFields.includes(field));
            }

            result[entity] = {
                allowedFields,
                whereClause: (entityModifications as any).whereClause || (baseConfig as any).whereClause
            };
        } else {
            // No modifications for this entity, use base
            result[entity] = { ...(baseConfig as any) };
        }
    }

    return result;
};

export const getMaximumReadAccess = (roles: number[], requestedValues: any, additionalFilters: any, user: any) => {
    const highestRole = Math.max(...roles);
    
    // Get permissions by applying role modifications to base permissions
    const permissions = applyRoleModifications(basePermissions, highestRole, user);
    
    if (!permissions) {
        return {
            success: false,
            error: 'Invalid role access',
            clauses: null
        };
    }

    const whereClause: any = {};
    const includeClause: any = {};
    const errors: string[] = [];

    // Process requested values
    for (const [entity, fields] of Object.entries(requestedValues)) {
        const entityPermissions = permissions[entity as keyof typeof permissions];
        
        if (!entityPermissions) {
            errors.push(`Access denied to ${entity}`);
            continue;
        }

        // Handle "all" fields request
        if (fields === 'all' || (Array.isArray(fields) && fields.includes('all'))) {
            if (entityPermissions.allowedFields.includes('all')) {
                // Super admin or entity with full access
                includeClause[entity] = true;
            } else {
                // Regular entity - include only allowed fields
                includeClause[entity] = {
                    select: entityPermissions.allowedFields.reduce((acc: any, field: string) => {
                        acc[field] = true;
                        return acc;
                    }, {})
                };
            }
        } else if (Array.isArray(fields)) {
            // Check if all requested fields are allowed
            const invalidFields = fields.filter(field => 
                !entityPermissions.allowedFields.includes(field) && 
                !entityPermissions.allowedFields.includes('all')
            );
            
            if (invalidFields.length > 0) {
                errors.push(`Access denied to fields in ${entity}: ${invalidFields.join(', ')}`);
                continue;
            }

            // Include only requested and allowed fields
            includeClause[entity] = {
                select: fields.reduce((acc: any, field: string) => {
                    if (entityPermissions.allowedFields.includes(field) || entityPermissions.allowedFields.includes('all')) {
                        acc[field] = true;
                    }
                    return acc;
                }, {})
            };
        }

        // Add where clause for this entity if it has one
        if ('whereClause' in entityPermissions && entityPermissions.whereClause) {
            const entityWhere = entityPermissions.whereClause(user);
            if (Object.keys(entityWhere).length > 0) {
                whereClause[entity] = entityWhere;
            }
        }
    }

    // Process additional filters
    for (const [entity, filters] of Object.entries(additionalFilters || {})) {
        const entityPermissions = permissions[entity as keyof typeof permissions];
        
        if (!entityPermissions) {
            errors.push(`Access denied to filter ${entity}`);
            continue;
        }

        for (const [field, filterValue] of Object.entries(filters as Record<string, any>)) {
            // Check if field is allowed for filtering (use allowedFields)
            if (!entityPermissions.allowedFields.includes(field) && !entityPermissions.allowedFields.includes('all')) {
                errors.push(`Access denied to filter ${entity}.${field}`);
                continue;
            }

            // Add filter to where clause
            if (!whereClause[entity]) {
                whereClause[entity] = {};
            }
            whereClause[entity][field] = filterValue;
        }
    }

    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join('; '),
            clauses: null
        };
    }

    return {
        success: true,
        clauses: {
            where: whereClause,
            include: includeClause
        }
    };
};

// Helper function to demonstrate usage in controllers
export const applyMaximumAccess = async (prisma: any, entity: string, roles: number[], requestedValues: any, additionalFilters: any, user: any) => {
    const accessResult = getMaximumReadAccess(roles, requestedValues, additionalFilters, user);
    
    if (!accessResult.success) {
        throw new Error(accessResult.error);
    }
    
    const { where, include } = accessResult.clauses!;
    
    return await prisma[entity].findMany({
        where,
        include
    });
};