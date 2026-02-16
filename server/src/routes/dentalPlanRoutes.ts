import express from 'express';
import {
    getDentalPlans,
    createDentalPlan,
    updateDentalPlan,
    deleteDentalPlan,
    applyAdjustment,
    generateBilling,
    adjustByOperator
} from '../controllers/dentalPlanController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getDentalPlans)
    .post(protect, createDentalPlan);

router.post('/adjust-by-operator', protect, adjustByOperator);

router.route('/:id')
    .put(protect, updateDentalPlan)
    .delete(protect, deleteDentalPlan);

router.post('/:id/apply-adjustment', protect, applyAdjustment);
router.post('/:id/generate-billing', protect, generateBilling);

export default router;
