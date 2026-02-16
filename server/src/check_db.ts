import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkEnrollments = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const collections = await db?.listCollections().toArray();
        console.log('Collectionsfound:', collections?.map(c => c.name));

        const enrollmentSchema = new mongoose.Schema({}, { strict: false });
        const Enrollment = mongoose.model('Enrollment', enrollmentSchema, 'enrollments');

        const docs = await Enrollment.find();
        console.log(`Found ${docs.length} documents in 'enrollments' collection`);

        if (docs.length > 0) {
            console.log('First doc:', JSON.stringify(docs[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking enrollments:', error);
        process.exit(1);
    }
};

checkEnrollments();
