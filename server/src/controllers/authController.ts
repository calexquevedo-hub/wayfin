import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import generateToken from '../utils/generateToken';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('profile');

    if (user && (await user.matchPassword(password))) {
        if (!user.active) {
            res.status(401).json({ message: 'User is disabled. Please contact support.' });
            return;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            active: user.active,
            profile: user.profile,
            token: generateToken(user._id.toString()),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            token: generateToken(user._id.toString()),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req: any, res: Response) => {
    const user = await User.findById(req.user._id).populate('profile');

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            active: user.active,
            profile: user.profile,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile data (name/email/avatar/password)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req: any, res: Response) => {
    const user = await User.findById(req.user._id).populate('profile');

    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    const {
        name,
        email,
        avatar,
        currentPassword,
        newPassword,
        confirmPassword,
    } = req.body;

    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
            res.status(400).json({ message: 'Email already in use' });
            return;
        }
        user.email = email;
    }

    if (typeof name === 'string' && name.trim()) {
        user.name = name.trim();
    }

    if (typeof avatar === 'string') {
        user.avatar = avatar;
    }

    if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
            res.status(400).json({ message: 'Para alterar a senha, preencha senha atual, nova senha e confirmação.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            res.status(400).json({ message: 'A confirmação da nova senha não confere.' });
            return;
        }

        const isCurrentPasswordValid = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            res.status(400).json({ message: 'Senha atual inválida.' });
            return;
        }

        user.password = newPassword;
    }

    const updatedUser = await user.save();
    await updatedUser.populate('profile');

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        isAdmin: updatedUser.isAdmin,
        active: updatedUser.active,
        profile: updatedUser.profile,
    });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await user.save();

        // In a real app, send email here. For now, return token.
        res.status(200).json({ success: true, data: resetToken, message: "Token generated. In production, this would be sent via email." });
    } catch (error) {
        res.status(500).json({ message: 'Error generating reset token' });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resetToken
// @access  Public
const resetPassword = async (req: Request, res: Response) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken as string).digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid token' });
            return;
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
};

export { authUser, registerUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword };
