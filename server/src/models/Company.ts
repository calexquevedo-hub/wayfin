import mongoose, { Document, Model, Schema } from 'mongoose';
import { IAddress } from './Collaborator';

export interface ICompany extends Document {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    inscricaoMunicipal?: string;
    inscricaoEstadual?: string;
    atividadeEconomica?: string; // CNAE
    codigoMunicipio?: string;
    address: IAddress;
    email?: string;
    telefone?: string;
    responsavel?: string;
    createdAt: Date;
    updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
    razaoSocial: { type: String, required: true },
    nomeFantasia: { type: String, required: true },
    cnpj: { type: String, required: true, unique: true },
    inscricaoMunicipal: { type: String },
    inscricaoEstadual: { type: String },
    atividadeEconomica: { type: String },
    codigoMunicipio: { type: String },
    address: {
        cep: { type: String, required: true },
        street: { type: String, required: true },
        number: { type: String, required: true },
        complement: { type: String },
        neighborhood: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
    },
    email: { type: String },
    telefone: { type: String },
    responsavel: { type: String },
}, {
    timestamps: true,
});

const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);
export default Company;
