import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { OSRMRoutingService } from './osrmClient';
import { AutomatedDispatchEngine } from './dispatchEngine';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;
const supabaseUrl = process.env.SUPABASE_URL || 'https://zciujeihkvleehhqbeat.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const osrmUrl = process.env.OSRM_URL || 'http://localhost:5000';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const routingService = new OSRMRoutingService(osrmUrl);
const dispatchEngine = new AutomatedDispatchEngine(supabaseUrl, supabaseServiceKey, routingService);

// 1. Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    supabaseConnected: Boolean(supabaseServiceKey),
    osrmUrl,
    timestamp: new Date().toISOString(),
  });
});

// 2. Cotizador de ruta y tarifa con OSRM (Costo = $0)
app.post('/api/route', async (req: Request, res: Response) => {
  try {
    const { origin, destination, fareParams } = req.body;
    if (!origin?.latitude || !destination?.latitude) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    const route = await routingService.calculateRoute(origin, destination);
    const fee = routingService.calculateDeliveryFee(route, fareParams || {
      baseFare: 1.50,
      perKmRate: 0.60,
      perMinuteRate: 0.15,
      surgeMultiplier: 1.00,
    });

    res.json({ route, fee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Disparador manual de Despacho de Pedido
app.post('/api/dispatch', async (req: Request, res: Response) => {
  try {
    const { orderId, restaurantLocation, deliveryLocation, deliveryFee } = req.body;
    const result = await dispatchEngine.dispatchOrder({
      orderId,
      restaurantId: req.body.restaurantId || '',
      restaurantLocation,
      deliveryLocation,
      deliveryFee,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Decodificador robusto de PostGIS EWKB Hex / GeoJSON / WKT para coordenadas
function parseCoordinates(loc: any): { latitude: number; longitude: number } {
  if (!loc) return { latitude: 12.1260, longitude: -86.2650 }; // Managua default
  if (typeof loc === 'object' && Array.isArray(loc.coordinates)) {
    return { latitude: loc.coordinates[1], longitude: loc.coordinates[0] };
  }
  if (typeof loc === 'string') {
    const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
    }
    if (/^[0-9a-fA-F]+$/.test(loc) && loc.length >= 42) {
      try {
        const buf = Buffer.from(loc, 'hex');
        const isLE = buf[0] === 1;
        const type = isLE ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
        const hasSrid = (type & 0x20000000) !== 0;
        const offset = hasSrid ? 9 : 5;
        const lng = isLE ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset);
        const lat = isLE ? buf.readDoubleLE(offset + 8) : buf.readDoubleBE(offset + 8);
        return { latitude: lat, longitude: lng };
      } catch (e) {
        return { latitude: 12.1260, longitude: -86.2650 };
      }
    }
  }
  return { latitude: 12.1260, longitude: -86.2650 };
}

// 4. Suscripción automática a eventos de pedidos de cocina en Supabase
const startOrderDispatcherListener = () => {
  console.log('[Dispatcher] Escuchando pedidos listos para despacho (READY_FOR_PICKUP)...');

  supabase
    .channel('backend-order-listener')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      async (payload: any) => {
        const order = payload.new;
        // Si la cocina marcó el pedido listo y no tiene driver asignado aún
        if (order.status === 'READY_FOR_PICKUP' && !order.driver_id) {
          console.log(`[Dispatcher] Pedido ${order.id} listo en cocina. Buscando repartidores más cercanos...`);

          // Obtener coordenadas del restaurante
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('location')
            .eq('id', order.restaurant_id)
            .single();

          const restCoords = parseCoordinates(restaurant?.location);
          const delivCoords = parseCoordinates(order.delivery_location);

          console.log(`[Dispatcher] Coordenadas resueltas: Restaurante (${restCoords.latitude}, ${restCoords.longitude}) -> Entrega (${delivCoords.latitude}, ${delivCoords.longitude})`);

          await dispatchEngine.dispatchOrder({
            orderId: order.id,
            restaurantId: order.restaurant_id,
            restaurantLocation: restCoords,
            deliveryLocation: delivCoords,
            deliveryFee: Number(order.delivery_fee) || 2.50,
          });
        }
      }
    )
    .subscribe();
};

app.listen(port, () => {
  console.log(`⚡ [Backend] Servidor de Ruteo & Despacho iniciado en el puerto ${port}`);
  console.log(`🔗 [Supabase] Conectado a ${supabaseUrl} con credenciales de SERVICE_ROLE.`);
  startOrderDispatcherListener();
});
