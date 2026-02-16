import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEnrollment extends Document {
    collaborator: mongoose.Types.ObjectId;
    dependent: mongoose.Types.ObjectId | null;
    financialResponsible: mongoose.Types.ObjectId;
    healthPlan?: mongoose.Types.ObjectId;
    healthPlanCredential?: string;
    dentalPlan?: mongoose.Types.ObjectId;
    dentalPlanCredential?: string;
    type: 'Health' | 'Dental';
    enrollmentDate: Date;
    effectiveDate: Date;
    monthlyCost: number;
    retroactiveDiff: number;
    status: 'active' | 'inactive';
    planChange?: {
        requestDate: Date;
        effectiveDate: Date;
        status: 'pending' | 'active' | 'cancelled';
        previousPlan?: mongoose.Types.ObjectId;
        newPlan?: mongoose.Types.ObjectId;
        previousCost: number;
        newCost: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
    collaborator: {
        type: Schema.Types.ObjectId,
        ref: 'Collaborator',
        required: true
    },
    dependent: {
        type: Schema.Types.ObjectId,
        // No ref as dependents are subdocuments in Collaborator
        default: null
    },
    financialResponsible: {
        type: Schema.Types.ObjectId,
        ref: 'Collaborator',
        required: true
    },
    type: {
        type: String,
        enum: ['Health', 'Dental'],
        default: 'Health',
        required: true
    },
    healthPlan: {
        type: Schema.Types.ObjectId,
        ref: 'HealthPlan'
    },
    healthPlanCredential: {
        type: String
    },
    dentalPlan: {
        type: Schema.Types.ObjectId,
        ref: 'DentalPlan'
    },
    dentalPlanCredential: {
        type: String
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    effectiveDate: {
        type: Date,
        default: Date.now
    },
    monthlyCost: {
        type: Number,
        required: true
    },
    retroactiveDiff: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    planChange: {
        requestDate: { type: Date },
        effectiveDate: { type: Date },
        status: {
            type: String,
            enum: ['pending', 'active', 'cancelled']
        },
        previousPlan: {
            type: Schema.Types.ObjectId,
            // Dynamic ref is hard here without refPath, will resolve manually or use refPath if needed
            // For now, keeping ObjectId, controller handles population based on type
        },
        newPlan: {
            type: Schema.Types.ObjectId,
        },
        previousCost: { type: Number },
        newCost: { type: Number }
    }
}, { timestamps: true });

const Enrollment: Model<IEnrollment> = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
export default Enrollment;
