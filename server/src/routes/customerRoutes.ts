import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController';

const router = express.Router();

router.route('/').get(protect, getCustomers).post(protect, addCustomer);
router.route('/:id').put(protect, updateCustomer).delete(protect, deleteCustomer);

export default router;
