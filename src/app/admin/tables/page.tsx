'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, Order, TableStatus, OrderStatus } from '@/lib/types';
import {
    LayoutDashboard,
    Armchair,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Plus,
    Trash2,
    X,
    Receipt,
    CheckCircle,
    Clock,
    AlertCircle,
    Store,
    ShoppingBag
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

function TableDashboardContent() {
    const [tables, setTables] = useState<Table[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

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
                .select('restaurant_id, role')
                .eq('id', session.user.id)
                .single();

            const isMasterEmail = session.user.email?.toLowerCase() === 'admin@turestaurante.com';
            const effectiveRole = isMasterEmail ? 'superadmin' : profile?.role;

            let targetResId = profile?.restaurant_id;
            if ((isMasterEmail || effectiveRole === 'superadmin') && resIdParam) {
                targetResId = resIdParam;
            }

            if (targetResId) {
                setRestaurantId(targetResId);
                fetchData(targetResId);
                const cleanup = setupRealtime(targetResId);
                return cleanup;
            } else {
                router.push('/admin');
            }
        };
        const cleanupPromise = checkAuth();
        return () => {
            cleanupPromise.then(cleanup => {
                if (typeof cleanup === 'function') cleanup();
            });
        };
    }, [router, resIdParam]);

    const fetchData = async (resId: string) => {
        setLoading(true);
        const { data: tablesData } = await supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', resId)
            .order('number');

        const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', resId)
            .neq('status', 'entregado');

        if (tablesData) setTables(tablesData);
        if (ordersData) {
            setOrders(ordersData.map(o => ({
                id: o.id,
                tableId: o.table_id,
                status: o.status,
                total: o.total,
                billRequested: o.bill_requested,
                items: [],
                createdAt: new Date(o.created_at).getTime()
            })));
        }
        setLoading(false);
    };

    const setupRealtime = (resId: string) => {
        const tableSubscription = supabase
            .channel('table-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${resId}` }, () => fetchData(resId))
            .subscribe();

        const orderSubscription = supabase
            .channel('order-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${resId}` }, () => fetchData(resId))
            .subscribe();

        return () => {
            supabase.removeChannel(tableSubscription);
            supabase.removeChannel(orderSubscription);
        };
    };

    const handleViewOrder = async (order: Order) => {
        setSelectedOrder(order);
        setLoadingItems(true);
        const { data } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        if (data) setOrderItems(data);
        setLoadingItems(false);
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (!error && restaurantId) {
            fetchData(restaurantId);
            if (newStatus === 'entregado') setSelectedOrder(null);
        }
    };

    const createTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableNumber || !restaurantId) return;

        setIsCreating(true);
        const { error } = await supabase
            .from('tables')
            .insert([{ number: newTableNumber, restaurant_id: restaurantId, status: 'libre' }]);

        if (error) {
            alert('Error al crear mesa: ' + error.message);
        } else {
            setNewTableNumber('');
            fetchData(restaurantId);
        }
        setIsCreating(false);
    };

    const deleteTable = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar esta mesa?')) return;
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else if (restaurantId) fetchData(restaurantId);
    };

    const getTableStatus = (tableNumber: string) => {
        const activeOrder = orders.find(o => o.tableId === tableNumber);
        if (activeOrder) {
            if (activeOrder.billRequested) return { label: 'Pidiendo Cuenta', color: '#f59e0b', icon: <Receipt size={16} /> };
            if (activeOrder.status === 'listo') return { label: 'Listo para Servir', color: '#10b981', icon: <CheckCircle size={16} /> };
            return { label: 'En Consumo', color: '#3b82f6', icon: <Clock size={16} /> };
        }
        return { label: 'Libre', color: '#9ca3af', icon: null };
    };

    if (loading) return <div className="p-8 text-center" style={{ color: '#64748b' }}>Sincronizando salón...</div>;

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar activePage="tables" />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>Monitor de Salón</h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>Vista en tiempo real del estado de tus mesas.</p>
                    </div>

                    <form onSubmit={createTable} style={{ display: 'flex', gap: '0.75rem', background: 'white', padding: '0.5rem', borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <input
                            type="text"
                            placeholder="Nº Mesa..."
                            value={newTableNumber}
                            onChange={(e) => setNewTableNumber(e.target.value)}
                            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.75rem', background: 'var(--secondary)', width: '120px', fontWeight: '600' }}
                        />
                        <button type="submit" disabled={isCreating} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                            <Plus size={18} /> Añadir Mesa
                        </button>
                    </form>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {tables.map(table => {
                        const order = orders.find(o => o.tableId === table.number.toString());
                        const status = order ? (order.billRequested ? 'cuenta' : 'ocupada') : 'libre';

                        return (
                            <div key={table.id} className="card animate-fade-in" style={{
                                position: 'relative',
                                background: status === 'cuenta' ? '#fff1f2' : (status === 'ocupada' ? '#eff6ff' : 'white'),
                                borderLeft: `6px solid ${status === 'cuenta' ? '#ef4444' : (status === 'ocupada' ? '#3b82f6' : '#22c55e')}`,
                                minHeight: '180px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Mesa #{table.number}</h3>
                                    <div style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '2rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        background: status === 'cuenta' ? '#ef4444' : (status === 'ocupada' ? '#3b82f6' : '#22c55e'),
                                        color: 'white'
                                    }}>
                                        {status === 'cuenta' ? 'Pidiendo Cuenta' : (status === 'ocupada' ? 'Ocupada' : 'Libre')}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    {order ? (
                                        <>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: status === 'cuenta' ? '#ef4444' : 'inherit' }}>
                                                Total: ${order.total}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                                <Clock size={16} />
                                                Haciendo pedido...
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Mesa disponible para nuevos clientes.</p>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    {order ? (
                                        <>
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="btn"
                                                style={{ flex: 1, padding: '0.5rem', background: 'white', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                                            >
                                                Ver Comanda
                                            </button>
                                            {status === 'cuenta' && (
                                                <button
                                                    onClick={() => router.push('/cashier')}
                                                    className="btn"
                                                    style={{ flex: 1, padding: '0.5rem', background: '#ef4444', color: 'white', fontSize: '0.8rem' }}
                                                >
                                                    Cobrar
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <a
                                                href={`/menu?r=${restaurantId}&table=${table.number}`}
                                                target="_blank"
                                                className="btn"
                                                style={{ flex: 1, padding: '0.5rem', background: 'var(--secondary)', fontSize: '0.8rem', color: 'var(--primary)' }}
                                            >
                                                Menú/QR
                                            </a>
                                            <button
                                                onClick={() => deleteTable(table.id)}
                                                className="btn"
                                                style={{ padding: '0.5rem', background: '#fee2e2', color: '#dc2626' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', overflow: 'hidden', padding: 0 }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Comanda Mesa #{selectedOrder.tableId}</h2>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: 'var(--secondary)', padding: '0.5rem', borderRadius: '2rem' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            {loadingItems ? (
                                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>Cargando items...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed var(--border)' }}>
                                            <div>
                                                <div style={{ fontWeight: '700' }}>{item.quantity}x {item.product_name || 'Producto'}</div>
                                                {item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Nota: {item.notes}</div>}
                                            </div>
                                            <div style={{ fontWeight: '800', color: 'var(--primary)' }}>${item.price * item.quantity}</div>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', marginTop: '1rem' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>Total</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>${selectedOrder.total}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem 2rem', background: 'var(--muted)', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => updateOrderStatus(selectedOrder.id, 'entregado')}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                <CheckCircle size={18} /> Liberar Mesa
                            </button>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="btn"
                                style={{ flex: 1, background: 'white', border: '1px solid var(--border)' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TableDashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center" style={{ color: '#64748b' }}>Cargando...</div>}>
            <TableDashboardContent />
        </Suspense>
    );
}
