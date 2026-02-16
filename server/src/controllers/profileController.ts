import { Request, Response } from 'express';
import Profile from '../models/Profile';

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Private/Admin
const getProfiles = async (req: Request, res: Response) => {
    try {
        const profiles = await Profile.find({});
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profiles' });
    }
};

// @desc    Create a new profile
// @route   POST /api/profiles
// @access  Private/Admin
const createProfile = async (req: Request, res: Response) => {
    const { name, permissions } = req.body;

    try {
        const profileExists = await Profile.findOne({ name });

        if (profileExists) {
            res.status(400).json({ message: 'Profile already exists' });
            return;
        }

        const profile = await Profile.create({
            name,
            permissions,
        });

        res.status(201).json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error creating profile' });
    }
};

// @desc    Update a profile
// @route   PUT /api/profiles/:id
// @access  Private/Admin
const updateProfile = async (req: Request, res: Response) => {
    const { name, permissions } = req.body;

    try {
        const profile = await Profile.findById(req.params.id);

        if (profile) {
            if (profile.isStatic && name !== profile.name) {
                res.status(400).json({ message: 'Cannot rename a static profile (Administrador)' });
                return;
            }

            profile.name = name || profile.name;
            profile.permissions = permissions || profile.permissions;

            const updatedProfile = await profile.save();
            res.json(updatedProfile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// @desc    Delete a profile
// @route   DELETE /api/profiles/:id
// @access  Private/Admin
const deleteProfile = async (req: Request, res: Response) => {
    try {
        const profile = await Profile.findById(req.params.id);

        if (profile) {
            if (profile.isStatic) {
                res.status(400).json({ message: 'Cannot delete a static profile (Administrador)' });
                return;
            }

            await profile.deleteOne();
            res.json({ message: 'Profile removed' });
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting profile' });
    }
};

// Standalone function to ensure admin profile exists and has full permissions
const ensureAdminProfile = async () => {
    try {
        const adminPermissions = {
            dashboard: true,
            payables: true,
            receivables: true,
            reports: true,
            analytics: true,
            collaborators: true,
            health_plans: true,
            dental_plans: true,
            enrollments: true,
            company: true,
            settings: true,
        };

        await Profile.findOneAndUpdate(
            { name: 'Administrador' },
            {
                $set: {
                    permissions: adminPermissions,
                    isStatic: true
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log('Admin profile ensured with full permissions.');
    } catch (error) {
        console.error('Error ensuring admin profile:', error);
    }
};

// @desc    Initialize default Admin profile
// @route   POST /api/profiles/init
// @access  Public (protected by secret or run once)
const initAdminProfile = async (req: Request, res: Response) => {
    try {
        await ensureAdminProfile();
        res.json({ message: 'Admin profile check completed' });
    } catch (error) {
        res.status(500).json({ message: 'Error initializing admin profile' });
    }
}

export {
    getProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    initAdminProfile,
    ensureAdminProfile
};


