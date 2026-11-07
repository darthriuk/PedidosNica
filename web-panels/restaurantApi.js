// ============================================================================
// RESTAURANT BACKEND API - GATEWAY DE SINCRONIZACIÓN CON LOCALSTORE & SUPABASE
// ============================================================================

const crypto = require('crypto');
const localStore = require('./localStore');

const RESTAURANT_ID = '6701bc0c-e5ce-475a-8893-75e9d06e8012';
const MOCK_CLIENT_ID = 'c91f2a10-1234-4a9b-9c11-887766554433'; // Mateo Blandón

async function handleRestaurantApi(req, res, url, config) {
  const { currentCommissionRate } = config;

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

  const parsedUrl = new URL(req.url, 'http://localhost:3000');
  const activeRestId = parsedUrl.searchParams.get('restaurant_id') || RESTAURANT_ID;

  // 0. POST /api/restaurant/onboard - Afiliación de nuevo restaurante
  if (req.method === 'POST' && url === '/api/restaurant/onboard') {
    try {
      const body = await readBody();
      const { name, email, phone, address, opening_hours, logo_url, delivery_radius_km } = body;

      if (!name || !name.trim()) {
        return jsonResponse(400, { success: false, error: 'El nombre del restaurante es obligatorio.' });
      }

      const newRestaurant = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : '+505 8800-0000',
        address: address ? address.trim() : 'Managua, Nicaragua',
        opening_hours: opening_hours ? opening_hours.trim() : 'Lun - Dom: 11:00 - 23:00',
        logo_url: logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150',
        commission_rate: parseFloat(currentCommissionRate) || 15.0,
        location: 'POINT(-86.2514 12.1364)',
        delivery_radius_km: parseFloat(delivery_radius_km) || 6.0,
        estimated_prep_time_minutes: 20,
        delivery_fee: 60.00,
        is_active: true,
        rating: 5.0
      };

      localStore.restaurants.unshift(newRestaurant);

      // Actualizar autorizaciones de SuperAdmin y Multi-Sucursal
      localStore.users.forEach(u => {
        if (u.role === 'SUPER_ADMIN' || u.is_multi_management) {
          u.authorized_restaurants = localStore.restaurants.map(r => ({ id: r.id, name: r.name }));
        }
      });

      const starterProducts = [
        {
          id: crypto.randomUUID(),
          restaurant_id: newRestaurant.id,
          category: 'Especialidades',
          name: `Especialidad ${newRestaurant.name}`,
          description: 'Nuestra receta original preparada al momento con los mejores ingredientes.',
          price: 180.00,
          discount_price: null,
          is_combo: false,
          is_available: true,
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'
        },
        {
          id: crypto.randomUUID(),
          restaurant_id: newRestaurant.id,
          category: 'Combos',
          name: `Combo ${newRestaurant.name} Familiar`,
          description: 'Porción generosa para compartir con acompañamiento y 2 bebidas.',
          price: 360.00,
          discount_price: 320.00,
          is_combo: true,
          is_available: true,
          image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'
        },
        {
          id: crypto.randomUUID(),
          restaurant_id: newRestaurant.id,
          category: 'Bebidas',
          name: 'Bebida Refrescante 500ml',
          description: 'Bebida natural o gaseosa bien fría.',
          price: 45.00,
          discount_price: null,
          is_combo: false,
          is_available: true,
          image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400'
        }
      ];

      localStore.products.push(...starterProducts);

      if (config.broadcastEvent) {
        config.broadcastEvent({ type: 'RESTAURANT_CREATED', restaurant: newRestaurant });
      }

      console.log(`✓ [PedidosNica] Nuevo restaurante afiliado: ${newRestaurant.name} (${newRestaurant.id})`);

      return jsonResponse(201, {
        success: true,
        restaurant: newRestaurant,
        message: '¡Restaurante registrado con éxito en PedidosNica!'
      });
    } catch (e) {
      console.error('[Onboard Catch Error]', e);
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 1. GET /api/restaurant/data - Carga integral para Suite de Restaurante
  if (req.method === 'GET' && url.startsWith('/api/restaurant/data')) {
    try {
      const isAll = activeRestId === 'all';
      const allRestaurants = localStore.restaurants;
      const products = isAll
        ? localStore.products
        : localStore.products.filter(p => p.restaurant_id === activeRestId);
      const rawOrders = isAll
        ? localStore.orders
        : localStore.orders.filter(o => o.restaurant_id === activeRestId);
      const reviews = isAll
        ? localStore.reviews
        : localStore.reviews.filter(r => r.restaurant_id === activeRestId);

      const mappedOrders = rawOrders.map(ord => {
        const orderItems = (ord.items || []).map(it => {
          const prod = localStore.products.find(p => p.id === it.product_id);
          const options = [];
          if (it.customizations && typeof it.customizations === 'object') {
            if (Array.isArray(it.customizations.options)) options.push(...it.customizations.options);
            if (it.customizations.size) options.push(`Tamaño: ${it.customizations.size}`);
            if (Array.isArray(it.customizations.extras)) options.push(...it.customizations.extras);
            if (Array.isArray(it.customizations.without)) options.push(...it.customizations.without.map(w => `Sin ${w}`));
            if (it.customizations.special_notes) options.push(`Nota: ${it.customizations.special_notes}`);
          }
          return {
            id: it.id,
            name: prod ? prod.name : 'Platillo',
            quantity: it.quantity,
            unit_price: parseFloat(it.unit_price),
            options
          };
        });

        const cProf = localStore.users.find(u => u.id === ord.client_id);
        const dProf = ord.driver_id ? localStore.users.find(u => u.id === ord.driver_id) : null;
        const dVeh = dProf ? dProf.driver_profile : null;

        return {
          id: ord.id,
          restaurant_id: ord.restaurant_id,
          status: ord.status,
          client_name: ord.client_name || cProf?.full_name || 'Mateo Blandón',
          phone: ord.client_phone || cProf?.phone || '+505 8899-7711',
          delivery_address: ord.delivery_address,
          delivery_notes: ord.delivery_notes,
          subtotal: parseFloat(ord.subtotal || ord.total),
          delivery_fee: parseFloat(ord.delivery_fee || 0),
          total: parseFloat(ord.total),
          created_at: ord.created_at,
          accepted_at: ord.accepted_at,
          ready_at: ord.ready_at,
          delivered_at: ord.delivered_at,
          cancellation_reason: ord.cancellation_reason,
          estimated_prep_minutes: ord.estimated_prep_time_minutes || 20,
          items: orderItems.length > 0 ? orderItems : [
            { name: 'Platillo Especial de la Casa', quantity: 1, unit_price: 180.00, options: ['Receta Original'] }
          ],
          driver: ord.driver_id ? {
            name: dProf?.full_name || 'Martín Rivas',
            phone: dProf?.phone || '+505 8822-4455',
            vehicle: `${dVeh?.vehicle_type === 'BICYCLE' ? 'Bicicleta' : (dVeh?.vehicle_type === 'CAR' ? 'Automóvil' : 'Moto')} (${dVeh?.license_plate || 'A482XYZ'})`,
            eta: ord.status === 'PICKED_UP' ? 'En ruta al cliente' : 'En camino al local',
            pin: ord.id ? ord.id.replace(/[^0-9]/g, '').slice(0, 4).padEnd(4, '8') : '4821',
            avatar: dProf?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
          } : null
        };
      });

      const currentRest = isAll
        ? { id: 'all', name: '🏢 Todos los Restaurantes (Global)', commission_rate: currentCommissionRate, address: 'Managua, Nicaragua' }
        : (allRestaurants.find(r => r.id === activeRestId) || allRestaurants[0]);

      return jsonResponse(200, {
        success: true,
        restaurant: currentRest,
        allRestaurants,
        products,
        orders: mappedOrders,
        reviews,
        commission_rate: currentCommissionRate
      });
    } catch (e) {
      console.error('Error fetching restaurant data:', e);
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 1b. POST /api/restaurant/reviews/reply - Responder a una reseña
  if (req.method === 'POST' && url === '/api/restaurant/reviews/reply') {
    const body = await readBody();
    const { reviewId, reply } = body;
    if (reviewId) {
      const rev = localStore.reviews.find(r => r.id === reviewId);
      if (rev) rev.reply = reply;
    }
    return jsonResponse(200, { success: true });
  }

  // 2. POST /api/restaurant/orders/status - Actualizar estado de pedido en KDS
  if (req.method === 'POST' && url === '/api/restaurant/orders/status') {
    const body = await readBody();
    const { orderId, status, prepMinutes, cancellationReason } = body;

    const ord = localStore.orders.find(o => o.id === orderId);
    if (ord) {
      ord.status = status;
      if (prepMinutes) ord.estimated_prep_time_minutes = parseInt(prepMinutes);
      if (cancellationReason) ord.cancellation_reason = cancellationReason;
      if (status === 'ACCEPTED') ord.accepted_at = new Date().toISOString();
      if (status === 'READY_FOR_PICKUP') ord.ready_at = new Date().toISOString();
      if (status === 'DELIVERED') ord.delivered_at = new Date().toISOString();

      if (config.broadcastEvent) {
        config.broadcastEvent('ORDER_STATUS_CHANGED', { orderId, status });
      }
    }

    return jsonResponse(200, { success: true });
  }

  // 3. POST /api/restaurant/orders/simulate - Crear nuevo pedido simulado para la sucursal
  if (req.method === 'POST' && url === '/api/restaurant/orders/simulate') {
    try {
      const targetRest = (activeRestId && activeRestId !== 'all') ? activeRestId : RESTAURANT_ID;
      const prods = localStore.products.filter(p => p.restaurant_id === targetRest);
      const chosenProd = prods[0] || localStore.products[0];
      const unitPrice = chosenProd ? Number(chosenProd.discount_price || chosenProd.price) : 140.00;
      const subtotal = unitPrice * 2;
      const deliveryFee = 65.00;
      const orderId = crypto.randomUUID();

      const newOrder = {
        id: orderId,
        client_id: MOCK_CLIENT_ID,
        client_name: 'Mateo Blandón',
        client_phone: '+505 8711-2299',
        restaurant_id: targetRest,
        driver_id: null,
        status: 'CREATED',
        subtotal,
        delivery_fee: deliveryFee,
        total: subtotal + deliveryFee + 15.00,
        delivery_location: 'POINT(-86.2415 12.1022)',
        delivery_address: 'Galerías Santo Domingo, Condominio Las Colinas #14, Managua',
        delivery_notes: 'Tocar timbre o llamar al llegar | Pago: CASH',
        estimated_prep_time_minutes: 20,
        created_at: new Date().toISOString(),
        items: [
          {
            id: `item-${Date.now()}`,
            order_id: orderId,
            product_id: chosenProd ? chosenProd.id : 'd1000001-0000-4000-a000-000000000001',
            quantity: 2,
            unit_price: unitPrice,
            customizations: { extras: ['Quesillo Extra', 'Salsa Casera'] }
          }
        ]
      };

      localStore.orders.unshift(newOrder);

      if (config.broadcastEvent) {
        config.broadcastEvent('ORDER_CREATED', { order: newOrder, items: newOrder.items });
      }

      return jsonResponse(200, { success: true, order: newOrder });
    } catch (e) {
      return jsonResponse(500, { success: false, error: e.message });
    }
  }

  // 4. POST /api/restaurant/products/toggle - Pausa / Reanudación de stock
  if (req.method === 'POST' && url === '/api/restaurant/products/toggle') {
    const body = await readBody();
    const { productId, is_available } = body;

    const prod = localStore.products.find(p => p.id === productId);
    if (prod) {
      prod.is_available = Boolean(is_available);
    }

    if (config.broadcastEvent) {
      config.broadcastEvent('PRODUCT_STOCK_CHANGED', {
        productId,
        is_available: Boolean(is_available),
        product: prod || null
      });
    }

    return jsonResponse(200, { success: true, product: prod || null });
  }

  // 5. POST /api/restaurant/products/save - Crear o editar producto
  if (req.method === 'POST' && url === '/api/restaurant/products/save') {
    const body = await readBody();
    const { id, name, category, description, price, discount_price, is_combo, image_url, customization_groups } = body;

    const targetRestId = (body.restaurant_id && body.restaurant_id !== 'all')
      ? body.restaurant_id
      : ((activeRestId && activeRestId !== 'all') ? activeRestId : RESTAURANT_ID);

    let savedProduct = localStore.products.find(p => p.id === id);
    if (savedProduct) {
      savedProduct.name = name;
      savedProduct.category = category;
      savedProduct.description = description;
      savedProduct.price = parseFloat(price);
      savedProduct.discount_price = discount_price ? parseFloat(discount_price) : null;
      savedProduct.is_combo = !!is_combo;
      if (image_url) savedProduct.image_url = image_url;
      if (customization_groups) savedProduct.customization_groups = customization_groups;
    } else {
      savedProduct = {
        id: crypto.randomUUID(),
        restaurant_id: targetRestId,
        name,
        category,
        description,
        price: parseFloat(price),
        discount_price: discount_price ? parseFloat(discount_price) : null,
        is_combo: !!is_combo,
        is_available: true,
        image_url: image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        customization_groups: customization_groups || []
      };
      localStore.products.push(savedProduct);
    }

    if (config.broadcastEvent && savedProduct) {
      config.broadcastEvent('PRODUCT_SAVED', { product: savedProduct });
    }

    return jsonResponse(200, { success: true, product: savedProduct });
  }

  // 6. POST /api/restaurant/products/delete - Eliminar platillo
  if (req.method === 'POST' && url === '/api/restaurant/products/delete') {
    const body = await readBody();
    const { id } = body;

    const idx = localStore.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      localStore.products.splice(idx, 1);
    }

    if (config.broadcastEvent) {
      config.broadcastEvent('PRODUCT_DELETED', { productId: id });
    }

    return jsonResponse(200, { success: true });
  }

  return false;
}

module.exports = {
  handleRestaurantApi,
  RESTAURANT_ID
};
