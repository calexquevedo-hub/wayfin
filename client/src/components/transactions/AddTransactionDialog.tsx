import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';

interface AddTransactionProps {
    type: 'income' | 'expense';
    onSuccess: () => void;
    children?: React.ReactNode;
}

const AddTransactionDialog = ({ type, onSuccess, children }: AddTransactionProps) => {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('pending');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // New Fields
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState('monthly');
    const [isInstallment, setIsInstallment] = useState(false);
    const [installments, setInstallments] = useState('1');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

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
        try {
            await api.post('/transactions', {
                type,
                description,
                amount: Number(amount),
                category,
                status,
                date,
                isRecurring,
                recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
                installments: isInstallment ? Number(installments) : undefined,
                paymentMethod: paymentMethod || undefined,
                bankAccount: bankAccount || undefined,
            });
            setOpen(false);
            onSuccess();
            // Reset form
            setDescription('');
            setAmount('');
            setCategory('');
            setStatus('pending');
            setIsRecurring(false);
            setIsInstallment(false);
            setInstallments('1');
            setPaymentMethod('');
            setBankAccount('');
        } catch (error) {
            console.error('Failed to create transaction', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button>Adicionar {type === 'income' ? 'Receita' : 'Despesa'}</Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nova {type === 'income' ? 'Receita' : 'Despesa'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes da transação aqui. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Descrição
                            </Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Valor Total
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Categoria
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories
                                        .filter(c => c.type === type)
                                        .map(category => (
                                            <SelectItem key={category._id} value={category.name}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                                                    {category.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Data
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Status
                            </Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">{type === 'income' ? 'Recebido' : 'Pago'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentMethod" className="text-right">
                                Método
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o método" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="transfer">Transferência</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bankAccount" className="text-right">
                                Conta
                            </Label>
                            <Select value={bankAccount} onValueChange={setBankAccount}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts.map((account) => (
                                        <SelectItem key={account._id} value={account._id}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="options" className="text-right">Opções</Label>
                            <div className="col-span-3 flex flex-col gap-3">
                                <div className="flex items-center space-x-2">
                                    <Switch id="recurring" checked={isRecurring} onCheckedChange={(c) => { setIsRecurring(c); if (c) setIsInstallment(false); }} />
                                    <Label htmlFor="recurring">Recorrente</Label>
                                </div>
                                {isRecurring && (
                                    <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Intervalo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Switch id="installment" checked={isInstallment} onCheckedChange={(c) => { setIsInstallment(c); if (c) setIsRecurring(false); }} />
                                    <Label htmlFor="installment">Parcelado</Label>
                                </div>
                                {isInstallment && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="2"
                                            max="120"
                                            value={installments}
                                            onChange={(e) => setInstallments(e.target.value)}
                                            placeholder="Nº Parcelas"
                                        />
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">x parcelas</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddTransactionDialog;
