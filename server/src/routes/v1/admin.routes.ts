import { Router } from 'express';
import { 
    getAccounts,
    createAccount,
    updateAccount,
    getContacts,
    createContact,
    getDealerGroups,
    createDealerGroup,
    updateDealerGroup,
    deleteDealerGroup,
    getDealerships,
    createDealership,
    updateDealership,
    deleteDealership,
    getApplicantByCustomerNumber,
} from '../../controllers/admin.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateRole, validateRequiredFields, validateContactFields, validateWithZod, createAccountSchema } from '../../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Contact Management
router.get('/contacts', getContacts);

router.post('/contacts/create', 
    validateRole([0]), // Allow all roles to create contacts
    validateContactFields,
    createContact
);

// Dealer Group Management
router.get('/dealer-groups', 
    validateRole([4]),
    getDealerGroups
);

router.post('/dealer-groups/create', 
    validateRole([4]),
    createDealerGroup
);

router.put('/dealer-groups/:id', 
    validateRole([4]),
    updateDealerGroup
);

router.delete('/dealer-groups/:id', 
    validateRole([4]),
    deleteDealerGroup
);

// Dealership Management
router.get('/dealerships', getDealerships);

router.post('/dealerships/create', 
    validateRole([4]),
    validateRequiredFields(['name']),
    createDealership
);

router.put('/dealerships/:id', 
    validateRole([4]),
    updateDealership
);

router.delete('/dealerships/:id', 
    validateRole([4]),
    deleteDealership
);

router.get('/accounts', authenticateToken, getAccounts);

router.post('/accounts/create', 
    authenticateToken,
    validateRole([3, 2, 4]),
    validateWithZod(createAccountSchema),
    createAccount
);

router.put('/accounts/:id', 
    authenticateToken,
    validateRole([3, 2, 4]),
    validateWithZod(createAccountSchema),
    updateAccount
);

// Applicant Management - Customer lookup (available to all authenticated users)
router.get('/applicants/customer/:customerNumber', 
    getApplicantByCustomerNumber
);

export default router; 