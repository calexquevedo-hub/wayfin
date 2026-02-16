import express from 'express';
import { authUser, registerUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

export default router;
