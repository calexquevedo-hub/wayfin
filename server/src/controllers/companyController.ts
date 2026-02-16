import { Request, Response } from 'express';
import Company from '../models/Company';

// @desc    Get company data (singleton-style)
// @route   GET /api/company
// @access  Private
const getCompany = async (req: Request, res: Response) => {
    try {
        let company = await Company.findOne({});
        if (!company) {
            // Return empty or default if none exists yet
            return res.json({});
        }
        res.json(company);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update or create company data
// @route   PUT /api/company
// @access  Private
const updateCompany = async (req: Request, res: Response) => {
    try {
        let company = await Company.findOne({});

        if (company) {
            // Update existing
            Object.assign(company, req.body);
            const updatedCompany = await company.save();
            res.json(updatedCompany);
        } else {
            // Create first one
            const newCompany = await Company.create(req.body);
            res.status(201).json(newCompany);
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export { getCompany, updateCompany };
