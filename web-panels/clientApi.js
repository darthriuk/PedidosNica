// ============================================================================
// CLIENT BACKEND API - GATEWAY DE COMPRA Y TRACKING PARA EL COMENSAL
// ============================================================================

const crypto = require('crypto');
const localStore = require('./localStore');

const RESTAURANT_ID = '6701bc0c-e5ce-475a-8893-75e9d06e8012';
const MOCK_CLIENT_ID = 'c91f2a10-1234-4a9b-9c11-887766554433'; // Mateo Blandón

// Helper: Cálculo de distancia geodésica mediante fórmula Haversine (en kilómetros)
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 999.0;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

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

async function handleClientApi(req, res, url, config) {
  const jsonResponse = (statusCode, data) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
  };

  const readBody = () => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      });
    });
  };

  // 1. GET /api/client/catalog - Obtiene todos los restaurantes y carta completa con distancia y radio
  if (req.method === 'GET' && (url === '/api/client/catalog' || url.startsWith('/api/client/catalog'))) {
    try {
      const parsedUrl = new URL(url, 'http://localhost');
      const clientLat = parseFloat(parsedUrl.searchParams.get('lat')) || 12.1022;
      const clientLng = parseFloat(parsedUrl.searchParams.get('lng')) || -86.2415;
      const selectedRestaurantId = parsedUrl.searchParams.get('restaurant_id');

      const validRestaurants = localStore.restaurants.filter(r => r.is_active !== false);
      const validProducts = localStore.products;

      // Procesar distancias y cobertura para cada restaurante
      const restaurantsWithDistance = validRestaurants.map(r => {
        const coords = parseLocation(r.location);
        const radius = Number(r.delivery_radius_km) || 5.0;
        let distance_km = 3.0;
        if (coords) {
          distance_km = calculateHaversineDistanceKm(clientLat, clientLng, coords.lat, coords.lng);
        }
        const in_radius = distance_km <= radius;
        const prepTime = r.estimated_prep_time_minutes || 20;
        const minTime = Math.max(15, Math.round(prepTime + distance_km * 2));
        const maxTime = Math.max(25, Math.round(prepTime + distance_km * 3.5));
        const delivery_fee = Number(Math.max(50, 50 + distance_km * 7).toFixed(2));

        return {
          ...r,
          coords,
          distance_km,
          in_radius,
          delivery_radius_km: radius,
          estimated_time: `${minTime} - ${maxTime} min`,
          delivery_fee
        };
      });

      restaurantsWithDistance.sort((a, b) => {
        if (a.in_radius && !b.in_radius) return -1;
        if (!a.in_radius && b.in_radius) return 1;
        return a.distance_km - b.distance_km;
      });

      const restMap = {};
      restaurantsWithDistance.forEach(r => { restMap[r.id] = r; });

      const enrichedProducts = validProducts.map(p => {
        const r = restMap[p.restaurant_id];
        return {
          ...p,
          restaurant_name: r ? r.name : 'Restaurante Asociado',
          restaurant_address: r ? r.address : '',
          restaurant_logo: r ? r.logo_url : null,
          restaurant_rating: r ? r.rating : 5.0,
          distance_km: r ? r.distance_km : 999,
          in_radius: r ? r.in_radius : false,
          delivery_radius_km: r ? r.delivery_radius_km : 5,
          delivery_fee: r ? r.delivery_fee : 70.00,
          estimated_time: r ? r.estimated_time : '20 - 35 min'
        };
      });

      let activeRestaurant = null;
      if (selectedRestaurantId) {
        activeRestaurant = restaurantsWithDistance.find(r => r.id === selectedRestaurantId) || null;
      }

      const categories = ['Todos', ...new Set(enrichedProducts.map(p => p.category).filter(Boolean))];

      return jsonResponse(200, {
        success: true,
        restaurant: activeRestaurant,
        restaurants: restaurantsWithDistance,
        products: enrichedProducts,
        categories,
        clientLocation: { lat: clientLat, lng: clientLng }
      });
    } catch (e) {
      console.error('[Client Catalog Error]', e);
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 2. POST /api/client/orders - Crear pedido formal validando radio de entrega
  if (req.method === 'POST' && url === '/api/client/orders') {
    try {
      const body = await readBody();
      const {
        items = [],
        restaurant_id: requestedRestaurantId,
        delivery_address,
        delivery_notes = '',
        delivery_latitude = 12.1022,
        delivery_longitude = -86.2415,
        payment_method = 'CASH',
        client_id,
        client_name = 'Cliente Comensal',
        client_phone = '+505 8899-7711',
        discount_amount = 0,
        promo_code = ''
      } = body;

      const targetClientId = client_id || MOCK_CLIENT_ID;

      if (!items || items.length === 0) {
        return jsonResponse(400, { success: false, error: 'El carrito no puede estar vacío.' });
      }

      // Validar que ningún producto esté agotado
      const itemProdIds = items.map(i => i.product_id).filter(Boolean);
      const productsFromDb = localStore.products.filter(p => itemProdIds.includes(p.id));
      const outOfStock = productsFromDb.find(p => p.is_available === false);
      if (outOfStock) {
        return jsonResponse(400, {
          success: false,
          error: `El producto "${outOfStock.name}" acaba de agotarse en cocina y no puede ser procesado.`
        });
      }

      // Determinar el restaurante que atiende el pedido
      let targetRestaurantId = requestedRestaurantId;
      if (!targetRestaurantId && productsFromDb.length > 0) {
        targetRestaurantId = productsFromDb[0].restaurant_id;
      }
      if (!targetRestaurantId && items[0] && items[0].restaurant_id) {
        targetRestaurantId = items[0].restaurant_id;
      }
      if (!targetRestaurantId) {
        targetRestaurantId = RESTAURANT_ID;
      }

      const restaurant = localStore.restaurants.find(r => r.id === targetRestaurantId) || localStore.restaurants[0];

      let distanceToClient = null;
      if (restaurant) {
        const restCoords = parseLocation(restaurant.location);
        const radius = Number(restaurant.delivery_radius_km) || 5.0;
        if (restCoords) {
          distanceToClient = calculateHaversineDistanceKm(delivery_latitude, delivery_longitude, restCoords.lat, restCoords.lng);
          if (distanceToClient > radius) {
            return jsonResponse(400, {
              success: false,
              error: `La dirección seleccionada se encuentra a ${distanceToClient} km, fuera del radio máximo de entrega de ${restaurant.name} (${radius} km). Elige una sucursal o dirección más cercana.`
            });
          }
        }
      }

      let subtotal = 0;
      items.forEach(item => {
        const itemTotal = (Number(item.unit_price) + (Number(item.customization_delta) || 0)) * (Number(item.quantity) || 1);
        subtotal += itemTotal;
      });

      const deliveryFee = (distanceToClient !== null)
        ? Number(Math.max(50, 50 + distanceToClient * 7).toFixed(2))
        : Number(body.delivery_fee || (restaurant ? restaurant.delivery_fee : 70.00) || 70.00);
      const serviceFee = 15.00;
      const total = Number(Math.max(0, subtotal + deliveryFee + serviceFee - Number(discount_amount || 0)).toFixed(2));

      let finalDeliveryNotes = delivery_notes ? `${delivery_notes} | Pago: ${payment_method}` : `Pago: ${payment_method}`;
      if (promo_code) {
        finalDeliveryNotes += ` | Cupón: ${promo_code} (-C$ ${Number(discount_amount || 0).toFixed(2)})`;
      }

      const orderId = crypto.randomUUID();
      const itemsPayload = items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        unit_price: Number(item.unit_price),
        customizations: {
          options: item.selected_options || [],
          special_notes: item.notes || '',
          price_delta: item.customization_delta || 0
        }
      }));

      const newOrder = {
        id: orderId,
        client_id: targetClientId,
        client_name,
        client_phone,
        restaurant_id: targetRestaurantId,
        driver_id: null,
        status: 'CREATED',
        subtotal: Number(subtotal.toFixed(2)),
        delivery_fee: deliveryFee,
        total: total,
        delivery_location: `POINT(${delivery_longitude} ${delivery_latitude})`,
        delivery_address: delivery_address || 'Galerías Santo Domingo, Managua',
        delivery_notes: finalDeliveryNotes,
        estimated_prep_time_minutes: restaurant ? (restaurant.estimated_prep_time_minutes || 25) : 25,
        created_at: new Date().toISOString(),
        items: itemsPayload
      };

      localStore.orders.unshift(newOrder);

      console.log(`[Cliente] ¡Nuevo pedido creado con éxito! ID: ${newOrder.id} - Total: C$ ${total}`);

      if (config.broadcastEvent) {
        config.broadcastEvent('ORDER_CREATED', {
          order: newOrder,
          items: itemsPayload
        });
      }

      return jsonResponse(200, {
        success: true,
        orderId: newOrder.id,
        order: newOrder,
        itemsCount: items.length
      });
    } catch (e) {
      console.error('[Cliente API] Error al procesar pedido:', e);
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 3. GET /api/client/orders-history - Historial de pedidos del cliente
  if (req.method === 'GET' && (url === '/api/client/orders-history' || url.startsWith('/api/client/orders-history'))) {
    try {
      const parsedUrl = new URL(url, 'http://localhost');
      const clientId = parsedUrl.searchParams.get('client_id') || MOCK_CLIENT_ID;

      const userOrders = localStore.orders
        .filter(o => o.client_id === clientId)
        .slice(0, 15)
        .map(o => {
          const rest = localStore.restaurants.find(r => r.id === o.restaurant_id);
          const orderItems = (o.items || []).map(it => {
            const prod = localStore.products.find(p => p.id === it.product_id);
            return {
              ...it,
              products: prod ? {
                id: prod.id,
                name: prod.name,
                price: prod.price,
                image_url: prod.image_url,
                category: prod.category,
                restaurant_id: prod.restaurant_id
              } : null
            };
          });
          return {
            ...o,
            restaurants: rest ? { id: rest.id, name: rest.name, address: rest.address, logo_url: rest.logo_url } : null,
            order_items: orderItems
          };
        });

      return jsonResponse(200, { success: true, orders: userOrders });
    } catch (e) {
      console.error('[Orders History Error]', e);
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 4. POST /api/client/orders/cancel - Cancelar pedido si está en CREATED o ACCEPTED
  if (req.method === 'POST' && (url === '/api/client/orders/cancel' || url.startsWith('/api/client/orders/cancel'))) {
    try {
      const body = await readBody();
      const { orderId } = body;
      if (!orderId) {
        return jsonResponse(400, { success: false, error: 'orderId es requerido' });
      }

      const foundOrder = localStore.orders.find(o => o.id === orderId);
      if (!foundOrder) {
        return jsonResponse(404, { success: false, error: 'Pedido no encontrado' });
      }

      const currentStatus = foundOrder.status;
      if (currentStatus !== 'CREATED' && currentStatus !== 'ACCEPTED') {
        return jsonResponse(400, {
          success: false,
          error: `No se puede cancelar el pedido en estado "${currentStatus}". Solo pedidos pendientes o aceptados pueden cancelarse.`
        });
      }

      foundOrder.status = 'CANCELLED';
      foundOrder.cancellation_reason = 'Cancelado por el cliente';

      if (config.broadcastEvent) {
        config.broadcastEvent('ORDER_STATUS_CHANGED', { orderId, status: 'CANCELLED' });
      }

      return jsonResponse(200, { success: true, order: foundOrder });
    } catch (e) {
      console.error('[Cancel Order Error]', e);
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 5. GET /api/client/orders/:id - Estado y tracking del pedido
  if (req.method === 'GET' && url.startsWith('/api/client/orders/')) {
    const parsedReqUrl = new URL(url, 'http://localhost');
    const orderId = parsedReqUrl.pathname.replace('/api/client/orders/', '').trim();

    const activeStatuses = ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP'];

    if (!orderId || orderId === 'active') {
      try {
        const clientId = parsedReqUrl.searchParams.get('client_id') || MOCK_CLIENT_ID;
        const activeOrd = localStore.orders.find(o => o.client_id === clientId && activeStatuses.includes(o.status));
        if (activeOrd) {
          const rest = localStore.restaurants.find(r => r.id === activeOrd.restaurant_id);
          const ordCopy = {
            ...activeOrd,
            delivery_coords: parseLocation(activeOrd.delivery_location),
            restaurants: rest ? {
              id: rest.id,
              name: rest.name,
              address: rest.address,
              location: rest.location,
              logo_url: rest.logo_url,
              coords: parseLocation(rest.location)
            } : null
          };
          return jsonResponse(200, { success: true, order: ordCopy });
        }
        return jsonResponse(200, { success: true, order: null });
      } catch (e) {
        return jsonResponse(500, { success: false, error: e.message });
      }
    }

    try {
      const foundOrder = localStore.orders.find(o => o.id === orderId);
      if (!foundOrder) {
        return jsonResponse(404, { success: false, error: 'Pedido no encontrado' });
      }

      const rest = localStore.restaurants.find(r => r.id === foundOrder.restaurant_id);
      const order = {
        ...foundOrder,
        delivery_coords: parseLocation(foundOrder.delivery_location),
        restaurants: rest ? {
          id: rest.id,
          name: rest.name,
          address: rest.address,
          location: rest.location,
          logo_url: rest.logo_url,
          coords: parseLocation(rest.location)
        } : null
      };

      const items = (foundOrder.items || []).map(it => {
        const prod = localStore.products.find(p => p.id === it.product_id);
        return {
          ...it,
          products: prod ? { name: prod.name, image_url: prod.image_url, category: prod.category } : { name: 'Platillo', image_url: null, category: 'General' }
        };
      });

      let driver = null;
      if (order.driver_id) {
        const drvUser = localStore.users.find(u => u.id === order.driver_id);
        const dp = drvUser ? drvUser.driver_profile : null;
        driver = {
          id: order.driver_id,
          name: drvUser ? drvUser.full_name : 'Martín Rivas',
          phone: drvUser ? drvUser.phone : '+505 8822-4455',
          avatar: drvUser ? drvUser.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
          vehicle: dp ? dp.vehicle_type : 'MOTORCYCLE',
          license_plate: dp ? dp.license_plate : 'A482XYZ',
          rating: dp ? dp.rating : 4.95,
          battery: dp ? dp.battery_level : 95,
          coords: dp ? parseLocation(dp.last_location) : { lng: -86.2650, lat: 12.1260 }
        };
      }

      return jsonResponse(200, {
        success: true,
        order,
        items,
        driver
      });
    } catch (e) {
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 6. POST /api/client/reviews - Publicar calificación del comensal
  if (req.method === 'POST' && url === '/api/client/reviews') {
    try {
      const body = await readBody();
      const { order_id, rating = 5, comment = '', client_name = 'Cliente Comensal' } = body;
      const targetClientId = body.client_id || MOCK_CLIENT_ID;

      let targetReviewRestId = body.restaurant_id;
      if (!targetReviewRestId && order_id) {
        const ord = localStore.orders.find(o => o.id === order_id);
        if (ord) targetReviewRestId = ord.restaurant_id;
      }

      const numRating = Math.min(5, Math.max(1, Number(rating)));
      const finalComment = (comment && comment.trim())
        ? comment.trim()
        : (numRating >= 4 ? '¡Excelente servicio!' : 'Calificación enviada por el cliente.');

      const newReview = {
        id: `rev-${Date.now()}`,
        restaurant_id: targetReviewRestId || RESTAURANT_ID,
        client_id: targetClientId,
        client_name,
        order_id: order_id || null,
        rating: numRating,
        comment: finalComment,
        reply: null,
        created_at: new Date().toISOString()
      };

      localStore.reviews.unshift(newReview);
      console.log(`[Cliente] Calificación registrada con éxito (${numRating} ⭐):`, finalComment);

      return jsonResponse(200, { success: true, review: newReview });
    } catch (e) {
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  return jsonResponse(404, { success: false, error: 'Client API endpoint not found' });
}

module.exports = { handleClientApi };
