import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import collaboratorRoutes from './routes/collaboratorRoutes';
import healthPlanRoutes from './routes/healthPlanRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import companyRoutes from './routes/companyRoutes';
import dentalPlanRoutes from './routes/dentalPlanRoutes';
import uploadRoutes from './routes/uploadRoutes';
import profileRoutes from './routes/profileRoutes';
import userRoutes from './routes/userRoutes';
import bankAccountRoutes from './routes/bankAccountRoutes';
import categoryRoutes from './routes/categoryRoutes';
import contractRoutes from './routes/contractRoutes';
import reconciliationRoutes from './routes/reconciliationRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
app.use(express.json());

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/collaborators', collaboratorRoutes);
app.use('/api/health-plans', healthPlanRoutes);
app.use('/api/dental-plans', dentalPlanRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reconciliation', reconciliationRoutes);

import { ensureAdminProfile } from './controllers/profileController';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI or MONGO_URI environment variable is not defined');
        }
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Ensure Admin profile exists
        await ensureAdminProfile();
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        console.log('⚠️  MongoDB Connection FAILED. Ensure MongoDB is running locally on port 27017');
        console.log('⚠️  The app will run but login will NOT work.');
        // process.exit(1); // Do not exit, keep server running to serve static files/show errors
    }
};

connectDB();

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.get('/', (req, res) => {
    res.send('WayFin API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
