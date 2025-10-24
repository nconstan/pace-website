import { Router } from 'express';
import { 
    getClaims, 
    getClaim, 
    createClaim, 
    updateClaim, 
    deleteClaim, 
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getClaimsByEmail,
    getClaimsByCustomerNumber,
    upload
} from '../../controllers/claims.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateDealershipAccess } from '../../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(validateDealershipAccess);

router.get('/', getClaims);
router.get('/email/:email', getClaimsByEmail);
router.get('/customer/:customerNumber', getClaimsByCustomerNumber);
router.get('/:id', getClaim);
router.post('/', createClaim);
router.put('/:id', updateClaim);
router.delete('/:id', deleteClaim);
router.post('/:id/documents', upload.single('document'), uploadDocument);
router.get('/:id/documents/download', downloadDocument);
router.delete('/:id/documents', deleteDocument);

export default router; 