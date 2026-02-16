import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Laptop } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Profiles from './Profiles';
import UsersPage from './Users';
import ProfileEditor from '@/components/settings/ProfileEditor';

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    const isAdmin = user?.isAdmin || user?.profile?.name === 'Administrador';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
                <p className="text-muted-foreground">Gerencie suas preferências e configurações do sistema.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="flex w-full flex-wrap gap-2 lg:w-[400px]">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    {isAdmin && <TabsTrigger value="profiles">Perfis de Acesso</TabsTrigger>}
                    {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                    <ProfileEditor />

                    <Card>
                        <CardHeader>
                            <CardTitle>Aparência</CardTitle>
                            <CardDescription>
                                Personalize a aparência do aplicativo. Alterne automaticamente entre os temas dia e noite.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Tema</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={theme === 'light' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTheme('light')}
                                        className="gap-2"
                                    >
                                        <Sun className="h-4 w-4" /> Claro
                                    </Button>
                                    <Button
                                        variant={theme === 'dark' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTheme('dark')}
                                        className="gap-2"
                                    >
                                        <Moon className="h-4 w-4" /> Escuro
                                    </Button>
                                    <Button
                                        variant={theme === 'system' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTheme('system')}
                                        className="gap-2"
                                    >
                                        <Laptop className="h-4 w-4" /> Sistema
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </TabsContent>

                {isAdmin && (
                    <TabsContent value="profiles" className="pt-4">
                        <Profiles />
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="users" className="pt-4">
                        <UsersPage />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default Settings;
