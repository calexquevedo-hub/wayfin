import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

interface EditTransactionProps {
    transaction: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const EditTransactionDialog = ({ transaction, open, onOpenChange, onSuccess }: EditTransactionProps) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('pending');
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [bankAccount, setBankAccount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            setDescription(transaction.description);
            setAmount(transaction.amount.toString());
            setCategory(transaction.category);
            setStatus(transaction.status);
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setBankAccount(transaction.bankAccount?._id || '');
        }
    }, [transaction]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountsRes, categoriesRes] = await Promise.all([
                    api.get('/bank-accounts'),
                    api.get('/categories')
                ]);
                setBankAccounts(accountsRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim().length < 5) {
            toast.error('Informe um motivo válido para a alteração (mín. 5 caracteres).');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/transactions/${transaction._id}`, {
                description,
                amount: Number(amount),
                category,
                status,
                date,
                reason,
                bankAccount: bankAccount || undefined,
            });
            toast.success('Transação atualizada com sucesso!');
            onSuccess();
            onOpenChange(false);
            setReason('');
        } catch (error: any) {
            toast.error('Erro ao atualizar: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Transação</DialogTitle>
                    <DialogDescription>
                        Toda alteração em uma transação financeira deve ser justificada.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right font-bold text-xs uppercase">Descrição</Label>
                            <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3 rounded-xl" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-amount" className="text-right font-bold text-xs uppercase">Valor</Label>
                            <Input id="edit-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3 rounded-xl" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-category" className="text-right font-bold text-xs uppercase">Categoria</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="col-span-3 rounded-xl">
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories
                                        .filter(c => c.type === transaction?.type)
                                        .map((cat: any) => (
                                            <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-bankAccount" className="text-right font-bold text-xs uppercase">Conta</Label>
                            <Select value={bankAccount} onValueChange={setBankAccount}>
                                <SelectTrigger className="col-span-3 rounded-xl">
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts.map((account: any) => (
                                        <SelectItem key={account._id} value={account._id}>{account.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-date" className="text-right font-bold text-xs uppercase">Data</Label>
                            <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3 rounded-xl" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-status" className="text-right font-bold text-xs uppercase">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="col-span-3 rounded-xl">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">{transaction?.type === 'income' ? 'Recebido' : 'Pago'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-bold text-xs uppercase">Motivo</Label>
                            <Textarea
                                placeholder="Justificativa para a alteração..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="col-span-3 rounded-xl min-h-[80px]"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="rounded-xl font-bold">
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditTransactionDialog;
