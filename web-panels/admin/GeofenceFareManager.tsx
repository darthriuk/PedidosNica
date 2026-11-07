'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface FareRule {
  id?: string;
  name: string;
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  surge_multiplier: number;
  is_active: boolean;
}

export default function GeofenceFareManager({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [fareRule, setFareRule] = useState<FareRule>({
    name: 'Zona Centro - Alta Demanda',
    base_fare: 1.50,
    per_km_rate: 0.65,
    per_minute_rate: 0.15,
    surge_multiplier: 1.25,
    is_active: true,
  });

  const [simulationKm, setSimulationKm] = useState<number>(4.2);
  const [simulationMins, setSimulationMins] = useState<number>(18);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Fórmula de cálculo en tiempo real
  const calculatedFee = (
    (fareRule.base_fare +
      simulationKm * fareRule.per_km_rate +
      simulationMins * fareRule.per_minute_rate) *
    fareRule.surge_multiplier
  ).toFixed(2);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    // Guardar en tabla `fare_rules` de Supabase
    const { error } = await supabase.from('fare_rules').upsert({
      name: fareRule.name,
      base_fare: fareRule.base_fare,
      per_km_rate: fareRule.per_km_rate,
      per_minute_rate: fareRule.per_minute_rate,
      surge_multiplier: fareRule.surge_multiplier,
      is_active: fareRule.is_active,
      // Polígono por defecto para la zona operativa metropolitana
      geofence: 'SRID=4326;POLYGON((-58.45 -34.60, -58.35 -34.60, -58.35 -34.55, -58.45 -34.55, -58.45 -34.60))',
    });

    if (!error) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 max-w-5xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tarificación Dinámica y Geocercas Operativas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configura los parámetros del motor de tarifas que se aplican automáticamente según la distancia calculada por OSRM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de Variables de Tarifa */}
        <form onSubmit={handleSaveRule} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-200">Variables de Tarifa Base</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Nombre de la Zona</label>
            <input
              type="text"
              value={fareRule.name}
              onChange={(e) => setFareRule({ ...fareRule, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Tarifa Base ($)</label>
              <input
                type="number"
                step="0.01"
                value={fareRule.base_fare}
                onChange={(e) => setFareRule({ ...fareRule, base_fare: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Costo por Km ($)</label>
              <input
                type="number"
                step="0.01"
                value={fareRule.per_km_rate}
                onChange={(e) => setFareRule({ ...fareRule, per_km_rate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Costo por Minuto ($)</label>
              <input
                type="number"
                step="0.01"
                value={fareRule.per_minute_rate}
                onChange={(e) => setFareRule({ ...fareRule, per_minute_rate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase mb-2">Surge Multiplier (Demanda)</label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="3.0"
                value={fareRule.surge_multiplier}
                onChange={(e) => setFareRule({ ...fareRule, surge_multiplier: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            Guardar Regla de Tarifa
          </button>

          {savedSuccess && (
            <p className="text-center text-xs text-emerald-400 font-semibold animate-fade-in">
              ✓ Parámetros guardados y sincronizados con el Backend OSRM
            </p>
          )}
        </form>

        {/* Simulador y Previsualización en Tiempo Real */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-4">Simulador de Cotización de Envío</h2>
            <p className="text-xs text-slate-400 mb-6">
              Prueba cómo responderá el motor de cálculo ante una distancia y tiempo estimados reportados por OSRM.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Distancia OSRM:</span>
                  <span className="font-mono text-indigo-400">{simulationKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.1"
                  value={simulationKm}
                  onChange={(e) => setSimulationKm(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Tiempo de Viaje:</span>
                  <span className="font-mono text-indigo-400">{simulationMins} mins</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  step="1"
                  value={simulationMins}
                  onChange={(e) => setSimulationMins(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Resultado de la cotización */}
          <div className="mt-8 p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center">
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Costo Final Calculado al Cliente</p>
            <p className="text-4xl font-extrabold text-emerald-400 font-mono my-2">${calculatedFee}</p>
            <p className="text-xs text-slate-500">
              Costo de API de Mapas para este cálculo: <strong className="text-emerald-400">$0.00</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
