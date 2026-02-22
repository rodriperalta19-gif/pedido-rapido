'use client';

import { useOrder } from '@/context/OrderContext';
import { OrderStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KitchenPage() {
    const { orders, setRestaurantId } = useOrder();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [userRestaurantId, setUserRestaurantId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
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

            if (profile) {
                setUserRole(profile.role);
                // Validación de Rol: Un mozo no debería estar en la cocina
                if (profile.role === 'waiter') {
                    router.push('/waiter');
                    return;
                }

                setUserRestaurantId(profile.restaurant_id);
                setRestaurantId(profile.restaurant_id); // Sincronizar con el contexto
            } else {
                router.push('/admin');
            }
        };
        checkAuth();
    }, [router, setRestaurantId]);

    if (!mounted) return null;

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        setUpdatingId(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al actualizar estado.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pendiente': return '#fbbf24'; // amber-400
            case 'preparacion': return '#3b82f6'; // blue-500
            case 'listo': return '#22c55e'; // green-500
            case 'entregado': return '#9ca3af'; // gray-400
            default: return '#9ca3af';
        }
    };

    const activeOrders = orders.filter(o =>
        o.status !== 'entregado' && !o.billRequested &&
        (!userRestaurantId || o.restaurant_id === userRestaurantId)
    ).map(o => ({
        ...o,
        restaurant_id: o.restaurant_id || '' // Ensure it matches the type expectations if needed
    }));

    return (
        <div className="container" style={{ maxWidth: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🍳 Cocina</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {(userRole === 'owner' || userRole === 'superadmin') && (
                        <button onClick={() => router.push('/admin')} className="btn" style={{ background: '#f3f4f6' }}>⚙️ Dashboard</button>
                    )}
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/admin/login');
                        }}
                        className="btn"
                        style={{ background: '#fee2e2', color: '#dc2626' }}
                    >
                        Salir
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {activeOrders.length === 0 ? (
                    <p style={{ color: 'var(--muted-foreground)' }}>No hay pedidos activos.</p>
                ) : (
                    activeOrders.map((order) => (
                        <div key={order.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(order.status)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Mesa #{order.tableId}</span>
                                <span style={{
                                    textTransform: 'capitalize',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    background: getStatusColor(order.status),
                                    color: 'white'
                                }}>
                                    {order.status}
                                </span>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.25rem' }}>
                                        <span>{item.quantity}x {item.name}</span>
                                        {item.notes && <span style={{ fontSize: '0.8rem', color: 'gray' }}>({item.notes})</span>}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                {order.status === 'pendiente' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'preparacion')}
                                        disabled={updatingId === order.id}
                                        className="btn"
                                        style={{ background: '#3b82f6', color: 'white', flex: 1, opacity: updatingId === order.id ? 0.7 : 1 }}
                                    >
                                        {updatingId === order.id ? '...' : 'Preparar'}
                                    </button>
                                )}
                                {order.status === 'preparacion' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'listo')}
                                        disabled={updatingId === order.id}
                                        className="btn"
                                        style={{ background: '#22c55e', color: 'white', flex: 1, opacity: updatingId === order.id ? 0.7 : 1 }}
                                    >
                                        {updatingId === order.id ? '...' : 'Listo'}
                                    </button>
                                )}
                                {order.status === 'listo' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'entregado')}
                                        disabled={updatingId === order.id}
                                        className="btn"
                                        style={{ background: '#9ca3af', color: 'white', flex: 1, opacity: updatingId === order.id ? 0.7 : 1 }}
                                    >
                                        {updatingId === order.id ? '...' : 'Entregado'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
