import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPriceRange {
    minAge: number;
    maxAge: number;
    beneficiaryType: 'Titular' | 'Dependente' | 'Ambos';
    price: number;
}

export interface IHealthPlan extends Document {
    operator: string;
    planName: string;
    planCode?: string; // ANS Code
    type: 'Enfermaria' | 'Apartamento' | 'VIP';
    coparticipation: boolean;
    hasObstetrics: boolean;
    hasAmbulatory: boolean;
    hasHospital: boolean;
    priceTable: IPriceRange[];
    adjustmentMonth: number; // 1-12
    billingDay: number; // 1-31
    lastAdjustment?: {
        date: Date;
        percentage: number;
        previousPriceTable: IPriceRange[];
    };
    sortOrder: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const priceRangeSchema = new Schema<IPriceRange>({
    minAge: { type: Number, required: true },
    maxAge: { type: Number, required: true },
    beneficiaryType: { type: String, required: true, enum: ['Titular', 'Dependente', 'Ambos'], default: 'Ambos' },
    price: { type: Number, required: true },
});

const healthPlanSchema = new Schema<IHealthPlan>({
    operator: { type: String, required: true }, // e.g., Unimed, Bradesco
    planName: { type: String, required: true }, // e.g., Nacional Flex
    planCode: { type: String },
    type: { type: String, required: true, enum: ['Enfermaria', 'Apartamento', 'VIP'] },
    coparticipation: { type: Boolean, default: false },
    hasObstetrics: { type: Boolean, default: false },
    hasAmbulatory: { type: Boolean, default: false },
    hasHospital: { type: Boolean, default: false },
    priceTable: [priceRangeSchema],
    adjustmentMonth: { type: Number, min: 1, max: 12, default: 1 },
    billingDay: { type: Number, min: 1, max: 31, default: 1 },
    lastAdjustment: {
        date: { type: Date },
        percentage: { type: Number },
        previousPriceTable: [priceRangeSchema]
    },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
}, {
    timestamps: true,
});

const HealthPlan: Model<IHealthPlan> = mongoose.model<IHealthPlan>('HealthPlan', healthPlanSchema);
export default HealthPlan;
