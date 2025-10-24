import { Router } from 'express';
import { 
    createPolicy, 
    getPolicies, 
    getPolicy, 
    updatePolicy,
    saveQuickQuote,
    getQuickQuotes,
    getQuickQuote,
    updateQuickQuote,
    deleteQuickQuote,
    getAllPricing,
    getVinData,
    confirmPolicy,
    calculateRefund,
    searchPoliciesByEmail,
    getPoliciesByCustomerNumber,
    startPolicyCancelation,
    cancelPolicy
} from '../../controllers/policy.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateRequiredFields, validateDealershipAccess, validateWithZod, createPolicySchema, quickQuoteSchema } from '../../middleware/validation';

const router = Router();

// Policy confirmation route (no authentication required)
router.post('/confirm', confirmPolicy);

// Policy cancellation route (no authentication required)
router.post('/cancel', cancelPolicy);

// All other routes require authentication
router.use(authenticateToken);
router.use(validateDealershipAccess);

// Policy routes
router.post('/create', 
    validateWithZod(createPolicySchema),
    createPolicy
);

router.post('/getPolicies', getPolicies);
router.get('/search/email/:email', searchPoliciesByEmail);
router.post('/customer/:customerNumber', getPoliciesByCustomerNumber);
router.get('/:id', getPolicy);
router.get('/:id/refund', calculateRefund);
router.post('/:id/start-cancellation', startPolicyCancelation);
router.put('/:id', updatePolicy);

// Quick quote routes
router.post('/quick-quote/save', 
    validateWithZod(quickQuoteSchema),
    saveQuickQuote
);

router.post('/getAllPricing', getAllPricing);
router.get('/quick-quote', getQuickQuotes);
router.get('/quick-quote/:id', getQuickQuote);
router.put('/quick-quote/:id', updateQuickQuote);
router.delete('/quick-quote/:id', deleteQuickQuote);
router.get('/getVinData/:vin', getVinData);

export default router; 