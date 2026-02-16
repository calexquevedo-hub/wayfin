import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getContracts, addContract, updateContract, deleteContract } from '../controllers/contractController';

const router = express.Router();

router.route('/').get(protect, getContracts).post(protect, addContract);
router.route('/:id').put(protect, updateContract).delete(protect, deleteContract);

export default router;
