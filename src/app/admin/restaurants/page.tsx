'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Restaurant } from '@/lib/types';
import Link from 'next/link';

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        const { data, error } = await supabase.from('restaurants').select('*').order('name');
        if (error) console.error(error);
        else setRestaurants(data || []);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        // Simple slugify
        const finalSlug = slug.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const { data, error } = await supabase
            .from('restaurants')
            .insert([{ name, slug: finalSlug }])
            .select()
            .single();

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Restaurante creado correctamente');
            setName('');
            setSlug('');
            fetchRestaurants();
        }
        setCreating(false);
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Gestión de Restaurantes</h1>

            {/* Formulario de Creación */}
            <form onSubmit={handleCreate} style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Registrar Nuevo Restaurante</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Nombre del Local</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!slug) setSlug(e.target.value.toLowerCase().replace(/ /g, '-'));
                            }}
                            required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                            placeholder="Ej: Parrilla Don Julio"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Slug (para la URL)</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                            placeholder="ej: parrilla-don-julio"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={creating}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                >
                    {creating ? 'Creando...' : 'Dar de Alta Restaurante'}
                </button>
            </form>

            {/* Lista de Restaurantes */}
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>URL del Menú</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>ID Sistema</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>Cargando...</td></tr>
                        ) : restaurants.length === 0 ? (
                            <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>No hay restaurantes registrados.</td></tr>
                        ) : (
                            restaurants.map(r => (
                                <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{r.name}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <code style={{ background: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>
                                            /menu?r={r.slug}
                                        </code>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.7rem', color: '#6b7280' }}>
                                        {r.id.slice(0, 8)}...
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                    Volver al Panel de Productos
                </Link>
            </div>
        </div>
    );
}
