import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

interface RequestWithUser extends Request {
    user?: any;
}

const protect = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

            req.user = await User.findById(decoded.id).select('-password').populate('profile');

            next();
        } catch (error) {
            console.error('Error in protect middleware:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req: RequestWithUser, res: Response, next: NextFunction) => {
    // Check if user is admin OR has 'admin' profile (legacy support or explicit override)
    if (req.user && (req.user.isAdmin || req.user.profile?.name === 'Administrador')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const checkPermission = (permission: string) => {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
        // Admins have all permissions
        if (req.user && (req.user.isAdmin || req.user.profile?.name === 'Administrador')) {
            next();
            return;
        }

        if (req.user && req.user.profile && req.user.profile.permissions && req.user.profile.permissions.get(permission)) {
            next();
        } else {
            res.status(403).json({ message: `Not authorized. Missing permission: ${permission}` });
        }
    };
};

export { protect, admin, checkPermission };
