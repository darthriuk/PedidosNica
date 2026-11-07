import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OSRMRoutingService } from './osrmClient';

dotenv.config();

async function runTest() {
  const url = process.env.SUPABASE_URL || 'https://zciujeihkvleehhqbeat.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('====================================================');
  console.log('🔍 VERIFICACIÓN DE INTEGRACIÓN SUPABASE (SERVICE_ROLE)');
  console.log('====================================================');
  console.log(`URL: ${url}`);
  console.log(`Service Key presente: ${Boolean(serviceKey)}`);

  const supabase = createClient(url, serviceKey);

  // 1. Probar consulta a la tabla restaurants
  console.log('\n[1/3] Verificando conexión a PostgreSQL...');
  const { data: restaurants, error: restError } = await supabase
    .from('restaurants')
    .select('id, name')
    .limit(5);

  if (restError) {
    if (restError.code === '42P01') {
      console.warn('⚠️  La tabla "restaurants" aún no existe en tu base de datos.');
      console.warn('👉 Asegúrate de ejecutar el archivo "supabase/schema.sql" en el SQL Editor de Supabase.');
    } else {
      console.error('❌ Error al consultar Supabase:', restError.message);
    }
  } else {
    console.log(`✅ Conexión exitosa a la base de datos! Restaurantes encontrados: ${restaurants.length}`);
  }

  // 2. Probar PostGIS RPC
  console.log('\n[2/3] Verificando función RPC PostGIS (find_nearest_available_drivers)...');
  const { data: drivers, error: rpcError } = await supabase.rpc('find_nearest_available_drivers', {
    pickup_lat: -34.6037,
    pickup_lng: -58.3816,
    max_distance_meters: 5000.0,
    max_candidates: 3,
  });

  if (rpcError) {
    console.warn(`ℹ️  RPC no ejecutado todavía (${rpcError.message}). Se creará al correr schema.sql.`);
  } else {
    console.log(`✅ PostGIS RPC activo y respondiendo! Drivers cercanos: ${drivers?.length || 0}`);
  }

  // 3. Probar cálculo de ruta
  console.log('\n[3/3] Verificando motor de cálculo de rutas y tarifas...');
  const routing = new OSRMRoutingService();
  const route = await routing.calculateRoute(
    { latitude: -34.6037, longitude: -58.3816 },
    { latitude: -34.5950, longitude: -58.3980 }
  );
  const fee = routing.calculateDeliveryFee(route, {
    baseFare: 1.50,
    perKmRate: 0.60,
    perMinuteRate: 0.15,
    surgeMultiplier: 1.00,
  });

  console.log(`✅ Ruta calculada: ${route.distanceKm} km | ${route.durationMinutes} mins`);
  console.log(`💰 Tarifa cotizada: $${fee.toFixed(2)} (Costo de API: $0.00)`);
  console.log('====================================================\n');
}

runTest();
