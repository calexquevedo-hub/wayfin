import { Request, Response } from 'express';
import Contract from '../models/Contract';

export const getContracts = async (req: any, res: Response) => {
    try {
        const contracts = await Contract.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const addContract = async (req: any, res: Response) => {
    try {
        const { customerName, description, amount, startDate, endDate, recurrenceInterval, billingDay, status, fileUrl } = req.body;

        const contract = new Contract({
            user: req.user._id,
            customerName,
            description,
            amount,
            startDate,
            endDate,
            recurrenceInterval,
            billingDay,
            status,
            fileUrl,
        });

        const createdContract = await contract.save();
        res.status(201).json(createdContract);
    } catch (error) {
        res.status(400).json({ message: 'Invalid contract data', error });
    }
};

export const updateContract = async (req: any, res: Response) => {
    try {
        const { customerName, description, amount, startDate, endDate, recurrenceInterval, billingDay, status, fileUrl } = req.body;
        const contract = await Contract.findById(req.params.id);

        if (contract) {
            if (contract.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            contract.customerName = customerName || contract.customerName;
            contract.description = description || contract.description;
            contract.amount = amount || contract.amount;
            contract.startDate = startDate || contract.startDate;
            contract.endDate = endDate || contract.endDate;
            contract.recurrenceInterval = recurrenceInterval || contract.recurrenceInterval;
            contract.billingDay = billingDay || contract.billingDay;
            contract.status = status || contract.status;
            contract.fileUrl = fileUrl || contract.fileUrl;

            const updatedContract = await contract.save();
            res.json(updatedContract);
        } else {
            res.status(404).json({ message: 'Contract not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};

export const deleteContract = async (req: any, res: Response) => {
    try {
        const contract = await Contract.findById(req.params.id);

        if (contract) {
            if (contract.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            await contract.deleteOne();
            res.json({ message: 'Contract removed' });
        } else {
            res.status(404).json({ message: 'Contract not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
