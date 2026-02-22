'use client';

import { useOrder } from '@/context/OrderContext';
import { OrderStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, CreditCard, Utensils } from 'lucide-react';

export default function WaiterPage() {
    const { orders, setRestaurantId } = useOrder();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [userRestaurantId, setUserRestaurantId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [lastOrderReadyCount, setLastOrderReadyCount] = useState(0);

    // Audio for notifications (optional, but good for UX)
    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio blocked by browser policy'));
    };

    // Notification Logic (Pedidos Listos y Cuentas)
    useEffect(() => {
        // Alerta por pedidos listos
        const readyCount = orders.filter(o => o.status === 'listo' && !o.billRequested).length;
        if (readyCount > lastOrderReadyCount) {
            playNotificationSound();
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("¡Plato Listo!", {
                    body: `Hay un nuevo plato listo para servir.`,
                    icon: "/favicon.ico"
                });
            }
        }
        setLastOrderReadyCount(readyCount);

        // Alerta por solicitud de cuenta
        const billRequestCount = orders.filter(o => o.billRequested && (!userRestaurantId || o.restaurant_id === userRestaurantId)).length;
        if (billRequestCount > (orders.filter(o => o.billRequested).length - 1)) { // Simple check for new bill requests
            // Podríamos usar un state separado para lastBillRequestCount si queremos ser más precisos
        }
    }, [orders, lastOrderReadyCount, userRestaurantId]);

    // Efecto separado para sonido de CUENTA specifically si queremos
    const [lastBillCount, setLastBillCount] = useState(0);
    useEffect(() => {
        const currentBillCount = orders.filter(o => o.billRequested && (!userRestaurantId || o.restaurant_id === userRestaurantId)).length;
        if (currentBillCount > lastBillCount) {
            playNotificationSound();
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("¡Solicitud de Cuenta!", {
                    body: `La mesa #${orders.find(o => o.billRequested && o.id)?.tableId} ha pedido la cuenta.`,
                    icon: "/favicon.ico"
                });
            }
        }
        setLastBillCount(currentBillCount);
    }, [orders, lastBillCount, userRestaurantId]);

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

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
                // Validación de Rol: Un cocinero no debería estar en el panel de mozos
                if (profile.role === 'cook') {
                    router.push('/kitchen');
                    return;
                }

                setUserRestaurantId(profile.restaurant_id);
                setRestaurantId(profile.restaurant_id);
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


    const activeOrders = orders.filter(o =>
        (!userRestaurantId || o.restaurant_id === userRestaurantId)
    );

    // Separar pedidos por estado para el mozo
    const billRequests = activeOrders.filter(o => o.billRequested && o.status !== 'entregado');
    const readyToServe = activeOrders.filter(o => o.status === 'listo' && !o.billRequested);
    const inProgress = activeOrders.filter(o => (o.status === 'pendiente' || o.status === 'preparacion') && !o.billRequested);

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🏃‍♂️ Mozos</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {(userRole === 'owner' || userRole === 'superadmin') && (
                        <>
                            <button onClick={() => router.push('/admin')} className="btn" style={{ background: '#f3f4f6' }}>⚙️ Dashboard</button>
                            <button onClick={() => router.push('/kitchen')} className="btn" style={{ background: '#f3f4f6' }}>🍳 Cocina</button>
                        </>
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

            {/* SECCIÓN 1: SOLICITUDES DE CUENTA */}
            {billRequests.length > 0 && (
                <section style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
                        <CreditCard size={24} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Solicitudes de Cuenta ({billRequests.length})</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {billRequests.map(order => (
                            <div key={order.id} className="card" style={{ borderLeft: '6px solid #ef4444', background: '#fef2f2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Mesa #{order.tableId}</span>
                                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>Total: ${order.total}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                    El cliente está esperando la cuenta en la mesa.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => router.push('/cashier')}
                                        style={{ flex: 1, padding: '0.5rem', background: '#ef4444', color: 'white', borderRadius: '0.5rem', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Ir a Caja para Cobrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SECCIÓN 2: LISTO PARA SERVIR */}
            <section style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#22c55e' }}>
                    <Utensils size={24} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Listos para Servir ({readyToServe.length})</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {readyToServe.length === 0 ? (
                        <p style={{ color: '#666' }}>No hay platos listos.</p>
                    ) : (
                        readyToServe.map(order => (
                            <div key={order.id} className="card" style={{ borderLeft: '6px solid #22c55e' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Mesa #{order.tableId}</span>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                            • {item.quantity}x {item.name}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => updateStatus(order.id, 'entregado')}
                                    disabled={updatingId === order.id}
                                    style={{ width: '100%', padding: '0.75rem', background: '#22c55e', color: 'white', borderRadius: '0.5rem', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Marcar como Entregado
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* SECCIÓN 3: EN PROCESO */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#3b82f6' }}>
                    <Bell size={24} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>En Cocina ({inProgress.length})</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {inProgress.length === 0 ? (
                        <p style={{ color: '#666' }}>No hay pedidos en cocina.</p>
                    ) : (
                        inProgress.map(order => (
                            <div key={order.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #eee' }}>
                                <span style={{ fontWeight: 'bold' }}>Mesa #{order.tableId}</span>
                                <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#666', background: '#e5e7eb', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                                    {order.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
