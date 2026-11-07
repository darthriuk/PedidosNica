// ============================================================================
// DRIVER BACKEND API - GATEWAY DE OPERACIONES Y TELEMETRÍA DEL REPARTIDOR
// ============================================================================

const localStore = require('./localStore');

const DEFAULT_DRIVER_ID = '6c5c143c-e567-4e1d-85b7-d4f984628816'; // Martín Rivas

// Helper: Decodificador seguro de PostGIS EWKB Hex o WKT a objeto { lng, lat }
function parseLocation(loc) {
  if (!loc) return null;
  if (typeof loc === 'object' && Array.isArray(loc.coordinates)) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }
  if (typeof loc === 'string') {
    const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
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
        return { lng, lat };
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

async function handleDriverApi(req, res, url, config) {
  const { broadcastEvent } = config;

  const sendJson = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    sendJson(200, { ok: true });
    return;
  }

  // 1. OBTENER PERFIL DEL DRIVER Y FLOTA
  if (req.method === 'GET' && url.startsWith('/api/driver/profile')) {
    try {
      const urlObj = new URL(url, 'http://localhost');
      const driverId = urlObj.searchParams.get('driverId') || DEFAULT_DRIVER_ID;

      const user = localStore.users.find(u => u.id === driverId && u.role === 'DRIVER')
        || localStore.users.find(u => u.id === DEFAULT_DRIVER_ID);

      if (user) {
        const dp = user.driver_profile || {};
        const loc = parseLocation(dp.last_location) || { lng: -86.2650, lat: 12.1260 };
        sendJson(200, {
          success: true,
          driver: {
            driver_id: user.id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            avatar_url: user.avatar_url,
            vehicle_type: dp.vehicle_type || 'MOTORCYCLE',
            license_plate: dp.license_plate || 'A482XYZ',
            current_status: dp.current_status || 'AVAILABLE',
            battery_level: dp.battery_level || 95,
            rating: dp.rating || 4.95,
            location: loc
          }
        });
      } else {
        sendJson(200, {
          success: true,
          driver: {
            driver_id: DEFAULT_DRIVER_ID,
            full_name: 'Martín Rivas',
            phone: '+505 8899-7766',
            vehicle_type: 'MOTORCYCLE',
            license_plate: 'A482XYZ',
            current_status: 'AVAILABLE',
            battery_level: 95,
            rating: 4.95,
            location: { lng: -86.2650, lat: 12.1260 }
          }
        });
      }
    } catch (err) {
      console.error('[Driver API] Error al obtener perfil:', err);
      sendJson(500, { error: 'Error interno al consultar perfil del repartidor' });
    }
    return;
  }

  // 2. TOGGLE ESTADO ONLINE / OFFLINE
  if (req.method === 'POST' && url === '/api/driver/toggle-status') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const driverId = payload.driverId || DEFAULT_DRIVER_ID;
        const newStatus = payload.status === 'AVAILABLE' ? 'AVAILABLE' : 'OFFLINE';

        const user = localStore.users.find(u => u.id === driverId);
        if (user) {
          if (!user.driver_profile) user.driver_profile = { driver_id: user.id };
          user.driver_profile.current_status = newStatus;
        }

        if (broadcastEvent) {
          broadcastEvent({
            type: 'DRIVER_STATUS_CHANGE',
            driver_id: driverId,
            status: newStatus
          });
        }

        sendJson(200, { success: true, status: newStatus });
      } catch (err) {
        sendJson(500, { error: 'Error al cambiar estado de disponibilidad' });
      }
    });
    return;
  }

  // 3. OBTENER PEDIDOS ACTIVOS Y DISPONIBLES EN ZONA (BOLSA DE PEDIDOS ABIERTA)
  if (req.method === 'GET' && url.startsWith('/api/driver/orders')) {
    try {
      const urlObj = new URL(url, 'http://localhost');
      const driverId = urlObj.searchParams.get('driverId') || DEFAULT_DRIVER_ID;

      const enrichOrder = (o) => {
        const rest = localStore.restaurants.find(r => r.id === o.restaurant_id);
        const client = localStore.users.find(u => u.id === o.client_id);
        const orderItems = (o.items || []).map(it => {
          const prod = localStore.products.find(p => p.id === it.product_id);
          return {
            ...it,
            products: prod || { name: 'Platillo Especial', price: it.unit_price }
          };
        });
        return {
          ...o,
          restaurants: rest || { name: 'Pupusería El Diamante', address: 'Colonia Los Robles, Managua', phone: '+505 8833-4455', location: 'POINT(-86.2650 12.1260)' },
          order_items: orderItems,
          restaurant_location: parseLocation(rest?.location) || { lng: -86.2650, lat: 12.1260 },
          delivery_coords: parseLocation(o.delivery_location) || { lng: -86.2415, lat: 12.1022 },
          client_name: o.client_name || client?.full_name || 'Mateo Blandón',
          client_phone: o.client_phone || client?.phone || '+505 8899-7711'
        };
      };

      // a) Pedido en curso asignado a este driver
      const rawActive = localStore.orders.find(
        o => o.driver_id === driverId && (o.status === 'DRIVER_ASSIGNED' || o.status === 'PICKED_UP')
      );
      const currentActive = rawActive ? enrichOrder(rawActive) : null;

      // b) Pedidos disponibles en la zona que cualquier conductor puede tomar
      const openStatuses = ['READY_FOR_PICKUP', 'IN_PREPARATION', 'ACCEPTED', 'CREATED'];
      const rawReady = localStore.orders.filter(o => !o.driver_id && openStatuses.includes(o.status));

      const formattedReady = rawReady.map(raw => {
        const o = enrichOrder(raw);
        const rawPayout = (Number(o.delivery_fee) || 70) * 0.80;
        const payout = rawPayout < 20 ? 56.00 : rawPayout;
        const isReady = o.status === 'READY_FOR_PICKUP';
        const isPrep = o.status === 'IN_PREPARATION' || o.status === 'ACCEPTED';

        return {
          ...o,
          driver_payout: Number(payout.toFixed(2)),
          status_label: isReady ? 'Listo para Retiro' : (isPrep ? 'En Cocina' : 'Nuevo Pedido'),
          status_tag_class: isReady
            ? 'bg-[#06C167] text-black'
            : (isPrep ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30')
        };
      });

      sendJson(200, {
        success: true,
        activeOrder: currentActive,
        readyOrders: formattedReady
      });
    } catch (err) {
      console.error('[Driver API] Error al obtener pedidos:', err);
      sendJson(500, { error: 'Error al consultar pedidos' });
    }
    return;
  }

  // 4. ACEPTAR / TOMAR PEDIDO (CONCURRENCIA ATÓMICA DE BOLSA ABIERTA)
  if (req.method === 'POST' && url === '/api/driver/accept-order') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { orderId, driverId = DEFAULT_DRIVER_ID } = payload;

        if (!orderId) {
          sendJson(400, { error: 'Falta orderId' });
          return;
        }

        const existingOrder = localStore.orders.find(o => o.id === orderId);
        if (!existingOrder) {
          sendJson(404, { success: false, error: 'Pedido no encontrado' });
          return;
        }

        if (existingOrder.driver_id && existingOrder.driver_id !== driverId) {
          sendJson(409, {
            success: false,
            error: '¡Este pedido ya fue tomado por otro repartidor en la zona! Selecciona otro disponible.'
          });
          return;
        }

        existingOrder.driver_id = driverId;
        existingOrder.status = 'DRIVER_ASSIGNED';
        existingOrder.accepted_at = new Date().toISOString();

        const drvUser = localStore.users.find(u => u.id === driverId);
        if (drvUser && drvUser.driver_profile) {
          drvUser.driver_profile.current_status = 'BUSY';
        }

        if (broadcastEvent) {
          broadcastEvent({
            type: 'ORDER_ASSIGNED_TO_DRIVER',
            orderId,
            driverId
          });
          broadcastEvent({
            type: 'ORDER_CLAIMED_BY_DRIVER',
            orderId,
            driverId
          });
        }

        sendJson(200, {
          success: true,
          message: '¡Pedido asignado exitosamente a tu consola!',
          order: existingOrder
        });
      } catch (err) {
        console.error('[Driver API] Error al aceptar pedido:', err);
        sendJson(500, { error: 'Error al aceptar pedido' });
      }
    });
    return;
  }

  // 5. ACTUALIZAR ESTADO DEL PEDIDO (Llegó local, Recogido, Llegó cliente, Entregado)
  if (req.method === 'POST' && url === '/api/driver/update-status') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { orderId, status, driverId = DEFAULT_DRIVER_ID } = payload;

        if (!orderId || !status) {
          sendJson(400, { error: 'Faltan parámetros requeridos' });
          return;
        }

        const ord = localStore.orders.find(o => o.id === orderId);
        if (ord) {
          ord.status = status;
          if (status === 'PICKED_UP') {
            ord.picked_up_at = new Date().toISOString();
          } else if (status === 'DELIVERED') {
            ord.delivered_at = new Date().toISOString();
            const drvUser = localStore.users.find(u => u.id === driverId);
            if (drvUser && drvUser.driver_profile) {
              drvUser.driver_profile.current_status = 'AVAILABLE';
            }
          }
        }

        if (broadcastEvent) {
          broadcastEvent({
            type: 'ORDER_STATUS_CHANGED',
            orderId,
            status
          });
        }

        sendJson(200, {
          success: true,
          status,
          order: ord || null
        });
      } catch (err) {
        console.error('[Driver API] Error al actualizar estado:', err);
        sendJson(500, { error: 'Error al actualizar estado del pedido' });
      }
    });
    return;
  }

  // 6. ACTUALIZAR TELEMETRÍA GPS DEL REPARTIDOR
  if (req.method === 'POST' && url === '/api/driver/location') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const {
          driverId = DEFAULT_DRIVER_ID,
          latitude,
          longitude,
          bearing = 0,
          speed = 25,
          battery = 95
        } = payload;

        if (latitude !== undefined && longitude !== undefined) {
          const drvUser = localStore.users.find(u => u.id === driverId);
          if (drvUser && drvUser.driver_profile) {
            drvUser.driver_profile.last_location = `POINT(${longitude} ${latitude})`;
            drvUser.driver_profile.battery_level = battery;
          }

          if (broadcastEvent) {
            broadcastEvent({
              type: 'DRIVER_LOCATION_UPDATE',
              driverId,
              latitude,
              longitude,
              bearing,
              speed
            });
          }
        }

        sendJson(200, { success: true });
      } catch (err) {
        sendJson(500, { error: 'Error al actualizar ubicación' });
      }
    });
    return;
  }

  // 7. HISTORIAL DE ENTREGAS Y GANANCIAS
  if (req.method === 'GET' && url.startsWith('/api/driver/history')) {
    try {
      const urlObj = new URL(url, 'http://localhost');
      const driverId = urlObj.searchParams.get('driverId') || DEFAULT_DRIVER_ID;

      const deliveredOrders = localStore.orders.filter(
        o => o.driver_id === driverId && o.status === 'DELIVERED'
      );

      let totalEarned = 0;
      const history = deliveredOrders.map(o => {
        const rest = localStore.restaurants.find(r => r.id === o.restaurant_id);
        const fee = Number(o.delivery_fee) || 70;
        const payout = fee * 0.80;
        totalEarned += payout;
        return {
          id: o.id,
          restaurant: rest?.name || 'Pupusería El Diamante',
          address: o.delivery_address,
          delivered_at: o.delivered_at || o.created_at,
          payout: Number(payout.toFixed(2))
        };
      });

      sendJson(200, {
        success: true,
        totalEarned: Math.round(totalEarned),
        deliveredCount: history.length,
        history
      });
    } catch (err) {
      sendJson(500, { error: 'Error al consultar historial' });
    }
    return;
  }

  sendJson(404, { error: 'Ruta no encontrada en Driver API' });
}

module.exports = {
  handleDriverApi,
  parseLocation
};
