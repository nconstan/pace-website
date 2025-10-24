import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../middleware/error';
import { CustomError } from '../middleware/error';
import { calculatePricing2, calculateRefund as calculateRefundFromService } from '../services/pricingCalculator';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import crypto from 'crypto';
import { getVehicleInfo } from '../services/vinLookup';
import { getMaximumReadAccess, applyMaximumAccess } from '../services/maximumAccess';
import { formatDataForResponse } from '../services/utilities';

// Helper function to convert payment method string to integer code
const getPaymentMethodCode = (paymentMethod: string): number => {
    switch (paymentMethod) {
        case 'vehicle-financing': return 1;
        case 'cash': return 2;
        case 'credit-card': return 3;
        case 'bank-transfer': return 4;
        default: return 1; // Default to vehicle-financing
    }
};

export const getPoliciesByCustomerNumber = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { customerNumber, filters } = req.body;
    
    // First, get the applicant ID for this customer number
    const applicant = await prisma.applicants.findUnique({
        where: {
            customer_number: BigInt(customerNumber)
        }
    });
    
    if (!applicant) {
        res.json([]);
        return;
    }
    
    // Get policies that don't have active claims
    const policies = await prisma.policies.findMany({
        where: {
            applicant_id: applicant.id,
            policy_status: filters.policy_status || 1,
            // Exclude policies that have active claims
            NOT: {
                claims_details: {
                    some: {
                        active: 1
                    }
                }
            }
        },
        include: {
            applicants: true,
            vehicle_details_policies_vehicle_detailsTovehicle_details: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedPolicies = policies.map(policy => ({
        id: policy.id.toString(),
        policy_status: policy.policy_status,
        applicants: policy.applicants ? {
            first_name_1: policy.applicants.first_name_1,
            first_name_2: policy.applicants.first_name_2,
            last_name_1: policy.applicants.last_name_1,
            last_name_2: policy.applicants.last_name_2,
            email_1: policy.applicants.email_1,
            email_2: policy.applicants.email_2,
            phone_number_1: policy.applicants.phone_number_1,
            phone_number_2: policy.applicants.phone_number_2,
            address_1: policy.applicants.address_1,
            address_2: policy.applicants.address_2,
            city: policy.applicants.city,
            province: policy.applicants.province,
            postal_code: policy.applicants.postal_code,
            is_company: policy.applicants.is_company,
            customer_number: policy.applicants.customer_number.toString(),
        } : null,
    }));
    
    res.json(serializedPolicies);
});

export const createPolicy = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { applicant, vehicle, debtInfo, selectedProducts, paymentInfo, dealership, contactInfo, fromApplicantId, sellerId, transfered_from, effectiveDate } = req.body;
    const user = req.user;
    
    console.log('Received customerNumber:', applicant.customerNumber);
    console.log('Type of customerNumber:', typeof applicant.customerNumber);

    // Validate pricing before creating policy TODO fix blank products
    let products: string[] = []
    selectedProducts.forEach((product: any) => {
        if(product.productName != '') products.push(product.productName)
    })
    const productPriceDetails = await calculatePrices(applicant?.postalCode, vehicle, debtInfo, products, parseInt(selectedProducts[0].productTerm));
    

    if(productPriceDetails[0].priceAtMonth[0].price !== selectedProducts[0].price || (productPriceDetails[1] && productPriceDetails[1].priceAtMonth[0].price !== selectedProducts[1].price)){
        res.status(400).json({ 
            error: "Pricing validation failed", 
            details: "Pricing validation failed" 
        });
        return;
    }

    //need to validate transfer credit************
    const transferCredit = 0 //pretend transfer credit is 0 for now

    let finalPrice = 0;
    productPriceDetails.forEach((product: any) => {
        if(product.productName != '') finalPrice += product.priceAtMonth[0].price;
    })

    try {
        const result = await prisma.$transaction(async (tx) => {
            let newApplicant;
            
            // Check if we have a customer number (from customer lookup)
            if(applicant.customerNumber && applicant.customerNumber !== null && applicant.customerNumber !== ''){
                console.log('Using existing customer number:', applicant.customerNumber);
                newApplicant = await tx.applicants.findFirst({
                    where: {
                        customer_number: BigInt(applicant.customerNumber),
                    }
                });
                if(!newApplicant){
                    throw new Error("Existing customer not found");
                }
                console.log('Found existing applicant:', newApplicant.id);
                
                // Update existing applicant with new information from the form
                newApplicant = await tx.applicants.update({
                    where: {
                        id: newApplicant.id
                    },
                    data: {
                        is_company: applicant.isOrganization || false,
                        first_name_1: applicant.primaryName?.split(' ')[0] || '',
                        last_name_1: applicant.primaryName?.split(' ').slice(1).join(' ') || '',
                        first_name_2: applicant.secondaryName?.split(' ')[0] || null,
                        last_name_2: applicant.secondaryName?.split(' ').slice(1).join(' ') || null,
                        address_1: applicant.street || '',
                        address_2: applicant.street2 || null,
                        city: applicant.city || '',
                        province: applicant.province || '',
                        postal_code: applicant.postalCode || '',
                        email_1: contactInfo.primary.email.value || '',
                        phone_number_1: contactInfo.primary.phoneNumber.value || '',
                        email_2: contactInfo.secondary.email.value || null,
                        phone_number_2: contactInfo.secondary.phoneNumber.value || null,
                    }
                });
            }            
            // Create new applicant
            else {
                console.log('Creating new applicant - no customer number provided');
                let newCustomerNumber = Math.floor(Math.random()*1000000) + await tx.applicants.count() + 1;
                // Create applicant first
                newApplicant = await tx.applicants.create({
                    data: {
                        is_company: applicant.isOrganization || false,
                        first_name_1: applicant.primaryName?.split(' ')[0] || '',
                        last_name_1: applicant.primaryName?.split(' ').slice(1).join(' ') || '',
                        first_name_2: applicant.secondaryName?.split(' ')[0] || null,
                        last_name_2: applicant.secondaryName?.split(' ').slice(1).join(' ') || null,
                        address_1: applicant.street || '',
                        address_2: applicant.street2 || null,
                        city: applicant.city || '',
                        province: applicant.province || '',
                        postal_code: applicant.postalCode || '',
                        email_1: contactInfo.primary.email.value || '',
                        phone_number_1: contactInfo.primary.phoneNumber.value || '',
                        policy_ids: [],
                        customer_number: BigInt(newCustomerNumber),
                    }
                });
            }


            const newPolicy = await tx.policies.create({
                data: {
                    applicant_id: newApplicant.id,
                    dealer_group_id: user.dealerGroupId ? BigInt(user.dealerGroupId) : null,
                    dealership_id: dealership ? BigInt(dealership) : null,
                    created_by_id: BigInt(req.user!.id),
                    seller_id: BigInt(req.user!.id),
                    policy_status: 0,
                    total_price: finalPrice || 0,
                    policy_term: String(selectedProducts[0].productTerm || 36),
                    products: selectedProducts.map((product: any) => product.productName),
                    province: applicant.province,
                    transfered_from: transfered_from ? BigInt(transfered_from) : null,
                    effective_date: effectiveDate ? new Date(effectiveDate) : new Date(),
                    policy_payment_method: getPaymentMethodCode(paymentInfo.paymentMethod),
                }
            });


            const newPriceCalculationData = await tx.price_calculation_data.create({
                data: {
                    policy_id: newPolicy.id,
                    total_debt: debtInfo.totalAmount || 0,
                    debt_interest_rate: debtInfo.interestRate || 0,
                    debt_term: debtInfo.debtTerm || 0,
                    loan_payment_monthly: debtInfo.monthlyPayment || 0,
                    negative_equity: debtInfo.rolledInNegativeEquity || 0,
                }
            });

            // Note: Transfer logic will be handled after the transaction completes

            const newVehicleDetails = await tx.vehicle_details.create({
                data: {
                    from_policy: newPolicy.id,
                    vin: vehicle.vin,
                    odometer: vehicle.odometer || parseInt(vehicle.odometer),
                    MSRP: "" + vehicle.purchasePrice,
                    bought_vehicle_value: "" + vehicle.purchasePrice,
                    vehicle_state: vehicle.state,
                    vehicle_purchase_year: vehicle.modelYear || parseInt(vehicle.modelYear),
                    make: vehicle.make,
                    model: vehicle.model,
                    series: vehicle.series,
                    body: vehicle.body,
                    model_year: parseInt(vehicle.modelYear),
                }
            });

            const isLicencedSeller = await tx.dealerships.findFirst({
                where: {
                    id: dealership,
                },
                select: {
                    licensed_seller: true
                }
            });

            const newPolicyPriceDetails = await tx.pricing_details.create({
                data: {
                    policy_id: newPolicy.id,
                    licenced_seller: isLicencedSeller?.licensed_seller || false,
                    coverage_term: parseInt(selectedProducts[0].productTerm),
                    underwriting_premium: productPriceDetails[0].priceAtMonth[0].underwritingPremium + (productPriceDetails[1]?.priceAtMonth[0].underwritingPremium || 0),
                    MGA_premium: productPriceDetails[0].priceAtMonth[0].mgaPayment + (productPriceDetails[1]?.priceAtMonth[0].mgaPayment || 0),
                    seller_commission: productPriceDetails[0].priceAtMonth[0].sellerCommission + (productPriceDetails[1]?.priceAtMonth[0].sellerCommission || 0),
                    IPT: productPriceDetails[0].priceAtMonth[0].ipt + (productPriceDetails[1]?.priceAtMonth[0].ipt || 0),
                    dealer_group_referral_fee: productPriceDetails[0].priceAtMonth[0].referralPayment + (productPriceDetails[1]?.priceAtMonth[0].referralPayment || 0),
                    dealer_group_referral_GST: productPriceDetails[0].priceAtMonth[0].referralPayment + (productPriceDetails[1]?.priceAtMonth[0].referralPayment || 0),
                    retail_tax: productPriceDetails[0].priceAtMonth[0].retailTax + (productPriceDetails[1]?.priceAtMonth[0].retailTax || 0),
                    transfer_credit: transferCredit || 0,
                    retail_price: productPriceDetails[0].priceAtMonth[0].retailBeforeTax + (productPriceDetails[1]?.priceAtMonth[0].retailBeforeTax || 0),
                    retail_price_after_tax: productPriceDetails[0].priceAtMonth[0].retailPriceAfterTax + (productPriceDetails[1]?.priceAtMonth[0].retailPriceAfterTax || 0) - (transferCredit || 0),
                }
            });

            let productPriceDetailsIds: bigint[] = [];

            for(const product of productPriceDetails){
                const newProductPriceDetails = await tx.product_price_details.create({
                    data: {
                        policy_id: newPolicy.id,
                        pricing_details_id: newPolicyPriceDetails.id,
                        product_type: product.productName,
                        underwriting_premium: product.priceAtMonth[0].underwritingPremium,
                        MGA_premium: product.priceAtMonth[0].mgaPayment,
                        seller_commission: product.priceAtMonth[0].sellerCommission,
                        IPT: product.priceAtMonth[0].ipt,
                        dealership_referral_fee: product.priceAtMonth[0].referralPayment,
                        dealership_referral_GST: product.priceAtMonth[0].referralPayment,
                        dealer_group_referral_fee: product.priceAtMonth[0].referralPayment,
                        dealer_group_referral_GST: product.priceAtMonth[0].referralPayment,
                        cc_surcharge: 0,
                        retail_price: product.priceAtMonth[0].retailBeforeTax,
                        retail_tax: product.priceAtMonth[0].retailTax,
                        retail_price_after_tax: product.priceAtMonth[0].retailPriceAfterTax,
                    }
                });
                productPriceDetailsIds.push(newProductPriceDetails.id);
            }
            
            // Update applicant with policy ID
            await tx.applicants.update({
                where: { id: newApplicant.id },
                data: { policy_ids: { push: newPolicy.id } }
            });

            // Generate confirmation token with randomness
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const confirmationToken = jwt.sign(
                { 
                    policyId: newPolicy.id.toString(),
                    type: 'policy_confirmation',
                    applicantEmail: contactInfo.primary.email.value,
                    random: randomBytes
                }, 
                JWT_SECRET, 
                { expiresIn: '30d' }
            );

            // Update policy with confirmation token and relations
            const updatedPolicy = await tx.policies.update({
                where: { id: newPolicy.id },
                data: { 
                    jwt_token: confirmationToken, 
                    pricing_details: newPolicyPriceDetails.id, 
                    product_price_details: { connect: productPriceDetailsIds.map((id: bigint) => ({ id })) },
                    price_calculation_data: newPriceCalculationData.id,
                    vehicle_details: newVehicleDetails.id,
                }
            });

            // Return the updated policy for serialization
            return updatedPolicy;
        });

        // Handle policy transfer after transaction completes
        if(transfered_from){
            console.log("About to call transferPolicyInternal with:", { transfered_from, newPolicyId: result.id.toString() });
            try {
                await transferPolicyInternal(transfered_from, result.id.toString());
                console.log("transferPolicyInternal completed successfully");
            } catch (error) {
                console.error("Transfer failed:", error);
                // Don't fail the entire policy creation if transfer fails
            }
        }

        // Convert BigInt fields to strings for JSON serialization
        const serializedPolicy = {
            ...result,
            id: result.id.toString(),
            applicant_id: result.applicant_id.toString(),
            seller_id: result.seller_id?.toString(),
            dealership_id: result.dealership_id?.toString(),
            dealer_group_id: result.dealer_group_id?.toString(),
            created_by_id: result.created_by_id.toString(),
            transfered_from: result.transfered_from?.toString(),
            transfered_to: result.transfered_to?.toString(),
            primary_insurer_id: result.primary_insurer_id?.toString(),
            vehicle_details: result.vehicle_details?.toString(),
            price_calculation_data: result.price_calculation_data?.toString(),
            pricing_details: result.pricing_details?.toString(),
            cancelation_details: result.cancelation_details?.toString()
        };

        // Send confirmation email (non-transactional)
        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/policy-confirmation?token=${result.jwt_token}`;
        const emailSubject = 'Confirm Your Insurance Policy';
        const emailBody = `
            <h2>Policy Confirmation Required</h2>
            <p>Hello ${applicant.primaryName},</p>
            <p>Your insurance policy has been created successfully. To activate your policy, please click the link below to confirm:</p>
            <p><a href="${confirmationUrl}" style="background-color: #ffa242; color: #2A525A; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm Policy</a></p>
            <p><strong>Policy Details:</strong></p>
            <ul>
                <li>VIN: ${vehicle.vin}</li>
                <li>Vehicle: ${vehicle.make} ${vehicle.model} ${vehicle.series}</li>
                <li>Total Premium: $${finalPrice.toFixed(2)}</li>
                <li>Policy Term: ${selectedProducts[0].productTerm} months</li>
            </ul>
            <p>This confirmation link will expire in 30 days.</p>
            <p>If you have any questions, please contact your insurance representative.</p>
            <p>Best regards,<br>AEI Insurance Team</p>
        `;
        
        try {
            // Import and use the email sender
            const { sendEmail } = await import('../services/emailSender');
            await sendEmail(contactInfo.primary.email.value, emailSubject, emailBody);
            console.log(`Confirmation email sent successfully to ${contactInfo.primary.email.value}`);
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
            // Don't fail the request if email fails, but log it
        }

        res.json({ message: "Policy created successfully. A confirmation email has been sent.", data: serializedPolicy });
    } catch (error) {
        res.status(400).json({ 
            error: "Policy creation failed", 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Internal transfer function for use within transactions TODO verify transfered policy ownership
const transferPolicyInternal = async (transfered_from: string, newPolicyId: string) => {
    // Find the policy to transfer from
    const transferFromPolicy = await prisma.policies.findFirst({
            where: {
            id: BigInt(transfered_from),
            policy_status: 1 // Only confirmed policies can be transferred
        },
        include: {
            applicants: true,
            product_price_details: true
        }
    });
    
    if (!transferFromPolicy) {
        throw new CustomError('Transfer from policy not found or not confirmed', 404);
    }
    
    // Calculate refund for the policy being transferred
    console.log("About to calculate refund for policy:", transferFromPolicy.id);
    const refundData = await calculateRefundForPolicy(transferFromPolicy);
    console.log("Refund calculation completed, refundData:", refundData);
    
    // Create cancellation_details record for the transfer
    const cancellationDetails = await prisma.cancelation_details.create({
        data: {
            policy_id: BigInt(transfered_from),
            cancellation_reason: 'Policy transferred to new policy',
            clawback_total: refundData.refundAmount,
            fee: 0, // No fee for transfers
            refund_factor: refundData.product_refund_details[0]?.refund_factor || 0
        }
    });
    
    // Create product_refund_details for each product
    for (const productRefundDetail of refundData.product_refund_details) {
        await prisma.product_refund_details.create({
            data: {
                policy_id: BigInt(transfered_from),
                cancelation_details_id: cancellationDetails.id,
                product_type: productRefundDetail.product_type,
                underwriting_clawback: productRefundDetail.underwriting_clawback,
                dealership_clawback: productRefundDetail.dealership_clawback,
                dealer_group_clawback: productRefundDetail.dealer_group_clawback,
                MGA_clawback: productRefundDetail.MGA_clawback,
                referral_clawback: productRefundDetail.referral_clawback
            }
        });
    }
    console.log("got here tho");
    console.log("About to update policy with transfered_from:", transfered_from);
    console.log("newPolicyId:", newPolicyId);
    console.log("cancellationDetails.id:", cancellationDetails.id);
    
    // Update the transfer from policy
    try {
        await prisma.policies.update({
            where: { id: BigInt(transfered_from) },
            data: {
                policy_status: 5, // Transferred status
                transfered_to: BigInt(newPolicyId),
                cancelation_details: cancellationDetails.id
            }
        });
        console.log("Successfully updated transfer from policy");
    } catch (error) {
        console.error("Error updating transfer from policy:", error);
        throw error;
    }

    console.log("transferFromPolicy", transferFromPolicy);
    
    // Update the new policy with transfer information
    try {
        await prisma.policies.update({
            where: { id: BigInt(newPolicyId) },
            data: {
                transfered_from: BigInt(transfered_from)
            }
        });
        console.log("Successfully updated new policy with transfer info");
    } catch (error) {
        console.error("Error updating new policy:", error);
        throw error;
    }
    
    return {
        transferFromPolicy: BigInt(transfered_from).toString(),
        newPolicy: newPolicyId,
        refundAmount: refundData.refundAmount,
        cancellationDetails: cancellationDetails.id.toString()
    };
};




export const getPolicies = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const user = req.user!;
    const { requestedValues, additionalFilters } = req.body;
    
    try {
        // Use the new maximum access system with values from the request body
        const accessResult = getMaximumReadAccess(
            user.roles,
            requestedValues || { policies: 'all' },
            additionalFilters || {},
            user
        );
        
        if (!accessResult.success) {
            res.status(403).json({ error: accessResult.error });
            return;
        }
        
        const { where, include } = accessResult.clauses!;
        
        console.log("where", where);
        console.log("include", include);
        
        // Extract the policies where clause and merge with additional filters
        const policiesWhere = where.policies || {};
        const policiesInclude = include.policies || {};
        
        // Handle the case where we have a select clause instead of include
        let queryOptions: any = {
            where: policiesWhere
        };
        
        if (policiesInclude && typeof policiesInclude === 'object' && 'select' in policiesInclude) {
            // Use select instead of include
            queryOptions.select = policiesInclude.select;
        } else {
            // Use include
            queryOptions.include = policiesInclude;
        }
        
        const policies = await prisma.policies.findMany(queryOptions);

        console.log("policies", policies);
        
        const formattedPolicies = formatDataForResponse(policies);
        res.json(formattedPolicies);
    } catch (error) {
        console.error('Error in getPolicies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export const getPolicy = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const policy = await prisma.policies.findFirst({
        where: {
            id: BigInt(req.params.id),
            seller_id: req.user!.id
        },
        include: {
            applicants: true,
            dealerships: true,
            vehicle_details_policies_vehicle_detailsTovehicle_details: true
        }
    });
    
    if (!policy) {
        throw new CustomError('Policy not found', 404);
    }
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedPolicy = {
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
        applicants: policy.applicants ? {
            ...policy.applicants,
            id: policy.applicants.id.toString(),
            customer_number: policy.applicants.customer_number.toString(),
            policy_ids: policy.applicants.policy_ids.map((id: bigint) => id.toString())
        } : null,
        vehicle_details_policies_vehicle_detailsTovehicle_details: policy.vehicle_details_policies_vehicle_detailsTovehicle_details ? {
            ...policy.vehicle_details_policies_vehicle_detailsTovehicle_details,
            id: policy.vehicle_details_policies_vehicle_detailsTovehicle_details.id.toString(),
            from_policy: policy.vehicle_details_policies_vehicle_detailsTovehicle_details.from_policy.toString()
        } : null,
        dealerships: policy.dealerships ? {
            ...policy.dealerships,
            id: policy.dealerships.id.toString(),
            dealer_group_id: policy.dealerships.dealer_group_id?.toString()
        } : null
    };
    
    res.json(serializedPolicy);
});

export const updatePolicy = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const updatedPolicy = await prisma.policies.updateMany({
        where: {
            id: BigInt(req.params.id),
            seller_id: req.user!.id
        },
        data: req.body
    });
    
    res.json({ message: "Policy updated successfully", data: updatedPolicy });
});

export const saveQuickQuote = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { policyData, step } = req.body;
    
    const newQuickQuote = await prisma.quick_quotes.create({
        data: {
            seller_id: req.user!.id.toString(),
            vin: policyData.vehicle?.vin || '',
            applicant: policyData.applicant || {},
            contactInfo: policyData.contactInfo || {},
            vehicle: policyData.vehicle || {},
            debtInfo: policyData.debtInfo || {},
            productInfo: policyData.productInfo || {},
            paymentInfo: policyData.paymentInfo || {},
            name: policyData.applicant?.primaryName || 'Quick Quote',
            currentStep: step,
            completed: false
        }
    });
    
    res.json({ message: "Quick quote saved successfully", data: newQuickQuote });
});

export const getQuickQuotes = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const quickQuotes = await prisma.quick_quotes.findMany({
        where: {
            seller_id: req.user!.id.toString()
        }
    });
    
    res.json(quickQuotes);
});

export const getQuickQuote = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const quickQuote = await prisma.quick_quotes.findFirst({
        where: {
            id: BigInt(req.params.id),
            seller_id: req.user!.id.toString()
        }
    });
    
    if (!quickQuote) {
        throw new CustomError('Quick quote not found', 404);
    }
    
    res.json(quickQuote);
});

export const updateQuickQuote = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const updatedQuickQuote = await prisma.quick_quotes.updateMany({
        where: {
            id: BigInt(req.params.id),
            seller_id: req.user!.id.toString()
        },
        data: req.body
    });
    
    res.json({ message: "Quick quote updated successfully", data: updatedQuickQuote });
});

export const deleteQuickQuote = asyncHandler(async (req: any, res: Response): Promise<void> => {
    await prisma.quick_quotes.deleteMany({
        where: {
            id: BigInt(req.params.id),
            seller_id: req.user!.id.toString()
        }
    });
    
    res.json({ message: "Quick quote deleted successfully" });
}); 

export const getAllPricing = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { 
        data, 
        products
    } = req.body;
    const { applicant, vehicle, debtInfo, productInfo } = data;

    try {
        // Convert frontend data to InputData format for calculatePricing
        const productPriceDetails = await calculatePrices(applicant?.postalCode, vehicle, debtInfo, products, null);
        const productPriceDetails2 = productPriceDetails.map((product: any) => ({
            productName: product.productName,
            priceAtMonth: product.priceAtMonth.map((price: any) => ({
                month: price.month,
                price: price.price,
            }))
        }));
        console.log(JSON.stringify(productPriceDetails2, null, 2))
        res.json(productPriceDetails2);
    } catch (error: any) {
        res.status(500).json({ 
            error: error.message || 'Failed to calculate pricing' 
        });
    }
});

async function calculatePrices(postalCode: string, vehicle: any, debtInfo: any, products: string[], term: number | null){

    const inputData = {
        postalCode: postalCode,
        vin: vehicle?.vin,
        odometer: parseInt(vehicle?.odometer),
        vehiclePurchaseMethod: vehicle?.purchaseMethod as 'financed' | 'lease' | 'cash',
        vehiclePurchasePrice: parseFloat(vehicle?.purchasePrice),
        totalDebt: parseFloat(debtInfo?.totalAmount),
        debtInterestRate: parseFloat(debtInfo?.interestRate),
        debtTerm: parseInt(debtInfo?.debtTerm),
        debtLoanPayment: parseFloat(debtInfo?.monthlyPayment),
        debtResidualValue: parseFloat(debtInfo?.residualValue),
        products: products,
        policyTerm: term,
        calendarYear: new Date().getFullYear(),
        dealershipLicensed: false,
        rolledInNegativeEquity: parseFloat(debtInfo?.rolledInNegativeEquity),
    };

    const result = await calculatePricing2(inputData);
    const productPriceDetails = Object.entries(result).map(([product, pricing]: [string, any]) => ({
        productName: product,
        priceAtMonth: Object.entries(pricing.pricing).map(([month, price]: [string, any]) => ({
            month: parseInt(month),
            price: price.retailPriceAfterTax,
            underwritingPremium: price.details.underwritingPremium,
            mgaPayment: price.details.mgaPayment,
            sellerCommission: price.details.sellerCommission,
            ipt: price.details.ipt,
            insurancePremium: price.details.insurancePremium,
            referralPayment: price.details.referralPayment,
            adminFee: price.details.adminFee,
            retailTax: price.details.retailTax,
            retailBeforeTax: price.details.retailBeforeTax,
            retailPriceAfterTax: price.details.retailPriceAfterTax,
        }))
    }));
    return productPriceDetails;
}

interface VehicleInfo {
    make: string;
    model: string;
    series: string;
    body: string;
    year: number;
    modelYear: number;
    msrp: number;
    powertrain: string;
    gvwr?: number;
    horsepower?: number;
  }


export const getVinData = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const vin = req.params.vin;
    const vinData = await getVehicleInfo(vin);
    console.log(vinData)
    res.json(vinData);
});

export const confirmPolicy = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
        throw new CustomError('Confirmation token is required', 400);
    }
    
    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        if (decoded.type !== 'policy_confirmation') {
            throw new CustomError('Invalid token type', 401);
        }
        
        // Find the policy
        const policy = await prisma.policies.findFirst({
            where: {
                id: BigInt(decoded.policyId),
                jwt_token: token,
                policy_status: 0 // Only confirm unconfirmed policies
            },
            include: {
                applicants: true
            }
        });
        
        if (!policy) {
            throw new CustomError('Policy not found or already confirmed', 404);
        }
        
        // Update policy status to confirmed (status 1)
        await prisma.policies.update({
            where: {
                id: policy.id
            },
            data: {
                policy_status: 1, // Confirmed
                jwt_token: null // Clear the token after confirmation
            }
        });
        
        res.json({ 
            message: "Policy confirmed successfully",
            policyId: policy.id.toString()
        });
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError('Invalid or expired confirmation token', 401);
        }
        throw error;
    }
});

// Helper function to calculate refund for a policy
const calculateRefundForPolicy = async (policy: any) => {
    console.log("calculateRefundForPolicy called with policy:", policy.id);
    
    // Get applicant data for refund calculation
    const applicant = policy.applicants;
    console.log("Applicant data:", applicant);
    if (!applicant) {
        throw new CustomError('Applicant data not found', 404);
    }
    
    // Get all price details for each product
    const allPriceDetails = policy.product_price_details || [];
    console.log("Price details:", allPriceDetails);
    if (allPriceDetails.length === 0) {
        throw new CustomError('Policy price details not found', 404);
    }
    
    // Prepare input data for the refund calculation service
    const refundInput = {
        policyNumber: policy.id.toString(),
        cancelationDate: new Date(),
        cancelationOrTransfer: 'Cancelation' as const,
        minimumRetained: false,
        cancelationFee: 100,
        transferFee: 50
    };
    
    // Prepare multi-product policy data
    const products = allPriceDetails.map((priceDetails: any, index: number) => ({
        product: policy.products?.[index] || 'RCP',
        underwritingPremium: priceDetails.underwriting_premium || 0,
        mgaPayment: priceDetails.MGA_premium || 0,
        sellerCommission: priceDetails.seller_commission || 0,
        ipt: priceDetails.IPT || 0,
        referralPayment: priceDetails.dealership_referral_fee || 0,
        administrationFee: 0, // Not stored in price_details, default to 0
        retailTax: priceDetails.retail_tax || 0,
        retailPrice: priceDetails.retail_price_after_tax || 0
    }));
    
    const policyData = {
        effectiveDate: policy.created_at,
        term: parseInt(policy.policy_term) || 36,
        provinceCode: applicant.province || 'ON',
        products: products
    };
    
    // Calculate refund using the multi-product function
    console.log("About to call calculateRefundFromService with:", { refundInput, policyData });
    const refundResult = calculateRefundFromService(refundInput, policyData);
    console.log("calculateRefundFromService result:", refundResult);
    
    // Calculate total refund amount
    const totalRefund = Object.values(refundResult).reduce((sum, product) => sum + product.refund, 0);
    
    // Format product refund details for response
    const productRefundDetails = Object.entries(refundResult).map(([productType, data]) => ({
        product_type: productType,
        underwriting_clawback: data.details.underwritingRefund,
        dealership_clawback: data.details.referralRefund,
        dealer_group_clawback: data.details.referralRefund,
        MGA_clawback: data.details.mgaRefund,
        referral_clawback: data.details.referralRefund,
        clawback_type: data.details.fullRefund ? 1 : 0,
        fee: data.details.fee,
        refund_factor: data.details.refundFactor,
        clawback_total: data.refund,
        cancellation_reason: refundInput.cancelationOrTransfer
    }));
    
    return {
        policyId: policy.id.toString(),
        originalAmount: policy.total_price,
        refundAmount: totalRefund,
        product_refund_details: productRefundDetails,
        refundResult: refundResult,
        policyData: policyData,
        refundInput: refundInput
    };
};

export const startPolicyCancelation = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const policyId = req.params.id;
    const user = req.user!;
    
    // Verify role is 4+ (admin or higher)
    const userRoles = user.roles.filter((role: number) => [1,2,3,4,5,12].includes(role));
    const highestRole = Math.max(...userRoles);
    if (highestRole < 4) {
        throw new CustomError('Insufficient permissions to cancel policies', 403);
    }
    
    // Find policy
    const policy = await prisma.policies.findFirst({
        where: {
            id: BigInt(policyId)
        },
        include: {
            applicants: true,
            product_price_details: true
        }
    });

    if (!policy) {
        throw new CustomError('Policy not found', 404);
    }
    
    if (policy.policy_status !== 1) {
        throw new CustomError('Policy must be confirmed to start cancellation', 400);
    }
    
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Set policy_status to 3 (cancellation in progress)
            const updatedPolicy = await tx.policies.update({
                where: { id: BigInt(policyId) },
                data: { policy_status: 3 }
            });
            
            // Generate cancellation token
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const cancellationToken = jwt.sign(
                { 
                    policyId: policy.id.toString(),
                    type: 'policy_cancellation',
                    random: randomBytes
                }, 
                JWT_SECRET, 
                { expiresIn: '7d' }
            );
            
            // Update policy with cancellation token
            await tx.policies.update({
                where: { id: BigInt(policyId) },
                data: { jwt_token: cancellationToken }
            });
            
            return { updatedPolicy, cancellationToken };
        });
        
        // Use the calculateRefund method to get refund data
        const refundData = await calculateRefundForPolicy(policy);
        const totalRefund = refundData.refundAmount;
        
        // Send cancellation email
        const cancellationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/policy-cancellation?token=${result.cancellationToken}`;
        const emailSubject = 'Policy Cancellation Confirmation';
        const emailBody = `
            <h2>Policy Cancellation Request</h2>
            <p>Hello ${policy.applicants?.first_name_1},</p>
            <p>Your policy cancellation has been initiated. To complete the cancellation, please click the link below:</p>
            <p><a href="${cancellationUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm Cancellation</a></p>
            <p><strong>Refund Amount: $${totalRefund.toFixed(2)}</strong></p>
            <p><strong>Policy Details:</strong></p>
            <ul>
                <li>Policy ID: ${policy.id.toString()}</li>
                <li>Total Premium: $${policy.total_price.toFixed(2)}</li>
                <li>Refund Amount: $${totalRefund.toFixed(2)}</li>
            </ul>
            <p>This cancellation link will expire in 7 days.</p>
            <p>If you have any questions, please contact your insurance representative.</p>
            <p>Best regards,<br>AEI Insurance Team</p>
        `;
        
        try {
            const { sendEmail } = await import('../services/emailSender');
            await sendEmail(policy.applicants?.email_1 || '', emailSubject, emailBody);
            console.log(`Cancellation email sent successfully to ${policy.applicants?.email_1}`);
        } catch (error) {
            console.error('Failed to send cancellation email:', error);
    }

    res.json({
            message: "Policy cancellation initiated successfully. Confirmation email sent.",
            policyId: policy.id.toString(),
            refundAmount: totalRefund
        });
        
    } catch (error) {
        console.error('Error in startPolicyCancelation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export const cancelPolicy = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
        throw new CustomError('Cancellation token is required', 400);
    }
    
    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        if (decoded.type !== 'policy_cancellation') {
            throw new CustomError('Invalid token type', 401);
        }
        
        // Find the policy
    const policy = await prisma.policies.findFirst({
        where: {
                id: BigInt(decoded.policyId),
                jwt_token: token,
        },
        include: {
            applicants: true,
            product_price_details: true
        }
    });
    
    if (!policy) {
            throw new CustomError('Policy not found or not in cancellation status', 404);
        }
        
        // Calculate refund using the helper function
        const refundData = await calculateRefundForPolicy(policy);
        
        const result = await prisma.$transaction(async (tx) => {
            // Set policy_status to 4 (cancelled)
            await tx.policies.update({
                where: { id: policy.id },
                data: { 
                    policy_status: 4,
                    jwt_token: null // Clear the token
                }
            });
            
            // Create cancellation_details record
            const cancellationDetails = await tx.cancelation_details.create({
                data: {
                    policy_id: policy.id,
                    cancellation_reason: 'Customer requested cancellation',
                    clawback_total: refundData.refundAmount,
                    fee: 100, // cancellation fee
                    refund_factor: refundData.product_refund_details[0]?.refund_factor || 0
                }
            });
            
            // Create product_refund_details for each product
            const productRefundDetails = [];
            for (const productRefundDetail of refundData.product_refund_details) {
                const createdDetail = await tx.product_refund_details.create({
                    data: {
                        policy_id: policy.id,
                        cancelation_details_id: cancellationDetails.id,
                        product_type: productRefundDetail.product_type,
                        underwriting_clawback: productRefundDetail.underwriting_clawback,
                        dealership_clawback: productRefundDetail.dealership_clawback,
                        dealer_group_clawback: productRefundDetail.dealer_group_clawback,
                        MGA_clawback: productRefundDetail.MGA_clawback,
                        referral_clawback: productRefundDetail.referral_clawback
                    }
                });
                productRefundDetails.push(createdDetail);
            }
            
            // Update policy with cancellation_details_id
            await tx.policies.update({
                where: { id: policy.id },
                data: { cancelation_details: cancellationDetails.id }
            });
            
            return { cancellationDetails, productRefundDetails, totalRefund: refundData.refundAmount };
        });
    
    res.json({
        message: "Policy cancelled successfully",
        policyId: policy.id.toString(),
            refundAmount: result.totalRefund,
            cancellationDetailsId: result.cancellationDetails.id.toString()
        });
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError('Invalid or expired cancellation token', 401);
        }
        throw error;
    }
});

export const calculateRefund = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const policyId = req.params.id;
    
    // Find the policy with price details
    const policy = await prisma.policies.findFirst({
        where: {
            id: BigInt(policyId),
            policy_status: 1 // Only calculate refund for confirmed policies
        },
        include: {
            applicants: true,
            product_price_details: true
        }
    });
    
    if (!policy) {
        throw new CustomError('Policy not found or not confirmed', 404);
    }
    
    // Use the helper function to calculate refund
    const refundData = await calculateRefundForPolicy(policy);
    
    res.json({
        policyId: refundData.policyId,
        originalAmount: refundData.originalAmount,
        refundAmount: refundData.refundAmount,
        product_refund_details: refundData.product_refund_details,
        calculationDate: new Date().toISOString(),
        // Additional data for cancellation methods
        refundResult: refundData.refundResult,
        policyData: refundData.policyData,
        refundInput: refundData.refundInput
    });
});

export const searchPoliciesByEmail = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const email = req.params.email;
    
    // Find policies by applicant email
    const policies = await prisma.policies.findMany({
        where: {
            applicants: {
                email_1: {
                    contains: email,
                    mode: 'insensitive'
                }
            }
        },
        include: {
            applicants: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    
    // Convert BigInt fields to strings for JSON serialization
    const serializedPolicies = policies.map((policy: any) => ({
        ...policy,
        id: policy.id.toString(),
        applicant_id: policy.applicant_id.toString(),
        seller_id: policy.seller_id?.toString(),
        dealership_id: policy.dealership_id?.toString(),
        created_by_id: policy.created_by_id?.toString(),
        applicants: policy.applicants ? {
            ...policy.applicants,
            id: policy.applicants.id.toString(),
            customer_number: policy.applicants.customer_number.toString(),
            policy_ids: policy.applicants.policy_ids.map((id: bigint) => id.toString())
        } : null
    }));
    
    res.json(serializedPolicies);
});

function runTests2() {
    const baseInputData = {
        isOrganization: false,
        applicant1FirstName: 'John',
        postalCode: 't3h 3r3',
        vin: '1GCEC19T5XZ130295',
        odometer: 1000,
        vehiclePurchasePrice: 60000,
        totalDebt: 65000,
        debtInterestRate: 6,
        debtTerm: 95,
        debtLoanPayment: 861.20,
        debtResidualValue: 0,
        calendarYear: new Date().getFullYear(),
        dealershipLicensed: false,
        rolledInNegativeEquity: 0,
        vehiclePurchaseMethod: 'financed' as const,
        products: ['GTU'],
        policyTerm: 36,
    };
    const result2 = calculatePricing2(baseInputData);
    console.log(`\ncalculatePricing2 Results for GTU:`);
    console.log(JSON.stringify(result2, null, 2));

    
}

// function runTests() {
//     const baseInputData = {
//         isOrganization: false,
//         applicant1FirstName: 'John',
//         postalCode: 't3h 3r3',
//         vin: '1GCEC19T5XZ130295',
//         odometer: 1000,
//         vehiclePurchasePrice: 60000,
//         totalDebt: 65000,
//         debtInterestRate: 6,
//         debtTerm: 95,
//         debtLoanPayment: 861.20,
//         debtResidualValue: 0,
//         calendarYear: new Date().getFullYear(),
//         dealershipLicensed: false,
//         rolledInNegativeEquity: 0,
//     };

//     const terms = [36, 48, 60, 72, 84, 96];
    
//     // Test financed products
//     const financedProducts = ['RCE', 'RCP', 'GTU', 'RNE'];
    
//     for (const product of financedProducts) {
//         console.log(`\n=== Testing ${product} (Financed) ===`);
        
//         // Test calculatePricing2 (single call with null policyTerm)
//         const inputData2 = {
//             ...baseInputData,
//             vehiclePurchaseMethod: 'financed' as const,
//             products: [product],
//             policyTerm: null,
//         };
        
//         try {
//             const result2 = calculatePricing2(inputData2);
//             console.log(`\ncalculatePricing2 Results for ${product}:`);
//             console.log(JSON.stringify(result2, null, 2));
            
//             // Test calculatePricing (multiple calls for each term)
//             console.log(`\ncalculatePricing Results for ${product}:`);
//             const results1: Record<number, any> = {};
            
//             for (const term of terms) {
//                 const inputData1 = {
//                     ...baseInputData,
//                     vehiclePurchaseMethod: 'financed' as const,
//                     product: product,
//                     policyTerm: term,
//                 };
                
//                 try {
//                     const result1 = calculatePricing(inputData1);
//                     results1[term] = result1;
//                     console.log(`Term ${term}: ${result1.retailPriceAfterTax}` + "------" + "underwritingPremium: " + result1.details.underwritingPremium + "--" + "mgaPayment: " + result1.details.mgaPayment + "--" + "sellerCommission: " + result1.details.sellerCommission + "--" + "ipt: " + result1.details.ipt + "--" + "insurancePremium: " + result1.details.insurancePremium + "--" + "referralPayment: " + result1.details.referralPayment + "--" + "adminFee: " + result1.details.adminFee + "--" + "transferCredit: " + result1.details.transferCredit + "--" + "retailTax: " + result1.details.retailTax);
//                 } catch (error) {
//                     console.log(`Term ${term}: Error - ${error}`);
//                 }
//             }
            
//             // Compare results
//             console.log(`\nComparison for ${product}:`);
//             console.log('Term | calcPricing1 | calcPricing2 | Difference');
//             console.log('-----|-------------|-------------|-----------');
            
//             for (const term of terms) {
//                 const calc1Price = results1[term]?.retailPriceAfterTax || 'N/A';
//                 const calc2Price = result2[product]?.pricing[term]?.retailPriceAfterTax || 'N/A';
//                 const diff = typeof calc1Price === 'number' && typeof calc2Price === 'number' 
//                     ? (calc1Price - calc2Price).toFixed(2) 
//                     : 'N/A';
                
//                 console.log(`${term.toString().padStart(4)} | ${calc1Price.toString().padStart(11)} | ${calc2Price.toString().padStart(11)} | ${diff.padStart(9)}`);
//             }
            
//         } catch (error) {
//             console.log(`Error testing ${product}: ${error}`);
//         }
//     }
    
//     // Test cash products
//     const cashProducts = ['RCC'];
    
//     for (const product of cashProducts) {
//         console.log(`\n=== Testing ${product} (Cash) ===`);
        
//         // Test calculatePricing2 (single call with null policyTerm)
//         const inputData2 = {
//             ...baseInputData,
//             vehiclePurchaseMethod: 'cash' as const,
//             products: [product],
//             policyTerm: null,
//         };
        
//         try {
//             const result2 = calculatePricing2(inputData2);
//             console.log(`\ncalculatePricing2 Results for ${product}:`);
//             console.log(JSON.stringify(result2, null, 2));
            
//             // Test calculatePricing (multiple calls for each term)
//             console.log(`\ncalculatePricing Results for ${product}:`);
//             const results1: Record<number, any> = {};
            
//             for (const term of terms) {
//                 const inputData1 = {
//                     ...baseInputData,
//                     vehiclePurchaseMethod: 'cash' as const,
//                     product: product,
//                     policyTerm: term,
//                 };
                
//                 try {
//                     const result1 = calculatePricing(inputData1);
//                     results1[term] = result1;
//                     console.log(`Term ${term}: ${result1.retailPriceAfterTax}`);
//                 } catch (error) {
//                     console.log(`Term ${term}: Error - ${error}`);
//                 }
//             }
            
//             // Compare results
//             console.log(`\nComparison for ${product}:`);
//             console.log('Term | calcPricing1 | calcPricing2 | Difference');
//             console.log('-----|-------------|-------------|-----------');
            
//             for (const term of terms) {
//                 const calc1Price = results1[term]?.retailPriceAfterTax || 'N/A';
//                 const calc2Price = result2[product]?.pricing?.[term]?.retailPriceAfterTax || 'N/A';
//                 const diff = typeof calc1Price === 'number' && typeof calc2Price === 'number' 
//                     ? (calc1Price - calc2Price).toFixed(2) 
//                     : 'N/A';
                
//                 console.log(`${term.toString().padStart(4)} | ${calc1Price.toString().padStart(11)} | ${calc2Price.toString().padStart(11)} | ${diff.padStart(9)}`);
//             }
            
//         } catch (error) {
//             console.log(`Error testing ${product}: ${error}`);
//         }
//     }
// }