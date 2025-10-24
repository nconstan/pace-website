import { Router } from 'express';
import { login, validateToken, changePassword, setupPassword } from '../../controllers/auth.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validateRequiredFields, validateRole, validateWithZod, loginSchema, createAccountSchema, setupPasswordSchema } from '../../middleware/validation.js';
import { rateLimit } from '../../middleware/ratelimit.js';

const router = Router();

// Public routes
router.post('/login', 
    rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
    validateWithZod(loginSchema),
    login
);

// Protected routes
router.get('/validate-token', authenticateToken, validateToken);

router.post('/change-password',
    authenticateToken,
    changePassword
);

// Public route for password setup (no authentication required)
router.post('/setup-password', 
    validateWithZod(setupPasswordSchema),
    setupPassword
);

export default router; 