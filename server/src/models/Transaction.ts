import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransaction extends Document {
    user: mongoose.Schema.Types.ObjectId;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: Date;
    status: 'pending' | 'paid';
    dueDate?: Date;
    healthPlan?: mongoose.Schema.Types.ObjectId;
    dentalPlan?: mongoose.Schema.Types.ObjectId;
    isRecurring?: boolean;
    recurrenceInterval?: 'monthly' | 'weekly' | 'yearly';
    installments?: {
        current: number;
        total: number;
    };
    paymentMethod?: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'boleto' | 'transfer';
    bankAccount?: mongoose.Schema.Types.ObjectId;
    settlementDate?: Date;
    reconciled?: boolean;
    reconciliationId?: mongoose.Schema.Types.ObjectId;
}

const transactionSchema = new Schema<ITransaction>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense'],
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid'],
    },
    dueDate: {
        type: Date,
    },
    healthPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthPlan',
    },
    dentalPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DentalPlan',
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurrenceInterval: {
        type: String,
        enum: ['monthly', 'weekly', 'yearly'],
    },
    installments: {
        current: Number,
        total: Number,
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'pix', 'cash', 'boleto', 'transfer'],
    },
    bankAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
    },
    settlementDate: {
        type: Date,
    },
    reconciled: {
        type: Boolean,
        default: false,
    },
    reconciliationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StatementImport',
    },
}, {
    timestamps: true,
});

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
