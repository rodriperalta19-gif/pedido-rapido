'use client';

import { useOrder } from '@/context/OrderContext';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CartSummary() {
    const { cart } = useOrder();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    if (!mounted) return null;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems === 0) return null;

    return (
        <Link href="/cart" style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'var(--primary)',
            color: 'white',
            padding: '1rem',
            borderRadius: '50%',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
        }}>
            <ShoppingCart size={24} />
            <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'red',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {totalItems}
            </span>
        </Link>
    );
}
