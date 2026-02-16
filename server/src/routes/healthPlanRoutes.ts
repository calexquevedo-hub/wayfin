import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import {
    getHealthPlans,
    createHealthPlan,
    updateHealthPlan,
    deleteHealthPlan,
    applyAdjustment,
    generateBilling,
    adjustByOperator
} from '../controllers/healthPlanController';

const router = express.Router();

router.route('/').get(protect, getHealthPlans).post(protect, admin, createHealthPlan);
router.route('/:id').put(protect, admin, updateHealthPlan).delete(protect, admin, deleteHealthPlan);
router.route('/:id/apply-adjustment').post(protect, admin, applyAdjustment);
router.route('/adjust-by-operator').post(protect, admin, adjustByOperator);
router.route('/:id/generate-billing').post(protect, admin, generateBilling);

export default router;
