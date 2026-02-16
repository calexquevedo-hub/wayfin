import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash, RotateCw, CreditCard, CheckCircle2, Pencil } from 'lucide-react';
import AuditModal from './AuditModal';
import EditTransactionDialog from './EditTransactionDialog';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
    _id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: string;
    status: 'pending' | 'paid';
    isRecurring?: boolean;
    recurrenceInterval?: string;
    installments?: {
        current: number;
        total: number;
    };
    paymentMethod?: string;
    bankAccount?: {
        _id: string;
        name: string;
        color: string;
    };
}

interface TransactionListProps {
    transactions: Transaction[];
    onSuccess: () => void;
}

const TransactionList = ({ transactions, onSuccess }: TransactionListProps) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [auditMode, setAuditMode] = useState<'liquidate' | 'delete' | 'edit' | null>(null);

    const handleAction = async (reason: string) => {
        if (!selectedTransaction || !auditMode) return;

        try {
            if (auditMode === 'liquidate') {
                await api.put(`/transactions/${selectedTransaction._id}`, {
                    status: 'paid',
                    settlementDate: new Date(),
                    reason
                });
                toast.success('Baixa realizada com sucesso!');
            } else if (auditMode === 'delete') {
                await api.delete(`/transactions/${selectedTransaction._id}`, {
                    data: { reason }
                });
                toast.success('Lançamento excluído com sucesso!');
            }
            onSuccess();
        } catch (error: any) {
            toast.error('Erro ao processar ação: ' + (error.response?.data?.message || error.message));
        } finally {
            setAuditMode(null);
            setSelectedTransaction(null);
        }
    };
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{transaction.description}</span>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        {transaction.isRecurring && (
                                            <span className="flex items-center gap-0.5 text-blue-500" title={`Recorrente: ${transaction.recurrenceInterval}`}>
                                                <RotateCw className="h-3 w-3" />
                                                {transaction.recurrenceInterval === 'monthly' ? 'Mensal' :
                                                    transaction.recurrenceInterval === 'weekly' ? 'Semanal' : 'Anual'}
                                            </span>
                                        )}
                                        {transaction.installments && transaction.installments.total > 0 && (
                                            <span className="flex items-center gap-0.5 text-orange-500">
                                                <CreditCard className="h-3 w-3" />
                                                {transaction.installments.current}/{transaction.installments.total}
                                            </span>
                                        )}
                                        {transaction.paymentMethod && (
                                            <span className="capitalize border px-1 rounded bg-muted/50">
                                                {transaction.paymentMethod.replace('_', ' ')}
                                            </span>
                                        )}
                                        {transaction.bankAccount && (
                                            <span
                                                className="border px-1 rounded text-[10px] text-white"
                                                style={{ backgroundColor: transaction.bankAccount.color }}
                                            >
                                                {transaction.bankAccount.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell>
                                <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                                    {transaction.status === 'paid' ? 'Pago/Recebido' : 'Pendente'}
                                </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    {transaction.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => {
                                                setSelectedTransaction(transaction);
                                                setAuditMode('liquidate');
                                            }}
                                            title="Baixar Título"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => {
                                            setSelectedTransaction(transaction);
                                            setAuditMode('edit');
                                        }}
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                        onClick={() => {
                                            setSelectedTransaction(transaction);
                                            setAuditMode('delete');
                                        }}
                                        title="Excluir"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {transactions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Nenhuma transação encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <AuditModal
                open={auditMode === 'liquidate'}
                onOpenChange={(open) => !open && setAuditMode(null)}
                title="Confirmar Baixa"
                description={`Você está confirmando o ${selectedTransaction?.type === 'income' ? 'recebimento' : 'pagamento'} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTransaction?.amount || 0)}.`}
                confirmLabel="Confirmar Baixa"
                onConfirm={handleAction}
            />

            <AuditModal
                open={auditMode === 'delete'}
                onOpenChange={(open) => !open && setAuditMode(null)}
                title="Excluir Lançamento"
                description="Esta ação é irreversível e removerá o registro da base de dados ativa."
                confirmLabel="Excluir Permanentemente"
                onConfirm={handleAction}
                destructive
            />

            <EditTransactionDialog
                open={auditMode === 'edit'}
                onOpenChange={(open) => !open && setAuditMode(null)}
                transaction={selectedTransaction}
                onSuccess={onSuccess}
            />
        </div>
    );
};

export default TransactionList;
