'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Settings, Image as ImageIcon, QrCode, MapPin, Phone, Clock, Save, ArrowLeft } from 'lucide-react';

export default function RestaurantSettings() {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        opening_hours: '',
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedUrl = localStorage.getItem('qr_base_url');
            setBaseUrl(savedUrl || window.location.origin);
        }

        const fetchRestaurant = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*, restaurants(*)')
                .eq('id', session.user.id)
                .single();

            if (profile?.restaurants) {
                const res = profile.restaurants;
                setRestaurant(res);
                setFormData({
                    name: res.name || '',
                    address: res.address || '',
                    phone: res.phone || '',
                    opening_hours: res.opening_hours || '',
                });
                setLogoPreview(res.logo_url);
            }
            setLoading(false);
        };

        fetchRestaurant();
    }, [router]);

    useEffect(() => {
        if (baseUrl) localStorage.setItem('qr_base_url', baseUrl);
    }, [baseUrl]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadLogo = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo_${restaurant.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return publicUrl;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalLogoUrl = restaurant.logo_url;
            if (logoFile) finalLogoUrl = await uploadLogo(logoFile);

            const { error } = await supabase
                .from('restaurants')
                .update({
                    ...formData,
                    logo_url: finalLogoUrl
                })
                .eq('id', restaurant.id);

            if (error) throw error;

            setRestaurant({ ...restaurant, ...formData, logo_url: finalLogoUrl });
            alert('¡Configuración guardada correctamente!');
        } catch (error: any) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando ajustes...</div>;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${baseUrl}/?r=${restaurant?.slug}`)}`;

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Settings size={36} /> Configuración del Restaurante
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Personaliza la información de tu local y genera tus códigos QR</p>
                    </div>
                    <button onClick={() => router.push('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
                        <ArrowLeft size={18} /> Volver
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>

                    {/* Formulario Principal */}
                    <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ width: '100px', height: '100px', borderRadius: '1rem', background: '#f8fafc', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <ImageIcon size={32} color="#94a3b8" />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 'bold' }}>Logo del Local</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Se mostrará en el menú digital y tickets.</p>
                                    <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" style={{ display: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>
                                        Nombre Comercial
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>
                                        <MapPin size={16} /> Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Ej: Av. Siempreviva 742"
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>
                                            <Phone size={16} /> Teléfono
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+54 11 ..."
                                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>
                                            <Clock size={16} /> Horarios
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.opening_hours}
                                            onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                                            placeholder="Ej: Lun-Vie 18-00hs"
                                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    marginTop: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </form>
                    </div>

                    {/* QR Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <QrCode size={24} color="#3b82f6" /> Código QR General
                            </h3>

                            <div style={{ marginBottom: '1.5rem', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '1rem', background: '#f8fafc' }}>
                                <img src={qrUrl} alt="QR Menu" style={{ width: '100%', height: 'auto', maxWidth: '200px', margin: '0 auto' }} />
                            </div>

                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                Los clientes podrán escanear este código para ver tu menú digital.
                            </p>

                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>URL de Base</label>
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="http://tu-dominio.com"
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                />
                            </div>

                            <button
                                onClick={() => window.print()}
                                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', color: 'white', borderRadius: '0.75rem', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                            >
                                Descargar o Imprimir QR
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
