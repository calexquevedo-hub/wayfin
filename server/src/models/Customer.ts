import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
    user: mongoose.Schema.Types.ObjectId;
    name: string;
    email?: string;
    phone?: string;
    document?: string; // CPF or CNPJ
    address?: {
        cep?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    };
    notes?: string;
}

const customerSchema = new Schema<ICustomer>(
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
        email: {
            type: String,
        },
        phone: {
            type: String,
        },
        document: {
            type: String,
        },
        address: {
            cep: String,
            street: String,
            number: String,
            complement: String,
            neighborhood: String,
            city: String,
            state: String,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ICustomer>('Customer', customerSchema);
