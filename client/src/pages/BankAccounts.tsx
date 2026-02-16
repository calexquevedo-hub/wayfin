import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Wallet, CreditCard, Landmark, DollarSign, Trash } from 'lucide-react';

interface BankAccount {
    _id: string;
    name: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    type: 'Checking' | 'Savings' | 'Investment' | 'Cash' | 'Credit Card' | 'Other';
    balance: number;
    color: string;
}

const BankAccounts = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState('');
    const [branch, setBranch] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [type, setType] = useState('Checking');
    const [balance, setBalance] = useState('');
    const [color, setColor] = useState('#000000');
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/bank-accounts');
            setAccounts(res.data);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    if (loading) {
        return <div>Carregando...</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/bank-accounts', {
                name,
                bankName,
                branch,
                accountNumber,
                type,
                balance: Number(balance),
                color,
            });
            setOpen(false);
            fetchAccounts();
            // Reset form
            setName('');
            setBankName('');
            setBranch('');
            setAccountNumber('');
            setType('Checking');
            setBalance('');
            setColor('#000000');
        } catch (error) {
            console.error('Failed to create account', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
        try {
            await api.delete(`/bank-accounts/${id}`);
            fetchAccounts();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Falha ao excluir conta');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Checking': return <Landmark className="h-6 w-6" />;
            case 'Savings': return <Wallet className="h-6 w-6" />;
            case 'Investment': return <DollarSign className="h-6 w-6" />;
            case 'Credit Card': return <CreditCard className="h-6 w-6" />;
            default: return <Wallet className="h-6 w-6" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {!isEmbedded && (
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Contas Bancárias</h2>
                        <p className="text-muted-foreground">
                            Gerencie suas contas e saldos.
                        </p>
                    </div>
                )}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nova Conta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Conta</DialogTitle>
                            <DialogDescription>
                                Crie uma nova conta para gerenciar seus fundos.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Nome
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Ex: Conta Principal"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bankName" className="text-right">
                                        Banco
                                    </Label>
                                    <Input
                                        id="bankName"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Ex: Itaú, Nubank..."
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="branch" className="text-right">
                                        Agência
                                    </Label>
                                    <Input
                                        id="branch"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        className="col-span-3"
                                        placeholder="0001"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="accountNumber" className="text-right">
                                        Conta
                                    </Label>
                                    <Input
                                        id="accountNumber"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="col-span-3"
                                        placeholder="12345-6"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        Tipo
                                    </Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Checking">Conta Corrente</SelectItem>
                                            <SelectItem value="Savings">Poupança</SelectItem>
                                            <SelectItem value="Investment">Investimento</SelectItem>
                                            <SelectItem value="Cash">Dinheiro</SelectItem>
                                            <SelectItem value="Credit Card">Cartão de Crédito</SelectItem>
                                            <SelectItem value="Other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="balance" className="text-right">
                                        Saldo Inicial
                                    </Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        step="0.01"
                                        value={balance}
                                        onChange={(e) => setBalance(e.target.value)}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="color" className="text-right">
                                        Cor
                                    </Label>
                                    <div className="col-span-3 flex items-center gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-12 h-10 p-1"
                                        />
                                        <span className="text-sm text-muted-foreground">Escolha uma cor para identificar a conta</span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Salvar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <Card key={account._id} style={{ borderLeft: `4px solid ${account.color}` }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {account.name}
                            </CardTitle>
                            {getIcon(account.type)}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(account.balance)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {account.type === 'Checking' ? 'Conta Corrente' :
                                    account.type === 'Savings' ? 'Poupança' :
                                        account.type === 'Investment' ? 'Investimento' :
                                            account.type === 'Cash' ? 'Dinheiro' :
                                                account.type === 'Credit Card' ? 'Cartão de Crédito' : 'Outro'}
                                {account.bankName && ` • ${account.bankName}`}
                            </p>
                            {(account.branch || account.accountNumber) && (
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase">
                                    {account.branch && `Ag: ${account.branch}`} {account.accountNumber && `Cc: ${account.accountNumber}`}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => handleDelete(account._id)}>
                                <Trash className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BankAccounts;
