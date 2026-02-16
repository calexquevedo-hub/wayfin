import mongoose, { Document, Schema } from 'mongoose';

export interface IBankAccount extends Document {
    user: mongoose.Schema.Types.ObjectId;
    name: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    type: 'Checking' | 'Savings' | 'Investment' | 'Cash' | 'Credit Card' | 'Other';
    balance: number;
    color: string;
}

const bankAccountSchema = new Schema<IBankAccount>(
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
        bankName: {
            type: String,
            required: false,
        },
        branch: {
            type: String,
            required: false,
        },
        accountNumber: {
            type: String,
            required: false,
        },
        type: {
            type: String,
            enum: ['Checking', 'Savings', 'Investment', 'Cash', 'Credit Card', 'Other'],
            default: 'Checking',
        },
        balance: {
            type: Number,
            default: 0,
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

export default mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);
