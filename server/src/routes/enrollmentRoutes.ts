import express from 'express';
import { getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment, requestPlanChange, generateGlobalBilling } from '../controllers/enrollmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getEnrollments)
    .post(protect, createEnrollment);

router.route('/:id')
    .put(protect, updateEnrollment)
    .delete(protect, deleteEnrollment);

router.post('/:id/request-plan-change', protect, requestPlanChange);
router.post('/generate-billing', protect, generateGlobalBilling);

export default router;
