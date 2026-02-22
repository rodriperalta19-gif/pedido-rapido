'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, Restaurant } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProductFormProps {
    initialData?: Product;
    isEditing?: boolean;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'platos',
        image: '',
        restaurant_id: '',
        is_available: true,
    });

    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setUserProfile(profile);
                    if (!initialData && profile.restaurant_id) {
                        setFormData(prev => ({ ...prev, restaurant_id: profile.restaurant_id }));
                    }
                }
            }
        };
        fetchUserData();

        const fetchRestaurants = async () => {
            const { data } = await supabase.from('restaurants').select('*');
            if (data) setRestaurants(data);
        };
        fetchRestaurants();

        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                price: initialData.price.toString(),
                category: initialData.category,
                image: initialData.image || '',
                restaurant_id: initialData.restaurant_id || '',
                is_available: initialData.is_available !== false,
            });
            if (initialData.image) {
                setImagePreview(initialData.image);
            }
        }
    }, [initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError, data } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = formData.image;

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                image_url: finalImageUrl,
                restaurant_id: formData.restaurant_id || null,
                is_available: formData.is_available
            };

            if (isEditing && initialData) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                const newId = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                const { error, data } = await supabase
                    .from('products')
                    .insert([{ ...productData, id: newId }])
                    .select();

                if (error) {
                    console.error('Supabase Insert Error:', error);
                    throw new Error(error.message || 'Error desconocido en DB');
                }
            }

            alert('¡Producto guardado correctamente!');
            router.push('/admin');
            router.refresh();
        } catch (error: any) {
            console.error('Error completo:', error);
            alert('Error al guardar: ' + (error.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>

            {(!userProfile || userProfile.role === 'superadmin') && (
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Restaurante (Dueño)</label>
                    <select
                        value={formData.restaurant_id}
                        onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                    >
                        <option value="">-- Seleccionar Restaurante --</option>
                        {restaurants.map(res => (
                            <option key={res.id} value={res.id}>{res.name}</option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        * Para que aparezca en el menú de un local específico.
                    </p>
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Descripción</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio ($)</label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input"
                        required
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Categoría</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                    >
                        <option value="entradas">Entradas</option>
                        <option value="platos">Platos Fuertes</option>
                        <option value="bebidas">Bebidas</option>
                        <option value="postres">Postres</option>
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                <label htmlFor="is_available" style={{ fontWeight: '600', cursor: 'pointer', color: formData.is_available ? '#166534' : '#991b1b' }}>
                    {formData.is_available ? '✅ Producto en Stock (Disponible)' : '❌ Producto Agotado (No aparecerá en el menú)'}
                </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Imagen del Producto</label>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        width: '100%',
                        height: '200px',
                        border: '2px dashed #ccc',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        backgroundColor: '#f9fafb',
                        marginBottom: '0.5rem'
                    }}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ textAlign: 'center', color: '#6b7280' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</p>
                            <p>Haz clic para subir una imagen</p>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    * Se recomienda una imagen cuadrada de buena calidad.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn"
                    style={{ flex: 1, background: '#e5e7eb', color: 'black' }}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1 }}
                >
                    {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </div>
        </form>
    );
}
