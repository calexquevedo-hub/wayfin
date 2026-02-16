import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Save, MapPin, User } from 'lucide-react';
import { maskCNPJ, maskCEP, maskPhone } from '@/lib/masks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BankAccounts from './BankAccounts';
import Categories from './Categories';

const CompanyProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [razaoSocial, setRazaoSocial] = useState('');
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [inscricaoMunicipal, setInscricaoMunicipal] = useState('');
    const [inscricaoEstadual, setInscricaoEstadual] = useState('');
    const [atividadeEconomica, setAtividadeEconomica] = useState('');
    const [codigoMunicipio, setCodigoMunicipio] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [responsavel, setResponsavel] = useState('');

    // Address State
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const { data } = await api.get('/company');
            if (data._id) {
                setRazaoSocial(data.razaoSocial || '');
                setNomeFantasia(data.nomeFantasia || '');
                setCnpj(maskCNPJ(data.cnpj || ''));
                setInscricaoMunicipal(data.inscricaoMunicipal || '');
                setInscricaoEstadual(data.inscricaoEstadual || '');
                setAtividadeEconomica(data.atividadeEconomica || '');
                setCodigoMunicipio(data.codigoMunicipio || '');
                setEmail(data.email || '');
                setTelefone(maskPhone(data.telefone || ''));
                setResponsavel(data.responsavel || '');

                if (data.address) {
                    setCep(maskCEP(data.address.cep || ''));
                    setStreet(data.address.street || '');
                    setNumber(data.address.number || '');
                    setComplement(data.address.complement || '');
                    setNeighborhood(data.address.neighborhood || '');
                    setCity(data.address.city || '');
                    setState(data.address.state || '');
                }
            }
        } catch (error) {
            console.error('Failed to fetch company data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCepChange = async (value: string) => {
        const masked = maskCEP(value);
        setCep(masked);

        const cleanedCep = masked.replace(/\D/g, '');
        if (cleanedCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setStreet(data.logradouro);
                    setNeighborhood(data.bairro);
                    setCity(data.localidade);
                    setState(data.uf);
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                razaoSocial,
                nomeFantasia,
                cnpj: cnpj.replace(/\D/g, ''),
                inscricaoMunicipal,
                inscricaoEstadual,
                atividadeEconomica,
                codigoMunicipio,
                email,
                telefone: telefone.replace(/\D/g, ''),
                responsavel,
                address: {
                    cep: cep.replace(/\D/g, ''),
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state
                }
            };

            await api.put('/company', payload);
            alert('Dados da empresa salvos com sucesso!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Falha ao salvar dados da empresa');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Minha Empresa</h1>
                    <p className="text-muted-foreground">Gerencie os dados cadastrais e financeiros da sua organização.</p>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                    <TabsTrigger value="details">Dados Identificadores</TabsTrigger>
                    <TabsTrigger value="bank-accounts">Contas Bancárias</TabsTrigger>
                    <TabsTrigger value="categories">Categorias</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    Dados da Empresa
                                </CardTitle>
                                <CardDescription>Informações jurídicas e fiscais.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="razaoSocial">Razão Social</Label>
                                    <Input id="razaoSocial" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                                    <Input id="nomeFantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} required placeholder="00.000.000/0000-00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="atividadeEconomica">Atividade Econômica (CNAE)</Label>
                                    <Input id="atividadeEconomica" value={atividadeEconomica} onChange={(e) => setAtividadeEconomica(e.target.value)} placeholder="Ex: 6201-5/01" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                                    <Input id="inscricaoMunicipal" value={inscricaoMunicipal} onChange={(e) => setInscricaoMunicipal(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                                    <Input id="inscricaoEstadual" value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="codigoMunicipio">Código do Município (IBGE)</Label>
                                    <Input id="codigoMunicipio" value={codigoMunicipio} onChange={(e) => setCodigoMunicipio(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Endereço
                                </CardTitle>
                                <CardDescription>Localização da sede da empresa.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input id="cep" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="street">Logradouro</Label>
                                    <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label htmlFor="number">Número</Label>
                                    <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="complement">Complemento</Label>
                                    <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="neighborhood">Bairro</Label>
                                    <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="state">UF</Label>
                                    <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required maxLength={2} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Contato e Responsável
                                </CardTitle>
                                <CardDescription>Informações para comunicação direta.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="responsavel">Nome do Responsável</Label>
                                    <Input id="responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone</Label>
                                    <Input id="telefone" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail Corporativo</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-4">
                            <Button type="submit" disabled={saving} className="gap-2 px-8">
                                <Save className="h-4 w-4" />
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="bank-accounts" className="pt-4">
                    <BankAccounts isEmbedded={true} />
                </TabsContent>

                <TabsContent value="categories" className="pt-4">
                    <Categories isEmbedded={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CompanyProfile;
