import { Request, Response } from 'express';
import HealthPlan from '../models/HealthPlan';
import Enrollment from '../models/Enrollment';
import Collaborator from '../models/Collaborator';
import Transaction from '../models/Transaction';

// @desc    Get all health plans
// @route   GET /api/health-plans
// @access  Private
const getHealthPlans = async (req: Request, res: Response) => {
    const plans = await HealthPlan.find({}).sort({ operator: 1, planName: 1 });
    res.json(plans);
};

// @desc    Create a health plan
// @route   POST /api/health-plans
// @access  Private
const createHealthPlan = async (req: Request, res: Response) => {
    const {
        operator,
        planName,
        planCode,
        type,
        coparticipation,
        hasObstetrics,
        hasAmbulatory,
        hasHospital,
        priceTable,
        adjustmentMonth,
        billingDay,
        sortOrder
    } = req.body;

    const plan = await HealthPlan.create({
        operator,
        planName,
        planCode,
        type,
        coparticipation,
        hasObstetrics,
        hasAmbulatory,
        hasHospital,
        priceTable,
        adjustmentMonth,
        billingDay,
        sortOrder
    });

    if (plan) {
        res.status(201).json(plan);
    } else {
        res.status(400).json({ message: 'Invalid plan data' });
    }
};

// @desc    Update a health plan
// @route   PUT /api/health-plans/:id
// @access  Private
const updateHealthPlan = async (req: Request, res: Response) => {
    const plan = await HealthPlan.findById(req.params.id);

    if (plan) {
        plan.operator = req.body.operator || plan.operator;
        plan.planName = req.body.planName || plan.planName;
        plan.planCode = req.body.planCode || plan.planCode;
        plan.type = req.body.type || plan.type;
        plan.coparticipation = req.body.coparticipation !== undefined ? req.body.coparticipation : plan.coparticipation;
        plan.hasObstetrics = req.body.hasObstetrics !== undefined ? req.body.hasObstetrics : plan.hasObstetrics;
        plan.hasAmbulatory = req.body.hasAmbulatory !== undefined ? req.body.hasAmbulatory : plan.hasAmbulatory;
        plan.hasHospital = req.body.hasHospital !== undefined ? req.body.hasHospital : plan.hasHospital;
        plan.sortOrder = req.body.sortOrder !== undefined ? req.body.sortOrder : plan.sortOrder;
        plan.priceTable = req.body.priceTable || plan.priceTable;
        plan.adjustmentMonth = req.body.adjustmentMonth || plan.adjustmentMonth;
        plan.billingDay = req.body.billingDay || plan.billingDay;
        plan.active = req.body.active !== undefined ? req.body.active : plan.active;

        const updatedPlan = await plan.save();
        res.json(updatedPlan);
    } else {
        res.status(404).json({ message: 'Health Plan not found' });
    }
};

// @desc    Delete a health plan
// @route   DELETE /api/health-plans/:id
// @access  Private
const deleteHealthPlan = async (req: Request, res: Response) => {
    const plan = await HealthPlan.findById(req.params.id);

    if (plan) {
        await plan.deleteOne();
        res.json({ message: 'Health Plan removed' });
    } else {
        res.status(404).json({ message: 'Health Plan not found' });
    }
};

// @desc    Apply adjustment to a health plan
// @route   POST /api/health-plans/:id/apply-adjustment
// @access  Private
const applyAdjustment = async (req: Request, res: Response) => {
    try {
        const { percentage, applyRetroactive, retroactiveMonths } = req.body;
        const plan = await HealthPlan.findById(req.params.id);

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
        const enrollments = await Enrollment.find({ healthPlan: plan._id, status: 'active' }).populate('collaborator');

        for (const enr of enrollments) {
            const oldPrice = Number(enr.monthlyCost);

            // Recalculate new price using updated table
            // We need age and type
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
                // Rule: Don't change if transaction already paid
                // We'll check for paid transactions for this plan in the retroactive period
                // For simplicity, we calculate the diff and store it in enrollment.
                // The actual protection happens when generating the payout.
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

// @desc    Generate a transaction for a health plan billing
// @route   POST /api/health-plans/:id/generate-billing
// @access  Private
const generateBilling = async (req: Request, res: Response) => {
    try {
        const { year, month } = req.body;
        const plan = await HealthPlan.findById(req.params.id);

        if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });

        // Total cost of all active enrollments
        const enrollments = await Enrollment.find({ healthPlan: plan._id, status: 'active' });

        const totalBaseCost = enrollments.reduce((sum, enr) => sum + enr.monthlyCost, 0);
        const totalRetroactive = enrollments.reduce((sum, enr) => sum + enr.retroactiveDiff, 0);
        const totalAmount = Number((totalBaseCost + totalRetroactive).toFixed(2));

        if (totalAmount === 0) {
            return res.status(400).json({ message: 'Nenhum valor a cobrar para este período.' });
        }

        // Check if already exists and is paid
        const existingPaid = await Transaction.findOne({
            healthPlan: plan._id,
            category: 'Saúde',
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
        const description = `Fatura ${plan.operator} - ${plan.planName} (${month}/${year})`;
        const dueDate = new Date(year, month - 1, plan.billingDay || 1);

        const transaction = await Transaction.findOneAndUpdate(
            {
                healthPlan: plan._id,
                category: 'Saúde',
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
                healthPlan: plan._id
            },
            { upsert: true, new: true }
        );

        // Clear retroactiveDiff after generating bill? 
        // Typically yes, if we are creating the bill now.
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

// @desc    Apply adjustment to all health plans of an operator
// @route   POST /api/health-plans/adjust-by-operator
// @access  Private
const adjustByOperator = async (req: Request, res: Response) => {
    try {
        const { operator, percentage, applyRetroactive, retroactiveMonths } = req.body;

        if (!operator) return res.status(400).json({ message: 'Operadora não informada.' });

        const plans = await HealthPlan.find({ operator: { $regex: new RegExp(`^${operator}$`, 'i') } });

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
            const enrollments = await Enrollment.find({ healthPlan: plan._id, status: 'active' }).populate('collaborator');

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

export { getHealthPlans, createHealthPlan, updateHealthPlan, deleteHealthPlan, applyAdjustment, generateBilling, adjustByOperator };
