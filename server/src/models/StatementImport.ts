import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStatementImport extends Document {
    user: mongoose.Schema.Types.ObjectId;
    bankAccount: mongoose.Schema.Types.ObjectId;
    filename: string;
    fileType: 'OFX' | 'CSV';
    importDate: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionCount: number;
    error?: string;
}

const statementImportSchema = new Schema<IStatementImport>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bankAccount: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['OFX', 'CSV'],
        required: true
    },
    importDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    transactionCount: {
        type: Number,
        default: 0
    },
    error: {
        type: String
    }
}, { timestamps: true });

const StatementImport: Model<IStatementImport> = mongoose.model<IStatementImport>('StatementImport', statementImportSchema);
export default StatementImport;
