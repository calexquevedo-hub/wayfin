import express from 'express';
import { getCompany, updateCompany } from '../controllers/companyController';
// Assuming protect middleware exists if needed, but following current authRoutes pattern
// In this project, routes are defined and imported in index.ts

const router = express.Router();

router.route('/')
    .get(getCompany)
    .put(updateCompany);

export default router;
