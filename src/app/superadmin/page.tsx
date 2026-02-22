'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Restaurant } from '@/lib/types';

import { Globe, Plus, Store, ShoppingBag, Package, LogOut } from 'lucide-react';

export default function SuperAdminPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [stats, setStats] = useState({ orders: 0, products: 0 });
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const router = useRouter();

    useEffect(() => {
        const checkSuperAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }

            const isMasterEmail = session.user.email?.toLowerCase() === 'admin@turestaurante.com';
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            const isSuperAdmin = isMasterEmail || profile?.role === 'superadmin';
            if (!isSuperAdmin) {
                setLoading(false);
                return;
            }
            fetchData();
        };
        checkSuperAdmin();
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        const { data: resData } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
        if (resData) setRestaurants(resData);
        const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        setStats({ orders: orderCount || 0, products: productCount || 0 });
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const slug = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const { error } = await supabase.from('restaurants').insert([{ name: newName, slug }]);
        if (error) alert(error.message);
        else {
            setNewName('');
            setShowCreate(false);
            fetchData();
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando visión global...</div>;

    if (restaurants.length === 0 && !loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>Acceso Denegado</h1>
                    <p style={{ color: '#64748b', marginTop: '1rem' }}>No tienes permisos para acceder al panel global.</p>
                    <button onClick={() => router.push('/admin')} style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        Volver a mi Panel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2.5rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Globe size={40} color="#3b82f6" /> Hub Global
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Control total de la red de comercios</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                            <Plus size={20} /> Nuevo Local
                        </button>
                        <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>
                            <LogOut size={20} /> Salir
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '6px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            <Store size={20} /> <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>Comercios</span>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b' }}>{restaurants.length}</p>
                    </div>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '6px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            <ShoppingBag size={20} /> <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>Ventas Totales</span>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.orders}</p>
                    </div>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '6px solid #6366f1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            <Package size={20} /> <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>Catálogo</span>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.products}</p>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>Comercios Activos</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Nombre</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Acceso Directo</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {restaurants.map(res => (
                                <tr key={res.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1.25rem 2rem' }}>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{res.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {res.id.slice(0, 18)}...</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 2rem' }}>
                                        <code style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.25rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.85rem' }}>/?r={res.slug}</code>
                                    </td>
                                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => router.push(`/admin?resId=${res.id}`)}
                                            style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación */}
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Nuevo Restaurante</h2>
                        <form onSubmit={handleCreate}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Nombre del Comercio</label>
                            <input
                                type="text"
                                required
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}
                                placeholder="Ej: Pizzería Roma"
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
