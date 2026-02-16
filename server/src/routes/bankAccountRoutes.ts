import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getBankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
} from '../controllers/bankAccountController';

const router = express.Router();

router.route('/').get(protect, getBankAccounts).post(protect, addBankAccount);
router.route('/:id').put(protect, updateBankAccount).delete(protect, deleteBankAccount);

export default router;
