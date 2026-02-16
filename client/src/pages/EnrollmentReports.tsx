import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FileText,
    Download,
    Search,
    X,
    Filter,
    Table as TableIcon,
    FileSpreadsheet,
    Calendar,
    User,
    ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EnrollmentReports = () => {
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [collaboratorId, setCollaboratorId] = useState('');
    const [financialResponsibleId, setFinancialResponsibleId] = useState('');
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchCollaborators();
        fetchEnrollments();
    }, []);

    const fetchCollaborators = async () => {
        try {
            const { data } = await api.get('/collaborators');
            setCollaborators(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Failed to fetch collaborators', error);
        }
    };

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (collaboratorId) params.collaboratorId = collaboratorId;
            if (financialResponsibleId) params.financialResponsibleId = financialResponsibleId;
            if (type !== 'all') params.type = type;
            if (status !== 'all') params.status = status;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const { data } = await api.get('/enrollments', { params });
            setEnrollments(data);
        } catch (error) {
            console.error('Failed to fetch enrollments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEnrollments();
    };

    const clearFilters = () => {
        setCollaboratorId('');
        setFinancialResponsibleId('');
        setType('all');
        setStatus('all');
        setStartDate('');
        setEndDate('');
        setTimeout(fetchEnrollments, 0);
    };

    const exportToCSV = () => {
        const headers = ["Titular,Dependente,Tipo,Plano,Resp. Financeiro,Status,Vencimento,Custo Mensal"];
        const rows = enrollments.map(enr => {
            const titular = enr.collaborator?.name || '';
            const dependente = enr.dependent ? enr.collaborator?.dependents?.find((d: any) => d._id === enr.dependent)?.name : '-';
            const typeLabel = enr.type === 'Health' ? 'Saúde' : 'Odontológico';
            const planName = enr.healthPlan?.planName || enr.dentalPlan?.planName || '-';
            const responsible = enr.financialResponsible?.name || titular;
            const statusLabel = enr.status === 'active' ? 'Ativo' : enr.status === 'inactive' ? 'Inativo' : 'Pendente';
            const billingDay = enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay;
            const dueDate = billingDay ? `Dia ${billingDay}` : '-';
            const cost = enr.monthlyCost.toFixed(2);

            return `"${titular}","${dependente}","${typeLabel}","${planName}","${responsible}","${statusLabel}","${dueDate}","${cost}"`;
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_adesao_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const data = enrollments.map(enr => ({
            'Titular': enr.collaborator?.name || '',
            'Beneficiário': enr.dependent ? enr.collaborator?.dependents?.find((d: any) => d._id === enr.dependent)?.name : 'TITULAR',
            'Tipo': enr.type === 'Health' ? 'Saúde' : 'Odontológico',
            'Operadora': enr.healthPlan?.operator || enr.dentalPlan?.operator || '-',
            'Plano': enr.healthPlan?.planName || enr.dentalPlan?.planName || '-',
            'Cód. ANS': enr.healthPlan?.ansCode || '-',
            'Resp. Financeiro': enr.financialResponsible?.name || enr.collaborator?.name || '',
            'Status': enr.status === 'active' ? 'Ativo' : enr.status === 'inactive' ? 'Inativo' : 'Pendente',
            'Vencimento': enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay ? `Dia ${enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay}` : '-',
            'Custo Mensal': enr.monthlyCost,
            'Diferença Retroativa': enr.retroactiveDiff
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Adesões");
        XLSX.writeFile(wb, `relatorio_adesao_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Add Logo and Branding
        const logoUrl = '/logo.png';
        const systemName = 'WayFin';

        // Header Background
        doc.setFillColor(37, 99, 235); // Blue 600
        doc.rect(0, 0, pageWidth, 25, 'F');

        // Add Logo Image
        try {
            doc.addImage(logoUrl, 'PNG', 15, 5, 10, 10);
        } catch (e) {
            console.error('Failed to add logo to PDF', e);
        }

        // Add System Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text(systemName, 28, 17);

        // Add Main Title
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('Relatório de Adesão aos Planos', pageWidth - 15, 17, { align: 'right' });

        // Metadata
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 32);
        doc.text(`Total de registros: ${enrollments.length}`, pageWidth - 15, 32, { align: 'right' });

        const tableColumn = ["Titular", "Beneficiário", "Tipo", "Operadora / Plano", "Resp. Financeiro", "Status", "Vencimento", "Custo"];
        const tableRows = enrollments.map(enr => [
            enr.collaborator?.name || '',
            enr.dependent ? enr.collaborator?.dependents?.find((d: any) => d._id === enr.dependent)?.name : 'TITULAR',
            enr.type === 'Health' ? 'Saúde' : 'Odonto',
            `${enr.healthPlan?.operator || enr.dentalPlan?.operator || '-'} / ${enr.healthPlan?.planName || enr.dentalPlan?.planName || '-'}`,
            enr.financialResponsible?.name || enr.collaborator?.name || '',
            enr.status === 'active' ? 'Ativo' : enr.status === 'pending' ? 'Pendente' : 'Inativo',
            enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay ? `Dia ${enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay}` : '-',
            `R$ ${enr.monthlyCost.toFixed(2)}`
        ]);

        const totalCost = enrollments.reduce((sum, enr) => sum + enr.monthlyCost, 0);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 38,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            foot: [['', '', '', '', '', '', 'TOTAL:', `R$ ${totalCost.toFixed(2)}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
            columnStyles: {
                7: { halign: 'right' }
            }
        });

        doc.save(`relatorio_adesao_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                        Relatórios de Adesão
                    </h1>
                    <p className="text-muted-foreground font-medium">Extraia dados detalhados das adesões aos planos de saúde e odontológicos.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportToExcel}>
                        <FileSpreadsheet className="h-4 w-4" /> Excel
                    </Button>
                    <Button variant="outline" className="gap-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50" onClick={exportToPDF}>
                        <Download className="h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" className="gap-2 font-bold" onClick={exportToCSV}>
                        <TableIcon className="h-4 w-4" /> CSV
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-primary/5 bg-white/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-primary/80">
                        <Filter className="h-4 w-4" /> Filtros Avançados
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Titular</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <select
                                    className="flex h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                    value={collaboratorId}
                                    onChange={(e) => setCollaboratorId(e.target.value)}
                                >
                                    <option value="">Todos os Titulares</option>
                                    {collaborators.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Resp. Financeiro</Label>
                            <div className="relative">
                                <ClipboardCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <select
                                    className="flex h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                    value={financialResponsibleId}
                                    onChange={(e) => setFinancialResponsibleId(e.target.value)}
                                >
                                    <option value="">Todos os Responsáveis</option>
                                    {collaborators.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Tipo de Plano</Label>
                            <select
                                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="all">Filtro: Ambos</option>
                                <option value="Health">Saúde</option>
                                <option value="Dental">Odontológico</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Status</Label>
                            <select
                                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="all">Todos os Status</option>
                                <option value="active">Ativos</option>
                                <option value="inactive">Inativos</option>
                                <option value="pending">Pendentes</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Data Inicial</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    type="date"
                                    className="h-12 pl-10 rounded-2xl bg-background border-input font-bold"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Data Final</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    type="date"
                                    className="h-12 pl-10 rounded-2xl bg-background border-input font-bold"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 flex items-end gap-3">
                            <Button type="submit" className="h-12 flex-1 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all">
                                <Search className="mr-2 h-5 w-5" /> Filtrar Resultados
                            </Button>
                            <Button type="button" variant="outline" className="h-12 w-12 rounded-2xl border-2 shrink-0 p-0" onClick={clearFilters}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-primary/5 bg-white/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-primary/5 border-b border-primary/10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-primary/70 tracking-wider">Beneficiário / Titular</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-primary/70 tracking-wider">Plano</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-primary/70 tracking-wider">Resp. Financeiro</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-primary/70 tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-primary/70 tracking-wider text-right">Custo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                                                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Carregando...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : enrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-bold">
                                            Nenhuma adesão encontrada com os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : enrollments.map((enr) => {
                                    const titular = enr.collaborator?.name || 'Desconhecido';
                                    const beneficiario = enr.dependent ? enr.collaborator?.dependents?.find((d: any) => d._id === enr.dependent)?.name : 'TITULAR';
                                    const planLabel = enr.healthPlan?.planName || enr.dentalPlan?.planName || '-';
                                    const operatorLabel = enr.healthPlan?.operator || enr.dentalPlan?.operator || '';
                                    const responsible = enr.financialResponsible?.name || titular;

                                    return (
                                        <tr key={enr._id} className="hover:bg-primary/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-black text-primary">{beneficiario}</div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                    {enr.dependent ? <span className="text-blue-600">TITULAR:</span> : <span className="text-emerald-600">PRÓPRIO</span>} {titular}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${enr.type === 'Health' ? 'bg-blue-500' : 'bg-purple-500'}`} title={enr.type === 'Health' ? 'Saúde' : 'Odonto'} />
                                                    <span className="font-bold text-foreground/80">{operatorLabel} - {planLabel}</span>
                                                </div>
                                                {(enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay) && (
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                                        VENCIMENTO: DIA {enr.healthPlan?.billingDay || enr.dentalPlan?.billingDay}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 font-bold text-muted-foreground text-sm">
                                                {responsible}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${enr.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    enr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {enr.status === 'active' ? 'Ativo' : enr.status === 'pending' ? 'Pendente' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-primary">
                                                R$ {enr.monthlyCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {enrollments.length > 0 && !loading && (
                                <tfoot className="bg-primary/5 border-t border-primary/10">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-black text-primary/70 uppercase">Total do Relatório:</td>
                                        <td className="px-6 py-4 text-right font-black text-xl text-primary">
                                            R$ {enrollments.reduce((sum, enr) => sum + enr.monthlyCost, 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EnrollmentReports;
