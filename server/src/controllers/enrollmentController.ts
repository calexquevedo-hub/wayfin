import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment';
import Collaborator from '../models/Collaborator';
import HealthPlan from '../models/HealthPlan';
import DentalPlan from '../models/DentalPlan';
import Transaction from '../models/Transaction';
import FinancialAudit from '../models/FinancialAudit';

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private
export const getEnrollments = async (req: Request, res: Response) => {
    try {
        const { collaboratorId, financialResponsibleId, type, status, startDate, endDate } = req.query;

        let query: any = {};

        if (collaboratorId) {
            query.collaborator = collaboratorId;
        }

        if (financialResponsibleId) {
            query.financialResponsible = financialResponsibleId;
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.effectiveDate = {};
            if (startDate) {
                query.effectiveDate.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.effectiveDate.$lte = new Date(endDate as string);
            }
        }

        const enrollments = await Enrollment.find(query)
            .populate('collaborator')
            .populate('financialResponsible')
            .populate('healthPlan')
            .populate('dentalPlan')
            .sort({ createdAt: -1 });

        res.json(enrollments);
    } catch (error: any) {
        console.error('Error in getEnrollments:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an enrollment
// @route   POST /api/enrollments
// @access  Private
export const createEnrollment = async (req: Request, res: Response) => {
    try {
        const {
            collaboratorId,
            dependentId,
            healthPlanId,
            healthPlanCredential,
            dentalPlanId,
            dentalPlanCredential,
            financialResponsibleId,
            effectiveDate,
            type
        } = req.body;

        const enrollmentType = type || 'Health'; // Default to Health if not specified
        const collaborator = await Collaborator.findById(collaboratorId);

        if (!collaborator) {
            return res.status(404).json({ message: 'Colaborador não encontrado' });
        }

        let plan: any;
        let planModel: any;

        if (enrollmentType === 'Health') {
            plan = await HealthPlan.findById(healthPlanId);
            planModel = 'HealthPlan';
        } else {
            plan = await DentalPlan.findById(dentalPlanId);
            planModel = 'DentalPlan';
        }

        if (!plan) {
            return res.status(404).json({ message: 'Plano não encontrado' });
        }

        // Determine age and beneficiary type
        let birthDate: Date;
        let gender: string;
        const beneficiaryType = dependentId ? 'Dependente' : 'Titular';

        if (dependentId) {
            // Find dependent in the subdocument array
            const dependent = (collaborator.dependents as any).id(dependentId);
            if (!dependent) return res.status(404).json({ message: 'Dependente não encontrado' });
            birthDate = dependent.birthDate;
            gender = dependent.gender || 'Outro';
        } else {
            birthDate = collaborator.personalData.birthDate;
            gender = collaborator.personalData.gender || 'Outro';
        }

        // Rule: Woman needs plan with obstetrics (Only for Health Plans)
        if (enrollmentType === 'Health' && gender === 'Feminino' && !plan.hasObstetrics) {
            return res.status(400).json({
                message: 'Para beneficiários do gênero feminino, o plano de saúde deve obrigatoriamente possuir cobertura de Obstetrícia.'
            });
        }

        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();

        // Find price in table - refined lookup
        const priceEntry = plan.priceTable.find((p: any) =>
            age >= p.minAge &&
            age <= p.maxAge &&
            (p.beneficiaryType === 'Ambos' || p.beneficiaryType === beneficiaryType)
        );

        const monthlyCost = priceEntry ? priceEntry.price : 0;

        if (monthlyCost === 0) {
            return res.status(400).json({
                message: `Não foi encontrado valor na tabela para um ${beneficiaryType} de ${age} anos.`
            });
        }

        const enrollmentData: any = {
            collaborator: collaboratorId,
            dependent: dependentId || null,
            financialResponsible: financialResponsibleId || collaboratorId,
            effectiveDate: effectiveDate || new Date(),
            monthlyCost,
            type: enrollmentType
        };

        if (enrollmentType === 'Health') {
            enrollmentData.healthPlan = healthPlanId;
            enrollmentData.healthPlanCredential = healthPlanCredential;
        } else {
            enrollmentData.dentalPlan = dentalPlanId;
            enrollmentData.dentalPlanCredential = dentalPlanCredential;
        }

        const enrollment = await Enrollment.create(enrollmentData);

        res.status(201).json(enrollment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update an enrollment
// @route   PUT /api/enrollments/:id
// @access  Private
export const updateEnrollment = async (req: Request, res: Response) => {
    try {
        const {
            healthPlanId,
            healthPlanCredential,
            dentalPlanId,
            dentalPlanCredential,
            financialResponsibleId,
            effectiveDate,
            status
        } = req.body;
        const enrollment = await Enrollment.findById(req.params.id).populate('collaborator');

        if (!enrollment) {
            return res.status(404).json({ message: 'Adesão não encontrada' });
        }

        const collaborator = enrollment.collaborator as any;
        let plan: any;
        const enrollmentType = enrollment.type || 'Health'; // Default for existing records

        if (enrollmentType === 'Health') {
            const planId = healthPlanId || enrollment.healthPlan;
            plan = await HealthPlan.findById(planId);
        } else {
            const planId = dentalPlanId || enrollment.dentalPlan;
            plan = await DentalPlan.findById(planId);
        }

        if (!plan) {
            return res.status(404).json({ message: 'Plano não encontrado' });
        }

        // Determine age and beneficiary type
        let birthDate: Date;
        let gender: string;
        const beneficiaryType = enrollment.dependent ? 'Dependente' : 'Titular';

        if (enrollment.dependent) {
            const dependent = collaborator.dependents.id(enrollment.dependent);
            if (!dependent) return res.status(404).json({ message: 'Dependente não encontrado' });
            birthDate = dependent.birthDate;
            gender = dependent.gender || 'Outro';
        } else {
            birthDate = collaborator.personalData.birthDate;
            gender = collaborator.personalData.gender || 'Outro';
        }

        // Rule: Woman needs plan with obstetrics (Only Health)
        if (enrollmentType === 'Health' && gender === 'Feminino' && !plan.hasObstetrics) {
            return res.status(400).json({
                message: 'Para beneficiários do gênero feminino, o plano de saúde deve obrigatoriamente possuir cobertura de Obstetrícia.'
            });
        }

        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();

        // Find price in table
        const priceEntry = plan.priceTable.find((p: any) =>
            age >= p.minAge &&
            age <= p.maxAge &&
            (p.beneficiaryType === 'Ambos' || p.beneficiaryType === beneficiaryType)
        );

        const monthlyCost = priceEntry ? priceEntry.price : 0;

        if (monthlyCost === 0) {
            return res.status(400).json({
                message: `Não foi encontrado valor na tabela para um ${beneficiaryType} de ${age} anos.`
            });
        }

        if (enrollmentType === 'Health') {
            enrollment.healthPlan = plan._id;
            enrollment.healthPlanCredential = healthPlanCredential || enrollment.healthPlanCredential;
        } else {
            enrollment.dentalPlan = plan._id;
            enrollment.dentalPlanCredential = dentalPlanCredential || enrollment.dentalPlanCredential;
        }

        enrollment.effectiveDate = effectiveDate || enrollment.effectiveDate;
        enrollment.status = status || enrollment.status;
        enrollment.financialResponsible = financialResponsibleId || enrollment.financialResponsible;
        enrollment.monthlyCost = monthlyCost;

        const updatedEnrollment = await enrollment.save();
        res.json(updatedEnrollment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Request a plan change
// @route   POST /api/enrollments/:id/request-plan-change
// @access  Private
export const requestPlanChange = async (req: Request, res: Response) => {
    try {
        const { newPlanId, requestDate, effectiveDate } = req.body;

        const enrollment = await Enrollment.findById(req.params.id)
            .populate('collaborator')
            .populate('healthPlan')
            .populate('dentalPlan');

        if (!enrollment) {
            return res.status(404).json({ message: 'Adesão não encontrada' });
        }

        // Check if there's already a pending change
        if (enrollment.planChange && enrollment.planChange.status === 'pending') {
            return res.status(400).json({ message: 'Já existe uma mudança de plano pendente para esta adesão.' });
        }

        const collaborator = enrollment.collaborator as any;
        const enrollmentType = enrollment.type || 'Health';

        let newPlan: any;
        if (enrollmentType === 'Health') {
            newPlan = await HealthPlan.findById(newPlanId);
        } else {
            newPlan = await DentalPlan.findById(newPlanId);
        }

        if (!newPlan) {
            return res.status(404).json({ message: 'Novo plano não encontrado' });
        }

        // Determine age and beneficiary type
        let birthDate: Date;
        let gender: string;
        const beneficiaryType = enrollment.dependent ? 'Dependente' : 'Titular';

        if (enrollment.dependent) {
            const dependent = collaborator.dependents.id(enrollment.dependent);
            if (!dependent) return res.status(404).json({ message: 'Dependente não encontrado' });
            birthDate = dependent.birthDate;
            gender = dependent.gender || 'Outro';
        } else {
            birthDate = collaborator.personalData.birthDate;
            gender = collaborator.personalData.gender || 'Outro';
        }

        // Rule: Woman needs plan with obstetrics (Only Health)
        if (enrollmentType === 'Health' && gender === 'Feminino' && !newPlan.hasObstetrics) {
            return res.status(400).json({
                message: 'Para beneficiários do gênero feminino, o plano deve obrigatoriamente possuir cobertura de Obstetrícia.'
            });
        }

        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();

        // Find price in new plan's table
        const priceEntry = newPlan.priceTable.find((p: any) =>
            age >= p.minAge &&
            age <= p.maxAge &&
            (p.beneficiaryType === 'Ambos' || p.beneficiaryType === beneficiaryType)
        );

        const newCost = priceEntry ? priceEntry.price : 0;

        if (newCost === 0) {
            return res.status(400).json({
                message: `Não foi encontrado valor na tabela do novo plano para um ${beneficiaryType} de ${age} anos.`
            });
        }

        // Register the plan change request
        enrollment.planChange = {
            requestDate: requestDate ? new Date(requestDate) : new Date(),
            effectiveDate: new Date(effectiveDate),
            status: 'pending',
            previousPlan: (enrollmentType === 'Health' ? enrollment.healthPlan : enrollment.dentalPlan) as any,
            newPlan: newPlan._id as any,
            previousCost: enrollment.monthlyCost,
            newCost: newCost
        };

        const updatedEnrollment = await enrollment.save();

        res.json({
            message: 'Solicitação de mudança de plano registrada com sucesso.',
            enrollment: updatedEnrollment
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private
export const deleteEnrollment = async (req: Request, res: Response) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id);
        if (enrollment) {
            await enrollment.deleteOne();
            res.json({ message: 'Adesão excluída' });
        } else {
            res.status(404).json({ message: 'Adesão não encontrada' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Generate global billing entries
// @route   POST /api/enrollments/generate-billing
// @access  Private/Admin
export const generateGlobalBilling = async (req: Request, res: Response) => {
    try {
        const { year, month, dueDate: dueDateInput } = req.body;

        if (!year || !month || !dueDateInput) {
            return res.status(400).json({ message: 'Ano, mês e data de vencimento são obrigatórios.' });
        }

        const dueDate = new Date(dueDateInput);

        // Get all active enrollments
        const enrollments = await Enrollment.find({ status: 'active' });

        if (enrollments.length === 0) {
            return res.status(400).json({ message: 'Nenhuma adesão ativa encontrada para faturamento.' });
        }

        // Group by financial responsible
        const billingGroups: { [key: string]: { total: number, enrollments: any[] } } = {};

        enrollments.forEach(enr => {
            const respId = enr.financialResponsible.toString();
            if (!billingGroups[respId]) {
                billingGroups[respId] = { total: 0, enrollments: [] };
            }
            billingGroups[respId].total += (enr.monthlyCost + enr.retroactiveDiff);
            billingGroups[respId].enrollments.push(enr);
        });

        const createdTransactions = [];

        // For each group, create a transaction (Income)
        for (const respId of Object.keys(billingGroups)) {
            const group = billingGroups[respId];
            if (group.total <= 0) continue;

            const responsible = await Collaborator.findById(respId);
            const respName = responsible ? responsible.name : 'Responsável Desconhecido';

            const description = `Faturamento de Convênios - ${respName} (${month}/${year})`;

            // Check if already exists and is paid
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const existingPaid = await Transaction.findOne({
                type: 'income',
                description: { $regex: respName, $options: 'i' },
                date: { $gte: startDate, $lte: endDate },
                status: 'paid'
            } as any);

            if (existingPaid) {
                console.log(`Skipping ${respName} - already paid transaction exists for this period.`);
                continue;
            }

            const transaction = await Transaction.findOneAndUpdate(
                {
                    type: 'income',
                    description: { $regex: respName, $options: 'i' },
                    date: { $gte: startDate, $lte: endDate },
                    status: 'pending'
                } as any,
                {
                    user: (req as any).user._id,
                    type: 'income',
                    amount: Number(group.total.toFixed(2)),
                    description,
                    category: 'Saúde', // Using default category
                    date: startDate,
                    dueDate: dueDate,
                    status: 'pending'
                },
                { upsert: true, new: true }
            );

            createdTransactions.push(transaction);

            // Audit Log
            try {
                await FinancialAudit.create({
                    transactionId: transaction._id as any,
                    userId: (req as any).user._id,
                    action: 'create',
                    newData: transaction.toObject(),
                    reason: `Faturamento Global Automático (${month}/${year})`
                });
            } catch (e) {
                console.error('Failed to log audit for billing transaction', e);
            }

            // Zero out retroactiveDiff
            for (const enr of group.enrollments) {
                if (enr.retroactiveDiff > 0) {
                    enr.retroactiveDiff = 0;
                    await enr.save();
                }
            }
        }

        res.json({
            message: `Processamento concluído. ${createdTransactions.length} faturas geradas/atualizadas.`,
            transactions: createdTransactions
        });

    } catch (error: any) {
        console.error('Error in generateGlobalBilling:', error);
        res.status(500).json({ message: error.message });
    }
};
