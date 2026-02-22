import { Product } from './types';

export const MENU_ITEMS: Product[] = [
    {
        id: '1',
        name: 'Hamburguesa Clásica',
        description: 'Carne 100% res, lechuga, tomate, queso cheddar y salsa especial.',
        price: 1200,
        category: 'platos',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60',
    },
    {
        id: '2',
        name: 'Papas Fritas',
        description: 'Papas corte bastón, crujientes y doradas.',
        price: 500,
        category: 'entradas',
        image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=60',
    },
    {
        id: '3',
        name: 'Coca Cola',
        description: 'Lata 355ml bien fría.',
        price: 300,
        category: 'bebidas',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60',
    },
    {
        id: '4',
        name: 'Tacos al Pastor',
        description: '3 tacos con piña, cilantro y cebolla.',
        price: 1000,
        category: 'platos',
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=500&q=60',
    },
    {
        id: '5',
        name: 'Nachos con Queso',
        description: 'Totopos con queso fundido y jalapeños.',
        price: 700,
        category: 'entradas',
        image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=60',
    },
    {
        id: '6',
        name: 'Cheesecake',
        description: 'Rebanada de cheesecake de fresa.',
        price: 600,
        category: 'postres',
        image: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=500&q=60',
    }
];
