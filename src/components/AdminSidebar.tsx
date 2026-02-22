'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Armchair,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Store
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminSidebarProps {
    activePage: 'dashboard' | 'products' | 'tables' | 'reports' | 'staff' | 'settings';
    restaurantName?: string;
}

export default function AdminSidebar({ activePage, restaurantName }: AdminSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resIdParam = searchParams.get('resId');

    const navigate = (path: string) => {
        const url = resIdParam ? `${path}?resId=${resIdParam}` : path;
        router.push(url);
    };

    const isActive = (page: string) => activePage === page;

    const buttonStyle = (page: string) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        width: '100%',
        textAlign: 'left' as const,
        background: isActive(page) ? 'var(--secondary)' : 'transparent',
        color: isActive(page) ? 'var(--primary)' : 'var(--muted-foreground)',
        fontWeight: isActive(page) ? '600' : '500',
        transition: 'all 0.2s ease'
    });

    return (
        <aside style={{ width: '280px', background: 'white', borderRight: '1px solid var(--border)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '0.75rem' }}>
                    <Store size={24} />
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {restaurantName || 'Panel Admin'}
                </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <button onClick={() => navigate('/admin')} style={buttonStyle('dashboard')}>
                    <LayoutDashboard size={20} /> Dashboard
                </button>
                <button onClick={() => navigate('/admin/products')} style={buttonStyle('products')}>
                    <ShoppingBag size={20} /> Productos
                </button>
                <button onClick={() => navigate('/admin/tables')} style={buttonStyle('tables')}>
                    <Armchair size={20} /> Mesas
                </button>
                <button onClick={() => navigate('/admin/reports')} style={buttonStyle('reports')}>
                    <BarChart3 size={20} /> Reportes
                </button>
                <button onClick={() => navigate('/admin/staff')} style={buttonStyle('staff')}>
                    <Users size={20} /> Personal
                </button>
                <button onClick={() => navigate('/admin/settings')} style={buttonStyle('settings')}>
                    <Settings size={20} /> Ajustes
                </button>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: '#ef4444', fontWeight: '500', width: '100%' }}
                >
                    <LogOut size={20} /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
