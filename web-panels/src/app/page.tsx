import React from 'react';
import Link from 'next/link';

export default function HubPage() {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto flex flex-col justify-center">
      <div className="mb-12 text-center">
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Ecosistema Delivery Conectado
        </span>
        <h1 className="text-4xl font-extrabold text-white mt-4 tracking-tight">
          Paneles de Operaciones & Control
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
          Selecciona el panel de trabajo para interactuar en tiempo real con Supabase y el microservicio OSRM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel Cocina */}
        <Link
          href="/restaurant/orders"
          className="group block p-6 bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all shadow-xl hover:shadow-amber-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">👨‍🍳</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
              Sonido en vivo
            </span>
          </div>
          <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
            Gestor de Pedidos de Cocina
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Recepción acústica automática de nuevos pedidos, temporizador de preparación y botón de aviso para despacho.
          </p>
        </Link>

        {/* Control de Menú */}
        <Link
          href="/restaurant/menu"
          className="group block p-6 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">📋</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
              Optimistic UI
            </span>
          </div>
          <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
            Control de Menú y Stock
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Switch instantáneo para pausar platillos agotados en tiempo real sin recargar la pantalla.
          </p>
        </Link>

        {/* Torre de Control */}
        <Link
          href="/admin/control-tower"
          className="group block p-6 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">📡</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-semibold">
              PostGIS + Realtime
            </span>
          </div>
          <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
            Torre de Control de Flota (Live Map)
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Mapa global de conductores en vivo con estado cromático, batería, velocidad y órdenes asignadas.
          </p>
        </Link>

        {/* Tarifas & Geocercas */}
        <Link
          href="/admin/fares"
          className="group block p-6 bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all shadow-xl hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">⚙️</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold">
              OSRM $0 Cost
            </span>
          </div>
          <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            Tarifas Dinámicas y Geocercas
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Configuración de base fare, costo por km, costo por minuto y simulador de cotización al cliente.
          </p>
        </Link>
      </div>
    </main>
  );
}
