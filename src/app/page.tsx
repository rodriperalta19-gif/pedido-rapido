'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrder } from '@/context/OrderContext';
import { Store } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { Suspense } from 'react';

function HomeContent() {
  const [inputTable, setInputTable] = useState('');
  const { setTableId, setRestaurantId } = useOrder();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantSlug = searchParams.get('r');

  useEffect(() => {
    let currentResId = null;
    const checkParams = async () => {

      if (restaurantSlug) {
        // Intentar buscar por slug primero, luego por ID si falla
        let { data } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', restaurantSlug)
          .single();

        if (!data) {
          // Si no es un slug, quizás es un ID directo
          const { data: idData } = await supabase
            .from('restaurants')
            .select('id')
            .eq('id', restaurantSlug)
            .single();
          data = idData;
        }

        if (data) {
          currentResId = data.id;
          setRestaurantId(data.id);
        }
      }

      // Autodetección de mesa
      const tableParam = searchParams.get('table');
      if (tableParam) {
        setTableId(tableParam);
        const target = restaurantSlug
          ? `/menu?r=${restaurantSlug}&table=${tableParam}`
          : `/menu?table=${tableParam}`;
        router.replace(target);
      }
    };
    checkParams();
  }, [restaurantSlug, searchParams, setRestaurantId, setTableId, router]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTable.trim()) return;

    setTableId(inputTable);
    // Redirigir al menú asegurando que llevamos el slug del restaurante en la URL
    if (restaurantSlug) {
      router.push(`/menu?r=${restaurantSlug}&table=${inputTable}`);
    } else {
      router.push(`/menu?table=${inputTable}`);
    }
  };

  if (restaurantSlug && searchParams.get('table')) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', animation: 'pulse 2s infinite' }}>
          <Store size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Abriendo menú...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '2rem'
    }}>
      <div style={{
        background: 'var(--primary)',
        color: 'white',
        padding: '2rem',
        borderRadius: '50%',
        boxShadow: 'var(--shadow)'
      }}>
        <Store size={64} />
      </div>

      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Pedido Rápido
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Ingresa tu número de mesa
        </p>
      </div>

      <form onSubmit={handleStart} style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Número de Mesa..."
          value={inputTable}
          onChange={(e) => setInputTable(e.target.value)}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontSize: '1.1rem',
            textAlign: 'center',
            width: '100%'
          }}
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '1.2rem' }}
        >
          Ver Menú
        </button>
      </form>

    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
