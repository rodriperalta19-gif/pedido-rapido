'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando formulario...</div>}>
            <RegisterForm />
        </Suspense>
    );
}

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteId = searchParams.get('invite');

    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'waiter',
        restaurantName: '',
        slug: '',
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session);
                if (session.user?.email) {
                    setFormData(prev => ({ ...prev, email: session.user.email || '' }));
                }
            }
        });
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            let userId = currentSession?.user?.id;
            let userEmail = currentSession?.user?.email || formData.email;

            if (!userId) {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                });

                if (authError) {
                    if (authError.message.includes('already registered')) {
                        throw new Error('Este email ya está registrado. Inicia sesión para continuar.');
                    }
                    throw authError;
                }

                if (!authData.user) throw new Error('No se pudo crear el usuario.');
                userId = authData.user.id;
            }

            let restaurantId = inviteId;

            if (!inviteId) {
                const createSlug = (name: string) => {
                    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').trim();
                };

                let finalSlug = formData.slug || createSlug(formData.restaurantName);
                let { data: resData, error: resError } = await supabase.from('restaurants').insert([{ name: formData.restaurantName, slug: finalSlug }]).select().single();

                if (resError && (resError as any).code === '23505') {
                    finalSlug = `${finalSlug}-${Math.floor(Math.random() * 1000)}`;
                    const retry = await supabase.from('restaurants').insert([{ name: formData.restaurantName, slug: finalSlug }]).select().single();
                    resData = retry.data;
                    resError = retry.error;
                }

                if (resError) throw new Error('Error al crear el restaurante: ' + resError.message);
                restaurantId = resData.id;
            }

            const userRole = inviteId ? formData.role : 'owner';
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                restaurant_id: restaurantId,
                full_name: formData.fullName,
                email: userEmail,
                role: userRole
            });

            if (profileError) throw new Error('Error al crear perfil: ' + profileError.message);

            alert(inviteId ? '¡Bienvenido al equipo!' : '¡Restaurante listo! Empecemos configurando tu menú.');

            if (userEmail?.toLowerCase() === 'admin@turestaurante.com') router.push('/superadmin');
            else if (userRole === 'waiter') router.push('/waiter');
            else if (userRole === 'cook') router.push('/kitchen');
            else router.push('/admin');

        } catch (error: any) {
            alert(error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', overflow: 'hidden' }}>
            {/* Left Side: Brand/Marketing */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', color: 'white', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Pedido Rápido</h1>
                <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: '1.6', maxWidth: '400px' }}>
                    La plataforma más moderna para la gestión de pedidos y atención en salón.
                </p>
                <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🚀 Fácil Setup</h4>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Configura tu local y menú en menos de 5 minutos.</p>
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🪑 Mesas</h4>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Autogestión para clientes y paneles para mozos.</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ maxWidth: '440px', width: '100%' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
                            {inviteId ? 'Unirse al equipo' : 'Crea tu Restaurante'}
                        </h2>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                            {inviteId ? 'Completa tus datos para empezar a trabajar.' : 'Empecemos con la configuración básica de tu cuenta.'}
                        </p>
                    </div>

                    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Juan Pérez"
                                    style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: '#f8fafc' }}
                                />
                            </div>

                            {!session?.user && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="juan@ejemplo.com"
                                            style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: '#f8fafc' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Contraseña</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: '#f8fafc' }}
                                        />
                                    </div>
                                </>
                            )}

                            {inviteId ? (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Tu Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: '#f8fafc', appearance: 'none' }}
                                    >
                                        <option value="waiter">Mozo / Salón</option>
                                        <option value="cook">Cocinero / Barra</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Nombre del Restaurante</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.restaurantName}
                                        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                        placeholder="Parrilla Don Julio"
                                        style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: '#f8fafc' }}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                marginTop: '1rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                            }}
                        >
                            {loading ? 'Procesando...' : (inviteId ? 'Unirme al Equipo' : 'Comenzar ahora')}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>
                        ¿Ya tienes cuenta? <Link href="/admin/login" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Inicia sesión aquí</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
