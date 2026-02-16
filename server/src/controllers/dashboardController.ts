import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import BankAccount from '../models/BankAccount';
import FinancialAudit from '../models/FinancialAudit';
import mongoose from 'mongoose';

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const matchUser = { $match: { user: new mongoose.Types.ObjectId(userId) } };

        // Aggregation for totals
        const balanceData = await Transaction.aggregate([
            matchUser,
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
                        },
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
                        },
                    },
                },
            },
        ]);

        const { totalIncome, totalExpense } = balanceData[0] || {
            totalIncome: 0,
            totalExpense: 0,
        };

        const balance = totalIncome - totalExpense;

        // Recent transactions
        const recentTransactions = await Transaction.find({ user: userId } as any)
            .sort({ date: -1 })
            .limit(5);

        // Bank balances
        const bankAccounts = await BankAccount.find({ user: userId } as any);

        // Upcoming transactions (Today + 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcomingTransactions = await Transaction.find({
            user: userId,
            status: 'pending',
            date: { $gte: today, $lte: nextWeek }
        } as any).sort({ date: 1 });

        // Audit Activity Feed
        const activityFeed = await FinancialAudit.find({ userId } as any)
            .populate('userId', 'name')
            .populate('transactionId', 'description amount type')
            .sort({ createdAt: -1 })
            .limit(10);

        // Current Month Predicted vs Realized
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        const monthComparison = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    predictedIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
                    executedIncome: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'income'] }, { $eq: ['$status', 'paid'] }] }, '$amount', 0] } },
                    predictedExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
                    executedExpense: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'expense'] }, { $eq: ['$status', 'paid'] }] }, '$amount', 0] } },
                }
            }
        ]);

        const performance = monthComparison[0] || {
            predictedIncome: 0,
            executedIncome: 0,
            predictedExpense: 0,
            executedExpense: 0
        };

        res.json({
            totalIncome,
            totalExpense,
            balance,
            recentTransactions,
            bankAccounts,
            upcomingTransactions,
            activityFeed,
            performance
        });
    } catch (error: any) {
        console.error('Error in getDashboardSummary:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get analytics data (monthly)
// @route   GET /api/dashboard/analytics
// @access  Private
const getAnalytics = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        // Group by month
        const monthlyData = await Transaction.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' },
                    },
                    income: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
                        },
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
                        },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        res.json(monthlyData);
    } catch (error: any) {
        console.error('Error in getAnalytics:', error);
        res.status(500).json({ message: error.message });
    }
};

export { getDashboardSummary, getAnalytics };
