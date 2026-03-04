'use client';

import { useOrder } from '@/context/OrderContext';
import { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CartSummary from '@/components/CartSummary';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function MenuContent() {
    const { tableId, setTableId, addToCart, requestBill, billRequested, setRestaurantId } = useOrder();
    const router = useRouter();
    const searchParams = useSearchParams();
    const restaurantSlug = searchParams.get('r');

    const [selectedCategory, setSelectedCategory] = useState<Product['category'] | 'todos'>('todos');
    const [products, setProducts] = useState<Product[]>([]);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const tableParam = searchParams.get('table');

        if (!tableId && !tableParam) {
            router.push('/');
            return;
        }

        if (tableParam && tableId !== tableParam) {
            setTableId(tableParam);
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                let currentRestaurantId = null;

                // 1. Buscamos el restaurante por slug o por ID
                if (restaurantSlug) {
                    let { data: resData } = await supabase
                        .from('restaurants')
                        .select('*')
                        .eq('slug', restaurantSlug)
                        .single();

                    if (!resData) {
                        // Intentar por ID
                        const { data: idData } = await supabase
                            .from('restaurants')
                            .select('*')
                            .eq('id', restaurantSlug)
                            .single();
                        resData = idData;
                    }

                    if (resData) {
                        setRestaurant(resData);
                        currentRestaurantId = resData.id;
                        setRestaurantId(resData.id);
                    }
                }

                // 2. Traemos los productos (filtrando por restaurante si existe)
                let query = supabase.from('products').select('*').eq('is_available', true);

                if (currentRestaurantId) {
                    query = query.eq('restaurant_id', currentRestaurantId);
                } else {
                    // Si no hay restaurante especificado, mostramos los que no tienen restaurante asignado (legacy)
                    query = query.is('restaurant_id', null);
                }

                const { data, error } = await query;

                if (error) throw error;
                if (data) {
                    const mappedProducts: Product[] = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        category: p.category as Product['category'],
                        image: p.image_url || '/placeholder-food.jpg'
                    }));
                    setProducts(mappedProducts);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tableId, restaurantSlug, router, setTableId, searchParams, setRestaurantId]);

    if (!tableId) return null;

    const handleRequestBill = () => {
        if (confirm('¿Deseas solicitar la cuenta y cerrar la mesa?')) {
            requestBill();
            alert('¡El mozo ha sido notificado!');
        }
    };

    const categories = ['todos', 'entradas', 'platos', 'bebidas', 'postres'];

    const filteredItems = selectedCategory === 'todos'
        ? products
        : products.filter(item => item.category === selectedCategory);

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {restaurant?.logo_url && (
                        <div style={{ width: '60px', height: '60px', position: 'relative', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <Image
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                unoptimized
                            />
                        </div>
                    )}
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {restaurant ? restaurant.name : 'Menú'}
                        </h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>Mesa #{tableId}</p>
                    </div>
                </div>
                <button
                    onClick={handleRequestBill}
                    disabled={billRequested}
                    className="btn"
                    style={{
                        background: billRequested ? 'var(--muted)' : '#10b981',
                        color: billRequested ? 'var(--muted-foreground)' : 'white',
                        fontSize: '0.9rem',
                        padding: '0.5rem 1rem'
                    }}
                >
                    {billRequested ? 'Cuenta Solicitada' : 'Solicitar Cuenta'}
                </button>
            </header>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '1rem',
                marginBottom: '1rem',
                scrollbarWidth: 'none'
            }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as Product['category'] | 'todos')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            background: selectedCategory === cat ? 'var(--primary)' : 'var(--muted)',
                            color: selectedCategory === cat ? 'white' : 'var(--foreground)',
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando menú...</div>
            ) : filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                    No hay productos disponibles en esta categoría.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {filteredItems.map(item => (
                        <div key={item.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '120px', background: '#eee', position: 'relative' }}>
                                <Image
                                    src={item.image || '/placeholder-food.jpg'}
                                    alt={item.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    unoptimized // Useful for external/Supabase URLs to avoid Next.js domain config issues initially
                                />
                            </div>
                            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', flex: 1 }}>
                                    {item.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontWeight: 'bold' }}>${item.price}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedProduct(item);
                                            setNotes('');
                                        }}
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <OrderStatusTracker />
            <CartSummary />

            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Agregar al pedido</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ width: '60px', height: '60px', position: 'relative', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <Image
                                    src={selectedProduct.image || '/placeholder-food.jpg'}
                                    alt={selectedProduct.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: '600' }}>{selectedProduct.name}</h3>
                                <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${selectedProduct.price}</p>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Aclaraciones (Opcional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej. Sin cebolla, sin condimentos, extra aderezo..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border)',
                                    minHeight: '80px',
                                    resize: 'none',
                                    fontFamily: 'inherit',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setNotes('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--foreground)',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    addToCart(selectedProduct, 1, notes);
                                    setSelectedProduct(null);
                                    setNotes('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MenuPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
            <MenuContent />
        </Suspense>
    );
}

