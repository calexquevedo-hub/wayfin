import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import StatementImport from '../models/StatementImport';
import BankAccount from '../models/BankAccount';
import FinancialAudit from '../models/FinancialAudit';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';

// @desc    Upload and parse OFX statement
// @route   POST /api/reconciliation/upload
// @access  Private
export const uploadStatement = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const { bankAccountId } = req.body;
        if (!bankAccountId) {
            return res.status(400).json({ message: 'Conta bancária não informada.' });
        }

        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const data = parseOfx(fileContent);

        // Standard OFX structure: OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN
        const transactions = data.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
        const parsedTransactions = Array.isArray(transactions) ? transactions : [transactions];

        const importRecord = await StatementImport.create({
            user: req.user._id,
            bankAccount: bankAccountId,
            filename: req.file.originalname,
            fileType: 'OFX',
            transactionCount: parsedTransactions.length,
            status: 'completed'
        });

        // Map OFX transactions to a consistent format for the frontend
        const mappedData = parsedTransactions.map((tr: any) => ({
            id: tr.FITID,
            date: parseOFXDate(tr.DTPOSTED),
            amount: parseFloat(tr.TRNAMT),
            description: tr.MEMO || tr.NAME,
            type: parseFloat(tr.TRNAMT) > 0 ? 'income' : 'expense'
        }));

        res.json({
            importId: importRecord._id,
            transactions: mappedData
        });

    } catch (error: any) {
        console.error('Error uploading statement:', error);
        res.status(500).json({ message: 'Erro ao processar arquivo OFX: ' + error.message });
    }
};

function parseOfx(ofxContent: string) {
    const ofxStart = ofxContent.indexOf('<OFX>');
    if (ofxStart < 0) {
        throw new Error('Arquivo OFX inválido: tag <OFX> não encontrada.');
    }

    // OFX 1.x commonly omits closing tags. Convert SGML-like blocks to XML.
    const rawBody = ofxContent.slice(ofxStart).replace(/\r/g, '');
    const normalized = rawBody
        .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
        .replace(/<([A-Z0-9_.-]+)>([^<\n\r]+)/g, (_match, tag, value) => {
            return `<${tag}>${value.trim()}</${tag}>`;
        });

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        trimValues: true,
        parseTagValue: false,
    });

    return parser.parse(normalized);
}

// Helper to parse OFX date YYYYMMDDHHMMSS[-5:EST]
function parseOFXDate(ofxDate: string) {
    const year = parseInt(ofxDate.substring(0, 4));
    const month = parseInt(ofxDate.substring(4, 6)) - 1;
    const day = parseInt(ofxDate.substring(6, 8));
    return new Date(year, month, day);
}

// @desc    Get suggested matches for statement entries
// @route   POST /api/reconciliation/matches
// @access  Private
export const getSuggestedMatches = async (req: any, res: Response) => {
    try {
        const { entries, bankAccountId } = req.body;

        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ message: 'Entradas inválidas.' });
        }

        const results = [];

        for (const entry of entries) {
            const entryDate = new Date(entry.date);
            const entryAmount = Math.abs(entry.amount);
            const entryType = entry.amount > 0 ? 'income' : 'expense';

            // Find matching pending transactions
            // Window: +/- 3 days, exact amount, same type, same bankAccount
            const startDate = new Date(entryDate);
            startDate.setDate(entryDate.getDate() - 3);
            const endDate = new Date(entryDate);
            endDate.setDate(entryDate.getDate() + 3);

            const potentialMatches = await Transaction.find({
                user: req.user._id,
                bankAccount: bankAccountId,
                type: entryType,
                amount: entryAmount,
                status: 'pending',
                date: { $gte: startDate, $lte: endDate }
            });

            results.push({
                entry,
                matches: potentialMatches
            });
        }

        res.json(results);
    } catch (error: any) {
        console.error('Error getting suggested matches:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Confirm reconciliation (Baixa por conciliação)
// @route   POST /api/reconciliation/confirm
// @access  Private
export const confirmReconciliation = async (req: any, res: Response) => {
    try {
        const { transactionId, settlementDate, reason } = req.body;

        if (!transactionId || !settlementDate || !reason) {
            return res.status(400).json({ message: 'Dados incompletos.' });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transação não encontrada.' });
        }

        const previousData = transaction.toObject();

        transaction.status = 'paid';
        transaction.settlementDate = new Date(settlementDate);
        transaction.reconciled = true;
        await transaction.save();

        // Audit Log
        await FinancialAudit.create({
            transactionId: transaction._id as any,
            userId: req.user._id,
            action: 'liquidate',
            previousData,
            newData: transaction.toObject(),
            reason: `Conciliação Bancária: ${reason}`
        });

        // Update Bank Balance
        const bankAccount = await BankAccount.findById(transaction.bankAccount);
        if (bankAccount) {
            if (transaction.type === 'income') {
                bankAccount.balance += transaction.amount;
            } else {
                bankAccount.balance -= transaction.amount;
            }
            await bankAccount.save();
        }

        res.json({ message: 'Conciliação confirmada com sucesso.', transaction });

    } catch (error: any) {
        console.error('Error confirming reconciliation:', error);
        res.status(500).json({ message: error.message });
    }
};
