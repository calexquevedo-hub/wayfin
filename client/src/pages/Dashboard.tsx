import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Clock,
    Activity,
    Calendar,
    ArrowRight,
    Plus,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog';

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    recentTransactions: any[];
    bankAccounts: any[];
    upcomingTransactions: any[];
    activityFeed: any[];
    performance: {
        predictedIncome: number;
        executedIncome: number;
        predictedExpense: number;
        executedExpense: number;
    };
}

const Dashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setLoading(true);
            const [summaryRes, analyticsRes, transRes] = await Promise.all([
                api.get('/dashboard/summary'),
                api.get('/dashboard/analytics'),
                api.get('/transactions'),
            ]);

            setData(summaryRes.data);

            // Format analytics for chart
            const formattedAnalytics = analyticsRes.data.map((item: any) => ({
                name: format(new Date(item._id.year, item._id.month - 1), 'MMM/yy', { locale: ptBR }),
                Receita: item.income,
                Despesa: item.expense,
                Saldo: item.income - item.expense
            }));
            setAnalytics(formattedAnalytics);

            // Process Category Data
            const transactions = transRes.data;
            const categories: any = {};
            transactions.forEach((t: any) => {
                if (t.type === 'expense') {
                    categories[t.category] = (categories[t.category] || 0) + t.amount;
                }
            });
            const pieData = Object.keys(categories).map(key => ({
                name: key,
                value: categories[key]
            })).sort((a, b) => b.value - a.value).slice(0, 6);
            setCategoryData(pieData);

            setLoading(false);
            if (isRefresh) toast.success('Painel atualizado com dados recentes.');
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const calculatePercent = (executed: number, predicted: number) => {
        if (!predicted) return 0;
        return Math.min(Math.round((executed / predicted) * 100), 100);
    };

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Carregando painel financeiro...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-primary">Dashboard</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Sistema Financeiro - {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold border-2 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={() => fetchData(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>

                    <AddTransactionDialog type="income" onSuccess={() => fetchData(true)}>
                        <Button className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25">
                            <Plus className="mr-1 h-4 w-4" /> Receita
                        </Button>
                    </AddTransactionDialog>

                    <AddTransactionDialog type="expense" onSuccess={() => fetchData(true)}>
                        <Button className="rounded-xl font-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25">
                            <Plus className="mr-1 h-4 w-4" /> Despesa
                        </Button>
                    </AddTransactionDialog>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left: Summary Cards Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                <DollarSign size={80} />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-wider opacity-80">Saldo Consolidado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black tabular-nums">{formatCurrency(data.balance)}</div>
                                <p className="text-[10px] mt-2 opacity-70 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Activity size={10} /> Liquidez Imediata
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white overflow-hidden relative group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Previsto x Realizado (Receitas)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-emerald-600 tabular-nums">{formatCurrency(data.performance.executedIncome)}</div>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-muted-foreground/60">
                                        <span>EXECUÇÃO</span>
                                        <span>{calculatePercent(data.performance.executedIncome, data.performance.predictedIncome)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${calculatePercent(data.performance.executedIncome, data.performance.predictedIncome)}%` }}></div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground text-right italic font-medium">Meta: {formatCurrency(data.performance.predictedIncome)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white overflow-hidden relative group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Previsto x Realizado (Despesas)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-rose-600 tabular-nums">{formatCurrency(data.performance.executedExpense)}</div>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-muted-foreground/60">
                                        <span>PAGO</span>
                                        <span>{calculatePercent(data.performance.executedExpense, data.performance.predictedExpense)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${calculatePercent(data.performance.executedExpense, data.performance.predictedExpense)}%` }}></div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground text-right italic font-medium">Total: {formatCurrency(data.performance.predictedExpense)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart Card */}
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm grow">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-4">
                            <div>
                                <CardTitle className="text-lg font-black uppercase text-primary">Fluxo de Caixa Mensal</CardTitle>
                                <CardDescription>Consolidado histórico de movimentações</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                            formatter={(value: any) => formatCurrency(value)}
                                        />
                                        <Area type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                        <Area type="monotone" dataKey="Despesa" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Bank Accounts Sidebar */}
                <Card className="lg:col-span-4 border-none shadow-xl bg-primary text-white overflow-hidden flex flex-col">
                    <CardHeader className="pb-4 border-b border-white/10">
                        <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                            <Wallet className="h-5 w-5" /> Liquidez por Conta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 grow overflow-y-auto max-h-[600px] custom-scrollbar">
                        <div className="divide-y divide-white/10">
                            {data.bankAccounts.map((acc) => (
                                <div key={acc._id} className="p-6 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm truncate max-w-[140px]">{acc.name}</span>
                                        <span className="text-sm font-black tabular-nums">{formatCurrency(acc.balance)}</span>
                                    </div>
                                    <div className="flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: acc.color }}></div>
                                            <span className="text-[10px] uppercase font-black tracking-widest">{acc.bankName || 'Instituição'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {data.bankAccounts.length === 0 && (
                                <div className="p-12 text-center opacity-50 italic text-sm">Nenhuma conta cadastrada.</div>
                            )}
                        </div>
                    </CardContent>
                    <div className="p-4 bg-white/5 border-t border-white/10">
                        <Button variant="ghost" className="w-full text-white font-black uppercase tracking-tighter hover:bg-white/10" asChild>
                            <a href="/bank-accounts">Acessar Todas as Contas <ArrowRight className="ml-2 h-4 w-4" /></a>
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Category Breakdown */}
                <Card className="border-none shadow-xl bg-white h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase text-primary">Concentração de Gastos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {categoryData.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="font-bold text-muted-foreground truncate max-w-[120px]">{cat.name}</span>
                                    </div>
                                    <span className="font-black text-primary">{formatCurrency(cat.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Bills */}
                <Card className="border-none shadow-xl bg-white flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Agenda Próximos 7 Dias
                        </CardTitle>
                        <Badge variant="secondary" className="font-black h-6">{data.upcomingTransactions.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 grow overflow-y-auto">
                        {data.upcomingTransactions.map((t) => (
                            <div key={t._id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-xl transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {t.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-black text-primary truncate max-w-[100px]">{t.description}</div>
                                        <div className="text-[9px] font-black text-muted-foreground/60 uppercase">{format(new Date(t.date), 'dd MMM', { locale: ptBR })}</div>
                                    </div>
                                </div>
                                <div className="text-[11px] font-black tabular-nums">{formatCurrency(t.amount)}</div>
                            </div>
                        ))}
                        {data.upcomingTransactions.length === 0 && (
                            <div className="py-20 text-center text-muted-foreground text-xs italic font-medium">Fluxo limpo para a semana.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="border-none shadow-xl bg-white flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Rastro de Auditoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grow overflow-y-auto max-h-[400px] px-6 custom-scrollbar">
                        <div className="space-y-0">
                            {data.activityFeed.map((activity, idx) => (
                                <div key={idx} className="relative pl-6 pb-6 last:pb-2 border-l border-primary/10">
                                    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-primary ring-4 ring-white"></div>
                                    <div className="text-[9px] font-black text-primary/30 uppercase mb-1">
                                        {format(new Date(activity.createdAt), "HH:mm ' - ' dd/MM")}
                                    </div>
                                    <div className="text-[11px] font-bold leading-tight">
                                        <span className="text-primary font-black uppercase text-[9px]">{activity.userId?.name || 'Sistema'}</span>
                                        {activity.action === 'liquidate' ? ' baixou ' : activity.action === 'delete' ? ' removeu ' : ' editou '}
                                        <span className="italic text-muted-foreground">"{activity.transactionId?.description || 'Lançamento'}"</span>
                                    </div>
                                    <div className="mt-1">
                                        <span className="text-[9px] font-black text-muted-foreground/50 border rounded px-1 uppercase">{activity.reason}</span>
                                    </div>
                                </div>
                            ))}
                            {data.activityFeed.length === 0 && (
                                <div className="py-20 text-center text-muted-foreground text-xs italic font-medium">Nenhum rastro recente.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
