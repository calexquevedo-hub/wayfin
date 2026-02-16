import mongoose, { Document, Schema } from 'mongoose';

export interface IContract extends Document {
    user: mongoose.Schema.Types.ObjectId;
    customerName: string; // Or link to a customer model if it existed, but for now string
    description: string;
    amount: number;
    startDate: Date;
    endDate?: Date; // Optional, open-ended contracts
    recurrenceInterval: 'monthly' | 'yearly';
    billingDay: number; // Day of the month to generate the transaction
    status: 'active' | 'inactive' | 'canceled';
    fileUrl?: string; // For attaching the contract document
}

const contractSchema = new Schema<IContract>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
        },
        recurrenceInterval: {
            type: String,
            enum: ['monthly', 'yearly'],
            default: 'monthly',
        },
        billingDay: {
            type: Number,
            required: true,
            min: 1,
            max: 31,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'canceled'],
            default: 'active',
        },
        fileUrl: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IContract>('Contract', contractSchema);
