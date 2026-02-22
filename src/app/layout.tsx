import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { OrderProvider } from '@/context/OrderContext';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pedido Rápido',
  description: 'Sistema de pedidos para restaurantes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <OrderProvider>
          {children}
          <OrderStatusTracker />
        </OrderProvider>
      </body>
    </html>
  );
}
