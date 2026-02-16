import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    user: mongoose.Schema.Types.ObjectId;
    name: string;
    type: 'income' | 'expense';
    color: string;
}

const categorySchema = new Schema<ICategory>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true,
        },
        color: {
            type: String,
            default: '#000000',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique names per user and type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', categorySchema);
