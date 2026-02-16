import express from 'express';
import { getDashboardSummary, getAnalytics } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/summary', protect, getDashboardSummary);
router.get('/analytics', protect, getAnalytics);

export default router;
