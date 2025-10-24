import { Router } from 'express'
import { 
  getPolicies
} from '../../controllers/reports.controller'
import { authenticateToken } from '../../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Reports endpoints
router.get('/policies', getPolicies)

export default router 