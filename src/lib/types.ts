export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
}

export interface Product {
    id: string;
    restaurant_id?: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    image_url?: string;
    category: string;
    is_available?: boolean;
}

export interface CartItem extends Product {
    quantity: number;
    notes?: string;
}

export type OrderStatus = 'pendiente' | 'preparacion' | 'listo' | 'entregado';

export interface Order {
    id: string;
    restaurant_id?: string;
    tableId: string;
    items: CartItem[];
    total: number;
    status: OrderStatus;
    billRequested?: boolean;
    createdAt: number;
}

export type TableStatus = 'libre' | 'ocupada' | 'reservada';

export interface Table {
    id: string;
    restaurant_id: string;
    number: string;
    status: TableStatus;
    capacity: number;
}
