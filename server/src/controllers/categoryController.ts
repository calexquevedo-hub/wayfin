import { Request, Response } from 'express';
import Category from '../models/Category';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req: any, res: Response) => {
    const { type } = req.query;
    let query: any = { user: req.user._id };

    if (type) {
        query.type = type;
    }

    const categories = await Category.find(query).sort({ name: 1 });
    res.json(categories);
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
const addCategory = async (req: any, res: Response) => {
    const { name, type, color } = req.body;

    if (!name || !type) {
        res.status(400).json({ message: 'Please provide name and type' });
        return;
    }

    try {
        const category = await Category.create({
            user: req.user._id,
            name,
            type,
            color,
        });
        res.status(201).json(category);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Category already exists' });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req: any, res: Response) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }

    if (category.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedCategory);
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req: any, res: Response) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }

    if (category.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    await category.deleteOne();
    res.status(200).json({ id: req.params.id });
};

export { getCategories, addCategory, updateCategory, deleteCategory };
