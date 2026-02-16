import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background">
            <Sidebar className="hidden md:flex" />

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Fechar menu"
                    />
                    <div className="absolute left-0 top-0 h-full">
                        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
                <div className="mb-4 flex items-center justify-between md:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                    >
                        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        Menu
                    </Button>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
