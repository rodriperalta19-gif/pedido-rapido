'use client';

import { Suspense, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    Armchair,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Trash2,
    Shield,
    UserPlus,
    Store,
    ShoppingBag
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

function StaffManagementContent() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const resIdParam = searchParams.get('resId');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const isMasterEmail = session.user.email?.toLowerCase() === 'admin@turestaurante.com';
            const effectiveRole = isMasterEmail ? 'superadmin' : profile?.role;

            let targetResId = profile?.restaurant_id;
            if ((isMasterEmail || effectiveRole === 'superadmin') && resIdParam) {
                targetResId = resIdParam;
            }

            if (targetResId) {
                setUserProfile({ ...profile, role: effectiveRole, restaurant_id: targetResId });
                fetchStaff(targetResId);
            } else {
                router.push('/admin');
            }
        };
        checkUser();
    }, [router, resIdParam]);

    const fetchStaff = async (restaurantId: string) => {
        if (!restaurantId) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (profileId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profileId);

            if (error) throw error;
            fetchStaff(userProfile.restaurant_id);
        } catch (error: any) {
            alert('Error al cambiar rol: ' + error.message);
        }
    };

    const handleRemoveStaff = async (profileId: string) => {
        if (!confirm('¿Seguro que quieres quitar a este miembro del staff? Solo se le quitará el acceso al restaurante.')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ restaurant_id: null, role: 'customer' })
                .eq('id', profileId);

            if (error) throw error;
            fetchStaff(userProfile.restaurant_id);
        } catch (error: any) {
            alert('Error al quitar staff: ' + error.message);
        }
    };

    if (loading) return <div className="p-8">Cargando staff...</div>;

    const registrationLink = typeof window !== 'undefined'
        ? `${window.location.origin}/register?invite=${userProfile?.restaurant_id}`
        : '';

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar activePage="staff" />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        Gestión de Personal
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Administra los accesos y roles de tu equipo.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                    {/* Staff List Card */}
                    <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--secondary)' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Miembro</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Rol de Acceso</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((member) => (
                                    <tr key={member.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>{member.full_name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{member.email}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--secondary)', fontWeight: '600', cursor: 'pointer' }}
                                                disabled={member.id === userProfile.id}
                                            >
                                                <option value="owner">Dueño</option>
                                                <option value="waiter">Mozo / Camarero</option>
                                                <option value="cook">Cocinero</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            {member.id !== userProfile.id && (
                                                <button
                                                    onClick={() => handleRemoveStaff(member.id)}
                                                    style={{ color: '#ef4444', padding: '0.5rem', borderRadius: '0.5rem', background: '#fee2e2' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Invitation Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card glass" style={{ border: '2px dashed var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                    <UserPlus size={20} />
                                </div>
                                <h3 style={{ fontWeight: '800', fontSize: '1.125rem' }}>Invitar Equipo</h3>
                            </div>

                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Comparte este código de acceso con tus empleados. Al registrarse con este link, se unirán automáticamente a tu restaurante.
                            </p>

                            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '0.8rem', wordBreak: 'break-all', marginBottom: '1.5rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600' }}>
                                {registrationLink}
                            </div>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(registrationLink);
                                    alert('¡Link copiado! Ya puedes enviarlo por WhatsApp.');
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                Copiar Link de Invitación
                            </button>
                        </div>

                        <div className="card" style={{ background: 'var(--secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <Shield size={20} color="var(--primary)" />
                                <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>Control de Accesos</h3>
                            </div>
                            <ul style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <li><strong>Mozos</strong>: Ven el monitor de mesas y pedidos listos. No pueden editar precios.</li>
                                <li><strong>Cocinero</strong>: Solo ve la pantalla de pedidos en preparación.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function StaffManagement() {
    return (
        <Suspense fallback={<div className="p-8">Cargando...</div>}>
            <StaffManagementContent />
        </Suspense>
    );
}
