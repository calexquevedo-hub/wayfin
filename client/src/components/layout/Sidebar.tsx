import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    DollarSign,
    Settings,
    LogOut,
    FileText,
    Users,
    HeartPulse,
    ClipboardCheck,
    Building,
    RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
    const { pathname } = useLocation();
    const { logout, user } = useAuth(); // Get user from auth context

    // Map routes to permission keys
    const permissionMap: Record<string, string> = {
        '/': 'dashboard',
        '/payables': 'payables',
        '/receivables': 'receivables',
        '/reports': 'reports',
        '/enrollment-reports': 'enrollment_reports',
        '/analytics': 'analytics',
        '/collaborators': 'collaborators',
        '/health-plans': 'health_plans',
        '/dental-plans': 'dental_plans',
        '/enrollments': 'enrollments',
        '/company': 'company',
        '/bank-accounts': 'bank_accounts',
        '/reconciliation': 'reconciliation',
        '/settings': 'settings'
    };

    const hasPermission = (path: string) => {
        // Admins see everything
        if (user?.isAdmin || user?.profile?.name === 'Administrador') return true;

        const permissionKey = permissionMap[path];
        // If route is not in map, assume it's open or handled elsewhere (or hidden by default)
        // For now, if no key, show it (e.g. logout), unless specifically protecting everything.
        if (!permissionKey) return true;

        return user?.profile?.permissions?.[permissionKey] === true;
    };

    const groups = [
        {
            label: 'Principal',
            items: [
                { href: '/', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/payables', label: 'Contas a Pagar', icon: DollarSign },
                { href: '/receivables', label: 'Contas a Receber', icon: DollarSign },
                { href: '/reconciliation', label: 'Conciliação Bancária', icon: RefreshCw },
            ]
        },
        {
            label: 'Relatórios',
            items: [
                { href: '/reports', label: 'Financeiros', icon: FileText },
                { href: '/enrollment-reports', label: 'Adesões aos Planos', icon: ClipboardCheck },
            ]
        },
        {
            label: 'Gestão Comercial',
            items: [
                { href: '/customers', label: 'Clientes', icon: Users },
                { href: '/contracts', label: 'Contratos', icon: FileText },
            ]
        },
        {
            label: 'Gestão de Benefícios',
            items: [
                { href: '/collaborators', label: 'Colaboradores', icon: Users },
                { href: '/health-plans', label: 'Planos de Saúde', icon: HeartPulse },
                { href: '/dental-plans', label: 'Planos Odontológicos', icon: HeartPulse },
                { href: '/enrollments', label: 'Adesão aos Planos', icon: ClipboardCheck },
            ]
        },
        {
            label: 'Sistema',
            items: [
                { href: '/company', label: 'Minha Empresa', icon: Building },
                { href: '/settings', label: 'Configurações', icon: Settings },
            ]
        }
    ];

    // Filter groups and items
    const filteredGroups = groups.map(group => ({
        ...group,
        items: group.items.filter(item => hasPermission(item.href))
    })).filter(group => group.items.length > 0);

    return (
        <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
            <div className="p-6 flex items-center gap-2">
                <img src="/logo.png" alt="WayFin Logo" className="w-8 h-8 object-contain" />
                <h1 className="text-2xl font-bold tracking-tight text-primary">WayFin</h1>
            </div>
            <nav className="flex-1 px-4 space-y-6 overflow-y-auto py-4">
                {filteredGroups.map((group, index) => (
                    <div key={index} className="space-y-2">
                        <h2 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            {group.label}
                        </h2>
                        <div className="space-y-1">
                            {group.items.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                            pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t border-border">
                <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
