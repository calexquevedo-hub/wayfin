import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Plus, Edit, Trash, CheckCircle2,
    CircleAlert, Check, Copy, CircleCheck, Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

const Enrollments = () => {
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [healthPlans, setHealthPlans] = useState<any[]>([]);
    const [dentalPlans, setDentalPlans] = useState<any[]>([]);
    const [enrollmentType, setEnrollmentType] = useState<'Health' | 'Dental'>('Health');
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [selectedCollabId, setSelectedCollabId] = useState('');
    // Map of beneficiaryId (or "titular") to { planId, effectiveDate }
    // Map of beneficiaryId (or "titular") to { planId }
    const [selectionMap, setSelectionMap] = useState<Record<string, { planId: string, credential?: string, financialResponsibleId?: string }>>({});
    const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // For editing
    const [editPlanId, setEditPlanId] = useState('');
    const [editCredential, setEditCredential] = useState('');
    const [editFinancialResponsibleId, setEditFinancialResponsibleId] = useState('');
    const [adjPercent, setAdjPercent] = useState(0);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; title: string; message: string; detail?: string }>({
        type: null,
        title: '',
        message: '',
        detail: ''
    });

    // Billing State
    const [billingModal, setBillingModal] = useState<{ open: boolean; plan: any }>({ open: false, plan: null });
    const [billingYear, setBillingYear] = useState(new Date().getFullYear());
    const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
    const [billingDueDate, setBillingDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [billingLoading, setBillingLoading] = useState(false);

    useEffect(() => {
        fetchCollaborators();
        fetchCollaborators();
        fetchHealthPlans();
        fetchDentalPlans();
        fetchEnrollments();
    }, []);

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const fetchEnrollments = async () => {
        try {
            const res = await api.get('/enrollments');
            setEnrollments(res.data);
        } catch (error) {
            console.error('Failed to fetch enrollments', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollaborators = async () => {
        try {
            const res = await api.get('/collaborators');
            setCollaborators(res.data);
        } catch (error) {
            console.error('Failed to fetch collaborators', error);
        }
    };

    const fetchHealthPlans = async () => {
        try {
            const res = await api.get('/health-plans');
            setHealthPlans(res.data);
        } catch (error) {
            console.error('Failed to fetch health plans', error);
        }
    };

    const fetchDentalPlans = async () => {
        try {
            const res = await api.get('/dental-plans');
            setDentalPlans(res.data);
        } catch (error) {
            console.error('Failed to fetch dental plans', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedIds = Object.keys(selectionMap).filter(id => selectionMap[id].planId);

        if (selectedIds.length === 0) {
            setFeedback({ type: 'error', title: 'Seleção Vazia', message: 'Selecione ao menos um beneficiário e seu respectivo plano para realizar a adesão.' });
            return;
        }

        try {
            // Sequential registration for each selected beneficiary
            for (const bId of selectedIds) {
                const config = selectionMap[bId];
                const payload: any = {
                    collaboratorId: selectedCollabId,
                    dependentId: bId === 'titular' ? null : bId,
                    type: enrollmentType,
                    effectiveDate: new Date()
                };

                if (enrollmentType === 'Health') {
                    payload.healthPlanId = config.planId;
                    payload.healthPlanCredential = config.credential;
                } else {
                    payload.dentalPlanId = config.planId;
                    payload.dentalPlanCredential = config.credential;
                }

                payload.financialResponsibleId = config.financialResponsibleId || selectedCollabId;

                await api.post('/enrollments', payload);
            }

            setOpen(false);
            resetForm();
            fetchEnrollments();
            setFeedback({
                type: 'success',
                title: 'Adesões Concluídas',
                message: `${selectedIds.length} beneficiário(s) vinculado(s) ao plano com sucesso.`
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro na Adesão',
                message: error.response?.data?.message || 'Não foi possível realizar a adesão neste momento.',
                detail: JSON.stringify({
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                }, null, 2)
            });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                adjPercent: adjPercent
            };

            if (editingEnrollment.type === 'Dental') {
                payload.dentalPlanId = editPlanId;
                payload.dentalPlanCredential = editCredential;
            } else {
                payload.healthPlanId = editPlanId;
                payload.healthPlanCredential = editCredential;
            }

            payload.financialResponsibleId = editFinancialResponsibleId;

            await api.put(`/enrollments/${editingEnrollment._id}`, payload);
            setEditModalOpen(false);
            fetchEnrollments();
            setFeedback({
                type: 'success',
                title: 'Adesão Atualizada',
                message: 'Os dados do plano e reajuste foram atualizados com sucesso.'
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro na Atualização',
                message: error.response?.data?.message || 'Não foi possível atualizar a adesão.',
                detail: error.message
            });
        }
    };

    const resetForm = () => {
        setSelectedCollabId('');
        setSelectionMap({});
    };

    const handleEditClick = (enr: any) => {
        setEditingEnrollment(enr);
        const plan = enr.healthPlan || enr.dentalPlan;
        setEditPlanId(plan?._id || plan);
        setEditCredential(enr.healthPlanCredential || enr.dentalPlanCredential || '');
        setEditFinancialResponsibleId(enr.financialResponsible?._id || enr.financialResponsible || '');
        setAdjPercent(enr.adjPercent || 0);
        setEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente cancelar esta adesão?')) return;
        try {
            await api.delete(`/enrollments/${id}`);
            fetchEnrollments();
            setFeedback({
                type: 'success',
                title: 'Adesão Cancelada',
                message: 'O vínculo do beneficiário com o plano foi removido com sucesso.'
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro ao Cancelar',
                message: 'Houve um problema ao excluir a adesão.',
                detail: error.message
            });
        }
    };

    const selectedCollab = collaborators.find(c => c._id === selectedCollabId);

    const calculatePrice = (plan: any, bId: string) => {
        if (!selectedCollab || !plan) return 0;

        const beneficiary = bId === 'titular'
            ? selectedCollab
            : selectedCollab.dependents.find((d: any) => d._id === bId);

        if (!beneficiary) return 0;

        const birthDate = bId === 'titular'
            ? beneficiary.personalData?.birthDate
            : beneficiary.birthDate;

        if (!birthDate) return 0;

        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
        const type = bId === 'titular' ? 'Titular' : 'Dependente';

        const entry = plan.priceTable?.find((p: any) =>
            age >= p.minAge &&
            age <= p.maxAge &&
            (p.beneficiaryType === 'Ambos' || p.beneficiaryType === type)
        );

        return entry ? entry.price : 0;
    };

    const isObstetricsConflict = (plan: any, bId: string) => {
        if (!selectedCollab || !plan) return false;
        const beneficiary = bId === 'titular'
            ? selectedCollab
            : selectedCollab.dependents.find((d: any) => d._id === bId);

        const gender = bId === 'titular'
            ? beneficiary?.personalData?.gender
            : beneficiary?.gender;

        return enrollmentType === 'Health' && gender === 'Feminino' && !plan.hasObstetrics;
    };

    const getTotalCost = () => {
        let total = 0;
        Object.keys(selectionMap).forEach(bId => {
            const config = selectionMap[bId];
            if (config.planId) {
                const activePlans = enrollmentType === 'Health' ? healthPlans : dentalPlans;
                const plan = activePlans.find(p => p._id === config.planId);
                if (plan) total += calculatePrice(plan, bId);
            }
        });
        return total;
    };

    const toggleBeneficiary = (beneficiaryId: string, checked: boolean) => {
        if (checked) {
            setSelectionMap({
                ...selectionMap,
                [beneficiaryId]: { planId: '', credential: '', financialResponsibleId: selectedCollabId }
            });
        } else {
            const newMap = { ...selectionMap };
            delete newMap[beneficiaryId];
            setSelectionMap(newMap);
        }
    };

    const updateSelection = (beneficiaryId: string, field: string, value: any) => {
        setSelectionMap({
            ...selectionMap,
            [beneficiaryId]: { ...selectionMap[beneficiaryId], [field]: value }
        });
    };

    const handleGenerateBilling = async () => {
        setBillingLoading(true);
        try {
            await api.post('/enrollments/generate-billing', {
                year: billingYear,
                month: billingMonth,
                dueDate: billingDueDate
            });

            setBillingModal({ open: false, plan: null });
            setFeedback({
                type: 'success',
                title: 'Faturamento Concluído',
                message: `As faturas de ${months[billingMonth - 1]}/${billingYear} foram geradas no Contas a Receber com sucesso.`
            });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                title: 'Erro na Fatura',
                message: error.response?.data?.message || 'Não foi possível gerar a fatura do plano.',
                detail: error.message
            });
        } finally {
            setBillingLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Adesão aos Planos</h1>
                    <p className="text-muted-foreground">Vincule colaboradores e dependentes aos planos de saúde.</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50" onClick={() => setBillingModal({ open: true, plan: null })}>
                        <CircleAlert className="h-4 w-4" /> Gerar Fatura do Mês
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" /> Nova Adesão
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Vincular ao Plano</DialogTitle>
                                <DialogDescription>
                                    Escolha os membros e os planos de saúde individualmente.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Colaborador Titular</Label>
                                    <select
                                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={selectedCollabId}
                                        onChange={(e) => {
                                            setSelectedCollabId(e.target.value);
                                            setSelectionMap({});
                                        }}
                                        required
                                    >
                                        <option value="">Selecione um colaborador</option>
                                        {collaborators.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Plano</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl hover:bg-muted/50 transition-all has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30">
                                            <input
                                                type="radio"
                                                name="enrollmentType"
                                                value="Health"
                                                checked={enrollmentType === 'Health'}
                                                onChange={() => { setEnrollmentType('Health'); setSelectionMap({}); }}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <span className="text-sm font-bold">Saúde</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl hover:bg-muted/50 transition-all has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30">
                                            <input
                                                type="radio"
                                                name="enrollmentType"
                                                value="Dental"
                                                checked={enrollmentType === 'Dental'}
                                                onChange={() => { setEnrollmentType('Dental'); setSelectionMap({}); }}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <span className="text-sm font-bold">Odontológico</span>
                                        </label>
                                    </div>
                                </div>

                                {selectedCollab && (
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold uppercase text-primary/70">Membros da Família e Configuração</Label>
                                        <div className="space-y-4">
                                            {/* Titular Row */}
                                            <div className="p-4 rounded-xl border border-primary/10 bg-muted/20 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="check-titular"
                                                            checked={!!selectionMap['titular']}
                                                            onChange={(e) => toggleBeneficiary('titular', e.target.checked)}
                                                            className="h-5 w-5 rounded border-primary/20 text-primary focus:ring-primary/30"
                                                        />
                                                        <Label htmlFor="check-titular" className="text-sm font-bold cursor-pointer">
                                                            {selectedCollab.name} (Titular)
                                                        </Label>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] uppercase">{selectedCollab.personalData?.gender}</Badge>
                                                </div>

                                                {selectionMap['titular'] && (
                                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Selecione o Plano</Label>
                                                            <div className="border rounded-2xl overflow-hidden bg-background shadow-sm border-primary/10">
                                                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                                                    {Array.from(new Set((enrollmentType === 'Health' ? healthPlans : dentalPlans).map(p => p.operator))).sort().map(operator => (
                                                                        <div key={operator} className="border-b last:border-0">
                                                                            <div className="bg-primary/5 px-4 py-2 text-[11px] font-black uppercase text-primary border-b border-primary/10 flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                                {operator}
                                                                            </div>
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-muted/30 text-[9px] uppercase text-muted-foreground/70 border-b">
                                                                                    <tr>
                                                                                        <th className="px-4 py-2.5 text-left font-bold">Cód. ANS</th>
                                                                                        <th className="px-4 py-2.5 text-left font-bold">Plano</th>
                                                                                        {enrollmentType === 'Health' && (
                                                                                            <>
                                                                                                <th className="px-4 py-2.5 text-left font-bold">Acomodação</th>
                                                                                                <th className="px-4 py-2.5 text-center font-bold">Obst.</th>
                                                                                            </>
                                                                                        )}
                                                                                        <th className="px-4 py-2.5 text-right font-bold">Valor</th>
                                                                                        <th className="px-4 py-2.5 text-center font-bold"></th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-primary/5">
                                                                                    {(enrollmentType === 'Health' ? healthPlans : dentalPlans)
                                                                                        .filter(p => p.operator === operator)
                                                                                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                                                                        .map(p => {
                                                                                            const price = calculatePrice(p, 'titular');
                                                                                            const conflict = isObstetricsConflict(p, 'titular');
                                                                                            const isSelected = selectionMap['titular'].planId === p._id;
                                                                                            return (
                                                                                                <tr
                                                                                                    key={p._id}
                                                                                                    className={`group hover:bg-primary/5 transition-all cursor-pointer ${isSelected ? 'bg-primary/[0.07]' : ''} ${conflict ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                                                                                    onClick={() => !conflict && updateSelection('titular', 'planId', p._id)}
                                                                                                >
                                                                                                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{p.planCode || '-'}</td>
                                                                                                    <td className="px-4 py-3 font-bold text-foreground/80">{p.planName}</td>
                                                                                                    {enrollmentType === 'Health' && (
                                                                                                        <>
                                                                                                            <td className="px-4 py-3">{p.type}</td>
                                                                                                            <td className="px-4 py-3 text-center">
                                                                                                                <Badge variant={p.hasObstetrics ? 'default' : 'outline'} className={`text-[9px] px-1.5 py-0 h-4 ${p.hasObstetrics ? 'bg-green-500 hover:bg-green-600' : 'text-muted-foreground'}`}>
                                                                                                                    {p.hasObstetrics ? 'Sim' : 'Não'}
                                                                                                                </Badge>
                                                                                                            </td>
                                                                                                        </>
                                                                                                    )}
                                                                                                    <td className="px-4 py-3 text-right font-bold text-primary text-sm">R$ {price.toFixed(2)}</td>
                                                                                                    <td className="px-4 py-3 text-center">
                                                                                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary text-white scale-110' : 'border-muted-foreground/30 group-hover:border-primary/50'}`}>
                                                                                                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                                                                                        </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    ))}
                                                                    {(enrollmentType === 'Health' ? healthPlans : dentalPlans).length === 0 && (
                                                                        <div className="p-12 text-center space-y-2 text-muted-foreground">
                                                                            <Info className="h-8 w-8 mx-auto opacity-20" />
                                                                            <p className="text-sm">Nenhum plano disponível para este tipo.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isObstetricsConflict(healthPlans.find(p => p._id === selectionMap['titular'].planId), 'titular') && enrollmentType === 'Health' && (
                                                                <p className="text-[10px] text-destructive font-bold flex items-center gap-1.5 mt-2 bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                                                                    <CircleAlert className="h-3 w-3" /> Este plano não inclui obstetrícia (conflito de gênero).
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Credencial</Label>
                                                                <Input
                                                                    className="h-11 rounded-xl border-primary/10 focus:ring-primary/20"
                                                                    placeholder="00000.000000-00 0"
                                                                    value={selectionMap['titular'].credential}
                                                                    onChange={(e) => updateSelection('titular', 'credential', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Responsável Financeiro</Label>
                                                                <select
                                                                    className="flex h-11 w-full rounded-xl border border-primary/10 bg-background px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                                    value={selectionMap['titular'].financialResponsibleId}
                                                                    onChange={(e) => updateSelection('titular', 'financialResponsibleId', e.target.value)}
                                                                    required
                                                                >
                                                                    {collaborators.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                                                        <option key={c._id} value={c._id}>{c.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dependent Rows */}
                                            {selectedCollab.dependents.map((d: any) => (
                                                <div key={d._id} className="p-4 rounded-xl border border-primary/10 bg-muted/20 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`check-${d._id}`}
                                                                checked={!!selectionMap[d._id]}
                                                                onChange={(e) => toggleBeneficiary(d._id, e.target.checked)}
                                                                className="h-5 w-5 rounded border-primary/20 text-primary focus:ring-primary/30"
                                                            />
                                                            <Label htmlFor={`check-${d._id}`} className="text-sm font-bold cursor-pointer">
                                                                {d.name} ({d.relationship})
                                                            </Label>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] uppercase">{d.gender}</Badge>
                                                    </div>

                                                    {selectionMap[d._id] && (
                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Selecione o Plano</Label>
                                                                <div className="border rounded-2xl overflow-hidden bg-background shadow-sm border-primary/10">
                                                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                                                        {Array.from(new Set((enrollmentType === 'Health' ? healthPlans : dentalPlans).map(p => p.operator))).sort().map(operator => (
                                                                            <div key={operator} className="border-b last:border-0">
                                                                                <div className="bg-primary/5 px-4 py-2 text-[11px] font-black uppercase text-primary border-b border-primary/10 flex items-center gap-2">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                                    {operator}
                                                                                </div>
                                                                                <table className="w-full text-xs">
                                                                                    <thead className="bg-muted/30 text-[9px] uppercase text-muted-foreground/70 border-b">
                                                                                        <tr>
                                                                                            <th className="px-4 py-2.5 text-left font-bold">Cód. ANS</th>
                                                                                            <th className="px-4 py-2.5 text-left font-bold">Plano</th>
                                                                                            {enrollmentType === 'Health' && (
                                                                                                <>
                                                                                                    <th className="px-4 py-2.5 text-left font-bold">Acomodação</th>
                                                                                                    <th className="px-4 py-2.5 text-center font-bold">Obst.</th>
                                                                                                </>
                                                                                            )}
                                                                                            <th className="px-4 py-2.5 text-right font-bold">Valor</th>
                                                                                            <th className="px-4 py-2.5 text-center font-bold"></th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-primary/5">
                                                                                        {(enrollmentType === 'Health' ? healthPlans : dentalPlans)
                                                                                            .filter(p => p.operator === operator)
                                                                                            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                                                                            .map(p => {
                                                                                                const price = calculatePrice(p, d._id);
                                                                                                const conflict = isObstetricsConflict(p, d._id);
                                                                                                const isSelected = selectionMap[d._id].planId === p._id;
                                                                                                return (
                                                                                                    <tr
                                                                                                        key={p._id}
                                                                                                        className={`group hover:bg-primary/5 transition-all cursor-pointer ${isSelected ? 'bg-primary/[0.07]' : ''} ${conflict ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                                                                                        onClick={() => !conflict && updateSelection(d._id, 'planId', p._id)}
                                                                                                    >
                                                                                                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{p.planCode || '-'}</td>
                                                                                                        <td className="px-4 py-3 font-bold text-foreground/80">{p.planName}</td>
                                                                                                        {enrollmentType === 'Health' && (
                                                                                                            <>
                                                                                                                <td className="px-4 py-3">{p.type}</td>
                                                                                                                <td className="px-4 py-3 text-center">
                                                                                                                    <Badge variant={p.hasObstetrics ? 'default' : 'outline'} className={`text-[9px] px-1.5 py-0 h-4 ${p.hasObstetrics ? 'bg-green-500 hover:bg-green-600' : 'text-muted-foreground'}`}>
                                                                                                                        {p.hasObstetrics ? 'Sim' : 'Não'}
                                                                                                                    </Badge>
                                                                                                                </td>
                                                                                                            </>
                                                                                                        )}
                                                                                                        <td className="px-4 py-3 text-right font-bold text-primary text-sm">R$ {price.toFixed(2)}</td>
                                                                                                        <td className="px-4 py-3 text-center">
                                                                                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary text-white scale-110' : 'border-muted-foreground/30 group-hover:border-primary/50'}`}>
                                                                                                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                                                                                            </div>
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                );
                                                                                            })}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        ))}
                                                                        {(enrollmentType === 'Health' ? healthPlans : dentalPlans).length === 0 && (
                                                                            <div className="p-12 text-center space-y-2 text-muted-foreground">
                                                                                <Info className="h-8 w-8 mx-auto opacity-20" />
                                                                                <p className="text-sm">Nenhum plano disponível para este tipo.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isObstetricsConflict(healthPlans.find(p => p._id === selectionMap[d._id].planId), d._id) && enrollmentType === 'Health' && (
                                                                    <p className="text-[10px] text-destructive font-bold flex items-center gap-1.5 mt-2 bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                                                                        <CircleAlert className="h-3 w-3" /> Este plano não inclui obstetrícia (conflito de gênero).
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Credencial</Label>
                                                                    <Input
                                                                        className="h-11 rounded-xl border-primary/10 focus:ring-primary/20"
                                                                        placeholder="00000.000000-00 0"
                                                                        value={selectionMap[d._id].credential}
                                                                        onChange={(e) => updateSelection(d._id, 'credential', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Responsável Financeiro</Label>
                                                                    <select
                                                                        className="flex h-11 w-full rounded-xl border border-primary/10 bg-background px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                                        value={selectionMap[d._id].financialResponsibleId}
                                                                        onChange={(e) => updateSelection(d._id, 'financialResponsibleId', e.target.value)}
                                                                        required
                                                                    >
                                                                        {collaborators.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                                                            <option key={c._id} value={c._id}>{c.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {getTotalCost() > 0 && (
                                            <div className="bg-primary/5 p-4 rounded-xl border-2 border-primary/20 flex justify-between items-center">
                                                <span className="text-xs font-black text-primary uppercase tracking-widest">Total da Adesão</span>
                                                <span className="text-xl font-black text-primary font-outfit">R$ {getTotalCost().toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}



                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Confirmar Adesão</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* --- MODAL DE EDIÇÃO --- */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Adesão</DialogTitle>
                        <DialogDescription>
                            Altere o plano ou o reajuste para <span className="font-bold text-primary">{editingEnrollment?.dependent ? editingEnrollment.collaborator?.dependents?.find((d: any) => d._id === editingEnrollment.dependent)?.name : editingEnrollment?.collaborator?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{editingEnrollment?.type === 'Dental' ? 'Plano Odontológico' : 'Plano de Saúde'}</Label>
                            <select
                                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={editPlanId}
                                onChange={(e) => setEditPlanId(e.target.value)}
                                required
                            >
                                <option value="">Selecione um plano</option>
                                {editingEnrollment?.type === 'Health' ? healthPlans.map(p => {
                                    const bId = editingEnrollment?.dependent || 'titular';
                                    const conflict = isObstetricsConflict(p, bId);

                                    const birthDate = bId === 'titular'
                                        ? editingEnrollment?.collaborator?.personalData?.birthDate
                                        : editingEnrollment?.collaborator?.dependents?.find((d: any) => d._id === bId)?.birthDate;
                                    const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0;
                                    const benefType = bId === 'titular' ? 'Titular' : 'Dependente';
                                    const priceEntry = p.priceTable?.find((pr: any) =>
                                        age >= pr.minAge &&
                                        age <= pr.maxAge &&
                                        (pr.beneficiaryType === 'Ambos' || pr.beneficiaryType === benefType)
                                    );
                                    const price = priceEntry ? priceEntry.price : 0;

                                    return (
                                        <option key={p._id} value={p._id} disabled={conflict}>
                                            {p.planCode || 'S/Cód'} - {p.operator} - {p.planName} - {p.type} - {p.hasObstetrics ? 'C/ Obst' : 'S/ Obst'} - R$ {price.toFixed(2)}
                                        </option>
                                    );
                                }) : dentalPlans.map(p => {
                                    const bId = editingEnrollment?.dependent || 'titular';

                                    const birthDate = bId === 'titular'
                                        ? editingEnrollment?.collaborator?.personalData?.birthDate
                                        : editingEnrollment?.collaborator?.dependents?.find((d: any) => d._id === bId)?.birthDate;
                                    const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0;
                                    const benefType = bId === 'titular' ? 'Titular' : 'Dependente';
                                    const priceEntry = p.priceTable?.find((pr: any) =>
                                        age >= pr.minAge &&
                                        age <= pr.maxAge &&
                                        (pr.beneficiaryType === 'Ambos' || pr.beneficiaryType === benefType)
                                    );
                                    const price = priceEntry ? priceEntry.price : 0;

                                    return (
                                        <option key={p._id} value={p._id}>
                                            {p.planCode || 'S/Cód'} - {p.operator} - {p.planName} - R$ {price.toFixed(2)}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Credencial</Label>
                            <Input
                                value={editCredential}
                                onChange={(e) => setEditCredential(e.target.value)}
                                placeholder="00000.000000-00 0"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Responsável Financeiro</Label>
                            <select
                                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={editFinancialResponsibleId}
                                onChange={(e) => setEditFinancialResponsibleId(e.target.value)}
                                required
                            >
                                <option value="">Selecione o responsável</option>
                                {collaborators.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Adesões</CardTitle>
                        <CardDescription>Custo mensal total em benefícios: R$ {enrollments.reduce((acc, curr) => acc + curr.monthlyCost, 0).toFixed(2)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : enrollments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    Nenhuma adesão ativa encontrada.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-10">
                                        {(() => {
                                            // 1. Group by Financial Responsible and then by Holder
                                            const groupedByResp = enrollments.reduce((acc: any, enr: any) => {
                                                const respId = enr.financialResponsible?._id || enr.collaborator?._id;
                                                if (!respId) return acc;

                                                if (!acc[respId]) {
                                                    acc[respId] = {
                                                        responsible: enr.financialResponsible || enr.collaborator,
                                                        holders: {}
                                                    };
                                                }

                                                const holderId = enr.collaborator?._id;
                                                if (!acc[respId].holders[holderId]) {
                                                    acc[respId].holders[holderId] = {
                                                        collab: enr.collaborator,
                                                        items: []
                                                    };
                                                }

                                                acc[respId].holders[holderId].items.push(enr);
                                                return acc;
                                            }, {});

                                            // 2. Sort and Structure
                                            return Object.values(groupedByResp)
                                                .sort((a: any, b: any) => (a.responsible?.name || '').localeCompare(b.responsible?.name || ''))
                                                .map((group: any) => {
                                                    const totalResp = Object.values(group.holders).reduce((sumH: number, h: any) =>
                                                        sumH + h.items.reduce((sumI: number, i: any) => sumI + i.monthlyCost, 0), 0);

                                                    return (
                                                        <div key={group.responsible._id} className="space-y-4">
                                                            <div className="flex items-center justify-between px-3 py-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm transition-all hover:bg-primary/[0.07]">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                                                                        {group.responsible.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                                            Responsável: {group.responsible.name}
                                                                            <Badge className="bg-primary/10 text-primary border-none text-[9px] h-4">
                                                                                {Object.keys(group.holders).length} Famílias
                                                                            </Badge>
                                                                        </h3>
                                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Custeio centralizado de benefícios</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">Total do Responsável</p>
                                                                    <p className="text-xl font-black text-primary">R$ {totalResp.toFixed(2)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid gap-6">
                                                                {Object.values(group.holders)
                                                                    .sort((a: any, b: any) => (a.collab?.name || '').localeCompare(b.collab?.name || ''))
                                                                    .map((holder: any) => (
                                                                        <div key={holder.collab._id} className="border rounded-2xl overflow-hidden shadow-sm bg-white ml-6">
                                                                            <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center text-primary font-bold text-xs">
                                                                                        {holder.collab.name.charAt(0)}
                                                                                    </div>
                                                                                    <div>
                                                                                        <h4 className="font-bold text-sm text-primary">{holder.collab.name}</h4>
                                                                                        <p className="text-[9px] uppercase tracking-tighter text-muted-foreground font-black">Grupo Familiar ({holder.items.length} adesões)</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter leading-none">Custo Família</p>
                                                                                    <p className="text-md font-black text-primary">R$ {holder.items.reduce((sum: number, i: any) => sum + i.monthlyCost, 0).toFixed(2)}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-3 space-y-1">
                                                                                {holder.items
                                                                                    .sort((a: any, b: any) => {
                                                                                        if (!a.dependent && b.dependent) return -1;
                                                                                        if (a.dependent && !b.dependent) return 1;
                                                                                        const nameA = a.dependent ? holder.collab.dependents.find((d: any) => d._id === a.dependent)?.name : holder.collab.name;
                                                                                        const nameB = b.dependent ? holder.collab.dependents.find((d: any) => d._id === b.dependent)?.name : holder.collab.name;
                                                                                        return (nameA || '').localeCompare(nameB || '');
                                                                                    })
                                                                                    .map((enr: any) => {
                                                                                        const bName = enr.dependent
                                                                                            ? holder.collab.dependents.find((d: any) => d._id === enr.dependent)?.name
                                                                                            : holder.collab.name;

                                                                                        return (
                                                                                            <div key={enr._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/5">
                                                                                                <div className="flex items-center gap-4">
                                                                                                    <div className={`h-2 w-2 rounded-full ${enr.dependent ? 'bg-orange-400' : 'bg-primary shadow-lg shadow-primary/20'}`} />
                                                                                                    <div className="space-y-0.5">
                                                                                                        <p className="text-sm font-bold leading-none">{bName} <span className="text-[9px] text-muted-foreground font-medium ml-1">({enr.dependent ? 'Dependente' : 'Titular'})</span></p>
                                                                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider leading-tight">
                                                                                                            {(enr.healthPlan || enr.dentalPlan)?.operator} - {(enr.healthPlan || enr.dentalPlan)?.planName} • {enr.type === 'Dental' ? 'Odonto' : 'Saúde'}
                                                                                                            {(enr.healthPlanCredential || enr.dentalPlanCredential) && (
                                                                                                                <> • ID: <span className="text-primary">{enr.healthPlanCredential || enr.dentalPlanCredential}</span></>
                                                                                                            )}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-4">
                                                                                                    <div className="text-right">
                                                                                                        <p className="text-sm font-black text-primary">R$ {enr.monthlyCost.toFixed(2)}</p>
                                                                                                        {enr.retroactiveDiff > 0 && (
                                                                                                            <Badge variant="secondary" className="text-[8px] py-0 px-1.5 h-3.5 bg-orange-100 text-orange-700 border-none">
                                                                                                                + R$ {enr.retroactiveDiff.toFixed(2)}
                                                                                                            </Badge>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="flex gap-0.5">
                                                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => handleEditClick(enr)}>
                                                                                                            <Edit className="h-3 w-3" />
                                                                                                        </Button>
                                                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(enr._id)}>
                                                                                                            <Trash className="h-3 w-3" />
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )
                                                                                    })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- MODAL DE GERAÇÃO DE FATURA --- */}
            <Dialog open={billingModal.open} onOpenChange={(val) => setBillingModal({ ...billingModal, open: val })}>
                <DialogContent className="sm:max-w-md rounded-[32px] p-8 border-none shadow-2xl font-outfit">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                💰
                            </div>
                            Gerar Fatura Mensal
                        </DialogTitle>
                        <DialogDescription className="font-medium pt-2 text-muted-foreground">
                            Consolide todas as adesões ativas e crie um lançamento no Contas a Pagar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Ano</Label>
                                <Input
                                    type="number"
                                    className="h-12 text-center font-black text-primary rounded-2xl bg-muted/30 border-none"
                                    value={billingYear}
                                    onChange={(e) => setBillingYear(Number(e.target.value))}
                                    min={2020}
                                    max={2050}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Mês</Label>
                                <select
                                    className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                    value={billingMonth}
                                    onChange={(e) => setBillingMonth(Number(e.target.value))}
                                >
                                    {months.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Data de Vencimento</Label>
                            <Input
                                type="date"
                                className="h-12 font-bold text-primary rounded-2xl bg-muted/30 border-none"
                                value={billingDueDate}
                                onChange={(e) => setBillingDueDate(e.target.value)}
                            />
                        </div>

                        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <p className="text-xs font-bold text-blue-900 mb-2">ℹ️ Informações Importantes</p>
                            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                                <li>Todas as adesões ativas serão consolidadas</li>
                                <li>Diferenças retroativas serão incluídas e zeradas</li>
                                <li>Transações já pagas não serão sobrescritas</li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center pt-2">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => setBillingModal({ open: false, plan: null })}>
                                Cancelar
                            </Button>
                            <Button
                                className="h-12 rounded-2xl font-bold gap-2"
                                onClick={handleGenerateBilling}
                                disabled={billingLoading}
                            >
                                {billingLoading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Gerar Lançamentos'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL DE FEEDBACK (SUCESSO/ERRO) --- */}
            <Dialog open={feedback.type !== null} onOpenChange={() => setFeedback({ ...feedback, type: null })}>
                <DialogContent className="sm:max-w-[440px] border-none shadow-2xl rounded-[32px] overflow-hidden p-0 bg-background/95 backdrop-blur-xl">
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
                            <h3 className="text-3xl font-black font-outfit text-primary tracking-tight leading-none">{feedback.title}</h3>
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

export default Enrollments;
