import { Router } from 'express';

const router = Router();

// Example API routes
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Insurance-related routes
router.get('/insurance/types', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Auto Insurance', description: 'Comprehensive auto coverage' },
      { id: 2, name: 'Home Insurance', description: 'Protect your home and belongings' },
      { id: 3, name: 'Life Insurance', description: 'Financial security for your family' },
      { id: 4, name: 'Health Insurance', description: 'Medical coverage and wellness' }
    ]
  });
});

router.get('/insurance/quotes', (req, res) => {
  // This would typically connect to a database or external service
  res.json({
    success: true,
    message: 'Quote generation endpoint - implement your business logic here'
  });
});

export default router;
