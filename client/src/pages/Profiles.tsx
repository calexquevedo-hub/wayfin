import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PERMISSIONS_LIST = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'payables', label: 'Contas a Pagar' },
    { key: 'receivables', label: 'Contas a Receber' },
    { key: 'reports', label: 'Relatórios' },
    { key: 'analytics', label: 'Análise' },
    { key: 'collaborators', label: 'Colaboradores' },
    { key: 'health_plans', label: 'Planos de Saúde' },
    { key: 'dental_plans', label: 'Planos Odontológicos' },
    { key: 'enrollments', label: 'Adesão aos Planos' },
    { key: 'company', label: 'Minha Empresa' },
    { key: 'settings', label: 'Configurações' },
];

const Profiles = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<any>(null);

    // Form State
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const { data } = await api.get('/profiles');
            setProfiles(data);
        } catch (error) {
            console.error('Failed to fetch profiles', error);
        }
    };

    const handleOpenDialog = (profile?: any) => {
        if (profile) {
            setEditingProfile(profile);
            setName(profile.name);
            setPermissions(profile.permissions || {});
        } else {
            setEditingProfile(null);
            setName('');
            setPermissions({});
        }
        setIsDialogOpen(true);
        setFeedback({ type: null, message: '' });
    };

    const handlePermissionChange = (key: string, checked: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [key]: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { name, permissions };

            if (editingProfile) {
                await api.put(`/profiles/${editingProfile._id}`, payload);
                setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
            } else {
                await api.post('/profiles', payload);
                setFeedback({ type: 'success', message: 'Perfil criado com sucesso!' });
            }

            fetchProfiles();
            setTimeout(() => {
                setIsDialogOpen(false);
                setFeedback({ type: null, message: '' });
            }, 1000);
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Erro ao salvar perfil.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este perfil?')) return;
        try {
            await api.delete(`/profiles/${id}`);
            fetchProfiles();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao excluir perfil.');
        }
    };

    // Only allow access if admin
    if (!user?.isAdmin && user?.profile?.name !== 'Administrador') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <Shield className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-xl font-bold">Acesso Restrito</h2>
                <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Perfis de Acesso</h1>
                    <p className="text-muted-foreground">Gerencie os perfis de usuário e suas permissões no sistema.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Perfil
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map(profile => (
                    <Card key={profile._id} className="relative overflow-hidden transition-all hover:shadow-md border-primary/10">
                        {profile.isStatic && (
                            <div className="absolute top-0 right-0 p-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                    <Shield className="h-3 w-3 mr-1" /> Sistema
                                </Badge>
                            </div>
                        )}
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                {profile.name}
                            </CardTitle>
                            <CardDescription>
                                {Object.values(profile.permissions || {}).filter(Boolean).length} permissões ativas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-1">
                                    {PERMISSIONS_LIST.map(p => (
                                        profile.permissions?.[p.key] && (
                                            <Badge key={p.key} variant="outline" className="text-[10px] font-normal">
                                                {p.label}
                                            </Badge>
                                        )
                                    ))}
                                    {Object.values(profile.permissions || {}).every(v => !v) && (
                                        <span className="text-xs text-muted-foreground italic">Nenhuma permissão</span>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(profile)}>
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                    </Button>
                                    {!profile.isStatic && (
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(profile._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash className="h-4 w-4 mr-2" /> Excluir
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
                        <DialogDescription>Defina o nome do perfil e selecione as permissões de acesso.</DialogDescription>
                    </DialogHeader>

                    {feedback.message && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {feedback.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Perfil</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Financeiro"
                                required
                                disabled={editingProfile?.isStatic}
                            />
                            {editingProfile?.isStatic && <p className="text-xs text-muted-foreground">O nome deste perfil não pode ser alterado.</p>}
                        </div>

                        <div className="space-y-3">
                            <Label>Permissões de Acesso</Label>
                            {editingProfile?.isStatic ? (
                                <div className="p-4 border rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    <span className="font-medium">Este perfil possui acesso total ao sistema.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/10">
                                    {PERMISSIONS_LIST.map(permission => (
                                        <div key={permission.key} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={permission.key}
                                                checked={permissions[permission.key] || false}
                                                onCheckedChange={(checked: boolean | string) => handlePermissionChange(permission.key, checked === true)}
                                            />
                                            <Label htmlFor={permission.key} className="cursor-pointer flex-1 font-normal">
                                                {permission.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Perfil</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profiles;
