import { Request, Response } from 'express';
import Customer from '../models/Customer';

export const getCustomers = async (req: any, res: Response) => {
    try {
        const customers = await Customer.find({ user: req.user._id }).sort({ name: 1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const addCustomer = async (req: any, res: Response) => {
    try {
        const { name, email, phone, document, address, notes } = req.body;

        const customer = new Customer({
            user: req.user._id,
            name,
            email,
            phone,
            document,
            address,
            notes,
        });

        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(400).json({ message: 'Invalid customer data', error });
    }
};

export const updateCustomer = async (req: any, res: Response) => {
    try {
        const { name, email, phone, document, address, notes } = req.body;
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            if (customer.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            customer.name = name || customer.name;
            customer.email = email || customer.email;
            customer.phone = phone || customer.phone;
            customer.document = document || customer.document;
            customer.address = address || customer.address;
            customer.notes = notes || customer.notes;

            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};

export const deleteCustomer = async (req: any, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            if (customer.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
