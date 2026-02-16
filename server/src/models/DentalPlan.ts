import mongoose, { Document, Model, Schema } from 'mongoose';
import { IPriceRange } from './HealthPlan';

export interface IDentalPlan extends Document {
    operator: string;
    planName: string;
    planCode?: string; // ANS Code
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

const dentalPlanSchema = new Schema<IDentalPlan>({
    operator: { type: String, required: true }, // e.g., OdontoPrev, MetLife
    planName: { type: String, required: true }, // e.g., Dental Max
    planCode: { type: String },
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

const DentalPlan: Model<IDentalPlan> = mongoose.model<IDentalPlan>('DentalPlan', dentalPlanSchema);
export default DentalPlan;
