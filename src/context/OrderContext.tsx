'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, Order, Product } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface OrderContextType {
    tableId: string | null;
    setTableId: (id: string) => void;
    restaurantId: string | null;
    setRestaurantId: (id: string) => void;
    cart: CartItem[];
    addToCart: (product: Product, quantity: number, notes?: string) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    orders: Order[];
    placeOrder: () => void;
    requestBill: () => void;
    billRequested: boolean;
    total: number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    // Supabase Integration
    const [tableId, setTableId] = useState<string | null>(null);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [billRequested, setBillRequested] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            const storedTableId = localStorage.getItem('tableId');
            const storedRestaurantId = localStorage.getItem('restaurantId');
            const storedCart = localStorage.getItem('cart');
            if (storedTableId) setTableId(storedTableId);
            if (storedRestaurantId) setRestaurantId(storedRestaurantId);
            if (storedCart) setCart(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        if (isClient && tableId) localStorage.setItem('tableId', tableId);
    }, [tableId, isClient]);

    useEffect(() => {
        if (isClient && restaurantId) localStorage.setItem('restaurantId', restaurantId);
    }, [restaurantId, isClient]);

    useEffect(() => {
        if (isClient) localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart, isClient]);

    // Realtime Orders from Supabase
    useEffect(() => {
        if (!isClient) return;

        const fetchOrders = async () => {
            let query = supabase
                .from('orders')
                .select(`
                    id, 
                    table_id, 
                    restaurant_id,
                    status, 
                    total, 
                    created_at, 
                    bill_requested,
                    order_items (
                        id, 
                        product_id, 
                        quantity, 
                        price, 
                        notes,
                        product_name
                    )
                `);

            // Only fetch orders for the current restaurant if known
            if (restaurantId) {
                query = query.eq('restaurant_id', restaurantId);
            }

            const { data, error } = await query.order('created_at', { ascending: true });

            if (error) console.error('Error fetching orders:', error);
            else if (data) {
                const mappedOrders: Order[] = data.map((o: any) => ({
                    id: o.id,
                    restaurant_id: o.restaurant_id,
                    tableId: o.table_id,
                    status: o.status,
                    total: o.total,
                    billRequested: o.bill_requested,
                    createdAt: new Date(o.created_at).getTime(),
                    items: o.order_items.map((i: any) => ({
                        id: i.product_id,
                        name: i.product_name || 'Producto',
                        price: i.price,
                        category: 'platos',
                        image: '/placeholder.jpg',
                        quantity: i.quantity,
                        notes: i.notes
                    })),
                }));
                setOrders(mappedOrders);
            }
        };

        fetchOrders();

        const channel = supabase
            .channel('realtime orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isClient, restaurantId]);


    const addToCart = (product: Product, quantity: number, notes?: string) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
                        : item
                );
            }
            return [...prev, { ...product, quantity, notes }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    const placeOrder = async () => {
        if (!tableId || cart.length === 0) return;

        const totalOrder = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        try {
            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    table_id: tableId,
                    restaurant_id: restaurantId,
                    total: totalOrder,
                    status: 'pendiente'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            if (orderData) {
                const itemsToInsert = cart.map(item => ({
                    order_id: orderData.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes,
                    product_name: item.name
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;

                clearCart();
                // No need to manually update local orders, subscription will catch it
            }
        } catch (err: any) {
            console.error('Error placing order:', err);
            alert(`Hubo un error al enviar el pedido: ${err.message || JSON.stringify(err)}`);
        }
    };

    const requestBill = async () => {
        if (!tableId) return;
        setBillRequested(true);
        // Find active order for this table? Or just create a notification?
        // Since we don't have a specific "Bill" table, we can update the latest order or just use alert.
        // For Supabase, let's assuming we update the ACTIVE orders for this table to 'bill_requested = true'
        // But our schema has bill_requested on orders.
        try {
            await supabase
                .from('orders')
                .update({ bill_requested: true })
                .eq('table_id', tableId)
                .neq('status', 'entregado'); // Only active orders
        } catch (err) {
            console.error('Error requesting bill', err);
        }
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <OrderContext.Provider
            value={{
                tableId,
                setTableId,
                restaurantId,
                setRestaurantId,
                cart,
                addToCart,
                removeFromCart,
                clearCart,
                orders,
                placeOrder,
                requestBill,
                billRequested,
                total,
            }}
        >
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}
