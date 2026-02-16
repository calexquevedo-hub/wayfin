import { useEffect, useState } from 'react';
import api from '@/lib/api';
import TransactionList from '@/components/transactions/TransactionList';
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog';

const Receivables = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/transactions');
            setTransactions(data.filter((t: any) => t.type === 'income'));
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
                <AddTransactionDialog type="income" onSuccess={fetchTransactions} />
            </div>

            {loading ? (
                <div>Carregando...</div>
            ) : (
                <TransactionList transactions={transactions} onSuccess={fetchTransactions} />
            )}
        </div>
    );
};

export default Receivables;
