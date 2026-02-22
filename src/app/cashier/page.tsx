'use client';

import { useOrder } from '@/context/OrderContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CreditCard, Bell } from 'lucide-react';

export default function CashierPage() {
    const { orders, setRestaurantId } = useOrder();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [userRestaurantId, setUserRestaurantId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [prevBillCount, setPrevBillCount] = useState(0);

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
                // Validación de Rol
                if (profile.role === 'cook') {
                    router.push('/kitchen');
                    return;
                } else if (profile.role === 'waiter') {
                    router.push('/waiter');
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

    // Lógica para el sonido de alerta (SOLO EN CAJA)
    useEffect(() => {
        const billRequests = orders.filter(o => o.billRequested && (!userRestaurantId || o.restaurant_id === userRestaurantId));

        if (soundEnabled && billRequests.length > prevBillCount) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log('Error al reproducir sonido:', e));
        }
        setPrevBillCount(billRequests.length);
    }, [orders, soundEnabled, prevBillCount, userRestaurantId]);

    if (!mounted) return null;

    const clearBillRequest = async (orderId: string) => {
        setUpdatingId(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ bill_requested: false, status: 'entregado' })
                .eq('id', orderId);

            if (error) throw error;
        } catch (err) {
            console.error('Error clearing bill request:', err);
            alert('Error al procesar el pago.');
        } finally {
            setUpdatingId(null);
        }
    };

    const billRequests = orders.filter(o => o.billRequested && (!userRestaurantId || o.restaurant_id === userRestaurantId));
    const activeOrdersCount = orders.filter(o => o.status !== 'entregado' && (!userRestaurantId || o.restaurant_id === userRestaurantId)).length;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>💰 Panel de Caja</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="btn"
                        style={{
                            background: soundEnabled ? '#22c55e' : '#e5e7eb',
                            color: soundEnabled ? 'white' : 'black',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {soundEnabled ? '🔔 Alerta Activada' : '🔕 Alerta Silenciada'}
                    </button>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                {/* Solicitudes de Cuenta */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#ef4444' }}>
                        <CreditCard size={28} />
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Solicitudes de Cuenta</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {billRequests.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '1rem', border: '2px dashed #eee', gridColumn: '1 / -1' }}>
                                <p style={{ color: '#999', fontSize: '1.2rem' }}>No hay mesas solicitando la cuenta en este momento.</p>
                            </div>
                        ) : (
                            billRequests.map(order => (
                                <div key={order.id} className="card" style={{ borderLeft: '8px solid #ef4444', background: '#fef2f2', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>Mesa #{order.tableId}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#ef4444' }}>${order.total}</span>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem', maxHeight: '150px', overflowY: 'auto', background: 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{item.quantity}x {item.name}</span>
                                                <span style={{ color: '#666' }}>${item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => clearBillRequest(order.id)}
                                        disabled={updatingId === order.id}
                                        style={{ width: '100%', padding: '1rem', background: '#ef4444', color: 'white', borderRadius: '0.6rem', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
                                    >
                                        {updatingId === order.id ? 'Procesando...' : 'Confirmar Pago y Liberar Mesa'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Resumen de Salón */}
                <aside style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} color="#3b82f6" /> Estado del Salón
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '0.75rem' }}>
                            <p style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Mesas con Pedido</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{activeOrdersCount}</p>
                        </div>
                        <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.75rem' }}>
                            <p style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pendientes de Cobro</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>{billRequests.length}</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
