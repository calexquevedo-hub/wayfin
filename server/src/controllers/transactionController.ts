import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import FinancialAudit from '../models/FinancialAudit';
import BankAccount from '../models/BankAccount';

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req: any, res: Response) => {
    try {
        const { type, category, startDate, endDate } = req.query;

        let query: any = { user: req.user._id };

        if (type && type !== 'all') {
            query.type = type;
        }

        if (category && category !== 'all') {
            query.category = { $regex: category, $options: 'i' };
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate as string);
            }
        }

        const transactions = await Transaction.find(query).sort({ date: -1 }).populate('bankAccount', 'name color');
        res.json(transactions);
    } catch (error: any) {
        console.error('Error in getTransactions:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req: any, res: Response) => {
    const {
        type,
        amount,
        description,
        category,
        date,
        status,
        dueDate,
        isRecurring,
        recurrenceInterval,
        installments, // number of installments
        paymentMethod
    } = req.body;

    if (!type || !amount || !description || !category) {
        res.status(400).json({ message: 'Please fill in all required fields' });
        return;
    }

    // Handle Installments
    if (installments && installments > 1) {
        const transactions = [];
        const baseDate = date ? new Date(date) : new Date();
        const installmentAmount = amount / installments; // Simple division, might want to handle precision better in prod

        for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + i);

            transactions.push({
                user: req.user._id,
                type,
                amount: installmentAmount,
                description: `${description} (${i + 1}/${installments})`,
                category,
                date: installmentDate,
                status: i === 0 ? (status || 'pending') : 'pending', // Only first one might be paid immediately
                dueDate: installmentDate, // Assuming due date follows transaction date for installments
                isRecurring: false, // Installments are not recurring in the same sense
                installments: {
                    current: i + 1,
                    total: installments
                },
                paymentMethod
            });
        }

        const createdTransactions = await Transaction.insertMany(transactions);
        res.status(201).json(createdTransactions);
        return;
    }

    // Single or Recurring Transaction
    const transaction = await Transaction.create({
        user: req.user._id,
        type,
        amount,
        description,
        category,
        date: date || new Date(),
        status: status || 'pending',
        dueDate,
        isRecurring,
        recurrenceInterval,
        paymentMethod
    });

    res.status(201).json(transaction);

    // Audit Log
    try {
        await FinancialAudit.create({
            transactionId: transaction._id as any,
            userId: req.user._id,
            action: 'create',
            newData: transaction.toObject(),
            reason: 'Cadastro inicial'
        });
    } catch (e) {
        console.error('Failed to log audit for single transaction creation', e);
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req: any, res: Response) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
    }

    // Check on user
    if (transaction.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    const { reason, ...updateData } = req.body;

    if (!reason || reason.trim().length < 5) {
        res.status(400).json({ message: 'Um motivo válido (mínimo 5 caracteres) é obrigatório para editar a transação.' });
        return;
    }

    const previousData = transaction.toObject();

    // If status is being changed to 'paid' and bankAccount is provided, we should update balance? 
    // Actually, let's keep it simple for now as per plan, focused on Audit.
    // Handling "Baixa" might be a separate logic or specific update.

    const updatedTransaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    );

    if (updatedTransaction) {
        // Audit Log
        try {
            await FinancialAudit.create({
                transactionId: updatedTransaction._id as any,
                userId: req.user._id,
                action: updateData.status === 'paid' && previousData.status === 'pending' ? 'liquidate' : 'update',
                previousData,
                newData: updatedTransaction.toObject(),
                reason
            });
        } catch (e) {
            console.error('Failed to log audit for transaction update', e);
        }
    }

    res.status(200).json(updatedTransaction);
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req: any, res: Response) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
    }

    // Check on user
    if (transaction.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
        res.status(400).json({ message: 'Um motivo válido (mínimo 5 caracteres) é obrigatório para excluir a transação.' });
        return;
    }

    const previousData = transaction.toObject();
    await transaction.deleteOne();

    // Audit Log
    try {
        await FinancialAudit.create({
            transactionId: req.params.id as any,
            userId: req.user._id,
            action: 'delete',
            previousData,
            reason
        });
    } catch (e) {
        console.error('Failed to log audit for transaction deletion', e);
    }

    res.status(200).json({ id: req.params.id });
};

export { getTransactions, addTransaction, updateTransaction, deleteTransaction };
