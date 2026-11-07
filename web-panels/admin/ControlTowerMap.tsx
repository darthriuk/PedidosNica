'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DriverLocation {
  driver_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  latitude: number;
  longitude: number;
  battery_level: number;
  speed: number;
  last_updated: string;
}

export default function ControlTowerMap({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient(supabaseUrl, supabaseAnonKey)).current;

  // Carga inicial y suscripción a telemetría en tiempo real
  useEffect(() => {
    // 1. Cargar drivers desde Postgres
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('driver_profiles')
        .select(`
          driver_id,
          vehicle_type,
          current_status,
          battery_level,
          last_location,
          last_location_updated_at,
          profiles (full_name, phone)
        `);

      if (data) {
        const formatted: DriverLocation[] = data
          .filter((d: any) => d.last_location)
          .map((d: any) => {
            // PostGIS Point GeoJSON o WKT parser
            const coords = d.last_location?.coordinates || [-58.3816, -34.6037];
            return {
              driver_id: d.driver_id,
              full_name: (d.profiles as any)?.full_name || 'Repartidor',
              phone: (d.profiles as any)?.phone || '',
              vehicle_type: d.vehicle_type,
              status: d.current_status,
              longitude: coords[0],
              latitude: coords[1],
              battery_level: d.battery_level || 100,
              speed: 0,
              last_updated: d.last_location_updated_at || new Date().toISOString(),
            };
          });
        setDrivers(formatted);
      }
    };

    fetchDrivers();

    // 2. Suscripción a canal de telemetría de conductores (Supabase Realtime Broadcast)
    const channel = supabase
      .channel('fleet-telemetry')
      .on('broadcast', { event: 'driver_telemetry' }, ({ payload }: { payload: any }) => {
        setDrivers((prev) => {
          const index = prev.findIndex((d) => d.driver_id === payload.driver_id);
          const updated: DriverLocation = {
            driver_id: payload.driver_id,
            full_name: payload.full_name || (index >= 0 ? prev[index].full_name : 'Repartidor'),
            phone: payload.phone || (index >= 0 ? prev[index].phone : ''),
            vehicle_type: payload.vehicle_type || 'MOTORCYCLE',
            status: payload.order_id ? 'BUSY' : 'AVAILABLE',
            latitude: payload.latitude,
            longitude: payload.longitude,
            battery_level: payload.battery_level,
            speed: payload.speed,
            last_updated: new Date().toISOString(),
          };

          if (index >= 0) {
            const next = [...prev];
            next[index] = updated;
            return next;
          }
          return [...prev, updated];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const counts = {
    available: drivers.filter((d) => d.status === 'AVAILABLE').length,
    busy: drivers.filter((d) => d.status === 'BUSY').length,
    offline: drivers.filter((d) => d.status === 'OFFLINE').length,
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar de Métricas de Flota */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-xl font-bold tracking-tight text-white">Torre de Control</h1>
          </div>

          {/* Cards de Métricas */}
          <div className="space-y-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex justify-between items-center">
              <div>
                <p className="text-xs text-emerald-400 font-semibold uppercase">Disponibles</p>
                <p className="text-2xl font-bold text-white">{counts.available}</p>
              </div>
              <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase">En Reparto Activo</p>
                <p className="text-2xl font-bold text-white">{counts.busy}</p>
              </div>
              <span className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Desconectados</p>
                <p className="text-2xl font-bold text-slate-300">{counts.offline}</p>
              </div>
              <span className="w-4 h-4 rounded-full bg-red-500/80" />
            </div>
          </div>

          {/* Lista de Drivers */}
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Conductores en línea
          </h3>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {drivers.map((driver) => (
              <button
                key={driver.driver_id}
                onClick={() => setSelectedDriver(driver)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                  selectedDriver?.driver_id === driver.driver_id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-200">{driver.full_name}</p>
                  <p className="text-slate-500">{driver.vehicle_type} • Bat: {driver.battery_level}%</p>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    driver.status === 'AVAILABLE'
                      ? 'bg-emerald-400'
                      : driver.status === 'BUSY'
                      ? 'bg-blue-400'
                      : 'bg-red-500'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          Motor de ruteo: OSRM Self-Hosted ($0 API Cost)
        </div>
      </div>

      {/* Vista de Mapa interactivo con MapLibre / OpenStreetMap Tiles */}
      <div className="flex-1 relative bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-300 mb-2">Visor Geoespacial en Vivo</p>
            <p className="text-sm max-w-md text-slate-400">
              Renderizado con MapLibre GL JS y tiles vectoriales abiertos de OpenStreetMap. Cero consumo de cuotas de Google Maps.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponible
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> En Pedido
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fuera de servicio
              </span>
            </div>
          </div>
        </div>

        {/* Modal Flotante de Detalles de Telemetría */}
        {selectedDriver && (
          <div className="absolute top-6 right-6 w-80 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-2xl z-20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-base text-white">{selectedDriver.full_name}</h4>
                <p className="text-xs text-slate-400">{selectedDriver.phone}</p>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-slate-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Estado:</span>
                <span
                  className={`font-semibold ${
                    selectedDriver.status === 'AVAILABLE'
                      ? 'text-emerald-400'
                      : selectedDriver.status === 'BUSY'
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}
                >
                  {selectedDriver.status}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Batería Móvil:</span>
                <span className="font-semibold text-slate-200">{selectedDriver.battery_level}%</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Velocidad Actual:</span>
                <span className="font-semibold text-slate-200">
                  {(selectedDriver.speed * 3.6).toFixed(1)} km/h
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Vehículo:</span>
                <span className="font-semibold text-slate-200">{selectedDriver.vehicle_type}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Coordenadas:</span>
                <span className="font-mono text-slate-300">
                  {selectedDriver.latitude.toFixed(4)}, {selectedDriver.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
