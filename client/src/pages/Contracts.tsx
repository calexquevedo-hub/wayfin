import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash, FileText, Calendar } from 'lucide-react';

interface Contract {
    _id: string;
    customerName: string;
    description: string;
    amount: number;
    startDate: string;
    endDate?: string;
    recurrenceInterval: 'monthly' | 'yearly';
    billingDay: number;
    status: 'active' | 'inactive' | 'canceled';
}

const Contracts = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [recurrenceInterval, setRecurrenceInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [billingDay, setBillingDay] = useState('1');
    const [status, setStatus] = useState<'active' | 'inactive' | 'canceled'>('active');

    const fetchContracts = async () => {
        try {
            const res = await api.get('/contracts');
            setContracts(res.data);
        } catch (error) {
            console.error('Failed to fetch contracts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/contracts', {
                customerName,
                description,
                amount: Number(amount),
                startDate,
                endDate: endDate || undefined,
                recurrenceInterval,
                billingDay: Number(billingDay),
                status,
            });
            setOpen(false);
            fetchContracts();
            // Reset form
            setCustomerName('');
            setDescription('');
            setAmount('');
            setStartDate('');
            setEndDate('');
            setRecurrenceInterval('monthly');
            setBillingDay('1');
            setStatus('active');
        } catch (error: any) {
            console.error('Failed to create contract', error);
            alert(error.response?.data?.message || 'Falha ao criar contrato');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
        try {
            await api.delete(`/contracts/${id}`);
            fetchContracts();
        } catch (error: any) {
            console.error('Failed to delete contract', error);
            alert(error.response?.data?.message || 'Falha ao excluir contrato');
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Contratos</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus contratos recorrentes de serviço e receita.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Contrato
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Novo Contrato</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="customerName" className="text-right">Cliente</Label>
                                    <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Descrição</Label>
                                    <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="amount" className="text-right">Valor</Label>
                                    <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="startDate" className="text-right">Início</Label>
                                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="endDate" className="text-right">Fim (Op)</Label>
                                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="recurrence" className="text-right">Recorrência</Label>
                                    <Select value={recurrenceInterval} onValueChange={(v: any) => setRecurrenceInterval(v)}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="billingDay" className="text-right">Dia Venc.</Label>
                                    <Input id="billingDay" type="number" min="1" max="31" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">Status</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                            <SelectItem value="canceled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Salvar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contracts.map((contract) => (
                    <Card key={contract._id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {contract.customerName}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.amount)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {contract.description}
                            </p>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Dia {contract.billingDay} ({contract.recurrenceInterval === 'monthly' ? 'Mensal' : 'Anual'})</span>
                                </div>
                                <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${contract.status === 'active' ? 'border-transparent bg-green-500/10 text-green-500' :
                                    contract.status === 'inactive' ? 'border-transparent bg-yellow-500/10 text-yellow-500' :
                                        'border-transparent bg-red-500/10 text-red-500'
                                    }`}>
                                    {contract.status === 'active' ? 'Ativo' : contract.status === 'inactive' ? 'Inativo' : 'Cancelado'}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="mt-4 w-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(contract._id)}>
                                <Trash className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {contracts.length === 0 && (
                <div className="text-center text-muted-foreground mt-12">
                    Nenhum contrato cadastrado.
                </div>
            )}
        </div>
    );
};

export default Contracts;
