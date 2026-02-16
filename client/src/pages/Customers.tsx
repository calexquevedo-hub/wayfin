import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, User, Phone, Mail, FileText, MapPin } from 'lucide-react';

interface Customer {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: {
        cep?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    };
    notes?: string;
}

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: {
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
        },
        notes: '',
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            setLoading(false);
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value,
            },
        }));
    };

    const handleCepBlur = async () => {
        const cep = formData.address?.cep?.replace(/\D/g, '');
        if (cep && cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData((prev) => ({
                        ...prev,
                        address: {
                            ...prev.address,
                            street: data.logradouro,
                            neighborhood: data.bairro,
                            city: data.localidade,
                            state: data.uf,
                        },
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch CEP info', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/customers', formData);
            setIsDialogOpen(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                document: '',
                address: {
                    cep: '',
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                },
                notes: '',
            });
            fetchCustomers();
        } catch (error) {
            console.error('Failed to add customer', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este cliente?')) {
            try {
                await api.delete(`/customers/${id}`);
                fetchCustomers();
            } catch (error) {
                console.error('Failed to delete customer', error);
            }
        }
    };

    if (loading) return <div>Carregando clientes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                    <p className="text-muted-foreground">
                        Gerencie sua carteira de clientes.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome / Razão Social</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="document">CPF / CNPJ</Label>
                                    <Input
                                        id="document"
                                        value={formData.document}
                                        onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-medium">Endereço</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cep">CEP</Label>
                                        <Input
                                            id="cep"
                                            name="cep"
                                            value={formData.address?.cep}
                                            onChange={handleAddressChange}
                                            onBlur={handleCepBlur}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="street">Rua</Label>
                                        <Input
                                            id="street"
                                            name="street"
                                            value={formData.address?.street}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="number">Número</Label>
                                        <Input
                                            id="number"
                                            name="number"
                                            value={formData.address?.number}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="complement">Complemento</Label>
                                        <Input
                                            id="complement"
                                            name="complement"
                                            value={formData.address?.complement}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="neighborhood">Bairro</Label>
                                        <Input
                                            id="neighborhood"
                                            name="neighborhood"
                                            value={formData.address?.neighborhood}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Cidade</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            value={formData.address?.city}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">Estado</Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            value={formData.address?.state}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit">Salvar Cliente</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customers.map((customer) => (
                    <Card key={customer._id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">
                                {customer.name}
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(customer._id)}
                            >
                                <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {customer.document && (
                                    <div className="flex items-center text-sm">
                                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {customer.document}
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center text-sm">
                                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {customer.email}
                                    </div>
                                )}
                                {customer.phone && (
                                    <div className="flex items-center text-sm">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {customer.phone}
                                    </div>
                                )}
                                {customer.address?.city && (
                                    <div className="flex items-center text-sm">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {customer.address.city} - {customer.address.state}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {customers.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <User className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nenhum cliente cadastrado</h3>
                    <p className="text-muted-foreground">Comece adicionando seu primeiro cliente.</p>
                </div>
            )}
        </div>
    );
};

export default Customers;
