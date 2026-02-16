import { Request, Response } from 'express';
import Collaborator from '../models/Collaborator';

// @desc    Get all collaborators
// @route   GET /api/collaborators
// @access  Private
const getCollaborators = async (req: Request, res: Response) => {
    try {
        const collaborators = await Collaborator.find({}).sort({ name: 1 });
        res.json(collaborators);
    } catch (error: any) {
        console.error('Error in getCollaborators:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a collaborator
// @route   POST /api/collaborators
// @access  Private
const createCollaborator = async (req: Request, res: Response) => {
    try {
        const cpf = req.body.documents?.cpf;
        if (cpf) {
            const collaboratorExists = await Collaborator.findOne({ 'documents.cpf': cpf });
            if (collaboratorExists) {
                return res.status(400).json({ message: 'Colaborador com este CPF já cadastrado' });
            }
        }

        const collaborator = await Collaborator.create(req.body);
        res.status(201).json(collaborator);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Dados inválidos' });
    }
};

// @desc    Update a collaborator
// @route   PUT /api/collaborators/:id
// @access  Private
const updateCollaborator = async (req: Request, res: Response) => {
    try {
        const collaborator = await Collaborator.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (collaborator) {
            res.json(collaborator);
        } else {
            res.status(404).json({ message: 'Colaborador não encontrado' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Falha ao atualizar colaborador' });
    }
};

// @desc    Delete a collaborator
// @route   DELETE /api/collaborators/:id
// @access  Private
const deleteCollaborator = async (req: Request, res: Response) => {
    const collaborator = await Collaborator.findById(req.params.id);

    if (collaborator) {
        await collaborator.deleteOne();
        res.json({ message: 'Collaborator removed' });
    } else {
        res.status(404).json({ message: 'Collaborator not found' });
    }
};

export { getCollaborators, createCollaborator, updateCollaborator, deleteCollaborator };
