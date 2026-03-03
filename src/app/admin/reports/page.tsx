'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    BarChart, ArrowLeft, RefreshCw, TrendingUp, Package, DollarSign,
    LayoutDashboard,
    Armchair,
    BarChart3,
    Users,
    Settings,
    LogOut,
    ShoppingBag,
    Store
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface ProductStats {
    name: string;
    quantity: number;
    totalRevenue: number;
    avgPrice: number;
}

import { Suspense } from 'react';

function ReportsContent() {
    const [stats, setStats] = useState<ProductStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const resIdParam = searchParams.get('resId');

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('restaurant_id, role, restaurants(name)')
                .eq('id', session.user.id)
                .single();

            let targetResId = profile?.restaurant_id;
            if (profile?.role === 'superadmin' && resIdParam) {
                targetResId = resIdParam;
            }

            if (targetResId) {
                setRestaurantId(targetResId);
                fetchReportData(targetResId);

                if (resIdParam) {
                    const { data: resData } = await supabase.from('restaurants').select('name').eq('id', targetResId).single();
                    if (resData) setRestaurantName(resData.name);
                } else if (profile?.restaurants) {
                    setRestaurantName((profile.restaurants as any).name);
                }
            } else {
                router.push('/admin');
            }
        };
        checkAuth();
    }, [router, resIdParam]);

    const fetchReportData = async (resId: string) => {
        setLoading(true);
        try {
            // Obtener todos los items vendidos para este restaurante
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    price,
                    product_name,
                    orders!inner(restaurant_id, status)
                `)
                .eq('orders.restaurant_id', resId)
                // Opcionalmente filtrar solo pedidos entregados/pagados si se desea
                .neq('orders.status', 'pendiente');

            if (error) throw error;

            if (data) {
                // Agrupar por nombre de producto
                const grouping: Record<string, ProductStats> = {};

                data.forEach((item: any) => {
                    const name = item.product_name || 'Producto Desconocido';
                    if (!grouping[name]) {
                        grouping[name] = {
                            name,
                            quantity: 0,
                            totalRevenue: 0,
                            avgPrice: 0
                        };
                    }
                    grouping[name].quantity += item.quantity;
                    grouping[name].totalRevenue += (item.quantity * item.price);
                });

                // Convertir a array y calcular precio promedio
                const finalStats = Object.values(grouping).map(ps => ({
                    ...ps,
                    avgPrice: ps.totalRevenue / ps.quantity
                })).sort((a, b) => b.totalRevenue - a.totalRevenue); // Ordenar por ingresos

                setStats(finalStats);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalOrdersRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalItemsSold = stats.reduce((sum, s) => sum + s.quantity, 0);

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar activePage="reports" restaurantName={restaurantName} />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>Reporte de Ventas</h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>{restaurantName} • Detalle acumulado por producto</p>
                    </div>
                    <button
                        onClick={() => restaurantId && fetchReportData(restaurantId)}
                        className="btn"
                        style={{ background: 'white', border: '1px solid var(--border)' }}
                    >
                        <RefreshCw size={18} /> Actualizar
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card glass" style={{ background: 'linear-gradient(135deg, white 0%, var(--secondary) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <DollarSign size={24} />
                            </div>
                            <span style={{ fontWeight: '700', color: 'var(--muted-foreground)' }}>Ingresos Totales</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>
                            ${totalOrdersRevenue.toLocaleString()}
                        </div>
                    </div>

                    <div className="card glass" style={{ background: 'linear-gradient(135deg, white 0%, var(--secondary) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <ShoppingBag size={24} />
                            </div>
                            <span style={{ fontWeight: '700', color: 'var(--muted-foreground)' }}>Platos Vendidos</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>
                            {totalItemsSold.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        <h3 style={{ fontWeight: '800', fontSize: '1.125rem' }}>Ranking de Productos</h3>
                    </div>

                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                            <RefreshCw className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                            Procesando datos...
                        </div>
                    ) : stats.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                            No hay datos de ventas registrados todavía.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '1rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Producto</th>
                                    <th style={{ padding: '1rem 2rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Cantidad</th>
                                    <th style={{ padding: '1rem 2rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Ventas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((item, idx) => (
                                    <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Promedio: ${item.avgPrice.toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--primary)' }}>
                                            {item.quantity}
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: '900', fontSize: '1.125rem' }}>
                                            ${item.totalRevenue.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando reporte...</div>}>
            <ReportsContent />
        </Suspense>
    );
}

