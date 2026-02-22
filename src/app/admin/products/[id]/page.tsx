'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProductForm from '@/components/ProductForm';
import { Product } from '@/lib/types';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
    const params = useParams();
    const id = params.id as string;
    const [product, setProduct] = useState<Product | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching product:', error);
                alert('No se pudo cargar el producto');
            } else if (data) {
                setProduct({
                    ...data,
                    image: data.image_url // Map DB column to type
                });
            }
            setLoading(false);
        };

        fetchProduct();
    }, [id]);

    if (loading) return <div className="p-8">Cargando...</div>;
    if (!product) return <div className="p-8">Producto no encontrado</div>;

    return (
        <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
            <ProductForm initialData={product} isEditing={true} />
        </div>
    );
}
