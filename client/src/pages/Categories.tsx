import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash, Tag } from 'lucide-react';

interface Category {
    _id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
}

const Categories = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [color, setColor] = useState('#000000');

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/categories', {
                name,
                type,
                color,
            });
            setOpen(false);
            fetchCategories();
            // Reset
            setName('');
            setType('expense');
            setColor('#000000');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Falha ao criar categoria');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Falha ao excluir categoria');
        }
    };

    if (loading) return <div>Carregando...</div>;

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {!isEmbedded && (
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Categorias Financeiras</h2>
                        <p className="text-muted-foreground">
                            Gerencie as categorias de receitas e despesas.
                        </p>
                    </div>
                )}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nova Categoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Nova Categoria</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Nome
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        Tipo
                                    </Label>
                                    <Select value={type} onValueChange={(v: 'income' | 'expense') => setType(v)}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Receita</SelectItem>
                                            <SelectItem value="expense">Despesa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="color" className="text-right">
                                        Cor
                                    </Label>
                                    <div className="col-span-3 flex items-center gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-12 h-10 p-1"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Salvar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600 flex items-center gap-2">
                            <Tag className="h-5 w-5" /> Categorias de Receita
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {incomeCategories.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>}
                        {incomeCategories.map(category => (
                            <div key={category._id} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                                    <span className="font-medium">{category.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(category._id)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <Tag className="h-5 w-5" /> Categorias de Despesa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {expenseCategories.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>}
                        {expenseCategories.map(category => (
                            <div key={category._id} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                                    <span className="font-medium">{category.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(category._id)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Categories;
