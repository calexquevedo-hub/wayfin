import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
} from '../controllers/userController';

const router = express.Router();

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

export default router;
