import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { maskCPF, maskCEP, maskNIS } from '@/lib/masks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Edit, Trash, X, Save, FileText, History, UserPen, MapPin, Briefcase, DollarSign, Camera, Loader2, Copy, CircleAlert, CircleCheck } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

const UF_LIST = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    let sum = 0;
    let rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
    return true;
};

const Collaborators = () => {
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [cities, setCities] = useState<any[]>([]);
    const [depCitiesMap, setDepCitiesMap] = useState<Record<number, any[]>>({});
    const [loadingCities, setLoadingCities] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, title: string, message: string, detail?: string }>({ type: null, title: '', message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Form State
    const initialFormState = {
        name: '',
        registrationNumber: '',
        esocialMatricula: '',
        personalData: {
            photo: '',
            motherName: '',
            fatherName: '',
            birthDate: '',
            gender: 'Masculino',
            country: 'Brasil',
            ufNaturalidade: '',
            placeOfBirth: '',
            nationality: 'Brasileira',
            maritalStatus: 'Solteiro(a)',
            race: '',
            educationLevel: '',
            address: {
                cep: '', street: '', number: '', complement: '',
                neighborhood: '', city: '', state: ''
            },
            phone: '',
            mobile: '',
            email: '',
        },
        documents: {
            cpf: '',
            ctps: { number: '', series: '', dv: '', uf: '', issuanceDate: '' },
            nis: '',
            dnv: '',
            rg: { number: '', issuanceDate: '', issuer: '', uf: '' },
            title: { number: '', zone: '', section: '' },
            cnh: { number: '', category: '', validity: '' },
            military: { certificate: '', series: '', type: '', category: '', csmOam: '', rmDnComar: '' },
            classOrg: { council: '', uf: '', number: '', issuanceDate: '', validity: '' },
        },
        immigration: { arrivalYear: '', visaType: '', rgValidity: '', ctpsValidity: '' },
        contractual: { admissionDate: '', paymentMethod: 'Mensalista', department: '', jobTitle: '', terminationDate: '' },
        workShift: {
            code: '', description: '', observations: '',
            schedule: {
                monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '',
                slots: {
                    monday: { e1: '', s1: '', e2: '', s2: '' },
                    tuesday: { e1: '', s1: '', e2: '', s2: '' },
                    wednesday: { e1: '', s1: '', e2: '', s2: '' },
                    thursday: { e1: '', s1: '', e2: '', s2: '' },
                    friday: { e1: '', s1: '', e2: '', s2: '' },
                    saturday: { e1: '', s1: '', e2: '', s2: '' },
                    sunday: { e1: '', s1: '', e2: '', s2: '' },
                }
            }
        },
        otherInfo: { participatesCipa: false, lastMedicalExam: '' },
        jobHistory: [],
        salaryHistory: [],
        dependents: []
    };

    const [formData, setFormData] = useState<any>(initialFormState);

    useEffect(() => {
        fetchCollaborators();
    }, []);

    const fetchCollaborators = async () => {
        try {
            const { data } = await api.get('/collaborators');
            setCollaborators(data);
        } catch (error) {
            console.error('Failed to fetch collaborators', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('photo', file);

        setUploading(true);
        try {
            const { data } = await api.post('/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleChange('personalData.photo', data.url);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Falha ao enviar foto');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (path: string, value: any) => {
        const keys = path.split('.');
        setFormData((prev: any) => {
            const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const handleCepLookup = async (value: string) => {
        const masked = maskCEP(value);
        handleChange('personalData.address.cep', masked);

        const cleanedCep = masked.replace(/\D/g, '');
        if (cleanedCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    handleChange('personalData.address.street', data.logradouro);
                    handleChange('personalData.address.neighborhood', data.bairro);
                    handleChange('personalData.address.city', data.localidade);
                    handleChange('personalData.address.state', data.uf);
                }
            } catch (error) {
                console.error('CEP lookup failed', error);
            }
        }
    };

    const fetchCities = async (uf: string, dependentIndex?: number) => {
        if (!uf) {
            if (dependentIndex !== undefined) {
                setDepCitiesMap(prev => ({ ...prev, [dependentIndex]: [] }));
            } else {
                setCities([]);
            }
            return;
        }

        if (dependentIndex === undefined) setLoadingCities(true);
        try {
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const data = await response.json();
            const cityList = data.map((c: any) => ({ name: c.nome }));

            if (dependentIndex !== undefined) {
                setDepCitiesMap(prev => ({ ...prev, [dependentIndex]: cityList }));
            } else {
                setCities(cityList);
            }
        } catch (error) {
            console.error('Failed to fetch cities', error);
            if (dependentIndex !== undefined) {
                setDepCitiesMap(prev => ({ ...prev, [dependentIndex]: [] }));
            } else {
                setCities([]);
            }
        } finally {
            if (dependentIndex === undefined) setLoadingCities(false);
        }
    };

    useEffect(() => {
        if (formData.personalData.ufNaturalidade) {
            fetchCities(formData.personalData.ufNaturalidade);
        }
    }, [formData.personalData.ufNaturalidade]);

    const handleEdit = (collab: any) => {
        setEditingCollaborator(collab);

        // Map backend dates to string YYYY-MM-DD for inputs
        const formatDate = (date: any) => date ? new Date(date).toISOString().split('T')[0] : '';

        const preparedData = {
            ...initialFormState,
            ...collab,
            personalData: {
                ...initialFormState.personalData,
                ...(collab.personalData || {}),
                address: { ...initialFormState.personalData.address, ...(collab.personalData?.address || {}) },
                birthDate: formatDate(collab.personalData?.birthDate),
            },
            documents: {
                ...initialFormState.documents,
                ...(collab.documents || {}),
                ctps: { ...initialFormState.documents.ctps, ...(collab.documents?.ctps || {}), issuanceDate: formatDate(collab.documents?.ctps?.issuanceDate) },
                rg: { ...initialFormState.documents.rg, ...(collab.documents?.rg || {}), issuanceDate: formatDate(collab.documents?.rg?.issuanceDate) },
                cnh: { ...initialFormState.documents.cnh, ...(collab.documents?.cnh || {}), validity: formatDate(collab.documents?.cnh?.validity) },
                classOrg: {
                    ...initialFormState.documents.classOrg,
                    ...(collab.documents?.classOrg || {}),
                    issuanceDate: formatDate(collab.documents?.classOrg?.issuanceDate),
                    validity: formatDate(collab.documents?.classOrg?.validity)
                },
            },
            contractual: {
                ...initialFormState.contractual,
                ...(collab.contractual || {}),
                admissionDate: formatDate(collab.contractual?.admissionDate),
                terminationDate: formatDate(collab.contractual?.terminationDate),
            },
            otherInfo: {
                ...initialFormState.otherInfo,
                ...(collab.otherInfo || {}),
                lastMedicalExam: formatDate(collab.otherInfo?.lastMedicalExam),
            },
            workShift: {
                ...initialFormState.workShift,
                ...(collab.workShift || {}),
                schedule: {
                    ...initialFormState.workShift.schedule,
                    ...(collab.workShift?.schedule || {}),
                    slots: { ...initialFormState.workShift.schedule.slots, ...(collab.workShift?.schedule?.slots || {}) }
                }
            },
            dependents: (collab.dependents || []).map((d: any) => ({ ...d, birthDate: formatDate(d.birthDate) }))
        };

        setFormData(preparedData);

        // Pre-fetch cities for naturalidade
        if (preparedData.personalData.ufNaturalidade) {
            fetchCities(preparedData.personalData.ufNaturalidade);
        }
        preparedData.dependents.forEach((dep: any, idx: number) => {
            if (dep.ufNaturalidade) {
                fetchCities(dep.ufNaturalidade, idx);
            }
        });

        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name) {
            setFeedback({ type: 'error', title: 'Campo Obrigatório', message: 'O Nome Completo é obrigatório para o cadastro.' });
            return;
        }
        if (!formData.documents.cpf) {
            setFeedback({ type: 'error', title: 'Campo Obrigatório', message: 'O CPF é obrigatório para identificação.' });
            return;
        }
        if (!validateCPF(formData.documents.cpf)) {
            setFeedback({ type: 'error', title: 'CPF Inválido', message: 'O CPF informado não passou na validação de dígitos. Verifique se digitou corretamente.' });
            return;
        }
        if (!formData.personalData.birthDate) {
            setFeedback({ type: 'error', title: 'Campo Obrigatório', message: 'A Data de Nascimento é essencial para o cadastro.' });
            return;
        }
        if (!formData.personalData.gender) {
            setFeedback({ type: 'error', title: 'Campo Obrigatório', message: 'O Gênero é obrigatório para as regras de benefícios.' });
            return;
        }

        try {
            const payload = JSON.parse(JSON.stringify(formData));

            // Cleanup: remove empty strings from date fields and empty optional objects
            const cleanup = (obj: any) => {
                for (const key in obj) {
                    if (obj[key] === '') {
                        const deleteIfEmpty = ['birthDate', 'admissionDate', 'terminationDate', 'issuanceDate', 'validity', 'lastMedicalExam', 'gender'];
                        if (deleteIfEmpty.includes(key)) {
                            delete obj[key];
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        cleanup(obj[key]);
                        // If object becomes empty after cleanup, and it's not a root required one, delete it
                        if (Object.keys(obj[key]).length === 0) {
                            const optionalObjects = ['military', 'title', 'cnh', 'classOrg', 'immigration', 'workShift', 'address', 'rg', 'ctps'];
                            if (optionalObjects.includes(key)) {
                                delete obj[key];
                            }
                        }
                    }
                }
            };
            cleanup(payload);

            // Unmask key fields
            if (payload.documents?.cpf) payload.documents.cpf = payload.documents.cpf.replace(/\D/g, '');
            if (payload.personalData?.address?.cep) payload.personalData.address.cep = payload.personalData.address.cep.replace(/\D/g, '');
            if (payload.dependents) {
                payload.dependents = payload.dependents.map((d: any) => ({
                    ...d,
                    cpf: d.cpf?.replace(/\D/g, '')
                }));
            }

            if (editingCollaborator) {
                await api.put(`/collaborators/${editingCollaborator._id}`, payload);
            } else {
                await api.post('/collaborators', payload);
            }

            setFeedback({ type: 'success', title: 'Sucesso!', message: `Colaborador ${editingCollaborator ? 'atualizado' : 'cadastrado'} com sucesso no sistema.` });
            setOpen(false);
            setFormData(initialFormState);
            setEditingCollaborator(null);
            fetchCollaborators();
        } catch (error: any) {
            console.error('Save failed', error);
            const errorMsg = error.response?.data?.message || error.message || 'Houve um problema ao processar o cadastro.';
            const errorDetail = JSON.stringify({
                message: errorMsg,
                status: error.response?.status,
                data: error.response?.data,
                config: { url: error.config?.url, method: error.config?.method }
            }, null, 2);

            setFeedback({
                type: 'error',
                title: 'Erro ao Salvar',
                message: errorMsg,
                detail: errorDetail
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este colaborador?')) return;
        try {
            await api.delete(`/collaborators/${id}`);
            fetchCollaborators();
        } catch (error) {
            alert('Falha ao excluir colaborador');
        }
    };

    const addHistoryItem = (type: 'job' | 'salary') => {
        if (type === 'job') {
            handleChange('jobHistory', [...formData.jobHistory, { monthYear: '', cbo: '', jobTitle: '' }]);
        } else {
            handleChange('salaryHistory', [...formData.salaryHistory, { monthYear: '', value: 0 }]);
        }
    };

    const removeHistoryItem = (type: 'job' | 'salary', index: number) => {
        const list = type === 'job' ? [...formData.jobHistory] : [...formData.salaryHistory];
        list.splice(index, 1);
        handleChange(type === 'job' ? 'jobHistory' : 'salaryHistory', list);
    };

    const updateHistoryItem = (type: 'job' | 'salary', index: number, field: string, value: any) => {
        const list = type === 'job' ? [...formData.jobHistory] : [...formData.salaryHistory];
        list[index][field] = value;
        handleChange(type === 'job' ? 'jobHistory' : 'salaryHistory', list);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary font-outfit">Colaboradores</h1>
                    <p className="text-muted-foreground">Visão 360º e gestão completa do ciclo de vida HR.</p>
                </div>

                <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setFormData(initialFormState); setEditingCollaborator(null); } }}>
                    <Button className="gap-2 shadow-lg hover:shadow-primary/20 transition-all" onClick={() => { setFormData(initialFormState); setOpen(true); }}>
                        <Plus className="h-4 w-4" /> Novo Colaborador
                    </Button>
                    <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none rounded-2xl shadow-2xl">
                        <DialogHeader className="p-6 bg-primary/5 border-b">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <UserPen className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl">{editingCollaborator ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
                                    <DialogDescription>Gestão completa de dados pessoais, documentos e histórico.</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSubmit}>
                            <Tabs defaultValue="geral" className="w-full">
                                <div className="px-6 bg-primary/5">
                                    <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6">
                                        <TabsTrigger value="geral" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-4 text-sm font-medium transition-all">Geral e Endereço</TabsTrigger>
                                        <TabsTrigger value="docs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-4 text-sm font-medium transition-all">Documentação</TabsTrigger>
                                        <TabsTrigger value="contrato" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-4 text-sm font-medium transition-all">Contrato e Imigração</TabsTrigger>
                                        <TabsTrigger value="historico" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-4 text-sm font-medium transition-all">Histórico Profissional</TabsTrigger>
                                        <TabsTrigger value="dependents" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-4 text-sm font-medium transition-all">Dependentes</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="p-6">
                                    {/* --- TAB GERAL --- */}
                                    <TabsContent value="geral" className="mt-0 space-y-6 animate-in slide-in-from-left-2 transition-all">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            {/* Coluna de Campos (Esquerda) */}
                                            <div className="md:col-span-3 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                                    <div className="md:col-span-3 space-y-2">
                                                        <Label className="text-primary font-bold">Nome Completo <span className="text-destructive">*</span></Label>
                                                        <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="h-11 border-primary/10 bg-background focus:ring-2 focus:ring-primary/20" placeholder="Nome completo do colaborador" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Matrícula</Label>
                                                        <Input value={formData.registrationNumber} disabled className="bg-muted/50 font-mono text-center" placeholder="Auto" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Nome da Mãe</Label>
                                                        <Input value={formData.personalData.motherName} onChange={(e) => handleChange('personalData.motherName', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Nome do Pai</Label>
                                                        <Input value={formData.personalData.fatherName} onChange={(e) => handleChange('personalData.fatherName', e.target.value)} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>UF Naturalidade</Label>
                                                        <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.personalData.ufNaturalidade} onChange={(e) => {
                                                            handleChange('personalData.ufNaturalidade', e.target.value);
                                                            handleChange('personalData.placeOfBirth', ''); // Reset city
                                                        }}>
                                                            <option value="">Selecione...</option>
                                                            {UF_LIST.map(uf => (
                                                                <option key={uf} value={uf}>{uf}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Cidade Naturalidade</Label>
                                                        <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.personalData.placeOfBirth} onChange={(e) => handleChange('personalData.placeOfBirth', e.target.value)} disabled={!formData.personalData.ufNaturalidade || loadingCities}>
                                                            <option value="">{loadingCities ? 'Carregando...' : !formData.personalData.ufNaturalidade ? 'Aguardando UF...' : 'Selecione a cidade...'}</option>
                                                            {cities.map(city => (
                                                                <option key={city.name} value={city.name}>{city.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Nacionalidade</Label>
                                                        <Input value={formData.personalData.nationality} onChange={(e) => handleChange('personalData.nationality', e.target.value)} placeholder="Ex: Brasileira" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Coluna da Foto (Direita) */}
                                            <div className="md:col-span-1 flex flex-col items-center">
                                                <Label className="mb-2 text-xs uppercase text-muted-foreground font-bold">Foto do Colaborador</Label>
                                                <div
                                                    className="w-full aspect-[3/4] max-w-[160px] bg-muted rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group overflow-hidden relative shadow-inner"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    {formData.personalData.photo ? (
                                                        <img
                                                            src={`http://localhost:5001${formData.personalData.photo}`}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <>
                                                            <Users className="h-10 w-10 text-muted-foreground group-hover:scale-110 transition-transform" />
                                                            <span className="text-[10px] text-muted-foreground mt-2 font-medium">Foto 3x4</span>
                                                        </>
                                                    )}

                                                    {uploading && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                        </div>
                                                    )}

                                                    <div className="absolute bottom-0 inset-x-0 bg-primary/60 py-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Camera className="h-4 w-4 text-white" />
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handlePhotoUpload}
                                                />
                                                <div className="mt-4 w-full space-y-2">
                                                    <Label>eSocial</Label>
                                                    <Input value={formData.esocialMatricula} onChange={(e) => handleChange('esocialMatricula', e.target.value)} placeholder="ID eSocial" className="h-9 text-xs" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="flex items-center gap-2 text-sm font-semibold mb-4 text-primary">
                                                <MapPin className="h-4 w-4" /> Endereço Residencial
                                            </h4>
                                            <div className="grid grid-cols-6 gap-4">
                                                <div className="col-span-1">
                                                    <Label>CEP</Label>
                                                    <Input value={formData.personalData.address.cep} onChange={(e) => handleCepLookup(e.target.value)} />
                                                </div>
                                                <div className="col-span-4">
                                                    <Label>Rua/Avenida</Label>
                                                    <Input value={formData.personalData.address.street} readOnly className="bg-muted/30 cursor-not-allowed" />
                                                </div>
                                                <div className="col-span-1">
                                                    <Label>Nº</Label>
                                                    <Input value={formData.personalData.address.number} onChange={(e) => handleChange('personalData.address.number', e.target.value)} />
                                                </div>
                                                <div className="col-span-4">
                                                    <Label>Complemento</Label>
                                                    <Input value={formData.personalData.address.complement} onChange={(e) => handleChange('personalData.address.complement', e.target.value)} placeholder="Apto, Bloco, etc." />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label>Bairro</Label>
                                                    <Input value={formData.personalData.address.neighborhood} readOnly className="bg-muted/30 cursor-not-allowed" />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label>UF</Label>
                                                    <Input
                                                        value={formData.personalData.address.state}
                                                        readOnly
                                                        className="bg-muted/30 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div className="col-span-4">
                                                    <Label>Cidade</Label>
                                                    <Input value={formData.personalData.address.city} readOnly className="bg-muted/30 cursor-not-allowed" />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* --- TAB DOCUMENTOS --- */}
                                    <TabsContent value="docs" className="mt-0 space-y-6 animate-in slide-in-from-right-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Card: Informações Pessoais Essenciais */}
                                            <Card className="border-primary/10 shadow-sm overflow-hidden md:col-span-2">
                                                <div className="bg-primary/5 px-6 py-4 border-b flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-bold text-primary">Informações Pessoais e Estado Civil</h3>
                                                </div>
                                                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-2">
                                                        <Label>Data de Nascimento <span className="text-destructive">*</span></Label>
                                                        <Input type="date" value={formData.personalData.birthDate} onChange={(e) => handleChange('personalData.birthDate', e.target.value)} className="h-11" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Gênero <span className="text-destructive">*</span></Label>
                                                        <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.personalData.gender} onChange={(e) => handleChange('personalData.gender', e.target.value)}>
                                                            <option value="">Selecione...</option>
                                                            <option value="Masculino">Masculino</option>
                                                            <option value="Feminino">Feminino</option>
                                                            <option value="Outro">Outro</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Estado Civil</Label>
                                                        <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.personalData.maritalStatus} onChange={(e) => handleChange('personalData.maritalStatus', e.target.value)}>
                                                            <option value="">Selecione...</option>
                                                            <option value="Solteiro(a)">Solteiro(a)</option>
                                                            <option value="Casado(a)">Casado(a)</option>
                                                            <option value="Divorciado(a)">Divorciado(a)</option>
                                                            <option value="Viúvo(a)">Viúvo(a)</option>
                                                        </select>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Card: Documentos Básicos */}
                                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                                <div className="bg-primary/5 px-6 py-4 border-b flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-bold text-primary">Identificação Básica</h3>
                                                </div>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2 col-span-2">
                                                            <Label className="text-primary font-bold">CPF <span className="text-destructive">*</span></Label>
                                                            <Input value={formData.documents.cpf} onChange={(e) => handleChange('documents.cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" className="h-11 bg-primary/5 focus:bg-background transition-all" />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>NIS (PIS/PASEP)</Label>
                                                            <Input value={formData.documents.nis} onChange={(e) => handleChange('documents.nis', maskNIS(e.target.value))} placeholder="000.00000.00-0" className="h-11" />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>RG Número</Label>
                                                            <Input value={formData.documents.rg.number} onChange={(e) => handleChange('documents.rg.number', e.target.value)} className="h-11" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Emissão</Label>
                                                            <Input type="date" value={formData.documents.rg.issuanceDate} onChange={(e) => handleChange('documents.rg.issuanceDate', e.target.value)} className="h-11" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Órgão Emissor/UF</Label>
                                                            <div className="flex gap-2">
                                                                <Input value={formData.documents.rg.issuer} onChange={(e) => handleChange('documents.rg.issuer', e.target.value)} placeholder="SSP" className="h-11" />
                                                                <select className="flex h-11 w-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:ring-1 transition-all" value={formData.documents.rg.uf} onChange={(e) => handleChange('documents.rg.uf', e.target.value)}>
                                                                    <option value="">UF</option>
                                                                    {UF_LIST.map(uf => (
                                                                        <option key={uf} value={uf}>{uf}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>DNV (Declaração Nasc. Vivo)</Label>
                                                            <Input value={formData.documents.dnv} onChange={(e) => handleChange('documents.dnv', e.target.value)} className="h-11" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Card: CTPS e Profissional */}
                                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                                <div className="bg-primary/5 px-6 py-4 border-b flex items-center gap-2">
                                                    <Briefcase className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-bold text-primary">Documentos Profissionais</h3>
                                                </div>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label>Nº CTPS</Label><Input value={formData.documents.ctps.number} onChange={(e) => handleChange('documents.ctps.number', e.target.value)} className="h-11" /></div>
                                                        <div className="space-y-2"><Label>Série/DV</Label>
                                                            <div className="flex gap-2">
                                                                <Input value={formData.documents.ctps.series} onChange={(e) => handleChange('documents.ctps.series', e.target.value)} placeholder="Série" className="h-11" />
                                                                <Input value={formData.documents.ctps.dv} onChange={(e) => handleChange('documents.ctps.dv', e.target.value)} placeholder="DV" className="w-14 h-11 text-center" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>UF CTPS</Label>
                                                            <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:ring-1 transition-all" value={formData.documents.ctps.uf} onChange={(e) => handleChange('documents.ctps.uf', e.target.value)}>
                                                                <option value="">Selecione...</option>
                                                                {UF_LIST.map(uf => (
                                                                    <option key={uf} value={uf}>{uf}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2"><Label>Emissão</Label><Input type="date" value={formData.documents.ctps.issuanceDate} onChange={(e) => handleChange('documents.ctps.issuanceDate', e.target.value)} className="h-11" /></div>

                                                        <div className="col-span-2 pt-4 border-t mt-2 space-y-4">
                                                            <h4 className="text-sm font-bold text-primary uppercase tracking-tight">Registro de Classe</h4>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div className="space-y-1"><Label>Conselho</Label><Input value={formData.documents.classOrg.council} onChange={(e) => handleChange('documents.classOrg.council', e.target.value)} className="h-11" /></div>
                                                                <div className="space-y-1">
                                                                    <Label>UF</Label>
                                                                    <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:ring-1 transition-all" value={formData.documents.classOrg.uf} onChange={(e) => handleChange('documents.classOrg.uf', e.target.value)}>
                                                                        <option value="">Selecione...</option>
                                                                        {UF_LIST.map(uf => (
                                                                            <option key={uf} value={uf}>{uf}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-1"><Label>Número</Label><Input value={formData.documents.classOrg.number} onChange={(e) => handleChange('documents.classOrg.number', e.target.value)} className="h-11" /></div>
                                                                <div className="space-y-1"><Label>Expedição</Label><Input type="date" value={formData.documents.classOrg.issuanceDate} onChange={(e) => handleChange('documents.classOrg.issuanceDate', e.target.value)} className="h-11" /></div>
                                                                <div className="space-y-1 col-span-2"><Label>Validade</Label><Input type="date" value={formData.documents.classOrg.validity} onChange={(e) => handleChange('documents.classOrg.validity', e.target.value)} className="h-11" /></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Card: Eleitoral e Militar */}
                                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                                <div className="bg-primary/5 px-6 py-4 border-b flex items-center gap-2">
                                                    <History className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-bold text-primary">Eleitoral e Militar</h3>
                                                </div>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2 col-span-2"><Label>Título de Eleitor</Label><Input value={formData.documents.title.number} onChange={(e) => handleChange('documents.title.number', e.target.value)} className="h-11 font-mono" /></div>
                                                        <div className="space-y-2"><Label>Zona</Label><Input value={formData.documents.title.zone} onChange={(e) => handleChange('documents.title.zone', e.target.value)} className="h-11 text-center" /></div>
                                                        <div className="space-y-2"><Label>Seção</Label><Input value={formData.documents.title.section} onChange={(e) => handleChange('documents.title.section', e.target.value)} className="h-11 text-center" /></div>

                                                        <div className="col-span-2 pt-4 border-t mt-2 space-y-4">
                                                            <h4 className="text-sm font-bold text-primary uppercase tracking-tight">Serviço Militar</h4>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1 col-span-2"><Label>Certificado/RM</Label><Input value={formData.documents.military.certificate} onChange={(e) => handleChange('documents.military.certificate', e.target.value)} className="h-11" /></div>
                                                                <div className="space-y-1"><Label>Série/Tipo</Label><Input value={formData.documents.military.series} onChange={(e) => handleChange('documents.military.series', e.target.value)} placeholder="0/0" className="h-11" /></div>
                                                                <div className="space-y-1"><Label>RM/DN/COMAR</Label><Input value={formData.documents.military.rmDnComar} onChange={(e) => handleChange('documents.military.rmDnComar', e.target.value)} className="h-11" /></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Card: CNH */}
                                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                                <div className="bg-primary/5 px-6 py-4 border-b flex items-center gap-2">
                                                    <Camera className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-bold text-primary">Habilitação (CNH)</h3>
                                                </div>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2 col-span-2"><Label>CNH Número</Label><Input value={formData.documents.cnh.number} onChange={(e) => handleChange('documents.cnh.number', e.target.value)} className="h-11 font-mono" /></div>
                                                        <div className="space-y-2"><Label>Categoria</Label><Input value={formData.documents.cnh.category} onChange={(e) => handleChange('documents.cnh.category', e.target.value)} placeholder="AB" className="h-11 text-center font-bold" /></div>
                                                        <div className="space-y-2"><Label>Validade</Label><Input type="date" value={formData.documents.cnh.validity} onChange={(e) => handleChange('documents.cnh.validity', e.target.value)} className="h-11" /></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* --- TAB CONTRATO --- */}
                                    <TabsContent value="contrato" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card className="border-primary/10 shadow-sm">
                                                <CardHeader className="py-4"><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Dados Contratuais</CardTitle></CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label>Admissão</Label><Input type="date" value={formData.contractual.admissionDate} onChange={(e) => handleChange('contractual.admissionDate', e.target.value)} required /></div>
                                                        <div className="space-y-2"><Label>Forma de Pgto.</Label>
                                                            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.contractual.paymentMethod} onChange={(e) => handleChange('contractual.paymentMethod', e.target.value)}>
                                                                <option value="Mensalista">Mensalista</option>
                                                                <option value="Horista">Horista</option>
                                                                <option value="Comissionado">Comissionado</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2 col-span-2"><Label>Atestado Saúde Ocupacional (ASO)</Label><Input type="date" value={formData.otherInfo.lastMedicalExam} onChange={(e) => handleChange('otherInfo.lastMedicalExam', e.target.value)} /></div>
                                                        <div className="space-y-2 col-span-2"><Label>Setor / Departamento</Label><Input value={formData.contractual.department} onChange={(e) => handleChange('contractual.department', e.target.value)} /></div>
                                                        <div className="space-y-2 col-span-2"><Label>Cargo</Label><Input value={formData.contractual.jobTitle} onChange={(e) => handleChange('contractual.jobTitle', e.target.value)} placeholder="Ex: Analista de Sistemas, Gerente de Vendas..." /></div>
                                                        <div className="space-y-2 col-span-2"><Label>Desligamento</Label><Input type="date" value={formData.contractual.terminationDate} onChange={(e) => handleChange('contractual.terminationDate', e.target.value)} /></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-primary/10 shadow-sm">
                                                <CardHeader className="py-4"><CardTitle className="text-base font-bold">Imigração</CardTitle></CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label>Ano de Chegada</Label><Input type="number" value={formData.immigration.arrivalYear} onChange={(e) => handleChange('immigration.arrivalYear', e.target.value)} /></div>
                                                        <div className="space-y-2"><Label>Tipo de Visto</Label><Input value={formData.immigration.visaType} onChange={(e) => handleChange('immigration.visaType', e.target.value)} /></div>
                                                        <div className="space-y-2 col-span-2"><Label>Validade RG (Imig.)</Label><Input type="date" value={formData.immigration.rgValidity} onChange={(e) => handleChange('immigration.rgValidity', e.target.value)} /></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* --- TAB HISTORICO --- */}
                                    <TabsContent value="historico" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <section className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-sm flex items-center gap-2"><History className="h-4 w-4" /> Histórico de Cargos</h3>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => addHistoryItem('job')}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.jobHistory.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex gap-2 p-2 border rounded-lg bg-muted/10 relative group">
                                                            <Input value={item.monthYear} placeholder="MM/AAAA" className="w-24 h-9" onChange={(e) => updateHistoryItem('job', idx, 'monthYear', e.target.value)} />
                                                            <Input value={item.jobTitle} placeholder="Cargo" className="flex-1 h-9" onChange={(e) => updateHistoryItem('job', idx, 'jobTitle', e.target.value)} />
                                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeHistoryItem('job', idx)}><Trash className="h-4 w-4 text-destructive" /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            <section className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Histórico Salarial</h3>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => addHistoryItem('salary')}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.salaryHistory.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex gap-2 p-2 border rounded-lg bg-muted/10 relative group">
                                                            <Input value={item.monthYear} placeholder="MM/AAAA" className="w-24 h-9" onChange={(e) => updateHistoryItem('salary', idx, 'monthYear', e.target.value)} />
                                                            <Input type="number" value={item.value} placeholder="Valor" className="flex-1 h-9" onChange={(e) => updateHistoryItem('salary', idx, 'value', e.target.value)} />
                                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeHistoryItem('salary', idx)}><Trash className="h-4 w-4 text-destructive" /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                    </TabsContent>

                                    {/* --- TAB DEPENDENTES --- */}
                                    <TabsContent value="dependents" className="mt-0 space-y-6 animate-in slide-in-from-right-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-primary font-outfit">Dependentes e Familiares</h3>
                                                <p className="text-xs text-muted-foreground">Gerencie o círculo familiar e dependentes do plano de saúde</p>
                                            </div>
                                            <Button type="button" variant="outline" size="lg" onClick={() => handleChange('dependents', [...formData.dependents, { name: '', relationship: 'Filho(a)', birthDate: '', gender: '', cpf: '', rg: '', motherName: '', fatherName: '', placeOfBirth: '', ufNaturalidade: '', planDocuments: [] }])} className="gap-2 rounded-xl border-primary/20 hover:bg-primary/5 transition-all h-11">
                                                <Plus className="h-5 w-5 text-primary" /> Adicionar Dependente
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {formData.dependents.map((dep: any, idx: number) => (
                                                <Card key={idx} className="border-primary/10 shadow-sm overflow-hidden relative group hover:border-primary/20 transition-all">
                                                    <div className="bg-primary/5 px-6 py-4 border-b flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                <Users className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <h4 className="font-bold text-primary">{dep.name || `Dependente ${idx + 1}`}</h4>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm" onClick={() => {
                                                            const nd = [...formData.dependents]; nd.splice(idx, 1); handleChange('dependents', nd);
                                                        }}><X className="h-4 w-4" /></Button>
                                                    </div>

                                                    <CardContent className="p-6 space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="col-span-2 space-y-2">
                                                                <Label>Nome do Dependente</Label>
                                                                <Input value={dep.name} className="h-11" onChange={(e) => {
                                                                    const nd = [...formData.dependents]; nd[idx].name = e.target.value; handleChange('dependents', nd);
                                                                }} placeholder="Nome completo" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Parentesco</Label>
                                                                <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dep.relationship} onChange={(e) => {
                                                                    const nd = [...formData.dependents]; nd[idx].relationship = e.target.value; handleChange('dependents', nd);
                                                                }}>
                                                                    <option value="Esposo(a)">Esposo(a)</option>
                                                                    <option value="Filho(a)">Filho(a)</option>
                                                                    <option value="Pai/Mãe">Pai/Mãe</option>
                                                                    <option value="Outro">Outro</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Data de Nascimento</Label>
                                                                <Input type="date" value={dep.birthDate} className="h-11" onChange={(e) => {
                                                                    const nd = [...formData.dependents]; nd[idx].birthDate = e.target.value; handleChange('dependents', nd);
                                                                }} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Gênero</Label>
                                                                <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dep.gender} onChange={(e) => {
                                                                    const nd = [...formData.dependents]; nd[idx].gender = e.target.value; handleChange('dependents', nd);
                                                                }}>
                                                                    <option value="">Selecione...</option>
                                                                    <option value="Masculino">Masculino</option>
                                                                    <option value="Feminino">Feminino</option>
                                                                    <option value="Outro">Outro</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>CPF</Label>
                                                                <Input value={dep.cpf} className="h-11" onChange={(e) => {
                                                                    const nd = [...formData.dependents]; nd[idx].cpf = maskCPF(e.target.value); handleChange('dependents', nd);
                                                                }} placeholder="000.000.000-00" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>RG Número</Label>
                                                                <Input value={dep.rg} className="h-11" onChange={(e) => {
                                                                    const nd = [...formData.dependents]; nd[idx].rg = e.target.value; handleChange('dependents', nd);
                                                                }} />
                                                            </div>

                                                            <div className="col-span-2 pt-4 border-t mt-2 grid grid-cols-2 gap-4">
                                                                <div className="space-y-2"><Label>Nome do Pai</Label><Input value={dep.fatherName} className="h-11" onChange={(e) => { const nd = [...formData.dependents]; nd[idx].fatherName = e.target.value; handleChange('dependents', nd); }} /></div>
                                                                <div className="space-y-2"><Label>Nome da Mãe</Label><Input value={dep.motherName} className="h-11" onChange={(e) => { const nd = [...formData.dependents]; nd[idx].motherName = e.target.value; handleChange('dependents', nd); }} /></div>

                                                                <div className="space-y-2">
                                                                    <Label>UF Naturalidade</Label>
                                                                    <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dep.ufNaturalidade} onChange={(e) => {
                                                                        const newUf = e.target.value;
                                                                        const nd = [...formData.dependents];
                                                                        nd[idx].ufNaturalidade = newUf;
                                                                        nd[idx].placeOfBirth = ''; // Reset city
                                                                        handleChange('dependents', nd);
                                                                        fetchCities(newUf, idx);
                                                                    }}>
                                                                        <option value="">Selecione...</option>
                                                                        {UF_LIST.map(uf => (
                                                                            <option key={uf} value={uf}>{uf}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Cidade Naturalidade</Label>
                                                                    <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dep.placeOfBirth} onChange={(e) => {
                                                                        const nd = [...formData.dependents]; nd[idx].placeOfBirth = e.target.value; handleChange('dependents', nd);
                                                                    }} disabled={!dep.ufNaturalidade}>
                                                                        <option value="">{!dep.ufNaturalidade ? 'Aguardando UF...' : 'Selecione a cidade...'}</option>
                                                                        {(depCitiesMap[idx] || []).map(city => (
                                                                            <option key={city.name} value={city.name}>{city.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Documentação do Plano */}
                                                            <div className="col-span-2 pt-4 border-t mt-2">
                                                                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                                                    <h5 className="text-[10px] font-black text-primary uppercase mb-3 tracking-widest border-b border-primary/10 pb-2 flex items-center gap-2">
                                                                        <FileText className="h-3 w-3" /> Documentação do Plano
                                                                    </h5>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {['Certidão de Nascimento/RG', 'CPF', 'CNS (Cartão SUS)', 'Comprovante de Escolaridade'].map(docName => (
                                                                            <div key={docName} className="flex items-center gap-3 py-1 border-b border-primary/5 last:border-none">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`dep-${idx}-${docName}`}
                                                                                    checked={(dep.planDocuments || []).find((d: any) => d.name === docName)?.delivered || false}
                                                                                    onChange={(e) => {
                                                                                        const nd = [...formData.dependents];
                                                                                        const docs = [...(nd[idx].planDocuments || [])];
                                                                                        const docIdx = docs.findIndex((d: any) => d.name === docName);
                                                                                        if (docIdx >= 0) {
                                                                                            docs[docIdx].delivered = e.target.checked;
                                                                                        } else {
                                                                                            docs.push({ name: docName, delivered: e.target.checked, date: new Date() });
                                                                                        }
                                                                                        nd[idx].planDocuments = docs;
                                                                                        handleChange('dependents', nd);
                                                                                    }}
                                                                                    className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/30"
                                                                                />
                                                                                <Label htmlFor={`dep-${idx}-${docName}`} className="text-sm cursor-pointer select-none">{docName}</Label>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>

                            <DialogFooter className="p-6 border-t bg-primary/5 rounded-b-2xl">
                                <Button type="button" variant="outline" className="h-11 px-8 rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="h-11 px-10 rounded-xl gap-2 font-semibold shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                                    <Save className="h-4 w-4" /> {editingCollaborator ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div >

            {/* --- LISTA DE COLABORADORES --- */}
            < Card className="border-none shadow-xl shadow-primary/5 rounded-2xl overflow-hidden mt-8" >
                <CardHeader className="bg-primary/5 border-b py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold font-outfit">Base de Funcionários</CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Total: {collaborators.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {loading ? (
                            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
                        ) : collaborators.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                                <p className="text-lg">Nenhum funcionário cadastrado ainda.</p>
                                <Button variant="link" onClick={() => setOpen(true)} className="text-primary font-bold">Comece agora</Button>
                            </div>
                        ) : (
                            <div className="grid gap-0">
                                {collaborators.map((collab: any) => (
                                    <div key={collab._id} className="flex items-center justify-between p-5 hover:bg-primary/5 transition-all group border-l-4 border-transparent hover:border-primary">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center text-primary font-bold text-lg shadow-sm group-hover:rotate-6 transition-transform overflow-hidden">
                                                {collab.personalData?.photo ? (
                                                    <img
                                                        src={`http://localhost:5001${collab.personalData.photo}`}
                                                        alt={collab.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : collab.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg group-hover:text-primary transition-colors">{collab.name}</p>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {collab.contractual?.jobTitle || 'N/A'}</span>
                                                    <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                                                    <span className="flex items-center gap-1">CPF: {maskCPF(collab.documents?.cpf || collab.cpf)}</span>
                                                    <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                                                    <Badge variant="outline" className="text-[10px] py-0">{collab.dependents?.length || 0} Deps</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pr-2 scale-90 group-hover:scale-100 transition-transform">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleEdit(collab)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive shadow-none hover:text-white transition-all" onClick={() => handleDelete(collab._id)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card >
            {/* --- MODAL DE FEEDBACK (SUCESSO/ERRO) --- */}
            <Dialog open={feedback.type !== null} onOpenChange={() => setFeedback({ ...feedback, type: null })}>
                <DialogContent className="sm:max-w-[440px] border-none shadow-2xl rounded-[32px] overflow-hidden p-0 bg-background/95 backdrop-blur-xl">
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
                                {feedback.type === 'success' ? 'Excelente!' : 'Corrigir Agora'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default Collaborators;
