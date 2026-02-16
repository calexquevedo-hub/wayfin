import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getApiOrigin = () => {
    const baseURL = api.defaults.baseURL;
    if (typeof baseURL === 'string' && baseURL.startsWith('http')) {
        return baseURL.replace(/\/api\/?$/, '');
    }
    return window.location.origin;
};

const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const ProfileEditor = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [confirmEmail, setConfirmEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [sourceImageUrl, setSourceImageUrl] = useState<string>('');
    const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
    const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);

    const initials = useMemo(() => getInitials(name || user?.name), [name, user?.name]);

    const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Selecione um arquivo de imagem válido.');
            return;
        }

        const localUrl = URL.createObjectURL(file);
        setSourceImageUrl(localUrl);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
    };

    const applyCrop = async () => {
        if (!sourceImageUrl) return;

        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = sourceImageUrl;
        });

        const cropSize = Math.min(image.width, image.height) / zoom;
        const maxX = (image.width - cropSize) / 2;
        const maxY = (image.height - cropSize) / 2;
        const sx = clamp((image.width - cropSize) / 2 + (offsetX / 100) * maxX, 0, image.width - cropSize);
        const sy = clamp((image.height - cropSize) / 2 + (offsetY / 100) * maxY, 0, image.height - cropSize);

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast.error('Não foi possível processar a imagem.');
            return;
        }

        ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, 256, 256);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.9);
        });

        if (!blob) {
            toast.error('Falha ao gerar imagem cortada.');
            return;
        }

        setAvatarBlob(blob);
        setAvatarPreview(URL.createObjectURL(blob));
        toast.success('Foto ajustada com sucesso.');
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Informe o nome do usuário.');
            return;
        }

        if (!email.trim()) {
            toast.error('Informe o e-mail.');
            return;
        }

        if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
            toast.error('O e-mail e a confirmação de e-mail não conferem.');
            return;
        }

        if ((currentPassword || newPassword || confirmPassword) && (newPassword !== confirmPassword)) {
            toast.error('A confirmação da nova senha não confere.');
            return;
        }

        setIsSaving(true);
        try {
            let avatarToSave = user?.avatar || '';

            if (avatarBlob) {
                const formData = new FormData();
                formData.append('photo', avatarBlob, 'avatar.jpg');
                const uploadResponse = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const rawUrl = uploadResponse.data?.fileUrl as string;
                if (rawUrl) {
                    avatarToSave = rawUrl.startsWith('http') ? rawUrl : `${getApiOrigin()}${rawUrl}`;
                }
            }

            const response = await api.put('/auth/profile', {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                avatar: avatarToSave,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
                confirmPassword: confirmPassword || undefined,
            });

            updateUser({
                name: response.data.name,
                email: response.data.email,
                avatar: response.data.avatar,
                profile: response.data.profile,
                active: response.data.active,
                isAdmin: response.data.isAdmin,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSourceImageUrl('');
            setAvatarBlob(null);
            toast.success('Perfil atualizado com sucesso.');
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Não foi possível atualizar o perfil.';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>
                    Atualize nome, e-mail, senha e foto do usuário logado.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-16 w-16 rounded-full object-cover border" />
                    ) : (
                        <div className="h-16 w-16 rounded-full border flex items-center justify-center text-sm font-semibold bg-muted">
                            {initials}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="avatar-upload">Foto de perfil</Label>
                        <Input id="avatar-upload" type="file" accept="image/*" onChange={onSelectImage} />
                    </div>
                </div>

                {sourceImageUrl && (
                    <div className="space-y-3 rounded-md border p-4">
                        <Label>Editor da foto (recorte quadrado)</Label>
                        <img
                            src={sourceImageUrl}
                            alt="Pré-visualização para recorte"
                            className="max-h-64 rounded-md border object-contain w-full bg-muted/20"
                        />
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                                <Label>Zoom ({zoom.toFixed(1)}x)</Label>
                                <Input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Posição horizontal ({offsetX})</Label>
                                <Input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={offsetX}
                                    onChange={(e) => setOffsetX(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Posição vertical ({offsetY})</Label>
                                <Input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={offsetY}
                                    onChange={(e) => setOffsetY(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <Button type="button" variant="outline" onClick={applyCrop}>
                            Aplicar recorte
                        </Button>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do usuário</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="confirm-email">Confirmação de e-mail</Label>
                        <Input
                            id="confirm-email"
                            type="email"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Senha atual</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nova senha</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <Button type="button" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar perfil'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default ProfileEditor;
