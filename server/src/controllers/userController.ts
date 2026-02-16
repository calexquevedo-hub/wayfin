import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).populate('profile').select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Create a new user (Admin)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req: Request, res: Response) => {
    const { name, email, password, profileId } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            password,
            profile: profileId,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile,
                active: user.active,
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req: Request, res: Response) => {
    const { name, email, profileId, active } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            if (profileId) user.profile = profileId;
            if (active !== undefined) user.active = active;

            const updatedUser = await user.save();

            // Re-populate profile active status for response if needed
            await updatedUser.populate('profile');

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profile: updatedUser.profile,
                active: updatedUser.active,
                isAdmin: updatedUser.isAdmin,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).populate('profile').select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
};

export { getUsers, createUser, updateUser, deleteUser, getUserById };
