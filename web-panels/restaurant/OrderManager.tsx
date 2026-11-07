'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  options?: string[];
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehicle: string;
  eta: string;
  pin: string;
  avatar?: string;
}

export interface Order {
  id: string;
  client_name: string;
  phone?: string;
  delivery_address: string;
  delivery_notes?: string;
  status: 'CREATED' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  subtotal?: number;
  delivery_fee?: number;
  total: number;
  created_at: string;
  accepted_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  estimated_prep_minutes?: number;
  items?: OrderItem[];
  driver?: DriverInfo;
}

export default function RestaurantOrderManager({
  restaurantId,
  supabaseUrl,
  supabaseAnonKey,
}: {
  restaurantId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-81a2',
      status: 'CREATED',
      client_name: 'Valeria Rossi',
      phone: '+54 9 11 4099-2311',
      delivery_address: 'Av. Santa Fe 3420, Piso 4 B',
      delivery_notes: 'Timbre no funciona, tocar bocina o llamar',
      subtotal: 19.50,
      delivery_fee: 2.50,
      total: 22.00,
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
      estimated_prep_minutes: 25,
      items: [
        { name: 'Pizza Napolitana Familiar', quantity: 1, unit_price: 14.00, options: ['+ Extra Queso (+$1.50)', 'Sin Cebolla'] },
        { name: 'Coca-Cola 500ml', quantity: 2, unit_price: 2.00, options: [] }
      ]
    },
    {
      id: 'ord-33b7',
      status: 'IN_PREPARATION',
      client_name: 'Lucas Benítez',
      phone: '+54 9 11 5566-7788',
      delivery_address: 'Honduras 4820, Palermo',
      delivery_notes: 'Entregar en portería',
      subtotal: 21.90,
      delivery_fee: 2.00,
      total: 23.90,
      created_at: new Date(Date.now() - 14 * 60000).toISOString(),
      accepted_at: new Date(Date.now() - 11 * 60000).toISOString(),
      estimated_prep_minutes: 20,
      items: [
        { name: 'Super Combo Doble Cheddar', quantity: 1, unit_price: 12.90, options: ['Papas Rústicas', 'Gaseosa Lima'] },
        { name: 'Empanadas Criollas x6', quantity: 1, unit_price: 9.00, options: ['Carne suave'] }
      ]
    },
    {
      id: 'ord-52c9',
      status: 'READY_FOR_PICKUP',
      client_name: 'Camila Díaz',
      phone: '+54 9 11 6789-0123',
      delivery_address: 'Thames 1640, Depto 2',
      delivery_notes: 'Llamar antes de subir',
      subtotal: 25.00,
      delivery_fee: 2.50,
      total: 27.50,
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      accepted_at: new Date(Date.now() - 22 * 60000).toISOString(),
      ready_at: new Date(Date.now() - 2 * 60000).toISOString(),
      estimated_prep_minutes: 20,
      driver: {
        name: 'Martín Rivas',
        phone: '+54 9 11 9876-5432',
        vehicle: 'Moto Honda CB125 (A482XYZ)',
        eta: 'Arribando en 2 min',
        pin: '4821',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      },
      items: [
        { name: 'Burger Bacon Crispy', quantity: 2, unit_price: 9.00, options: ['+ Doble Panceta (+$2.50)'] },
        { name: 'Postre Tiramisú Clásico', quantity: 1, unit_price: 4.50, options: [] }
      ]
    }
  ]);

  const [prepTimes, setPrepTimes] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<Order | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Insumos agotados / sin stock para preparar');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');
  const [storeStatus, setStoreStatus] = useState<'OPEN' | 'BUSY' | 'CLOSED'>('OPEN');

  const audioContextRef = useRef<AudioContext | null>(null);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = useRef(createClient(supabaseUrl, supabaseAnonKey)).current;

  // Web Audio API Chime
  const playAlertChime = () => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio Web error:', e);
    }
  };

  useEffect(() => {
    // 1. Cargar pedidos desde Supabase
    const loadOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setOrders(data as Order[]);
      }
    };

    loadOrders();

    // 2. Suscripción Realtime
    const channel = supabase
      .channel('restaurant-orders-' + restaurantId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev]);
            playAlertChime();
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((ord) => (ord.id === payload.new.id ? { ...ord, ...payload.new } : ord))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
    };
  }, [restaurantId]);

  // Alarma acústica continua mientras haya pedidos en CREATED sin aceptar
  useEffect(() => {
    const hasPendingCreatedOrders = orders.some((o) => o.status === 'CREATED');

    if (hasPendingCreatedOrders && !soundIntervalRef.current && !isMuted) {
      playAlertChime();
      soundIntervalRef.current = setInterval(playAlertChime, 3500);
    } else if ((!hasPendingCreatedOrders || isMuted) && soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }

    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    };
  }, [orders, isMuted]);

  // Aceptar pedido
  const handleAcceptOrder = async (orderId: string) => {
    const minutes = prepTimes[orderId] || 25;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'ACCEPTED', estimated_prep_time_minutes: minutes })
      .eq('id', orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'ACCEPTED', estimated_prep_minutes: minutes } : o))
    );
  };

  // Marcar listo para despacho
  const handleMarkReady = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'READY_FOR_PICKUP' }).eq('id', orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'READY_FOR_PICKUP',
              driver: o.driver || {
                name: 'Martín Rivas',
                phone: '+54 9 11 9876-5432',
                vehicle: 'Moto Honda CB125 (A482XYZ)',
                eta: 'Arribando en 2 min',
                pin: '4821',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
              }
            }
          : o
      )
    );
  };

  // Confirmar entrega al repartidor
  const handleConfirmPickup = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'PICKED_UP' }).eq('id', orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'PICKED_UP', picked_up_at: new Date().toISOString() } : o))
    );
  };

  // Rechazo de pedido con motivo
  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    const finalReason = rejectReason === 'CUSTOM' ? customRejectReason : rejectReason;

    await supabase
      .from('orders')
      .update({ status: 'CANCELLED', cancellation_reason: finalReason })
      .eq('id', rejectingOrderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === rejectingOrderId
          ? { ...o, status: 'CANCELLED', cancellation_reason: finalReason, cancelled_at: new Date().toISOString() }
          : o
      )
    );
    setRejectingOrderId(null);
    setCustomRejectReason('');
  };

  // Simular pedido entrante
  const handleSimulateOrder = () => {
    const testId = 'ord-' + Date.now().toString(36).slice(-4);
    const newOrd: Order = {
      id: testId,
      status: 'CREATED',
      client_name: 'Cliente ' + Math.floor(Math.random() * 900 + 100),
      phone: '+54 9 11 3456-7890',
      delivery_address: 'Av. Libertador ' + Math.floor(Math.random() * 2000 + 1000),
      delivery_notes: 'Dejar en recepción',
      subtotal: 16.50,
      delivery_fee: 2.00,
      total: 18.50,
      created_at: new Date().toISOString(),
      estimated_prep_minutes: 25,
      items: [
        { name: 'Super Combo Doble Cheddar', quantity: 1, unit_price: 12.90, options: ['Papas', 'Bebida'] },
        { name: 'Gaseosa 500ml', quantity: 1, unit_price: 3.60 }
      ]
    };

    setOrders((prev) => [newOrd, ...prev]);
    playAlertChime();
  };

  // Filtrado de historial
  const historyOrders = orders.filter((o) => {
    const isHistory = ['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status);
    if (!isHistory) return false;
    if (historyFilter !== 'ALL' && o.status !== historyFilter) return false;
    if (historySearch) {
      const matchId = o.id.toLowerCase().includes(historySearch.toLowerCase());
      const matchClient = (o.client_name || '').toLowerCase().includes(historySearch.toLowerCase());
      return matchId || matchClient;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Topbar del KDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h1 className="text-2xl font-black tracking-tight text-white">Comandas de Cocina & Despacho (KDS)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Sincronización en tiempo real vía WebSockets con Supabase</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Switch de Estado de Tienda */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStoreStatus('OPEN')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                storeStatus === 'OPEN' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              🟢 Abierto
            </button>
            <button
              onClick={() => setStoreStatus('BUSY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                storeStatus === 'BUSY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              🟡 Saturado
            </button>
            <button
              onClick={() => setStoreStatus('CLOSED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                storeStatus === 'CLOSED' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔴 Cerrado
            </button>
          </div>

          {/* Alarma Sonora */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isMuted
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isMuted ? '🔇 Alarma Silenciada' : '🔔 Alarma Activa'}
          </button>

          {/* Test Sonido */}
          <button
            onClick={playAlertChime}
            className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
            title="Probar timbre"
          >
            🔊 Test
          </button>

          {/* Simular Pedido */}
          <button
            onClick={handleSimulateOrder}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
          >
            + Simular Pedido
          </button>
        </div>
      </div>

      {/* Sub-navegación: Comandas Activas vs Historial */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'live' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          🔴 Comandas en Vivo ({orders.filter((o) => ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'READY_FOR_PICKUP'].includes(o.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          📜 Historial del Turno ({orders.filter((o) => ['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)).length})
        </button>
      </div>

      {/* VISTA 1: TABLERO KANBAN EN VIVO */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1: Nuevos Pedidos */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h2 className="font-extrabold text-amber-400 flex items-center justify-between text-sm uppercase tracking-wider mb-4 pb-3 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                1. Nuevos Entrantes ({orders.filter((o) => o.status === 'CREATED').length})
              </span>
              <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-mono">Alarma</span>
            </h2>

            <div className="space-y-4">
              {orders
                .filter((o) => o.status === 'CREATED')
                .map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-800/90 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-md text-amber-400">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1 font-semibold">{order.client_name}</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-400 font-mono">${order.total.toFixed(2)}</span>
                    </div>

                    {/* Ítems */}
                    <div className="space-y-1 py-2 border-y border-slate-700/80 text-xs">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-200">
                          <span>
                            <strong>{it.quantity}x</strong> {it.name}
                            {it.options && it.options.length > 0 && (
                              <span className="block text-[10px] text-amber-300/80 pl-2">{it.options.join(', ')}</span>
                            )}
                          </span>
                          <span className="font-mono text-slate-400">${(it.quantity * it.unit_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-300">📍 {order.delivery_address}</p>
                    {order.delivery_notes && (
                      <p className="text-[10px] text-rose-300 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                        Nota: {order.delivery_notes}
                      </p>
                    )}

                    {/* Tiempo de cocción */}
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-slate-400">Cocción:</label>
                      <input
                        type="number"
                        defaultValue={25}
                        onChange={(e) =>
                          setPrepTimes({ ...prepTimes, [order.id]: parseInt(e.target.value) })
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1 text-center font-bold text-white font-mono"
                      />
                      <span className="text-slate-400">minutos</span>
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setRejectingOrderId(order.id)}
                        className="py-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                      >
                        ✕ Rechazar
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all"
                      >
                        ✓ Aceptar Pedido
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedTicketOrder(order)}
                      className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-white font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>🖨️</span> Ver / Imprimir Ticket Térmico
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Columna 2: En Preparación */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h2 className="font-extrabold text-blue-400 flex items-center justify-between text-sm uppercase tracking-wider mb-4 pb-3 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <span>👨‍🍳</span>
                2. En Cocina ({orders.filter((o) => ['ACCEPTED', 'IN_PREPARATION'].includes(o.status)).length})
              </span>
              <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full font-mono">Cronometrado</span>
            </h2>

            <div className="space-y-4">
              {orders
                .filter((o) => ['ACCEPTED', 'IN_PREPARATION'].includes(o.status))
                .map((order) => (
                  <div key={order.id} className="bg-slate-800/80 border border-blue-500/40 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-md text-blue-300">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1 font-semibold">{order.client_name}</span>
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">
                        En Cocina
                      </span>
                    </div>

                    {/* Checklist cocinero */}
                    <div className="space-y-1.5 py-2 border-y border-slate-700/80 text-xs">
                      {order.items?.map((it, idx) => (
                        <label key={idx} className="flex items-start gap-2 text-slate-200 cursor-pointer">
                          <input type="checkbox" className="accent-emerald-500 mt-0.5" />
                          <div>
                            <span><strong>{it.quantity}x</strong> {it.name}</span>
                            {it.options && it.options.length > 0 && (
                              <span className="block text-[10px] text-slate-400">{it.options.join(', ')}</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total: <strong className="text-emerald-400 font-mono">${order.total.toFixed(2)}</strong></span>
                      <span className="text-[10px] text-slate-400 font-mono">⏱️ Est: {order.estimated_prep_minutes || 20}m</span>
                    </div>

                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>🛵</span> Marcar Listo para Recoger
                    </button>

                    <button
                      onClick={() => setSelectedTicketOrder(order)}
                      className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-white font-semibold transition-colors"
                    >
                      🖨️ Re-imprimir Ticket
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Columna 3: Listos para Despacho */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h2 className="font-extrabold text-emerald-400 flex items-center justify-between text-sm uppercase tracking-wider mb-4 pb-3 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <span>🛵</span>
                3. Listos / Despacho ({orders.filter((o) => o.status === 'READY_FOR_PICKUP').length})
              </span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono">Entrega PIN</span>
            </h2>

            <div className="space-y-4">
              {orders
                .filter((o) => o.status === 'READY_FOR_PICKUP')
                .map((order) => (
                  <div key={order.id} className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-md text-emerald-300">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1 font-semibold">{order.client_name}</span>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                        En Mostrador
                      </span>
                    </div>

                    {/* Ficha del repartidor */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={order.driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          className="w-9 h-9 rounded-xl object-cover border border-emerald-500/40"
                          alt="Driver"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-white">{order.driver?.name || 'Repartidor Asignado'}</p>
                          <p className="text-[10px] text-slate-400">{order.driver?.vehicle || 'Moto Honda CB125'}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/80">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          {order.driver?.eta || 'Arribando en 2 min'}
                        </span>
                        <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          PIN: {order.driver?.pin || '4821'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConfirmPickup(order.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>✓</span> Confirmar Entrega a Repartidor
                    </button>

                    <button
                      onClick={() => setSelectedTicketOrder(order)}
                      className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-white font-semibold transition-colors"
                    >
                      🖨️ Ver Ticket Térmico
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: HISTORIAL DEL TURNO */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por #ID o nombre..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 w-64"
              />
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="DELIVERED">Entregados con Éxito</option>
                <option value="PICKED_UP">Despachados con Repartidor</option>
                <option value="CANCELLED">Cancelados / Rechazados</option>
              </select>
            </div>
            <p className="text-xs text-slate-400">Total registrados: <strong className="text-white font-mono">{historyOrders.length}</strong> pedidos</p>
          </div>

          <div className="space-y-3">
            {historyOrders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">#{o.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-300 font-semibold">{o.client_name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : o.status === 'PICKED_UP'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {o.items?.map((i) => i.quantity + 'x ' + i.name).join(', ')}
                  </p>
                  {o.cancellation_reason && (
                    <p className="text-[10px] text-rose-400 font-semibold">Motivo: {o.cancellation_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-white">${o.total.toFixed(2)}</span>
                    <p className="text-[10px] text-emerald-400">Neto: ${(o.total * 0.85).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicketOrder(o)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    🖨️ Ver Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: TICKET TÉRMICO (80mm) */}
      {selectedTicketOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖨️</span>
                <h3 className="font-black text-white text-base">Comanda Térmica (80mm)</h3>
              </div>
              <button onClick={() => setSelectedTicketOrder(null)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <div className="bg-white text-black p-4 rounded-xl font-mono text-[11px] leading-tight border border-slate-300 shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-black">
                <p className="font-extrabold text-sm uppercase tracking-wider">PIZZERÍA DI NAPOLI</p>
                <p className="text-[9px]">Av. Corrientes 1234, CABA • Tel: 4567-8900</p>
                <p className="text-[10px] font-bold mt-1 uppercase">*** COMANDA DE COCINA ***</p>
              </div>

              <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>ORDEN: <strong>#{selectedTicketOrder.id}</strong></span>
                  <span>{new Date(selectedTicketOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>CLIENTE: <strong>{selectedTicketOrder.client_name}</strong></div>
                <div>TEL: <span>{selectedTicketOrder.phone || 'S/D'}</span></div>
                <div>DIR: <span>{selectedTicketOrder.delivery_address}</span></div>
                {selectedTicketOrder.delivery_notes && (
                  <div className="text-red-700 font-bold">NOTA: {selectedTicketOrder.delivery_notes}</div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-black space-y-1.5">
                {selectedTicketOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <strong>{it.quantity}x</strong> {it.name}
                      {it.options && it.options.length > 0 && (
                        <div className="text-[9px] text-gray-700 pl-2 font-sans italic">{it.options.join(', ')}</div>
                      )}
                    </div>
                    <span className="font-bold">${(it.quantity * it.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-dashed border-black space-y-1 text-right text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${(selectedTicketOrder.subtotal || selectedTicketOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Envío:</span>
                  <span>${(selectedTicketOrder.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-dotted border-black">
                  <span>TOTAL:</span>
                  <span>${selectedTicketOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 text-center space-y-1 text-[10px]">
                <p className="font-bold tracking-widest text-xs uppercase bg-black text-white py-1 rounded">
                  PIN DE RETIRO: {selectedTicketOrder.driver?.pin || '4821'}
                </p>
                <div className="tracking-widest font-mono text-sm py-1 font-black">||| | | || ||| || |||</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <span>🖨️</span> Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECHAZO DE PEDIDO */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <span className="text-xl">⚠️</span>
                <h3 className="font-black text-white text-base">Rechazar Pedido</h3>
              </div>
              <button onClick={() => setRejectingOrderId(null)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Selecciona el motivo de cancelación para notificar al cliente:
            </p>

            <div className="space-y-2 text-xs">
              {[
                'Insumos agotados / sin stock para preparar',
                'Cocina saturada / demasiada demora en el turno',
                'Local fuera del horario de atención',
                'Dirección fuera del radio de entrega'
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={rejectReason === reason}
                    onChange={() => setRejectReason(reason)}
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="reason"
                  checked={rejectReason === 'CUSTOM'}
                  onChange={() => setRejectReason('CUSTOM')}
                  className="accent-rose-500"
                />
                <span>Otro motivo personalizado...</span>
              </label>
            </div>

            {rejectReason === 'CUSTOM' && (
              <input
                type="text"
                placeholder="Escribe el motivo..."
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setRejectingOrderId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/20"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
