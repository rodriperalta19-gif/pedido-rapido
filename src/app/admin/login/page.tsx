'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // 1. Obtener el usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No se encontró el usuario');

            // 2. Obtener su perfil para saber el rol
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            // 3. Redirección Inteligente
            let role = profile?.role;
            if (user.email?.toLowerCase() === 'admin@turestaurante.com') role = 'superadmin';

            if (role === 'superadmin') {
                router.push('/superadmin');
            } else if (role === 'waiter') {
                router.push('/waiter');
            } else if (role === 'cook') {
                router.push('/kitchen');
            } else {
                router.push('/admin');
            }

        } catch (error: any) {
            alert('Error iniciando sesión: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6'
        }}>
            <form onSubmit={handleLogin} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
                    Administración
                </h1>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', background: 'black', color: 'white', borderRadius: '0.25rem' }}
                >
                    {loading ? 'Entrando...' : 'Iniciar Sesión'}
                </button>
            </form>
        </div>
    );
}
