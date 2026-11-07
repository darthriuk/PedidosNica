import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Delivery Ecosystem - Web Panels',
  description: 'Paneles de Restaurante y Torre de Control de Administración',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
