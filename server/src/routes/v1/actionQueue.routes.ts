import { Router } from 'express';
import { 
    getCommands,
    scheduleNewCommand,
    getScheduled,
    cancelScheduledCommand,
    getCommandStats,
    registerNewCommand
} from '../../controllers/actionQueue.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateRole } from '../../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get available commands (any authenticated user)
router.get('/commands', getCommands);

// Get scheduled commands with filters (any authenticated user)
router.get('/scheduled', getScheduled);

// Get command statistics (any authenticated user)
router.get('/stats', getCommandStats);

// Schedule a new command (any authenticated user)
router.post('/schedule', scheduleNewCommand);

// Cancel a scheduled command (any authenticated user)
router.delete('/cancel/:id', cancelScheduledCommand);

// Register a new command (admin only - role 5+)
router.post('/register', validateRole([4, 5, 6, 7, 8, 9, 10, 11, 12]), registerNewCommand);

export default router;
