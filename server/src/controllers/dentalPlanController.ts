import { Request, Response } from 'express';
import DentalPlan from '../models/DentalPlan';
import Enrollment from '../models/Enrollment';
import Transaction from '../models/Transaction';

// @desc    Get all dental plans
// @route   GET /api/dental-plans
// @access  Private
const getDentalPlans = async (req: Request, res: Response) => {
    const plans = await DentalPlan.find({}).sort({ operator: 1, planName: 1 });
    res.json(plans);
};

// @desc    Create a dental plan
// @route   POST /api/dental-plans
// @access  Private
const createDentalPlan = async (req: Request, res: Response) => {
    const {
        operator,
        planName,
        planCode,
        priceTable,
        adjustmentMonth,
        billingDay,
        sortOrder
    } = req.body;

    const plan = await DentalPlan.create({
        operator,
        planName,
        planCode,
        priceTable,
        adjustmentMonth,
        billingDay,
        sortOrder
    });

    if (plan) {
        res.status(201).json(plan);
    } else {
        res.status(400).json({ message: 'Invalid dental plan data' });
    }
};

// @desc    Update a dental plan
// @route   PUT /api/dental-plans/:id
// @access  Private
const updateDentalPlan = async (req: Request, res: Response) => {
    const plan = await DentalPlan.findById(req.params.id);

    if (plan) {
        plan.operator = req.body.operator || plan.operator;
        plan.planName = req.body.planName || plan.planName;
        plan.planCode = req.body.planCode || plan.planCode;
        plan.sortOrder = req.body.sortOrder !== undefined ? req.body.sortOrder : plan.sortOrder;
        plan.priceTable = req.body.priceTable || plan.priceTable;
        plan.adjustmentMonth = req.body.adjustmentMonth || plan.adjustmentMonth;
        plan.billingDay = req.body.billingDay || plan.billingDay;
        plan.active = req.body.active !== undefined ? req.body.active : plan.active;

        const updatedPlan = await plan.save();
        res.json(updatedPlan);
    } else {
        res.status(404).json({ message: 'Dental Plan not found' });
    }
};

// @desc    Delete a dental plan
// @route   DELETE /api/dental-plans/:id
// @access  Private
const deleteDentalPlan = async (req: Request, res: Response) => {
    const plan = await DentalPlan.findById(req.params.id);

    if (plan) {
        await plan.deleteOne();
        res.json({ message: 'Dental Plan removed' });
    } else {
        res.status(404).json({ message: 'Dental Plan not found' });
    }
};

// @desc    Apply adjustment to a dental plan
// @route   POST /api/dental-plans/:id/apply-adjustment
// @access  Private
const applyAdjustment = async (req: Request, res: Response) => {
    try {
        const { percentage, applyRetroactive, retroactiveMonths } = req.body;
        const plan = await DentalPlan.findById(req.params.id);

        if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });

        // Save history before updating
        plan.lastAdjustment = {
            date: new Date(),
            percentage: percentage,
            previousPriceTable: [...plan.priceTable]
        };

        // Update priceTable
        const multiplier = 1 + (percentage / 100);
        plan.priceTable = plan.priceTable.map(range => ({
            ...range,
            price: Number((range.price * multiplier).toFixed(2))
        }));

        await plan.save();

        // Update Enrollments
        const enrollments = await Enrollment.find({ dentalPlan: plan._id, status: 'active' }).populate('collaborator');

        for (const enr of enrollments) {
            const oldPrice = Number(enr.monthlyCost);
            let birthDate: Date;
            const bType = enr.dependent ? 'Dependente' : 'Titular';

            if (enr.dependent) {
                const collab = enr.collaborator as any;
                const dep = collab.dependents.id(enr.dependent);
                birthDate = dep.birthDate;
            } else {
                birthDate = (enr.collaborator as any).personalData.birthDate;
            }

            const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
            const priceEntry = plan.priceTable.find(p =>
                age >= p.minAge &&
                age <= p.maxAge &&
                (p.beneficiaryType === 'Ambos' || p.beneficiaryType === bType)
            );

            const newPrice = priceEntry ? priceEntry.price : Number((oldPrice * multiplier).toFixed(2));

            // Calculate retroactive diff
            if (applyRetroactive && retroactiveMonths > 0) {
                const diff = (newPrice - oldPrice) * retroactiveMonths;
                enr.retroactiveDiff = Number((enr.retroactiveDiff + diff).toFixed(2));
            }

            enr.monthlyCost = newPrice;
            await enr.save();
        }

        res.json({ message: 'Reajuste aplicado com sucesso', plan });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate a transaction for a dental plan billing
// @route   POST /api/dental-plans/:id/generate-billing
// @access  Private
const generateBilling = async (req: Request, res: Response) => {
    try {
        const { year, month } = req.body;
        const plan = await DentalPlan.findById(req.params.id);

        if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });

        // Total cost of all active enrollments
        const enrollments = await Enrollment.find({ dentalPlan: plan._id, status: 'active' });

        const totalBaseCost = enrollments.reduce((sum, enr) => sum + enr.monthlyCost, 0);
        const totalRetroactive = enrollments.reduce((sum, enr) => sum + enr.retroactiveDiff, 0);
        const totalAmount = Number((totalBaseCost + totalRetroactive).toFixed(2));

        if (totalAmount === 0) {
            return res.status(400).json({ message: 'Nenhum valor a cobrar para este período.' });
        }

        // Check if already exists and is paid
        const existingPaid = await Transaction.findOne({
            dentalPlan: plan._id, // Need to add dentalPlan to Transaction model too? Or reuse healthPlan field/create generic plan field?
            // Transaction model might need update. Let's check Transaction.ts
            category: 'Saúde', // Or Odontológico?
            date: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            },
            status: 'paid'
        } as any);

        if (existingPaid) {
            return res.status(400).json({ message: 'Já existe uma fatura paga para este período. Não é permitido sobrescrever.' });
        }

        // Create or update pending transaction
        const description = `Fatura Odonto ${plan.operator} - ${plan.planName} (${month}/${year})`;
        const dueDate = new Date(year, month - 1, plan.billingDay || 1);

        // Transaction model update required to support dentalPlan field or we reuse healthPlan field (not ideal)
        // I will update Transaction model to include dentalPlan.

        const transaction = await Transaction.findOneAndUpdate(
            {
                dentalPlan: plan._id,
                category: 'Saúde', // Keeping same category for now, or maybe 'Benefícios'? 
                date: {
                    $gte: new Date(year, month - 1, 1),
                    $lt: new Date(year, month, 1)
                },
                status: 'pending'
            } as any,
            {
                user: (req as any).user._id,
                type: 'expense',
                amount: totalAmount,
                description,
                category: 'Saúde',
                date: new Date(year, month - 1, plan.billingDay || 1),
                dueDate,
                status: 'pending',
                dentalPlan: plan._id
            },
            { upsert: true, new: true }
        );

        // Clear retroactiveDiff
        for (const enr of enrollments) {
            if (enr.retroactiveDiff > 0) {
                enr.retroactiveDiff = 0;
                await enr.save();
            }
        }

        res.json({ message: 'Fatura gerada com sucesso', transaction });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Apply adjustment to all dental plans of an operator
// @route   POST /api/dental-plans/adjust-by-operator
// @access  Private
const adjustByOperator = async (req: Request, res: Response) => {
    try {
        const { operator, percentage, applyRetroactive, retroactiveMonths } = req.body;

        if (!operator) return res.status(400).json({ message: 'Operadora não informada.' });

        const plans = await DentalPlan.find({ operator: { $regex: new RegExp(`^${operator}$`, 'i') } });

        if (plans.length === 0) {
            return res.status(404).json({ message: `Nenhum plano encontrado para a operadora ${operator}.` });
        }

        const multiplier = 1 + (percentage / 100);
        const results = [];

        for (const plan of plans) {
            // Save history
            plan.lastAdjustment = {
                date: new Date(),
                percentage: percentage,
                previousPriceTable: [...plan.priceTable]
            };

            // Update priceTable
            plan.priceTable = plan.priceTable.map(range => ({
                ...range,
                price: Number((range.price * multiplier).toFixed(2))
            }));

            await plan.save();

            // Update Enrollments for this plan
            const enrollments = await Enrollment.find({ dentalPlan: plan._id, status: 'active' }).populate('collaborator');

            for (const enr of enrollments) {
                const oldPrice = Number(enr.monthlyCost);
                let birthDate: Date;
                const bType = enr.dependent ? 'Dependente' : 'Titular';

                if (enr.dependent) {
                    const collab = enr.collaborator as any;
                    const dep = collab.dependents.id(enr.dependent);
                    birthDate = dep.birthDate;
                } else {
                    birthDate = (enr.collaborator as any).personalData.birthDate;
                }

                const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
                const priceEntry = plan.priceTable.find(p =>
                    age >= p.minAge &&
                    age <= p.maxAge &&
                    (p.beneficiaryType === 'Ambos' || p.beneficiaryType === bType)
                );

                const newPrice = priceEntry ? priceEntry.price : Number((oldPrice * multiplier).toFixed(2));

                if (applyRetroactive && retroactiveMonths > 0) {
                    const diff = (newPrice - oldPrice) * retroactiveMonths;
                    enr.retroactiveDiff = Number((enr.retroactiveDiff + diff).toFixed(2));
                }

                enr.monthlyCost = newPrice;
                await enr.save();
            }
            results.push(plan._id);
        }

        res.json({ message: `Reajuste aplicado a ${results.length} planos da operadora ${operator}.`, updatedPlans: results });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export { getDentalPlans, createDentalPlan, updateDentalPlan, deleteDentalPlan, applyAdjustment, generateBilling, adjustByOperator };
