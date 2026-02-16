import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/categoryController';

const router = express.Router();

router.route('/').get(protect, getCategories).post(protect, addCategory);
router.route('/:id').put(protect, updateCategory).delete(protect, deleteCategory);

export default router;
