export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: 'entradas' | 'platos' | 'bebidas' | 'postres';
}

export interface CartItem extends Product {
    quantity: number;
    notes?: string;
}

export type OrderStatus = 'pendiente' | 'preparacion' | 'listo' | 'entregado';

export interface Order {
    id: string;
    tableId: string;
    items: CartItem[];
    total: number;
    status: OrderStatus;
    createdAt: number;
}
