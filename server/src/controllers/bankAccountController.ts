import { Request, Response } from 'express';
import BankAccount from '../models/BankAccount';
import Transaction from '../models/Transaction';

// @desc    Get all bank accounts
// @route   GET /api/bank-accounts
// @access  Private
const getBankAccounts = async (req: any, res: Response) => {
    const bankAccounts = await BankAccount.find({ user: req.user._id });
    res.json(bankAccounts);
};

// @desc    Create new bank account
// @route   POST /api/bank-accounts
// @access  Private
const addBankAccount = async (req: any, res: Response) => {
    const { name, type, balance, color, bankName, branch, accountNumber } = req.body;

    if (!name) {
        res.status(400).json({ message: 'Please add a name' });
        return;
    }

    const bankAccount = await BankAccount.create({
        user: req.user._id,
        name,
        bankName,
        branch,
        accountNumber,
        type,
        balance,
        color,
    });

    res.status(201).json(bankAccount);
};

// @desc    Update bank account
// @route   PUT /api/bank-accounts/:id
// @access  Private
const updateBankAccount = async (req: any, res: Response) => {
    const bankAccount = await BankAccount.findById(req.params.id);

    if (!bankAccount) {
        res.status(404).json({ message: 'Bank account not found' });
        return;
    }

    if (bankAccount.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    const updatedBankAccount = await BankAccount.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedBankAccount);
};

// @desc    Delete bank account
// @route   DELETE /api/bank-accounts/:id
// @access  Private
const deleteBankAccount = async (req: any, res: Response) => {
    const bankAccount = await BankAccount.findById(req.params.id);

    if (!bankAccount) {
        res.status(404).json({ message: 'Bank account not found' });
        return;
    }

    if (bankAccount.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    // Check if there are transactions linked to this account
    const transactions = await Transaction.findOne({ bankAccount: req.params.id });
    if (transactions) {
        res.status(400).json({ message: 'Cannot delete account with linked transactions' });
        return;
    }

    await bankAccount.deleteOne();

    res.status(200).json({ id: req.params.id });
};

export { getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount };
