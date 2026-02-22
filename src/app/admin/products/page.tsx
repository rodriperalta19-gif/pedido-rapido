'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/lib/types';
import Image from 'next/image';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    Plus,
    LogOut,
    Store,
    Armchair,
    BarChart3,
    Trash2,
    Edit3
} from 'lucide-react';

function ProductsContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const resIdParam = searchParams.get('resId');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [restaurantName, setRestaurantName] = useState<string>('');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*, restaurants(name)')
                .eq('id', session.user.id)
                .single();

            const isMasterEmail = session.user.email?.toLowerCase() === 'admin@turestaurante.com';
            const effectiveRole = isMasterEmail ? 'superadmin' : profile?.role;

            let restaurantId = profile?.restaurant_id;
            if (effectiveRole === 'superadmin' && resIdParam) {
                restaurantId = resIdParam;
            }

            if (restaurantId) {
                setUserProfile({ ...profile, restaurant_id: restaurantId, role: effectiveRole });

                // Fetch restaurant name
                const { data: resData } = await supabase
                    .from('restaurants')
                    .select('name')
                    .eq('id', restaurantId)
                    .single();
                if (resData) setRestaurantName(resData.name);

                fetchProducts(restaurantId);
            } else {
                router.push('/admin');
            }
        };
        checkUser();
    }, [router, resIdParam]);

    const fetchProducts = async (restaurantId: string) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('category', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleProductAvailability = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_available: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setProducts(products.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const deleteProduct = async (id: string, image_url?: string) => {
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

        try {
            if (image_url) {
                const path = image_url.split('/').pop();
                if (path) await supabase.storage.from('products').remove([path]);
            }

            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;

            setProducts(products.filter(p => p.id !== id));
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    if (loading) return <div className="p-8">Cargando productos...</div>;

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex' }}>
            {/* Sidebar Navigation */}
            <aside style={{ width: '280px', background: 'white', borderRight: '1px solid var(--border)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '0.75rem' }}>
                        <Store size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.02em' }}>{restaurantName || 'Panel Admin'}</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <button onClick={() => router.push(resIdParam ? `/admin?resId=${resIdParam}` : '/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button onClick={() => router.push(resIdParam ? `/admin/products?resId=${resIdParam}` : '/admin/products')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--secondary)', color: 'var(--primary)', fontWeight: '600' }}>
                        <ShoppingBag size={20} /> Productos
                    </button>
                    <button onClick={() => router.push(resIdParam ? `/admin/tables?resId=${resIdParam}` : '/admin/tables')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                        <Armchair size={20} /> Mesas
                    </button>
                    <button onClick={() => router.push(resIdParam ? `/admin/reports?resId=${resIdParam}` : '/admin/reports')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                        <BarChart3 size={20} /> Reportes
                    </button>
                    <button onClick={() => router.push(resIdParam ? `/admin/staff?resId=${resIdParam}` : '/admin/staff')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                        <Users size={20} /> Personal
                    </button>
                    <button onClick={() => router.push(resIdParam ? `/admin/settings?resId=${resIdParam}` : '/admin/settings')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
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

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>Mis Productos</h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>Gestiona tu menú, precios y disponibilidad.</p>
                    </div>
                    <button onClick={() => router.push('/admin/products/new')} className="btn btn-primary">
                        <Plus size={20} /> Agregar Producto
                    </button>
                </header>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--secondary)' }}>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Producto</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Categoría</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Precio</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Disponibilidad</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                                <Image
                                                    src={product.image_url || '/placeholder-food.jpg'}
                                                    alt={product.name}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ fontWeight: '700' }}>{product.name}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ background: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>${product.price}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => toggleProductAvailability(product.id, product.is_available !== false)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                background: product.is_available !== false ? '#dcfce7' : '#fee2e2',
                                                color: product.is_available !== false ? '#166534' : '#991b1b',
                                                border: `1px solid ${product.is_available !== false ? '#bbf7d0' : '#fecaca'}`
                                            }}
                                        >
                                            {product.is_available !== false ? 'EN STOCK' : 'AGOTADO'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => router.push(`/admin/products/${product.id}`)}
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--secondary)', color: 'var(--primary)' }}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product.id, product.image_url)}
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', background: '#fee2e2', color: '#ef4444' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                        No hay productos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="p-8">Cargando...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
