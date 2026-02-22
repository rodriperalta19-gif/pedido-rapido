'use client';

import { useOrder } from '@/context/OrderContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function CartPage() {
    const { cart, removeFromCart, placeOrder, total } = useOrder();
    const router = useRouter();

    if (cart.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Tu carrito está vacío</h2>
                <Link href="/menu" className="btn btn-primary">
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al menú
                </Link>
            </div>
        );
    }

    const handlePlaceOrder = () => {
        placeOrder();
        alert('¡Pedido enviado a la cocina!');
        router.push('/menu');
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/menu">
                    <ArrowLeft size={24} />
                </Link>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Tu Pedido</h1>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '8rem' }}>
                {cart.map((item) => (
                    <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                background: '#eee'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: 'var(--radius)',
                                    overflow: 'hidden',
                                    background: '#eee',
                                    position: 'relative'
                                }}>
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="60px"
                                        unoptimized
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontWeight: '600' }}>{item.name}</h3>
                                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                                    Cantidad: {item.quantity} x ${item.price}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 'bold' }}>${item.price * item.quantity}</span>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                style={{ color: '#ef4444', padding: '0.5rem' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--background)',
                borderTop: '1px solid var(--border)',
                padding: '1.5rem',
                boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
                <div className="container" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        <span>Total</span>
                        <span>${total}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '1.1rem' }}
                    >
                        Enviar a Cocina
                    </button>
                </div>
            </div>
        </div>
    );
}
