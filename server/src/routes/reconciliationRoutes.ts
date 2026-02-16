import express from 'express';
import { uploadStatement, getSuggestedMatches, confirmReconciliation } from '../controllers/reconciliationController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer Config for temporary uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /ofx|csv/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas arquivos OFX ou CSV são permitidos.'));
    }
});

router.post('/upload', protect, upload.single('file'), uploadStatement);
router.post('/matches', protect, getSuggestedMatches);
router.post('/confirm', protect, confirmReconciliation);

export default router;
