import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFinancialAudit extends Document {
    transactionId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    action: 'create' | 'update' | 'delete' | 'liquidate';
    previousData?: any;
    newData?: any;
    reason: string;
    createdAt: Date;
}

const financialAuditSchema = new Schema<IFinancialAudit>({
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'liquidate']
    },
    previousData: {
        type: Schema.Types.Mixed
    },
    newData: {
        type: Schema.Types.Mixed
    },
    reason: {
        type: String,
        required: true
    }
}, { timestamps: { createdAt: true, updatedAt: false } });

const FinancialAudit: Model<IFinancialAudit> = mongoose.model<IFinancialAudit>('FinancialAudit', financialAuditSchema);
export default FinancialAudit;
