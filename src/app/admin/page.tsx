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
    ChefHat,
    ClipboardList,
    BarChart3,
    Plus,
    LogOut,
    ExternalLink,
    Store,
    Armchair
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

function AdminContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const resIdParam = searchParams.get('resId');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [restaurantName, setRestaurantName] = useState<string>('');
    const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, itemCount: 0 });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }

            // Obtener el perfil del usuario
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, restaurants(name)')
                .eq('id', session.user.id)
                .single();

            const isMasterEmail = session.user.email?.toLowerCase() === 'admin@turestaurante.com';

            // Si no hay perfil, lo tratamos como un nuevo usuario por configurar
            if (profileError || !profile) {
                if (isMasterEmail) {
                    router.push('/superadmin');
                    return;
                }
                // Si no hay perfil, nos quedamos aquí para mostrar la pantalla de bienvenida/configuración
                setUserProfile(null);
                setLoading(false);
                return;
            }

            const effectiveRole = isMasterEmail ? 'superadmin' : profile.role;

            // REDIRECCIÓN INTELIGENTE SEGÚN ROL
            if (effectiveRole === 'superadmin') {
                if (!resIdParam && !profile?.restaurant_id) {
                    router.push('/superadmin');
                    return;
                }
            } else if (effectiveRole === 'waiter') {
                router.push('/waiter');
                return;
            } else if (effectiveRole === 'cook') {
                router.push('/kitchen');
                return;
            } else if (effectiveRole === 'customer') {
                router.push('/');
                return;
            }

            // Determinar qué restaurante mostrar
            let restaurantId = profile?.restaurant_id;
            if (effectiveRole === 'superadmin' && resIdParam) {
                restaurantId = resIdParam;
            }

            if (restaurantId) {
                const effectiveProfile = {
                    ...profile,
                    role: effectiveRole,
                    restaurant_id: restaurantId
                };
                setUserProfile(effectiveProfile);

                // Cargar nombre del restaurante
                if (resIdParam) {
                    const { data: resData } = await supabase
                        .from('restaurants')
                        .select('name')
                        .eq('id', restaurantId)
                        .single();
                    if (resData) setRestaurantName(resData.name);
                } else if (profile?.restaurants) {
                    setRestaurantName(profile.restaurants.name);
                }

                fetchProducts(effectiveProfile);
                fetchStats(effectiveProfile);
            } else {
                setUserProfile({ ...profile, role: effectiveRole });
                setLoading(false);
            }
        };
        checkUser();
    }, [router, resIdParam]);

    const fetchProducts = async (profile: any) => {
        if (!profile?.restaurant_id) return;
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('restaurant_id', profile.restaurant_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (profile: any) => {
        if (!profile?.restaurant_id) return;

        try {
            // 1. Obtener pedidos
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total, status')
                .eq('restaurant_id', profile.restaurant_id);

            // 2. Obtener items vendidos
            const { data: items } = await supabase
                .from('order_items')
                .select('quantity, orders!inner(restaurant_id)')
                .eq('orders.restaurant_id', profile.restaurant_id);

            if (orders) {
                const total = orders.reduce((sum, o) => sum + Number(o.total), 0);
                const totalItems = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                setStats({
                    totalSales: total,
                    orderCount: orders.length,
                    itemCount: totalItems
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    const toggleProductAvailability = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_available: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setProducts(products.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
        } catch (error: any) {
            alert('Error actualizando disponibilidad: ' + error.message);
        }
    };

    const deleteProduct = async (id: string, image_url?: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

        try {
            // 1. Eliminar imagen de storage si existe
            if (image_url) {
                const path = image_url.split('/').pop();
                if (path) {
                    await supabase.storage.from('products').remove([path]);
                }
            }

            // 2. Eliminar de la base de datos
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;

            setProducts(products.filter(p => p.id !== id));
            alert('Producto eliminado correctamente');
        } catch (error: any) {
            alert('Error eliminando producto: ' + error.message);
        }
    };

    if (loading) return <div className="p-8">Cargando panel...</div>;

    if (!userProfile) {
        return (
            <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👋</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>¡Bienvenido a Pedido Rápido!</h1>
                <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Parece que tu cuenta está activa pero aún no has configurado tu restaurante o no tienes un rol asignado.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={() => router.push('/register')} className="btn btn-primary" style={{ padding: '1rem' }}>
                        Configurar mi Restaurante ahora
                    </button>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/admin/login');
                        }}
                        className="btn"
                        style={{ padding: '1rem', background: '#f3f4f6' }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    if (!userProfile.restaurant_id) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">No tienes un restaurante configurado</h1>
                <p className="mb-6">Si eres un empleado, pide al administrador que te asigne a un local.</p>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/admin/login');
                    }}
                    className="btn btn-primary"
                >
                    Cerrar Sesión
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar activePage="dashboard" restaurantName={restaurantName} />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>Panel General</h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>Bienvenido de nuevo. Aquí tienes un resumen de hoy.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => router.push(resIdParam ? `/admin/products?resId=${resIdParam}` : '/admin/products')} className="btn glass">
                            <ShoppingBag size={20} /> Ver Productos
                        </button>
                        <button onClick={() => router.push('/admin/products/new')} className="btn btn-primary">
                            <Plus size={20} /> Nuevo Producto
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}
                    onClick={() => router.push(resIdParam ? `/admin/reports?resId=${resIdParam}` : '/admin/reports')}
                >
                    <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Ventas Brutas</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>${stats.totalSales.toLocaleString()}</div>
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Pedidos</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.orderCount}</div>
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Items Totales</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.itemCount}</div>
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid #ec4899' }}>
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Promedio x Mesa</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>
                            ${stats.orderCount > 0 ? (stats.totalSales / stats.orderCount).toFixed(0) : 0}
                        </div>
                    </div>
                </div>

                {/* Terminal Screens Links */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3.5rem' }}>
                    <a href="/kitchen" target="_blank" className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.75rem' }}><ChefHat size={24} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700' }}>Pantalla Cocina</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Ver pedidos en preparación</div>
                        </div>
                        <ExternalLink size={18} color="var(--muted-foreground)" />
                    </a>
                    <a href="/waiter" target="_blank" className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '0.75rem' }}><ClipboardList size={24} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700' }}>Panel Mozos</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Servicio y alertas</div>
                        </div>
                        <ExternalLink size={18} color="var(--muted-foreground)" />
                    </a>
                    <a href="/cashier" target="_blank" className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ background: '#eff6ff', color: '#1e40af', padding: '0.75rem', borderRadius: '0.75rem' }}><ShoppingBag size={24} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700' }}>Punto de Caja</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Cobros y facturación</div>
                        </div>
                        <ExternalLink size={18} color="var(--muted-foreground)" />
                    </a>
                </div>

                {/* Products Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Catálogo de Productos</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {products.length === 0 ? (
                            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)' }}>
                                <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                <p>No hay productos cargados todavía.</p>
                            </div>
                        ) : (
                            products.map((product) => (
                                <div key={product.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ position: 'relative', height: '200px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                                        <Image
                                            src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                                            alt={product.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                        {product.is_available === false && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.25rem' }}>
                                                AGOTADO
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{product.name}</h3>
                                            <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--primary)' }}>${product.price}</span>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.25rem', height: '2.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {product.description}
                                        </p>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                            <button
                                                onClick={() => toggleProductAvailability(product.id, product.is_available !== false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.6rem',
                                                    borderRadius: '0.6rem',
                                                    background: product.is_available !== false ? '#dcfce7' : '#f1f5f9',
                                                    color: product.is_available !== false ? '#166534' : '#64748b',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                {product.is_available !== false ? 'EN STOCK' : 'SIN STOCK'}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/products/${product.id}`)}
                                                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', background: 'var(--secondary)', fontSize: '0.75rem', fontWeight: '700' }}
                                            >
                                                EDITAR
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product.id, product.image_url)}
                                                style={{ padding: '0.6rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.6rem' }}
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando visión...</div>}>
            <AdminContent />
        </Suspense>
    );
}
