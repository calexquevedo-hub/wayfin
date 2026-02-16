import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartPulse, Plus, Trash, X, Copy, CircleAlert, CircleCheck } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

const HealthPlans = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Form State
    const [operator, setOperator] = useState('');
    const [planName, setPlanName] = useState('');
    const [planCode, setPlanCode] = useState('');
    const [type, setType] = useState('Enfermaria');
    const [coparticipation, setCoparticipation] = useState(false);
    const [hasObstetrics, setHasObstetrics] = useState(false);
    const [hasAmbulatory, setHasAmbulatory] = useState(false);
    const [hasHospital, setHasHospital] = useState(false);
    const [adjustmentMonth, setAdjustmentMonth] = useState(1);
    const [billingDay, setBillingDay] = useState(1);
    const [sortOrder, setSortOrder] = useState(0);
    const [priceTable, setPriceTable] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; title: string; message: string; detail?: string }>({
        type: null,
        title: '',
        message: '',
        detail: ''
    });

    // Adjustment Modal State
    const [adjustmentModal, setAdjustmentModal] = useState<{ open: boolean; plan: any }>({ open: false, plan: null });
    const [adjPercent, setAdjPercent] = useState(0);
    const [adjRetroactive, setAdjRetroactive] = useState(false);
    const [adjMonths, setAdjMonths] = useState(1);
    const [adjLoading, setAdjLoading] = useState(false);

    // Operator Adjustment Modal State
    const [operatorAdjustmentModal, setOperatorAdjustmentModal] = useState({ open: false, operator: '' });
    const [opAdjPercent, setOpAdjPercent] = useState(0);
    const [opAdjRetroactive, setOpAdjRetroactive] = useState(false);
    const [opAdjMonths, setOpAdjMonths] = useState(1);
    const [opAdjLoading, setOpAdjLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await api.get('/health-plans');
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch health plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrice = () => {
        setPriceTable([...priceTable, { minAge: 0, maxAge: 18, price: 0, beneficiaryType: 'Ambos' }]);
    };

    const handleRemovePrice = (index: number) => {
        setPriceTable(priceTable.filter((_, i) => i !== index));
    };

    const handlePriceChange = (index: number, field: string, value: any) => {
        const newTable = [...priceTable];
        newTable[index][field] = (field === 'minAge' || field === 'maxAge' || field === 'price') ? Number(value) : value;
        setPriceTable(newTable);
    };

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setOperator(plan.operator);
        setPlanName(plan.planName);
        setPlanCode(plan.planCode || '');
        setType(plan.type);
        setCoparticipation(plan.coparticipation || false);
        setHasObstetrics(plan.hasObstetrics || false);
        setHasAmbulatory(plan.hasAmbulatory || false);
        setHasHospital(plan.hasHospital || false);
        setAdjustmentMonth(plan.adjustmentMonth || 1);
        setBillingDay(plan.billingDay || 1);
        setSortOrder(plan.sortOrder || 0);
        setPriceTable([...plan.priceTable]);
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                operator,
                planName,
                planCode,
                type,
                coparticipation,
                hasObstetrics,
                hasAmbulatory,
                hasHospital,
                adjustmentMonth,
                billingDay,
                sortOrder,
                priceTable
            };

            if (editingPlan) {
                await api.put(`/health-plans/${editingPlan._id}`, payload);
            } else {
                await api.post('/health-plans', payload);
            }

            setOpen(false);
            resetForm();
            fetchPlans();
            setFeedback({
                type: 'success',
                title: editingPlan ? 'Plano Atualizado' : 'Plano Criado',
                message: editingPlan ? 'As alterações no plano de saúde foram salvas com sucesso.' : 'O novo plano de saúde foi registrado no sistema.'
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro ao Salvar',
                message: error.response?.data?.message || 'Houve um problema ao processar o plano de saúde.',
                detail: JSON.stringify({
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                }, null, 2)
            });
        }
    };

    const resetForm = () => {
        setEditingPlan(null);
        setOperator('');
        setPlanName('');
        setPlanCode('');
        setType('Enfermaria');
        setCoparticipation(false);
        setHasObstetrics(false);
        setHasAmbulatory(false);
        setHasHospital(false);
        setAdjustmentMonth(1);
        setBillingDay(1);
        setSortOrder(0);
        setPriceTable([]);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este plano?')) return;
        try {
            await api.delete(`/health-plans/${id}`);
            fetchPlans();
            setFeedback({
                type: 'success',
                title: 'Plano Excluído',
                message: 'O plano de saúde e suas tabelas de preço foram removidos permanentemente.'
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro na Exclusão',
                message: 'Não foi possível remover o plano de saúde.',
                detail: error.message
            });
        }
    };

    const handleApplyAdjustment = async () => {
        if (!adjustmentModal.plan) return;
        setAdjLoading(true);
        try {
            await api.post(`/health-plans/${adjustmentModal.plan._id}/apply-adjustment`, {
                percentage: adjPercent,
                applyRetroactive: adjRetroactive,
                retroactiveMonths: adjMonths
            });

            setAdjustmentModal({ open: false, plan: null });
            fetchPlans();
            setFeedback({
                type: 'success',
                title: 'Reajuste Aplicado',
                message: `O reajuste de ${adjPercent}% foi aplicado com sucesso.`
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro no Reajuste',
                message: error.response?.data?.message || 'Houve um erro ao aplicar o reajuste.',
                detail: error.message
            });
        } finally {
            setAdjLoading(false);
        }
    };

    const handleApplyOperatorAdjustment = async () => {
        if (!operatorAdjustmentModal.operator) return;
        setOpAdjLoading(true);
        try {
            await api.post(`/health-plans/adjust-by-operator`, {
                operator: operatorAdjustmentModal.operator,
                percentage: opAdjPercent,
                applyRetroactive: opAdjRetroactive,
                retroactiveMonths: opAdjMonths
            });

            setOperatorAdjustmentModal({ open: false, operator: '' });
            fetchPlans();
            setFeedback({
                type: 'success',
                title: 'Reajuste em Massa Aplicado',
                message: `O reajuste de ${opAdjPercent}% foi aplicado a todos os planos da operadora ${operatorAdjustmentModal.operator}.`
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro no Reajuste',
                message: error.response?.data?.message || 'Erro ao aplicar reajuste por operadora.',
                detail: error.message
            });
        } finally {
            setOpAdjLoading(false);
        }
    };

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center text-outfit">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Planos de Saúde</h1>
                    <p className="text-muted-foreground font-medium">Gerencie operadoras e tabelas de preço.</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="h-11 rounded-xl gap-2 font-bold text-orange-600 border-orange-200 bg-orange-50/50 hover:bg-orange-50" onClick={() => {
                        setOperatorAdjustmentModal({ open: true, operator: '' });
                        setOpAdjPercent(0);
                        setOpAdjRetroactive(false);
                        setOpAdjMonths(1);
                    }}>
                        <CircleAlert className="h-4 w-4" /> Reajuste Global
                    </Button>
                    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-11 rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={() => resetForm()}>
                                <Plus className="h-4 w-4" /> Novo Plano
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] p-8 border-none font-outfit">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-primary">{editingPlan ? 'Editar Plano' : 'Novo Plano de Saúde'}</DialogTitle>
                                <DialogDescription className="font-medium">
                                    {editingPlan ? 'Atualize as informações do plano.' : 'Cadastre a operadora e a tabela de preços por faixa etária.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Operadora</Label>
                                        <Input className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-primary" value={operator} onChange={(e) => setOperator(e.target.value)} required placeholder="Ex: Unimed, Bradesco" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nome do Plano</Label>
                                        <Input className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-primary" value={planName} onChange={(e) => setPlanName(e.target.value)} required placeholder="Ex: Nacional Flex" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Código ANS (Opcional)</Label>
                                        <Input className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-primary" value={planCode} onChange={(e) => setPlanCode(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Acomodação</Label>
                                        <select
                                            className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                        >
                                            <option value="Enfermaria">Enfermaria</option>
                                            <option value="Apartamento">Apartamento</option>
                                            <option value="VIP">VIP</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Obstetrícia</Label>
                                        <select
                                            className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={hasObstetrics ? 'true' : 'false'}
                                            onChange={(e) => setHasObstetrics(e.target.value === 'true')}
                                        >
                                            <option value="true">Com Obstetrícia</option>
                                            <option value="false">Sem Obstetrícia</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Exibição (Ordem)</Label>
                                        <Input
                                            className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-primary text-center"
                                            type="number"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mês de Reajuste</Label>
                                        <select
                                            className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={adjustmentMonth}
                                            onChange={(e) => setAdjustmentMonth(Number(e.target.value))}
                                        >
                                            {months.map((m, i) => (
                                                <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Dia de Faturamento</Label>
                                        <Input
                                            className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-primary text-center"
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={billingDay}
                                            onChange={(e) => setBillingDay(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-[24px] bg-muted/30 space-y-4 border border-dashed border-muted-foreground/20">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-muted/50">
                                            <input type="checkbox" id="copart" checked={coparticipation} onChange={(e) => setCoparticipation(e.target.checked)} className="h-5 w-5 rounded border-muted text-primary focus:ring-primary" />
                                            <Label htmlFor="copart" className="text-xs font-bold leading-none cursor-pointer">Coparticipação</Label>
                                        </div>
                                        <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-muted/50">
                                            <input type="checkbox" id="amb" checked={hasAmbulatory} onChange={(e) => setHasAmbulatory(e.target.checked)} className="h-5 w-5 rounded border-muted text-primary focus:ring-primary" />
                                            <Label htmlFor="amb" className="text-xs font-bold leading-none cursor-pointer">Ambulatório</Label>
                                        </div>
                                        <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-muted/50">
                                            <input type="checkbox" id="hosp" checked={hasHospital} onChange={(e) => setHasHospital(e.target.checked)} className="h-5 w-5 rounded border-muted text-primary focus:ring-primary" />
                                            <Label htmlFor="hosp" className="text-xs font-bold leading-none cursor-pointer">Hospitalar</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-muted pb-4">
                                        <h3 className="font-black text-lg text-primary">Tabela de Preços</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddPrice} className="rounded-xl font-bold bg-primary/5 border-primary/20 text-primary">
                                            <Plus className="h-4 w-4 mr-2" /> Faixa Etária
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {priceTable.map((range, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-muted/20 rounded-2xl relative border border-muted/50 transition-all hover:bg-muted/30">
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">De</Label>
                                                    <Input className="h-10 rounded-xl bg-background border-none text-center font-bold" type="number" value={range.minAge} onChange={(e) => handlePriceChange(index, 'minAge', e.target.value)} required />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Até</Label>
                                                    <Input className="h-10 rounded-xl bg-background border-none text-center font-bold" type="number" value={range.maxAge} onChange={(e) => handlePriceChange(index, 'maxAge', e.target.value)} required />
                                                </div>
                                                <div className="col-span-4 space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Tipo</Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-bold"
                                                        value={range.beneficiaryType || 'Ambos'}
                                                        onChange={(e) => handlePriceChange(index, 'beneficiaryType', e.target.value)}
                                                    >
                                                        <option value="Ambos">Ambos</option>
                                                        <option value="Titular">Titular</option>
                                                        <option value="Dependente">Dependente</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-4 space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Valor (R$)</Label>
                                                    <Input className="h-10 rounded-xl bg-background border-none font-black text-primary" type="number" step="0.01" value={range.price} onChange={(e) => handlePriceChange(index, 'price', e.target.value)} required />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                                                    onClick={() => handleRemovePrice(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <Button type="button" variant="outline" className="h-14 rounded-2xl font-bold" onClick={() => setOpen(false)}>Cancelar</Button>
                                        <Button type="submit" className="h-14 rounded-2xl font-black bg-primary shadow-xl shadow-primary/20">Salvar Plano</Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-primary/5 rounded-[32px] overflow-hidden">
                <CardHeader className="p-8 border-b border-muted">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1 font-outfit">
                            <CardTitle className="text-2xl font-black text-primary">Planos Disponíveis</CardTitle>
                            <CardDescription className="font-medium">Lista de todos os planos de saúde cadastrados.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-8">
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground border-4 border-dashed rounded-[40px] font-outfit">
                                <HeartPulse className="h-16 w-16 mx-auto mb-6 opacity-20" />
                                <p className="text-xl font-bold">Nenhum plano cadastrado.</p>
                                <p className="font-medium text-sm">Clique em "+ Novo Plano" para começar.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 font-outfit">
                                {[...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((plan: any) => (
                                    <Card key={plan._id} className="rounded-[32px] overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-muted/20 group">
                                        <div className={`h-2 w-full ${plan.operator.toLowerCase().includes('unimed') ? 'bg-green-500' : 'bg-primary'}`} />
                                        <CardHeader className="p-6 pb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="rounded-lg font-black uppercase text-[9px] tracking-widest text-muted-foreground bg-background">
                                                    {plan.operator}
                                                </Badge>
                                                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                                                    <HeartPulse className="h-4 w-4" />
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl font-black text-primary leading-tight">{plan.planName}</CardTitle>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                                                {plan.planCode || 'Sem registro ANS'} • {plan.type}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="p-6 pt-2 space-y-6">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className={`rounded-xl px-3 py-1 text-[10px] font-black border-none ${plan.coparticipation ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                    {plan.coparticipation ? 'COM COPART' : 'SEM COPART'}
                                                </Badge>
                                                <Badge className="rounded-xl px-3 py-1 text-[10px] font-black bg-blue-100 text-blue-600 border-none">
                                                    {plan.hasObstetrics ? '+ OBSTETRÍCIA' : 'SEM OBST.'}
                                                </Badge>
                                                <Badge className="rounded-xl px-3 py-1 text-[10px] font-black bg-primary/10 text-primary border-none uppercase tracking-tighter">
                                                    Reajuste: {months[plan.adjustmentMonth - 1]}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-background border border-muted/50">
                                                <div className="text-center border-r border-muted">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mín. Titular</p>
                                                    <p className="text-lg font-black text-primary">
                                                        R$ {Math.min(...(plan.priceTable?.filter((r: any) => r.beneficiaryType !== 'Dependente').map((r: any) => r.price) || [0])).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mín. Dep.</p>
                                                    <p className="text-lg font-black text-primary">
                                                        R$ {Math.min(...(plan.priceTable?.filter((r: any) => r.beneficiaryType !== 'Titular').map((r: any) => r.price) || [0])).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold bg-background" onClick={() => handleEdit(plan)}>
                                                    Editar
                                                </Button>
                                                <Button variant="secondary" size="sm" className="flex-1 rounded-xl font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border-none" onClick={() => {
                                                    setAdjustmentModal({ open: true, plan });
                                                    setAdjPercent(0);
                                                    setAdjRetroactive(false);
                                                }}>
                                                    % Reajuste
                                                </Button>
                                                <Button variant="outline" size="icon" className="shrink-0 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(plan._id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* --- MODAL DE REAJUSTE INDIVIDUAL --- */}
            <Dialog open={adjustmentModal.open} onOpenChange={(val) => setAdjustmentModal({ ...adjustmentModal, open: val })}>
                <DialogContent className="sm:max-w-md rounded-[32px] p-8 border-none shadow-2xl font-outfit">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                %
                            </div>
                            Aplicar Reajuste
                        </DialogTitle>
                        <DialogDescription className="font-medium pt-2 text-muted-foreground">
                            Atualize a tabela do plano <span className="text-primary font-bold">{adjustmentModal.plan?.operator} - {adjustmentModal.plan?.planName}</span> e todas as adesões ativas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Percentual (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                className="h-14 text-2xl font-black text-primary px-6 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-orange-500/50 transition-all"
                                value={adjPercent}
                                onChange={(e) => setAdjPercent(Number(e.target.value))}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="applyRetro" className="font-bold text-orange-900 cursor-pointer">Diferença Retroativa</Label>
                                <input
                                    type="checkbox"
                                    id="applyRetro"
                                    checked={adjRetroactive}
                                    onChange={(e) => setAdjRetroactive(e.target.checked)}
                                    className="h-5 w-5 rounded-md border-orange-300 text-orange-600 focus:ring-orange-500"
                                />
                            </div>

                            {adjRetroactive && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-orange-700">Quantidade de Meses</Label>
                                    <Input
                                        type="number"
                                        className="h-10 w-full font-bold text-center rounded-xl border-orange-200 bg-white"
                                        value={adjMonths}
                                        onChange={(e) => setAdjMonths(Number(e.target.value))}
                                        min={1}
                                    />
                                </div>
                            )}

                            {adjPercent > 0 && adjustmentModal.plan?.priceTable?.[0] && (
                                <div className="pt-4 border-t border-orange-100">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest">Prévia (Principal Faixa)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-xl bg-white/50 border border-muted/50">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground">Atual</p>
                                            <p className="text-xl font-black text-muted-foreground">R$ {adjustmentModal.plan.priceTable[0].price.toFixed(2)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-orange-100/50 border border-orange-200">
                                            <p className="text-[9px] uppercase font-bold text-orange-600">Novo (+{adjPercent}%)</p>
                                            <p className="text-xl font-black text-orange-700">R$ {(adjustmentModal.plan.priceTable[0].price * (1 + adjPercent / 100)).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center pt-2">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => setAdjustmentModal({ open: false, plan: null })}>
                                Cancelar
                            </Button>
                            <Button
                                className="h-12 rounded-2xl font-black bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200"
                                onClick={handleApplyAdjustment}
                                disabled={adjLoading || adjPercent <= 0}
                            >
                                {adjLoading ? 'Processando...' : 'Confirmar'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL DE REAJUSTE POR OPERADORA --- */}
            <Dialog open={operatorAdjustmentModal.open} onOpenChange={(val) => setOperatorAdjustmentModal({ ...operatorAdjustmentModal, open: val })}>
                <DialogContent className="sm:max-w-[480px] rounded-[32px] p-8 border-none shadow-2xl font-outfit">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                %
                            </div>
                            Reajuste Global
                        </DialogTitle>
                        <DialogDescription className="font-medium pt-2 text-muted-foreground">
                            Aplique um percentual de reajuste a todos os planos de uma operadora simultaneamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Operadora</Label>
                            <select
                                className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
                                value={operatorAdjustmentModal.operator}
                                onChange={(e) => setOperatorAdjustmentModal({ ...operatorAdjustmentModal, operator: e.target.value })}
                            >
                                <option value="">Selecione a operadora...</option>
                                {Array.from(new Set(plans.map(p => p.operator))).sort().map(op => (
                                    <option key={op} value={op}>{op}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Percentual (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                className="h-14 text-2xl font-black text-primary px-6 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-orange-500/50 transition-all"
                                value={opAdjPercent}
                                onChange={(e) => setOpAdjPercent(Number(e.target.value))}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="opApplyRetro" className="font-bold text-orange-900 cursor-pointer">Diferença Retroativa</Label>
                                <input
                                    type="checkbox"
                                    id="opApplyRetro"
                                    checked={opAdjRetroactive}
                                    onChange={(e) => setOpAdjRetroactive(e.target.checked)}
                                    className="h-5 w-5 rounded-md border-orange-300 text-orange-600 focus:ring-orange-500"
                                />
                            </div>

                            {opAdjRetroactive && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-orange-700">Meses Retroativos</Label>
                                    <Input
                                        type="number"
                                        className="h-10 w-full font-bold text-center rounded-xl border-orange-200 bg-white"
                                        value={opAdjMonths}
                                        onChange={(e) => setOpAdjMonths(Number(e.target.value))}
                                        min={1}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center pt-2">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => setOperatorAdjustmentModal({ open: false, operator: '' })}>
                                Cancelar
                            </Button>
                            <Button
                                className="h-12 rounded-2xl font-black bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200"
                                onClick={handleApplyOperatorAdjustment}
                                disabled={opAdjLoading || opAdjPercent <= 0 || !operatorAdjustmentModal.operator}
                            >
                                {opAdjLoading ? 'Processando...' : 'Confirmar'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={feedback.type !== null} onOpenChange={() => setFeedback({ ...feedback, type: null })}>
                <DialogContent className="sm:max-w-[440px] border-none shadow-2xl rounded-[32px] overflow-hidden p-0 bg-background/95 backdrop-blur-xl font-outfit">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{feedback.title}</DialogTitle>
                        <DialogDescription>{feedback.message}</DialogDescription>
                    </DialogHeader>
                    <div className={`h-1.5 w-full ${feedback.type === 'success' ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-destructive to-red-400'}`} />
                    <div className="p-10 text-center space-y-7">
                        <div className={`mx-auto h-24 w-24 rounded-3xl flex items-center justify-center shadow-inner ${feedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-destructive/5 text-destructive'} rotate-3 transition-transform hover:rotate-0 duration-500`}>
                            {feedback.type === 'success' ? <CircleCheck className="h-12 w-12" /> : <CircleAlert className="h-12 w-12" />}
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-primary tracking-tight leading-none">{feedback.title}</h3>
                            <p className="text-sm text-muted-foreground px-4 leading-relaxed font-medium">{feedback.message}</p>
                        </div>

                        {feedback.detail && (
                            <div className="relative group mx-1">
                                <div className="bg-primary/5 p-5 rounded-2xl text-[10px] font-mono text-left overflow-auto max-h-44 border border-primary/10 scrollbar-thin scrollbar-thumb-primary/20">
                                    <pre className="text-primary/70">{feedback.detail}</pre>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-3 right-3 h-8 gap-2 bg-background/90 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white rounded-lg px-3"
                                    onClick={() => {
                                        navigator.clipboard.writeText(feedback.detail || '');
                                        alert('Log de erro copiado!');
                                    }}
                                >
                                    <Copy className="h-3 w-3" /> <span className="text-[10px] font-bold uppercase tracking-tighter">Copiar Log</span>
                                </Button>
                            </div>
                        )}

                        <DialogFooter className="sm:justify-center pt-2">
                            <Button
                                className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all hover:-translate-y-1 active:scale-95 ${feedback.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-200/50' : 'bg-destructive hover:bg-destructive/90 shadow-destructive/20'}`}
                                onClick={() => setFeedback({ ...feedback, type: null })}
                            >
                                {feedback.type === 'success' ? 'Entendido' : 'Tentar Novamente'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HealthPlans;
