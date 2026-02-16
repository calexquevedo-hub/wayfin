import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import {
    getCollaborators,
    createCollaborator,
    updateCollaborator,
    deleteCollaborator
} from '../controllers/collaboratorController';

const router = express.Router();

router.route('/').get(protect, getCollaborators).post(protect, admin, createCollaborator);
router.route('/:id').put(protect, admin, updateCollaborator).delete(protect, admin, deleteCollaborator);

export default router;
