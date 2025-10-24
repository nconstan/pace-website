import { Router } from 'express'
import { 
  getPolicies
} from '../../controllers/reports.controller.js'
import { authenticateToken } from '../../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Reports endpoints
router.get('/policies', getPolicies)

export default router 