import { useEffect, useState } from 'react';
import api from '@/lib/api';
import TransactionList from '@/components/transactions/TransactionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const Reports = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [type, setType] = useState('all');
    const [category, setCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (type !== 'all') params.type = type;
            if (category) params.category = category;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const { data } = await api.get('/transactions', { params });
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions();
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-5 items-end">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="income">Receitas</SelectItem>
                                    <SelectItem value="expense">Despesas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Input
                                placeholder="Ex: Alimentação"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Inicial</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Final</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            <Search className="mr-2 h-4 w-4" />
                            Filtrar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Resultados ({transactions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div>Carregando...</div>
                    ) : (
                        <TransactionList transactions={transactions} onSuccess={fetchTransactions} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Reports;
