'use client';

import { useOrder } from '@/context/OrderContext';
import { OrderStatus } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function OrderStatusTracker() {
    const { orders, tableId } = useOrder();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    if (!mounted || !tableId) return null;

    // Filter orders for current table that are not 'entregado' (completed)
    const activeOrders = orders.filter(o => o.tableId === tableId && o.status !== 'entregado');

    if (activeOrders.length === 0) return null;

    const getStatusMessage = (status: OrderStatus) => {
        switch (status) {
            case 'pendiente': return 'Recibido en cocina';
            case 'preparacion': return 'Cocinando...';
            case 'listo': return '¡Listo para servir!';
            default: return '';
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pendiente': return '#fbbf24'; // amber-400
            case 'preparacion': return '#3b82f6'; // blue-500
            case 'listo': return '#22c55e'; // green-500
            default: return '#9ca3af';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '5rem', // Above the cart summary
            left: '1rem',
            right: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 40,
            pointerEvents: 'none' // Click through to content behind
        }}>
            {activeOrders.map(order => (
                <div key={order.id} style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1rem',
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `4px solid ${getStatusColor(order.status)}`,
                    pointerEvents: 'auto'
                }}>
                    <div>
                        <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Pedido #{order.id.slice(-4)}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                            {order.items.length} ítems
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            background: getStatusColor(order.status),
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                        }}>
                            {getStatusMessage(order.status)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
