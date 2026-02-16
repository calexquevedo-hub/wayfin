import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB Connected');

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@admin.com' });

        if (adminExists) {
            console.log('Admin user exists. Updating password...');
            adminExists.password = 'admin123';
            await adminExists.save();
            console.log('Admin password updated successfully');
            process.exit();
        }

        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@admin.com',
            password: 'admin123',
            isAdmin: true,
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUsers();
