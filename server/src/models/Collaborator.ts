import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDependent {
    name: string;
    relationship: 'Esposo(a)' | 'Filho(a)' | 'Pai/Mãe' | 'Outro';
    birthDate: Date;
    gender?: 'Masculino' | 'Feminino' | 'Outro';
    cpf?: string;
    email?: string;
    motherName?: string;
    fatherName?: string;
    nis?: string;
    dnv?: string;
    rg?: string;
    placeOfBirth?: string;
    ufNaturalidade?: string;
    planDocuments?: Array<{
        name: string;
        delivered: boolean;
        date: Date;
    }>;
}

export interface IAddress {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
}

export interface ICollaborator extends Document {
    name: string;
    registrationNumber?: string; // Internal Code / Matrícula
    esocialMatricula?: string;

    personalData: {
        photo?: string;
        motherName?: string;
        fatherName?: string;
        birthDate: Date;
        gender?: 'Masculino' | 'Feminino' | 'Outro';
        placeOfBirth?: string;
        ufNaturalidade?: string;
        nationality?: string;
        maritalStatus?: string;
        race?: string;
        educationLevel?: string;
        address?: IAddress;
        phone?: string;
        mobile?: string;
        email?: string;
    };

    documents: {
        cpf: string;
        ctps?: {
            number: string;
            series: string;
            dv: string;
            uf: string;
            issuanceDate: Date;
        };
        nis?: string;
        dnv?: string;
        rg?: {
            number: string;
            issuanceDate: Date;
            issuer: string;
            uf: string;
        };
        title?: {
            number: string;
            zone: string;
            section: string;
        };
        cnh?: {
            number: string;
            category: string;
            validity: Date;
        };
        military?: {
            certificate: string;
            series?: string;
            type?: string;
            category?: string;
            csmOam?: string;
            rmDnComar?: string;
        };
        classOrg?: {
            council: string;
            uf: string;
            number: string;
            issuanceDate?: Date;
            validity?: Date;
        };
    };

    immigration?: {
        arrivalYear?: number;
        visaType?: string;
        rgValidity?: Date;
        ctpsValidity?: Date;
    };

    contractual: {
        admissionDate: Date;
        paymentMethod?: string;
        department?: string;
        jobTitle?: string;
        terminationDate?: Date;
    };

    workShift: {
        code?: string;
        description?: string;
        observations?: string;
        schedule: {
            monday: string;
            tuesday: string;
            wednesday: string;
            thursday: string;
            friday: string;
            saturday: string;
            sunday: string;
            // Detailed slots for grid: E1, S1, E2, S2, E3, S3, E4, S4
            slots: {
                [day: string]: {
                    e1?: string; s1?: string;
                    e2?: string; s2?: string;
                    e3?: string; s3?: string;
                    e4?: string; s4?: string;
                }
            }
        };
    };

    otherInfo: {
        participatesCipa?: boolean;
        lastMedicalExam?: Date;
    };

    jobHistory: Array<{
        monthYear: string;
        cbo: string;
        jobTitle: string;
    }>;

    salaryHistory: Array<{
        monthYear: string;
        value: number;
    }>;

    dependents: IDependent[];
    createdAt: Date;
    updatedAt: Date;
}

const dependentSchema = new Schema<IDependent>({
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ['Masculino', 'Feminino', 'Outro'] },
    cpf: { type: String },
    email: { type: String },
    motherName: { type: String },
    fatherName: { type: String },
    nis: { type: String },
    dnv: { type: String },
    rg: { type: String },
    placeOfBirth: { type: String },
    ufNaturalidade: { type: String },
    planDocuments: [{
        name: String,
        delivered: Boolean,
        date: Date
    }]
});

const addressSchema = new Schema<IAddress>({
    cep: { type: String },
    street: { type: String },
    number: { type: String },
    complement: { type: String },
    neighborhood: { type: String },
    city: { type: String },
    state: { type: String },
}, { _id: false });

const collaboratorSchema = new Schema<ICollaborator>({
    name: { type: String, required: true },
    registrationNumber: { type: String },
    esocialMatricula: { type: String },

    personalData: {
        photo: { type: String },
        motherName: { type: String },
        fatherName: { type: String },
        birthDate: { type: Date, required: true },
        gender: { type: String, enum: ['Masculino', 'Feminino', 'Outro'], required: true },
        placeOfBirth: { type: String },
        ufNaturalidade: { type: String },
        nationality: { type: String },
        maritalStatus: { type: String },
        race: { type: String },
        educationLevel: { type: String },
        address: { type: addressSchema },
        phone: { type: String },
        mobile: { type: String },
        email: { type: String },
    },

    documents: {
        cpf: { type: String, required: true, unique: true },
        ctps: {
            number: String,
            series: String,
            dv: String,
            uf: String,
            issuanceDate: Date,
        },
        nis: String,
        dnv: String,
        rg: {
            number: String,
            issuanceDate: Date,
            issuer: String,
            uf: String,
        },
        title: {
            number: String,
            zone: String,
            section: String,
        },
        cnh: {
            number: String,
            category: String,
            validity: Date,
        },
        military: {
            certificate: { type: String, default: '' },
            series: { type: String, default: '' },
            type: { type: String, default: '' },
            category: { type: String, default: '' },
            csmOam: { type: String, default: '' },
            rmDnComar: { type: String, default: '' },
        },
        classOrg: {
            council: String,
            uf: String,
            number: String,
            issuanceDate: Date,
            validity: Date,
        },
    },

    immigration: {
        arrivalYear: Number,
        visaType: String,
        rgValidity: Date,
        ctpsValidity: Date,
    },

    contractual: {
        admissionDate: { type: Date },
        paymentMethod: String,
        department: String,
        jobTitle: String,
        terminationDate: Date,
    },

    workShift: {
        code: String,
        description: String,
        observations: String,
        schedule: {
            monday: String,
            tuesday: String,
            wednesday: String,
            thursday: String,
            friday: String,
            saturday: String,
            sunday: String,
            slots: { type: Map, of: Object }
        }
    },

    otherInfo: {
        participatesCipa: { type: Boolean, default: false },
        lastMedicalExam: Date,
    },

    jobHistory: [{
        monthYear: String,
        cbo: String,
        jobTitle: String,
    }],

    salaryHistory: [{
        monthYear: String,
        value: Number,
    }],

    dependents: [dependentSchema],
}, {
    timestamps: true,
});

collaboratorSchema.pre('save', async function (this: any) {
    if (!this.registrationNumber) {
        try {
            const lastCollab = await mongoose.model('Collaborator').findOne({}, { registrationNumber: 1 }).sort({ registrationNumber: -1 });
            let nextNumber = 1001;
            if (lastCollab && lastCollab.registrationNumber) {
                const lastNum = parseInt(lastCollab.registrationNumber);
                if (!isNaN(lastNum)) {
                    nextNumber = lastNum + 1;
                }
            }
            this.registrationNumber = nextNumber.toString();
        } catch (error) {
            console.error('Error generating registration number:', error);
        }
    }
});

const Collaborator: Model<ICollaborator> = mongoose.model<ICollaborator>('Collaborator', collaboratorSchema);
export default Collaborator;
