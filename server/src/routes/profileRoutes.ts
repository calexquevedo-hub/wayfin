import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import {
    getProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    initAdminProfile
} from '../controllers/profileController';

const router = express.Router();

router.route('/')
    .get(protect, admin, getProfiles)
    .post(protect, admin, createProfile);

router.route('/:id')
    .put(protect, admin, updateProfile)
    .delete(protect, admin, deleteProfile);

router.post('/init', initAdminProfile); // Protected by logic or run once

export default router;
