import { Router } from 'express';
import { getDashboardStats } from '../../controllers/dashboard.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validateDealershipAccess } from '../../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(validateDealershipAccess);

router.get('/stats', getDashboardStats);

export default router; 