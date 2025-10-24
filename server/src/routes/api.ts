import { Router } from 'express';

// Import all v1 route modules
import authRoutes from './v1/auth.routes';
import dashboardRoutes from './v1/dashboard.routes';
import policyRoutes from './v1/policy.routes';
import claimsRoutes from './v1/claims.routes';
import adminRoutes from './v1/admin.routes';
import actionQueueRoutes from './v1/actionQueue.routes';
import reportsRoutes from './v1/reports.routes';
import settingsRoutes from './v1/settings.routes';

const router = Router();

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'PACE Insurance API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Random number endpoint (for testing)
router.get('/random', (req, res) => {
  const randomNumber = Math.floor(Math.random() * 1000) + 1;
  res.json({
    success: true,
    randomNumber: randomNumber,
    timestamp: new Date().toISOString()
  });
});

// Mount all v1 routes
router.use('/v1/auth', authRoutes);
router.use('/v1/dashboard', dashboardRoutes);
router.use('/v1/policies', policyRoutes);
router.use('/v1/claims', claimsRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/action-queue', actionQueueRoutes);
router.use('/v1/reports', reportsRoutes);
router.use('/v1/settings', settingsRoutes);

export default router;
