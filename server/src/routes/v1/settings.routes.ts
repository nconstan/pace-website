import { Router } from 'express';
import { getUserSettings, updateUserSettings } from '../../controllers/settings.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validateRequiredFields } from '../../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/user', getUserSettings);

router.put('/user', 
    validateRequiredFields(['email']),
    updateUserSettings
);

export default router; 