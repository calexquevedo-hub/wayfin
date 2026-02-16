import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash, Shield, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profileId, setProfileId] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    useEffect(() => {
        fetchUsers();
        fetchProfiles();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchProfiles = async () => {
        try {
            const { data } = await api.get('/profiles');
            setProfiles(data);
        } catch (error) {
            console.error('Failed to fetch profiles', error);
        }
    };

    const handleOpenDialog = (u?: any) => {
        if (u) {
            setEditingUser(u);
            setName(u.name);
            setEmail(u.email);
            setProfileId(u.profile?._id || '');
            setIsActive(u.active);
            setPassword(''); // Don't show password
        } else {
            setEditingUser(null);
            setName('');
            setEmail('');
            setPassword('');
            setProfileId('');
            setIsActive(true);
        }
        setIsDialogOpen(true);
        setFeedback({ type: null, message: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { name, email, profileId, active: isActive };
            if (!editingUser) {
                payload.password = password;
            } else if (password) {
                // Should probably have a separate endpoint or logic for password update, but simple edit ignores it if empty usually
                // For this simple implementation, we might skip password update on edit or assume backend handles it if provided
                // The current userController.updateUser doesn't update password. So we skip it here.
            }

            if (editingUser) {
                await api.put(`/users/${editingUser._id}`, payload);
                setFeedback({ type: 'success', message: 'Usuário atualizado com sucesso!' });
            } else {
                await api.post('/users', payload);
                setFeedback({ type: 'success', message: 'Usuário criado com sucesso!' });
            }

            fetchUsers();
            setTimeout(() => {
                setIsDialogOpen(false);
                setFeedback({ type: null, message: '' });
            }, 1000);
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Erro ao salvar usuário.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao excluir usuário.');
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
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Usuários</h1>
                    <p className="text-muted-foreground">Gerencie os usuários do sistema, seus perfis e status.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Usuário
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Usuários Cadastrados</CardTitle>
                        <CardDescription>Total de {users.length} usuários no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.map(u => (
                                <div key={u._id} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm">{u.name}</h4>
                                                {u.isAdmin || u.profile?.name === 'Administrador' ? (
                                                    <Badge className="bg-primary/80 hover:bg-primary">Admin</Badge>
                                                ) : (
                                                    <Badge variant="outline">{u.profile?.name || 'Sem Perfil'}</Badge>
                                                )}
                                                {!u.active && <Badge variant="destructive">Inativo</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(u)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u._id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                        <DialogDescription>Preencha os dados do usuário e defina seu perfil de acesso.</DialogDescription>
                    </DialogHeader>

                    {feedback.message && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {feedback.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="João da Silva"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="joao@empresa.com"
                                required
                            />
                        </div>
                        {!editingUser && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="profile">Perfil de Acesso</Label>
                            <select
                                id="profile"
                                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={profileId}
                                onChange={(e) => setProfileId(e.target.value)}
                                required
                            >
                                <option value="">Selecione um perfil...</option>
                                {profiles.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                            <Label htmlFor="active">Usuário Ativo</Label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Usuário</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Users;
