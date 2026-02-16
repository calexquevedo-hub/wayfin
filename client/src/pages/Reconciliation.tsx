import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    FileSearch,
    Upload,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowRight,
    RefreshCw,
    Banknote,
    History,
    FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Reconciliation = () => {
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState<'upload' | 'match'>('upload');
    const [entries, setEntries] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        fetchBankAccounts();
    }, []);

    const fetchBankAccounts = async () => {
        try {
            const { data } = await api.get('/bank-accounts');
            setBankAccounts(data);
            if (data.length > 0) setSelectedAccountId(data[0]._id);
        } catch (error) {
            console.error('Failed to fetch bank accounts', error);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedAccountId) {
            toast.error('Selecione uma conta e um arquivo OFX.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankAccountId', selectedAccountId);

        try {
            const { data } = await api.post('/reconciliation/upload', formData);
            setEntries(data.transactions);

            // Get suggested matches
            const matchRes = await api.post('/reconciliation/matches', {
                entries: data.transactions,
                bankAccountId: selectedAccountId
            });
            setMatches(matchRes.data);
            setStage('match');
            toast.success('Extrato processado com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao processar arquivo: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const confirmMatch = async (transactionId: string, entry: any) => {
        try {
            await api.post('/reconciliation/confirm', {
                transactionId,
                settlementDate: entry.date,
                reason: `Confirmação via conciliação do extrato: ${entry.description}`
            });

            // Update UI: remove match or mark as done
            setMatches(prev => prev.filter(m => m.entry.id !== entry.id));
            toast.success('Baixa realizada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao confirmar baixa: ' + (error.response?.data?.message || error.message));
        }
    };

    const resetReconciliation = () => {
        setStage('upload');
        setFile(null);
        setEntries([]);
        setMatches([]);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-2">
                    <RefreshCw className="h-8 w-8 text-blue-600" />
                    Conciliação Bancária
                </h1>
                <p className="text-muted-foreground font-medium">Concilie seu extrato bancário com as movimentações do sistema.</p>
            </div>

            {stage === 'upload' ? (
                <div className="max-w-2xl mx-auto py-10">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 py-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-xl font-black uppercase text-primary">Importar Extrato</CardTitle>
                            <CardDescription>Envie seu arquivo OFX para iniciar a conciliação</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleFileUpload} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Conta Bancária</Label>
                                    <select
                                        className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                    >
                                        {bankAccounts.map(acc => (
                                            <option key={acc._id} value={acc._id}>
                                                {acc.name} {acc.bankName ? `- ${acc.bankName}` : ''} (R$ {acc.balance.toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Arquivo OFX</Label>
                                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-8 text-center hover:border-primary/40 transition-colors bg-white/30">
                                        <input
                                            type="file"
                                            accept=".ofx"
                                            className="hidden"
                                            id="ofx-upload"
                                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                        <label htmlFor="ofx-upload" className="cursor-pointer block">
                                            {file ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                                                    <span className="font-bold text-primary">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground">Clique para trocar</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileSearch className="h-10 w-10 text-muted-foreground/30" />
                                                    <span className="font-bold text-muted-foreground">Arraste ou clique para selecionar</span>
                                                    <span className="text-xs text-muted-foreground/50">Apenas arquivos .ofx são aceitos</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !file}
                                    className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin" /> Processando...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <ArrowRight className="h-5 w-5" /> Iniciar Conciliação
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12 flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-xl">
                                <Banknote className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-black text-blue-700">
                                    {bankAccounts.find(a => a._id === selectedAccountId)?.name}
                                    {bankAccounts.find(a => a._id === selectedAccountId)?.bankName && ` (${bankAccounts.find(a => a._id === selectedAccountId)?.bankName})`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                                <History className="h-4 w-4 text-slate-600" />
                                <span className="text-sm font-black text-slate-700">{entries.length} Registros no Extrato</span>
                            </div>
                        </div>
                        <Button variant="outline" onClick={resetReconciliation} className="font-bold">Voltar / Novo Arquivo</Button>
                    </div>

                    <div className="lg:col-span-12">
                        <Card className="border-none shadow-xl shadow-primary/5 bg-white backdrop-blur-sm">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
                                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-primary/80">
                                    <CheckCircle2 className="h-4 w-4" /> Correspondências Encontradas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground">Movimentação no Extrato</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground text-center">Status</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground">Sugestão WayFin</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-primary/5">
                                            {matches.map((match, idx) => (
                                                <tr key={idx} className="hover:bg-primary/[0.01]">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-primary">{match.entry.description}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(match.entry.date), 'dd/MM/yyyy')}</span>
                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${match.entry.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    R$ {Math.abs(match.entry.amount).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {match.matches.length > 0 ? (
                                                            <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-green-200">
                                                                <CheckCircle2 className="h-3 w-3" /> {match.matches.length} Sugestão(ões)
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-yellow-200">
                                                                <AlertCircle className="h-3 w-3" /> Sem Correspondência
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {match.matches.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {match.matches.map((m: any) => (
                                                                    <div key={m._id} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center group">
                                                                        <div>
                                                                            <div className="text-xs font-black text-blue-900">{m.description}</div>
                                                                            <div className="text-[10px] font-bold text-blue-700 uppercase">{format(new Date(m.date), 'dd/MM/yyyy')} - {m.category}</div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-8 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() => confirmMatch(m._id, match.entry)}
                                                                        >
                                                                            Conciliar
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                                                                <Info className="h-4 w-4" />
                                                                Nenhuma transação pendente encontrada com este valor.
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {match.matches.length === 0 && (
                                                            <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => toast('Funcionalidade de criar transação rápida em breve!')}>
                                                                Criar Transação
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reconciliation;
