import { Router } from 'express';
import { getUserSettings, updateUserSettings } from '../../controllers/settings.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateRequiredFields } from '../../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/user', getUserSettings);

router.put('/user', 
    validateRequiredFields(['email']),
    updateUserSettings
);

export default router; 