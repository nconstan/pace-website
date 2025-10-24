import { Router } from 'express';
import { getDashboardStats } from '../../controllers/dashboard.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateDealershipAccess } from '../../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(validateDealershipAccess);

router.get('/stats', getDashboardStats);

export default router; 