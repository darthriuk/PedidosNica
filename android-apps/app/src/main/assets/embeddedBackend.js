(function() {
  // ============================================================================
  // PEDIDOSNICA EMBEDDED LOCAL BUILD ENGINE (100% STANDALONE + LAN SYNC)
  // ============================================================================
  const nativeFetch = window.fetch.bind(window);
  const LAN_SERVER = "http://192.168.1.20:3000";
  let lanServerOnline = false;

  // Verificar en segundo plano si la PC en red local Wi-Fi está accesible para sincronizar
  function checkLanServer() {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 1200) : null;
    nativeFetch(LAN_SERVER + '/api/network-info', controller ? { signal: controller.signal } : {})
      .then(r => {
        if (timer) clearTimeout(timer);
        lanServerOnline = r && r.ok;
      })
      .catch(() => {
        if (timer) clearTimeout(timer);
        lanServerOnline = false;
      });
  }
  checkLanServer();
  setInterval(checkLanServer, 15000);

  // Shim de módulos CommonJS para ejecutar localStore, authApi, clientApi, driverApi, restaurantApi en el teléfono
  const __modules = {};
  const __cache = {};

  __modules['crypto'] = function(module, exports) {
    module.exports = {
      randomUUID: function() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
          return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
  };

  function __require(id) {
    const cleanId = id.replace(/^\.\//, '');
    if (__cache[cleanId]) return __cache[cleanId].exports;
    const mod = { exports: {} };
    __cache[cleanId] = mod;
    if (!__modules[cleanId]) {
      throw new Error('Module not found in embedded build: ' + id);
    }
    __modules[cleanId](mod, mod.exports, __require);
    return mod.exports;
  }

  __modules['localStore'] = function(module, exports, require) {
// ============================================================================
// SHARED ECOSYSTEM STATE & SUPABASE FALLBACK STORE (GARANTIZA 0 ERRORES 500)
// ============================================================================

const crypto = require('crypto');

// Almacén en memoria para tokens OTP de recuperación de contraseña (Email / SMS)
const recoveryTokens = {};

const restaurants = [
  {
    id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    name: 'Pupusería & Antojitos El Diamante',
    email: 'admin@eldiamante.com',
    phone: '+505 8833-4455',
    address: 'Colonia Los Robles, de la Rotonda El Güegüense 2c al Sur, Managua',
    opening_hours: 'Lun - Dom: 11:00 - 23:00',
    logo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    commission_rate: 15.0,
    location: 'POINT(-86.2650 12.1260)',
    delivery_radius_km: 7.0,
    estimated_prep_time_minutes: 20,
    delivery_fee: 60.00,
    is_active: true,
    rating: 4.9
  },
  {
    id: 'c641b9c7-e1b7-4f88-a8e6-53509446ee35',
    name: 'Asados El Toro Nica',
    email: 'admin@asadoseltoro.ni',
    phone: '+505 8922-3344',
    address: 'Carretera a Masaya Km 4.5, frente a Centro Pellas, Managua',
    opening_hours: 'Lun - Dom: 11:30 - 23:30',
    logo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200',
    commission_rate: 15.0,
    location: 'POINT(-86.2562 12.1185)',
    delivery_radius_km: 8.0,
    estimated_prep_time_minutes: 25,
    delivery_fee: 65.00,
    is_active: true,
    rating: 4.8
  },
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Pizzería & Ristorante Di Napoli',
    email: 'admin@pizzeriadnapoli.com',
    phone: '+505 8644-5566',
    address: 'Galerías Santo Domingo, Zona Viva Local 14, Managua',
    opening_hours: 'Lun - Dom: 12:00 - 23:00',
    logo_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200',
    commission_rate: 15.0,
    location: 'POINT(-86.2415 12.1022)',
    delivery_radius_km: 8.0,
    estimated_prep_time_minutes: 20,
    delivery_fee: 55.00,
    is_active: true,
    rating: 4.95
  }
];

const users = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'manager@pedidosnica.com',
    password: 'Password123!',
    full_name: 'Carlos Ortega',
    phone: '+505 8800-0001',
    avatar_url: 'https://ui-avatars.com/api/?name=Carlos+Ortega&background=06C167&color=000&bold=true',
    role: 'SUPER_ADMIN',
    subrole: 'SUPER_ADMIN',
    account_status: 'ACTIVE',
    is_multi_management: true,
    restaurant_id: null,
    restaurant_name: null,
    authorized_restaurants: restaurants.map(r => ({ id: r.id, name: r.name })),
    address: 'Centro Corporativo Pellas, Piso 10, Managua',
    notes: 'Recepción ejecutiva',
    security_question: '¿En qué ciudad naciste?',
    security_answer: 'managua',
    saved_addresses: [
      {
        id: 'addr-admin-1',
        label: 'Oficina Central',
        icon: '🏢',
        building_type: 'OFICINA',
        zone: 'Carretera a Masaya',
        address: 'Centro Corporativo Pellas, Piso 10, Managua',
        reference: 'Recepción ejecutiva',
        recipient_phone: '+505 8800-0001',
        lat: 12.1185,
        lng: -86.2562,
        is_default: true
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'c91f2a10-1234-4a9b-9c11-887766554433',
    email: 'mateo@pedidosnica.com',
    password: 'Password123!',
    full_name: 'Mateo Blandón',
    phone: '+505 8711-2299',
    avatar_url: 'https://ui-avatars.com/api/?name=Mateo+Blandon&background=06C167&color=000&bold=true',
    role: 'CLIENT',
    subrole: 'STANDARD',
    account_status: 'ACTIVE',
    address: 'Colonia Los Robles, Del Hotel Colón 1c al Sur, Casa #42, Managua',
    notes: 'Casa esquinera portón negro, tocar timbre',
    security_question: '¿Cuál es tu comida nica favorita?',
    security_answer: 'gallo pinto',
    saved_addresses: [
      {
        id: 'addr-mateo-1',
        label: 'Casa',
        icon: '🏠',
        building_type: 'CASA',
        zone: 'Colonia Los Robles',
        address: 'Colonia Los Robles, Del Hotel Colón 1c al Sur, Casa #42, Managua',
        reference: 'Casa esquinera portón negro, tocar timbre',
        recipient_phone: '+505 8711-2299',
        lat: 12.1260,
        lng: -86.2650,
        is_default: true
      },
      {
        id: 'addr-mateo-2',
        label: 'Oficina',
        icon: '🏢',
        building_type: 'OFICINA',
        zone: 'Carretera a Masaya / Centro Pellas',
        address: 'Centro Pellas, Carretera a Masaya Km 4.5, Piso 6, Managua',
        reference: 'Dejar en lobby con seguridad o llamar al llegar',
        recipient_phone: '+505 8711-2299',
        lat: 12.1185,
        lng: -86.2562,
        is_default: false
      },
      {
        id: 'addr-mateo-3',
        label: 'Casa Familia',
        icon: '❤️',
        building_type: 'CASA',
        zone: 'Galerías / Las Colinas',
        address: 'Condominio Las Colinas, Entrada Principal 2c al Este, Casa #18, Managua',
        reference: 'Anunciar en garita de seguridad a nombre de Familia Blandón',
        recipient_phone: '+505 8844-1100',
        lat: 12.1022,
        lng: -86.2415,
        is_default: false
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'bec363ae-0205-4193-8f01-93e2db50b38e',
    email: 'sofia@pedidosnica.com',
    password: 'Password123!',
    full_name: 'Sofía Chamorro',
    phone: '+505 8899-7711',
    avatar_url: 'https://ui-avatars.com/api/?name=Sofia+Chamorro&background=06C167&color=000&bold=true',
    role: 'CLIENT',
    subrole: 'STANDARD',
    account_status: 'ACTIVE',
    address: 'Galerías Santo Domingo, Condominio Las Colinas Casa #14, Managua',
    notes: 'Portón negro, llamar al llegar',
    security_question: '¿Cuál es el nombre de tu primera mascota?',
    security_answer: 'luna',
    saved_addresses: [
      {
        id: 'addr-sofia-1',
        label: 'Casa',
        icon: '🏠',
        building_type: 'CASA',
        zone: 'Galerías / Las Colinas',
        address: 'Galerías Santo Domingo, Condominio Las Colinas Casa #14, Managua',
        reference: 'Portón negro, llamar al llegar',
        recipient_phone: '+505 8899-7711',
        lat: 12.1022,
        lng: -86.2415,
        is_default: true
      },
      {
        id: 'addr-sofia-2',
        label: 'Universidad',
        icon: '🎓',
        building_type: 'OTRO',
        zone: 'Metrocentro / UCA',
        address: 'Rotonda Rubén Darío (Metrocentro) 1c al Oeste, Managua',
        reference: 'Entrada peatonal principal',
        recipient_phone: '+505 8899-7711',
        lat: 12.1282,
        lng: -86.2695,
        is_default: false
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'ecaae45b-e723-49b7-8cae-65f0897f1861',
    email: 'admin@eldiamante.com',
    password: 'Password123!',
    full_name: 'Roberto Morales',
    phone: '+505 8833-4455',
    avatar_url: 'https://ui-avatars.com/api/?name=Roberto+Morales&background=9333ea&color=fff&bold=true',
    role: 'RESTAURANT_ADMIN',
    subrole: 'ADMIN',
    account_status: 'ACTIVE',
    is_multi_management: false,
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    restaurant_name: 'Pupusería & Antojitos El Diamante',
    authorized_restaurants: [{ id: '6701bc0c-e5ce-475a-8893-75e9d06e8012', name: 'Pupusería & Antojitos El Diamante' }],
    security_question: '¿Cuál es tu comida nica favorita?',
    security_answer: 'pupusas',
    saved_addresses: [],
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'eaba2f82-1794-4c73-9c6f-2c426d949ff4',
    email: 'cocina@eldiamante.com',
    password: 'Password123!',
    full_name: 'Pedro Ruiz',
    phone: '+505 8765-4321',
    avatar_url: 'https://ui-avatars.com/api/?name=Pedro+Ruiz&background=2563eb&color=fff&bold=true',
    role: 'RESTAURANT_ADMIN',
    subrole: 'STAFF',
    account_status: 'ACTIVE',
    is_multi_management: false,
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    restaurant_name: 'Pupusería & Antojitos El Diamante',
    authorized_restaurants: [{ id: '6701bc0c-e5ce-475a-8893-75e9d06e8012', name: 'Pupusería & Antojitos El Diamante' }],
    security_question: '¿En qué ciudad naciste?',
    security_answer: 'masaya',
    saved_addresses: [],
    created_at: new Date(Date.now() - 86400000 * 18).toISOString()
  },
  {
    id: '7d91c002-5219-4c88-b102-339182736451',
    email: 'admin@asadoseltoro.ni',
    password: 'Password123!',
    full_name: 'Héctor Mendoza',
    phone: '+505 8922-3344',
    avatar_url: 'https://ui-avatars.com/api/?name=Hector+Mendoza&background=9333ea&color=fff&bold=true',
    role: 'RESTAURANT_ADMIN',
    subrole: 'ADMIN',
    account_status: 'ACTIVE',
    is_multi_management: false,
    restaurant_id: 'c641b9c7-e1b7-4f88-a8e6-53509446ee35',
    restaurant_name: 'Asados El Toro Nica',
    authorized_restaurants: [{ id: 'c641b9c7-e1b7-4f88-a8e6-53509446ee35', name: 'Asados El Toro Nica' }],
    security_question: '¿Cuál es tu comida nica favorita?',
    security_answer: 'churrasco',
    saved_addresses: [],
    created_at: new Date(Date.now() - 86400000 * 14).toISOString()
  },
  {
    id: '8f12d334-6321-4d99-a213-448273645512',
    email: 'admin@pizzeriadnapoli.com',
    password: 'Password123!',
    full_name: 'Luigi Falcone',
    phone: '+505 8644-5566',
    avatar_url: 'https://ui-avatars.com/api/?name=Luigi+Falcone&background=9333ea&color=fff&bold=true',
    role: 'RESTAURANT_ADMIN',
    subrole: 'ADMIN',
    account_status: 'ACTIVE',
    is_multi_management: false,
    restaurant_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    restaurant_name: 'Pizzería & Ristorante Di Napoli',
    authorized_restaurants: [{ id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Pizzería & Ristorante Di Napoli' }],
    security_question: '¿Cuál es tu comida nica favorita?',
    security_answer: 'pizza',
    saved_addresses: [],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: '9a23e445-7432-4e88-b324-559384756623',
    email: 'franquicia@gruponica.com',
    password: 'Password123!',
    full_name: 'Marcela Castillo (Directora Multi-Sucursal)',
    phone: '+505 8111-2233',
    avatar_url: 'https://ui-avatars.com/api/?name=Marcela+Castillo&background=7c3aed&color=fff&bold=true',
    role: 'RESTAURANT_ADMIN',
    subrole: 'ADMIN',
    account_status: 'ACTIVE',
    is_multi_management: true,
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    restaurant_name: 'Pupusería & Antojitos El Diamante',
    authorized_restaurants: restaurants.map(r => ({ id: r.id, name: r.name })),
    security_question: '¿En qué ciudad naciste?',
    security_answer: 'granada',
    saved_addresses: [],
    created_at: new Date(Date.now() - 86400000 * 25).toISOString()
  },
  {
    id: '6c5c143c-e567-4e1d-85b7-d4f984628816',
    email: 'driver.martin@pedidosnica.com',
    password: 'Password123!',
    full_name: 'Martín Rivas',
    phone: '+505 8899-7766',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    role: 'DRIVER',
    subrole: 'STANDARD',
    account_status: 'ACTIVE',
    security_question: '¿Cuál es el nombre de tu primera mascota?',
    security_answer: 'rocky',
    driver_profile: {
      driver_id: '6c5c143c-e567-4e1d-85b7-d4f984628816',
      vehicle_type: 'MOTORCYCLE',
      license_plate: 'A482XYZ',
      current_status: 'AVAILABLE',
      is_verified: true,
      battery_level: 96,
      rating: 4.95,
      last_location: 'POINT(-86.2650 12.1260)'
    },
    created_at: new Date(Date.now() - 86400000 * 16).toISOString()
  },
  {
    id: 'b8aea8b6-531f-4062-b9fe-0c69b33acbf4',
    email: 'driver.carlos@pedidosnica.com',
    password: 'Password123!',
    full_name: 'Carlos Gómez',
    phone: '+505 8765-1122',
    avatar_url: 'https://ui-avatars.com/api/?name=Carlos+Gomez&background=0284c7&color=fff&bold=true',
    role: 'DRIVER',
    subrole: 'STANDARD',
    account_status: 'ACTIVE',
    security_question: '¿En qué ciudad naciste?',
    security_answer: 'leon',
    driver_profile: {
      driver_id: 'b8aea8b6-531f-4062-b9fe-0c69b33acbf4',
      vehicle_type: 'MOTORCYCLE',
      license_plate: 'M819ABC',
      current_status: 'AVAILABLE',
      is_verified: true,
      battery_level: 89,
      rating: 4.88,
      last_location: 'POINT(-86.2720 12.1310)'
    },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString()
  },
  {
    id: 'fbcf8d15-f42d-45c9-bb40-0b754c34696a',
    email: 'driver.matias@pedidosnica.com',
    password: 'Password123!',
    full_name: 'Matías Pérez',
    phone: '+505 8555-4433',
    avatar_url: 'https://ui-avatars.com/api/?name=Matias+Perez&background=0284c7&color=fff&bold=true',
    role: 'DRIVER',
    subrole: 'STANDARD',
    account_status: 'ACTIVE',
    security_question: '¿Cuál es tu comida nica favorita?',
    security_answer: 'nacatamal',
    driver_profile: {
      driver_id: 'fbcf8d15-f42d-45c9-bb40-0b754c34696a',
      vehicle_type: 'BICYCLE',
      license_plate: 'B928E',
      current_status: 'AVAILABLE',
      is_verified: true,
      battery_level: 82,
      rating: 4.92,
      last_location: 'POINT(-86.2580 12.1220)'
    },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

const products = [
  // El Diamante (Pupusería & Antojitos)
  {
    id: 'd1000001-0000-4000-a000-000000000001',
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    name: 'Combo 3 Pupusas Revueltas + Curtido y Cacao',
    category: 'Pupusas',
    description: 'Tres pupusas artesanales rellenas de chicharrón, quesillo fundido y frijoles con curtido casero y cacao frío.',
    price: 220.00,
    discount_price: 185.00,
    is_combo: true,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500'
  },
  {
    id: 'd1000001-0000-4000-a000-000000000002',
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    name: 'Quesillo Tradicional Nagaroteño Doble',
    category: 'Antojitos',
    description: 'Tortilla recién palmeada con doble trenza de quesillo, cebolla encurtida, crema pura y chilero.',
    price: 165.00,
    discount_price: null,
    is_combo: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=500'
  },
  {
    id: 'd1000001-0000-4000-a000-000000000003',
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    name: 'Repochetas Nicas Crujientes (Orden de 4)',
    category: 'Antojitos',
    description: 'Tortillas doradas con quesillo, bañadas en crema ácida, repollo fresco y salsa de tomate casera.',
    price: 145.00,
    discount_price: null,
    is_combo: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=500'
  },
  // Asados El Toro Nica
  {
    id: 'd2000002-0000-4000-a000-000000000001',
    restaurant_id: 'c641b9c7-e1b7-4f88-a8e6-53509446ee35',
    name: 'Churrasco Nica de Lomito al Carbón 12oz',
    category: 'Asados',
    description: 'Lomito de exportación a las brasas con salsa jalapeña o chimichurri, gallo pinto, tajadas verdes y queso frito.',
    price: 420.00,
    discount_price: 375.00,
    is_combo: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'
  },
  {
    id: 'd2000002-0000-4000-a000-000000000002',
    restaurant_id: 'c641b9c7-e1b7-4f88-a8e6-53509446ee35',
    name: 'Parrillada Familiar El Toro (Para 4)',
    category: 'Combos',
    description: 'Res, cerdo adobado, pechuga al carbón, chorizos parrilleros, 4 porciones de gallo pinto, maduros, queso frito y 4 bebidas.',
    price: 1150.00,
    discount_price: 980.00,
    is_combo: true,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500'
  },
  // Pizzería Di Napoli
  {
    id: 'df91e203-2334-4036-9576-672106dcd72b',
    restaurant_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Pizza Napolitana Artesanal al Horno de Leña',
    category: 'Pizzas',
    description: 'Mozzarella fresca fundida, rodajas de tomate Roma, albahaca orgánica, aceite de oliva extra virgen y orégano.',
    price: 380.00,
    discount_price: 320.00,
    is_combo: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500'
  },
  {
    id: 'ec38fb52-2887-4151-a2ce-67416fb30762',
    restaurant_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Super Combo Doble Cheddar + Papas Rústicas + Bebida',
    category: 'Combos',
    description: 'Doble carne angus 180g, bacon crujiente, doble cheddar, papas rústicas al romero y gaseosa 500ml.',
    price: 340.00,
    discount_price: 285.00,
    is_combo: true,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'
  }
];

const orders = [
  {
    id: 'a81a2001-1111-4000-a000-000000000001',
    client_id: 'c91f2a10-1234-4a9b-9c11-887766554433',
    client_name: 'Mateo Blandón',
    client_phone: '+505 8711-2299',
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    driver_id: null,
    status: 'READY_FOR_PICKUP',
    subtotal: 370.00,
    delivery_fee: 65.00,
    total: 450.00,
    delivery_location: 'POINT(-86.2650 12.1260)',
    delivery_address: 'Colonia Los Robles, Del Hotel Colón 1c al Sur, Casa #42, Managua',
    delivery_notes: 'Casa esquinera portón negro, tocar timbre | Pago: CASH',
    estimated_prep_time_minutes: 20,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    accepted_at: new Date(Date.now() - 9 * 60000).toISOString(),
    ready_at: new Date(Date.now() - 2 * 60000).toISOString(),
    items: [
      {
        id: 'item-101',
        order_id: 'a81a2001-1111-4000-a000-000000000001',
        product_id: 'd1000001-0000-4000-a000-000000000001',
        quantity: 2,
        unit_price: 185.00,
        customizations: { options: ['Extra Quesillo', 'Salsa Picante Aparte'], special_notes: 'Bien doraditas' }
      }
    ]
  },
  {
    id: 'b72c3002-2222-4000-a000-000000000002',
    client_id: 'c91f2a10-1234-4a9b-9c11-887766554433',
    client_name: 'Mateo Blandón',
    client_phone: '+505 8711-2299',
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    driver_id: '6c5c143c-e567-4e1d-85b7-d4f984628816',
    status: 'DELIVERED',
    subtotal: 330.00,
    delivery_fee: 60.00,
    total: 405.00,
    delivery_location: 'POINT(-86.2650 12.1260)',
    delivery_address: 'Colonia Los Robles, Del Hotel Colón 1c al Sur, Casa #42, Managua',
    delivery_notes: 'Entregado en mano',
    estimated_prep_time_minutes: 20,
    created_at: new Date(Date.now() - 95 * 60000).toISOString(),
    delivered_at: new Date(Date.now() - 60 * 60000).toISOString(),
    items: [
      {
        id: 'item-102',
        order_id: 'b72c3002-2222-4000-a000-000000000002',
        product_id: 'd1000001-0000-4000-a000-000000000002',
        quantity: 2,
        unit_price: 165.00,
        customizations: { options: ['Con chile'] }
      }
    ]
  }
];

const reviews = [
  {
    id: 'rev-101',
    restaurant_id: '6701bc0c-e5ce-475a-8893-75e9d06e8012',
    client_id: 'c91f2a10-1234-4a9b-9c11-887766554433',
    client_name: 'Mateo Blandón',
    order_id: 'b72c3002-2222-4000-a000-000000000002',
    rating: 5,
    comment: '¡Las pupusas llegaron calientitas y el cacao delicioso! Excelente servicio.',
    reply: '¡Muchas gracias Mateo! Siempre es un gusto atenderte en El Diamante.',
    created_at: new Date(Date.now() - 50 * 60000).toISOString()
  }
];

module.exports = {
  restaurants,
  users,
  products,
  orders,
  reviews,
  recoveryTokens
};

  };

  __modules['authApi'] = function(module, exports, require) {
// ============================================================================
// AUTH & PROFILE BACKEND API - GESTIÓN INTEGRAL DE IDENTIDAD, ROLES,
// MÚLTIPLES DIRECCIONES Y RECUPERACIÓN DE CONTRASEÑA (EMAIL / SMS / PREGUNTA)
// ============================================================================

const crypto = require('crypto');
const localStore = require('./localStore');

function normalizeAnswer(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizePhoneDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();
  const lower = raw.toLowerCase();
  const digits = normalizePhoneDigits(raw);

  return localStore.users.find(u => {
    if (u.id === raw) return true;
    if ((u.email || '').toLowerCase() === lower) return true;
    if (digits.length >= 7) {
      const uDigits = normalizePhoneDigits(u.phone);
      if (uDigits && (uDigits === digits || uDigits.endsWith(digits) || digits.endsWith(uDigits))) {
        return true;
      }
    }
    return false;
  }) || null;
}

function serializeUserPublic(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    avatar_url: u.avatar_url,
    role: u.role,
    subrole: u.subrole || (u.role === 'RESTAURANT_ADMIN' ? 'ADMIN' : 'STANDARD'),
    account_status: u.account_status || 'ACTIVE',
    is_multi_management: Boolean(u.is_multi_management),
    restaurant_id: u.restaurant_id || null,
    restaurant_name: u.restaurant_name || null,
    authorized_restaurants: u.authorized_restaurants || [],
    address: u.address || 'Galerías Santo Domingo, Managua',
    notes: u.notes || '',
    security_question: u.security_question || '¿Cuál es tu comida nica favorita?',
    saved_addresses: Array.isArray(u.saved_addresses) ? u.saved_addresses : [],
    driver_profile: u.driver_profile || null
  };
}

async function handleAuthApi(req, res, url, config) {
  const { broadcastEvent } = config;

  const sendJson = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
  };

  const readBody = () => new Promise((resolve) => {
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

  if (req.method === 'OPTIONS') {
    sendJson(200, { ok: true });
    return;
  }

  const cleanUrl = url.split('?')[0];

  // ==========================================================================
  // 1. POST /api/auth/login - Iniciar sesión por email, teléfono o userId
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/login') {
    try {
      const payload = await readBody();
      const { email, phone, identifier, password, userId } = payload;

      let matchedUser = null;
      if (userId) {
        matchedUser = localStore.users.find(u => u.id === userId) || null;
      } else {
        matchedUser = findUserByIdentifier(identifier || email || phone);
      }

      if (!matchedUser) {
        sendJson(401, { success: false, error: 'No se encontró ninguna cuenta asociada a ese correo o teléfono.' });
        return;
      }

      // Validar contraseña si se ingresó (permitiendo la contraseña actual del usuario o Password123! para cuentas demo)
      if (password && matchedUser.password && password !== matchedUser.password && password !== 'Password123!') {
        sendJson(401, { success: false, error: 'Contraseña incorrecta. ¿Olvidaste tu contraseña? Puedes recuperarla por Email, SMS o Pregunta de Seguridad.' });
        return;
      }

      if (matchedUser.account_status === 'SUSPENDED') {
        sendJson(403, {
          success: false,
          error: '🚫 Cuenta Suspendida: Tu acceso ha sido temporalmente deshabilitado por el Administrador de la Plataforma.'
        });
        return;
      }

      sendJson(200, {
        success: true,
        user: serializeUserPublic(matchedUser)
      });
    } catch (err) {
      console.error('[Auth API] Error en login:', err);
      sendJson(500, { success: false, error: 'Error del servidor durante la autenticación.' });
    }
    return;
  }

  // ==========================================================================
  // 2. POST /api/auth/register - Registro de nuevo usuario con libreta de direcciones y pregunta de seguridad
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/register') {
    try {
      const payload = await readBody();
      const {
        full_name,
        email,
        phone = '+505 8888-0000',
        password = 'Password123!',
        role = 'CLIENT',
        subrole = 'ADMIN',
        restaurant_id = null,
        restaurant_name = null,
        is_multi_management = false,
        authorized_restaurants = [],
        vehicle_type = 'MOTORCYCLE',
        license_plate = 'M-10293',
        address = 'Galerías Santo Domingo, Managua',
        notes = '',
        zone = 'Galerías / Las Colinas',
        lat = 12.1022,
        lng = -86.2415,
        security_question = '¿Cuál es tu comida nica favorita?',
        security_answer = 'gallo pinto'
      } = payload;

      if (!full_name || !email) {
        sendJson(400, { success: false, error: 'El nombre completo y correo electrónico son obligatorios.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (localStore.users.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
        sendJson(400, { success: false, error: 'Ya existe una cuenta registrada con ese correo electrónico.' });
        return;
      }

      const validRole = ['CLIENT', 'DRIVER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'].includes(role) ? role : 'CLIENT';
      const newUserId = crypto.randomUUID();
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name.trim())}&background=06C167&color=000&bold=true`;

      let driverProfileObj = null;
      if (validRole === 'DRIVER') {
        driverProfileObj = {
          driver_id: newUserId,
          vehicle_type: ['MOTORCYCLE', 'BICYCLE', 'CAR'].includes(vehicle_type) ? vehicle_type : 'MOTORCYCLE',
          license_plate: license_plate.trim() || 'M-99881',
          current_status: 'AVAILABLE',
          is_verified: true,
          rating: 5.0,
          battery_level: 100,
          last_location: 'POINT(-86.2650 12.1260)'
        };
      }

      const targetRestId = validRole === 'RESTAURANT_ADMIN' ? (restaurant_id || '6701bc0c-e5ce-475a-8893-75e9d06e8012') : null;
      const targetRestObj = targetRestId ? localStore.restaurants.find(r => r.id === targetRestId) : null;
      const targetRestName = validRole === 'RESTAURANT_ADMIN' ? (restaurant_name || targetRestObj?.name || 'Pupusería & Antojitos El Diamante') : null;

      const initialAddresses = address ? [
        {
          id: `addr-${Date.now()}`,
          label: 'Casa',
          icon: '🏠',
          building_type: 'CASA',
          zone: zone || 'Managua',
          address: address.trim(),
          reference: notes ? notes.trim() : 'Llamar al llegar',
          recipient_phone: phone.trim(),
          lat: Number(lat) || 12.1022,
          lng: Number(lng) || -86.2415,
          is_default: true
        }
      ] : [];

      const finalUser = {
        id: newUserId,
        email: cleanEmail,
        password: password || 'Password123!',
        full_name: full_name.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
        role: validRole,
        subrole: validRole === 'RESTAURANT_ADMIN' ? (subrole || 'ADMIN') : 'STANDARD',
        account_status: 'ACTIVE',
        is_multi_management: Boolean(is_multi_management),
        restaurant_id: targetRestId,
        restaurant_name: targetRestName,
        authorized_restaurants: validRole === 'RESTAURANT_ADMIN'
          ? (authorized_restaurants && authorized_restaurants.length > 0 ? authorized_restaurants : [{ id: targetRestId, name: targetRestName }])
          : [],
        address: address.trim(),
        notes: notes ? notes.trim() : '',
        security_question: security_question || '¿Cuál es tu comida nica favorita?',
        security_answer: (security_answer || 'gallo pinto').trim(),
        saved_addresses: initialAddresses,
        driver_profile: driverProfileObj,
        created_at: new Date().toISOString()
      };

      localStore.users.unshift(finalUser);

      if (broadcastEvent) {
        broadcastEvent({ type: 'USER_REGISTERED', user: serializeUserPublic(finalUser) });
      }

      sendJson(201, {
        success: true,
        message: 'Usuario registrado exitosamente.',
        user: serializeUserPublic(finalUser)
      });
    } catch (err) {
      console.error('[Auth API] Error en registro:', err);
      sendJson(500, { success: false, error: 'Error interno al registrar usuario.' });
    }
    return;
  }

  // ==========================================================================
  // 3. GET /api/auth/users - Directorio completo de usuarios y comercios para IAM
  // ==========================================================================
  if (req.method === 'GET' && cleanUrl === '/api/auth/users') {
    try {
      sendJson(200, {
        success: true,
        users: localStore.users.map(u => ({
          ...u,
          driver_profiles: u.driver_profile ? [u.driver_profile] : []
        })),
        restaurants: localStore.restaurants
      });
    } catch (err) {
      sendJson(500, { success: false, error: 'Error al listar usuarios.' });
    }
    return;
  }

  // ==========================================================================
  // 4. POST /api/auth/profile - Editar perfil, teléfono, dirección, pregunta de seguridad o contraseña
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/profile') {
    try {
      const payload = await readBody();
      const {
        userId,
        fullName,
        phone,
        email,
        avatarUrl,
        vehicleType,
        licensePlate,
        address,
        notes,
        savedAddresses,
        securityQuestion,
        securityAnswer,
        newPassword
      } = payload;

      if (!userId) {
        sendJson(400, { success: false, error: 'Falta userId.' });
        return;
      }

      const u = localStore.users.find(x => x.id === userId);
      if (u) {
        if (fullName !== undefined && String(fullName).trim()) u.full_name = String(fullName).trim();
        if (phone !== undefined && String(phone).trim()) u.phone = String(phone).trim();
        if (email !== undefined && String(email).trim()) u.email = String(email).trim().toLowerCase();
        if (avatarUrl !== undefined) u.avatar_url = avatarUrl;
        if (address !== undefined) u.address = address;
        if (notes !== undefined) u.notes = notes;
        if (Array.isArray(savedAddresses)) u.saved_addresses = savedAddresses;
        if (securityQuestion !== undefined && String(securityQuestion).trim()) {
          u.security_question = String(securityQuestion).trim();
        }
        if (securityAnswer !== undefined && String(securityAnswer).trim()) {
          u.security_answer = String(securityAnswer).trim();
        }
        if (newPassword !== undefined && String(newPassword).trim().length >= 4) {
          u.password = String(newPassword).trim();
        }

        if (vehicleType || licensePlate) {
          if (!u.driver_profile) {
            u.driver_profile = {
              driver_id: u.id,
              vehicle_type: vehicleType || 'MOTORCYCLE',
              license_plate: licensePlate || 'M-1029',
              current_status: 'AVAILABLE',
              is_verified: true,
              battery_level: 95,
              rating: 4.95,
              last_location: 'POINT(-86.2650 12.1260)'
            };
          } else {
            if (vehicleType) u.driver_profile.vehicle_type = vehicleType;
            if (licensePlate) u.driver_profile.license_plate = licensePlate;
          }
        }
      }

      if (broadcastEvent) {
        broadcastEvent({
          type: 'PROFILE_UPDATED',
          userId,
          fullName: u?.full_name || fullName,
          phone: u?.phone || phone,
          address: u?.address || address
        });
      }

      sendJson(200, {
        success: true,
        message: 'Perfil actualizado exitosamente.',
        user: u ? serializeUserPublic(u) : null
      });
    } catch (err) {
      console.error('[Auth API] Error actualizando perfil:', err);
      sendJson(500, { success: false, error: 'Error al actualizar perfil.' });
    }
    return;
  }

  // ==========================================================================
  // 5. POST /api/auth/addresses - CRUD Completo de Libreta de Direcciones Múltiples
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/addresses') {
    try {
      const payload = await readBody();
      const {
        action = 'LIST', // 'LIST' | 'ADD' | 'UPDATE' | 'DELETE' | 'SET_DEFAULT'
        userId,
        addressId,
        addressData = {}
      } = payload;

      const u = localStore.users.find(x => x.id === userId);
      if (!u) {
        sendJson(404, { success: false, error: 'Usuario no encontrado para gestionar libreta de direcciones.' });
        return;
      }

      if (!Array.isArray(u.saved_addresses)) {
        u.saved_addresses = [];
      }

      if (action === 'LIST') {
        sendJson(200, {
          success: true,
          saved_addresses: u.saved_addresses,
          active_address: u.address,
          active_notes: u.notes,
          phone: u.phone
        });
        return;
      }

      if (action === 'ADD') {
        const iconMap = {
          'Casa': '🏠',
          'Oficina': '🏢',
          'Pareja / Familia': '❤️',
          'Universidad': '🎓',
          'Otro': '📍'
        };
        const label = (addressData.label || 'Casa').trim();
        const isFirst = u.saved_addresses.length === 0;
        const makeDefault = Boolean(addressData.is_default) || isFirst;

        if (makeDefault) {
          u.saved_addresses.forEach(a => { a.is_default = false; });
        }

        const newAddr = {
          id: `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          label,
          icon: addressData.icon || iconMap[label] || '📍',
          building_type: addressData.building_type || 'CASA',
          zone: addressData.zone || 'Managua',
          address: (addressData.address || 'Managua, Nicaragua').trim(),
          reference: (addressData.reference || '').trim(),
          recipient_phone: (addressData.recipient_phone || u.phone || '+505 8888-0000').trim(),
          lat: Number(addressData.lat) || 12.1022,
          lng: Number(addressData.lng) || -86.2415,
          is_default: makeDefault
        };

        u.saved_addresses.unshift(newAddr);

        if (makeDefault) {
          u.address = newAddr.address;
          u.notes = newAddr.reference;
        }

        sendJson(200, {
          success: true,
          message: 'Dirección agregada a tu libreta.',
          address: newAddr,
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      if (action === 'UPDATE') {
        const target = u.saved_addresses.find(a => a.id === addressId);
        if (!target) {
          sendJson(404, { success: false, error: 'Dirección no encontrada.' });
          return;
        }

        const iconMap = {
          'Casa': '🏠',
          'Oficina': '🏢',
          'Pareja / Familia': '❤️',
          'Universidad': '🎓',
          'Otro': '📍'
        };

        if (addressData.label !== undefined) {
          target.label = addressData.label.trim();
          target.icon = addressData.icon || iconMap[target.label] || target.icon || '📍';
        }
        if (addressData.building_type !== undefined) target.building_type = addressData.building_type;
        if (addressData.zone !== undefined) target.zone = addressData.zone;
        if (addressData.address !== undefined) target.address = addressData.address.trim();
        if (addressData.reference !== undefined) target.reference = addressData.reference.trim();
        if (addressData.recipient_phone !== undefined) target.recipient_phone = addressData.recipient_phone.trim();
        if (addressData.lat !== undefined) target.lat = Number(addressData.lat);
        if (addressData.lng !== undefined) target.lng = Number(addressData.lng);

        if (addressData.is_default) {
          u.saved_addresses.forEach(a => { a.is_default = (a.id === target.id); });
        }

        if (target.is_default) {
          u.address = target.address;
          u.notes = target.reference;
        }

        sendJson(200, {
          success: true,
          message: 'Dirección actualizada correctamente.',
          address: target,
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      if (action === 'DELETE') {
        const idx = u.saved_addresses.findIndex(a => a.id === addressId);
        if (idx === -1) {
          sendJson(404, { success: false, error: 'Dirección no encontrada.' });
          return;
        }
        const wasDefault = u.saved_addresses[idx].is_default;
        u.saved_addresses.splice(idx, 1);

        if (wasDefault && u.saved_addresses.length > 0) {
          u.saved_addresses[0].is_default = true;
          u.address = u.saved_addresses[0].address;
          u.notes = u.saved_addresses[0].reference;
        }

        sendJson(200, {
          success: true,
          message: 'Dirección eliminada.',
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      if (action === 'SET_DEFAULT') {
        const target = u.saved_addresses.find(a => a.id === addressId);
        if (!target) {
          sendJson(404, { success: false, error: 'Dirección no encontrada.' });
          return;
        }
        u.saved_addresses.forEach(a => { a.is_default = (a.id === addressId); });
        u.address = target.address;
        u.notes = target.reference;

        sendJson(200, {
          success: true,
          message: `Dirección "${target.label}" establecida como principal.`,
          address: target,
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      sendJson(400, { success: false, error: 'Acción de dirección no válida.' });
    } catch (err) {
      console.error('[Auth Addresses Error]', err);
      sendJson(500, { success: false, error: 'Error al procesar libreta de direcciones.' });
    }
    return;
  }

  // ==========================================================================
  // 6. POST /api/auth/recovery/initiate - Iniciar recuperación (EMAIL / SMS / SECURITY_QUESTION)
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/recovery/initiate') {
    try {
      const payload = await readBody();
      const { identifier, method = 'EMAIL' } = payload;

      if (!identifier || !String(identifier).trim()) {
        sendJson(400, { success: false, error: 'Ingresa tu correo electrónico o número de teléfono registrado.' });
        return;
      }

      const user = findUserByIdentifier(identifier);
      if (!user) {
        sendJson(404, {
          success: false,
          error: 'No encontramos ninguna cuenta asociada a ese correo o teléfono. Verifica los datos o regístrate.'
        });
        return;
      }

      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      localStore.recoveryTokens[user.id] = {
        code: otpCode,
        method,
        expiresAt: Date.now() + 10 * 60 * 1000
      };

      if (method === 'EMAIL') {
        const parts = (user.email || 'usuario@pedidosnica.com').split('@');
        const maskedEmail = `${parts[0].slice(0, 2)}***@${parts[1] || 'pedidosnica.com'}`;
        sendJson(200, {
          success: true,
          userId: user.id,
          fullName: user.full_name,
          method: 'EMAIL',
          maskedDestination: maskedEmail,
          demoOtpCode: otpCode,
          message: `Se ha enviado un código de verificación de 6 dígitos al correo ${maskedEmail}.`
        });
        return;
      }

      if (method === 'SMS') {
        const cleanPh = user.phone || '+505 8888-0000';
        const maskedPhone = cleanPh.length > 6
          ? `${cleanPh.slice(0, 4)} ****-${cleanPh.slice(-4)}`
          : cleanPh;
        sendJson(200, {
          success: true,
          userId: user.id,
          fullName: user.full_name,
          method: 'SMS',
          maskedDestination: maskedPhone,
          demoOtpCode: otpCode,
          message: `Se ha enviado un SMS con tu código de 6 dígitos al número ${maskedPhone}.`
        });
        return;
      }

      if (method === 'SECURITY_QUESTION') {
        sendJson(200, {
          success: true,
          userId: user.id,
          fullName: user.full_name,
          method: 'SECURITY_QUESTION',
          securityQuestion: user.security_question || '¿Cuál es tu comida nica favorita?',
          hint: 'Responde la pregunta de seguridad configurada en tu perfil.',
          message: 'Responde tu pregunta de seguridad para restablecer tu contraseña.'
        });
        return;
      }

      sendJson(400, { success: false, error: 'Método de recuperación no soportado.' });
    } catch (err) {
      console.error('[Auth Recovery Initiate Error]', err);
      sendJson(500, { success: false, error: 'Error al iniciar recuperación de contraseña.' });
    }
    return;
  }

  // ==========================================================================
  // 7. POST /api/auth/recovery/verify-and-reset - Verificar OTP o Pregunta y Cambiar Contraseña
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/recovery/verify-and-reset') {
    try {
      const payload = await readBody();
      const {
        userId,
        identifier,
        method = 'EMAIL',
        code,
        securityAnswer,
        newPassword
      } = payload;

      const user = userId
        ? localStore.users.find(u => u.id === userId)
        : findUserByIdentifier(identifier);

      if (!user) {
        sendJson(404, { success: false, error: 'Usuario no encontrado.' });
        return;
      }

      if (!newPassword || String(newPassword).trim().length < 6) {
        sendJson(400, { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }

      if (method === 'EMAIL' || method === 'SMS') {
        const tokenObj = localStore.recoveryTokens[user.id];
        if (!code || !String(code).trim()) {
          sendJson(400, { success: false, error: 'Ingresa el código de verificación de 6 dígitos.' });
          return;
        }
        const cleanCode = String(code).trim();
        if (!tokenObj || tokenObj.code !== cleanCode) {
          sendJson(401, {
            success: false,
            error: 'El código de verificación ingresado es incorrecto o ha expirado.'
          });
          return;
        }
        delete localStore.recoveryTokens[user.id];
      } else if (method === 'SECURITY_QUESTION') {
        if (!securityAnswer || !String(securityAnswer).trim()) {
          sendJson(400, { success: false, error: 'Ingresa la respuesta a tu pregunta de seguridad.' });
          return;
        }
        const given = normalizeAnswer(securityAnswer);
        const expected = normalizeAnswer(user.security_answer || 'gallo pinto');
        if (given !== expected) {
          sendJson(401, {
            success: false,
            error: 'La respuesta a la pregunta de seguridad no coincide con nuestros registros.'
          });
          return;
        }
      } else {
        sendJson(400, { success: false, error: 'Método de verificación inválido.' });
        return;
      }

      user.password = String(newPassword).trim();

      if (broadcastEvent) {
        broadcastEvent({ type: 'PASSWORD_RESET_COMPLETED', userId: user.id, method });
      }

      sendJson(200, {
        success: true,
        message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes usar tu cuenta.',
        user: serializeUserPublic(user)
      });
    } catch (err) {
      console.error('[Auth Recovery Reset Error]', err);
      sendJson(500, { success: false, error: 'Error al restablecer la contraseña.' });
    }
    return;
  }

  // ==========================================================================
  // 8. POST /api/auth/admin/user-action - Gestión Avanzada de Usuarios desde el Hub
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/admin/user-action') {
    try {
      const payload = await readBody();
      const {
        action, // 'UPDATE_USER' | 'SET_STATUS' | 'DELETE' | 'RESET_PASSWORD'
        userId,
        full_name,
        email,
        phone,
        password,
        address,
        notes,
        security_question,
        security_answer,
        saved_addresses,
        role,
        subrole,
        account_status,
        restaurant_id,
        restaurant_name,
        is_multi_management,
        authorized_restaurants,
        vehicle_type,
        license_plate,
        is_verified
      } = payload;

      if (!userId || !action) {
        sendJson(400, { success: false, error: 'Faltan parámetros userId o action.' });
        return;
      }

      const idx = localStore.users.findIndex(x => x.id === userId);
      if (idx === -1) {
        sendJson(404, { success: false, error: 'Usuario no encontrado.' });
        return;
      }

      if (action === 'DELETE') {
        localStore.users.splice(idx, 1);
        sendJson(200, { success: true, message: 'Usuario eliminado correctamente.' });
        return;
      }

      const u = localStore.users[idx];

      if (action === 'RESET_PASSWORD') {
        if (!password || String(password).trim().length < 4) {
          sendJson(400, { success: false, error: 'Ingresa una nueva contraseña válida.' });
          return;
        }
        u.password = String(password).trim();
        sendJson(200, { success: true, message: `Contraseña de ${u.full_name} actualizada correctamente.` });
        return;
      }

      if (action === 'SET_STATUS') {
        u.account_status = account_status || 'ACTIVE';
        if (u.driver_profile) {
          u.driver_profile.is_verified = u.account_status === 'ACTIVE';
          if (u.account_status !== 'ACTIVE') {
            u.driver_profile.current_status = 'OFFLINE';
          }
        }
        if (broadcastEvent) {
          broadcastEvent({ type: 'USER_STATUS_UPDATED', userId, account_status: u.account_status });
        }
        sendJson(200, { success: true, message: `Estado de cuenta actualizado a ${u.account_status}.` });
        return;
      }

      if (action === 'UPDATE_USER') {
        if (full_name) u.full_name = full_name.trim();
        if (email) u.email = email.trim().toLowerCase();
        if (phone) u.phone = phone.trim();
        if (password && String(password).trim()) u.password = String(password).trim();
        if (address !== undefined) u.address = address;
        if (notes !== undefined) u.notes = notes;
        if (security_question !== undefined && String(security_question).trim()) u.security_question = String(security_question).trim();
        if (security_answer !== undefined && String(security_answer).trim()) u.security_answer = String(security_answer).trim();
        if (Array.isArray(saved_addresses)) u.saved_addresses = saved_addresses;
        if (role) u.role = role;
        if (subrole) u.subrole = subrole;
        if (account_status) u.account_status = account_status;
        if (restaurant_id !== undefined) u.restaurant_id = restaurant_id;
        if (restaurant_name !== undefined) u.restaurant_name = restaurant_name;
        if (is_multi_management !== undefined) u.is_multi_management = Boolean(is_multi_management);
        if (authorized_restaurants !== undefined) u.authorized_restaurants = authorized_restaurants;

        if (u.role === 'DRIVER' || vehicle_type || license_plate) {
          if (!u.driver_profile) {
            u.driver_profile = {
              driver_id: u.id,
              vehicle_type: vehicle_type || 'MOTORCYCLE',
              license_plate: license_plate || 'M-1029',
              current_status: 'AVAILABLE',
              is_verified: is_verified !== undefined ? Boolean(is_verified) : true,
              battery_level: 95,
              rating: 5.0,
              last_location: 'POINT(-86.2650 12.1260)'
            };
          } else {
            if (vehicleType || vehicle_type) u.driver_profile.vehicle_type = vehicle_type;
            if (licensePlate || license_plate) u.driver_profile.license_plate = license_plate;
            if (is_verified !== undefined) u.driver_profile.is_verified = Boolean(is_verified);
          }
        }

        if (broadcastEvent) {
          broadcastEvent({ type: 'USER_UPDATED', userId });
        }

        sendJson(200, { success: true, message: 'Usuario y permisos actualizados correctamente.', user: u });
        return;
      }

      sendJson(400, { success: false, error: 'Acción no reconocida.' });
    } catch (err) {
      console.error('[Auth Admin Action Error]', err);
      sendJson(500, { success: false, error: 'Error al ejecutar acción administrativa.' });
    }
    return;
  }

  // ==========================================================================
  // 9. POST /api/restaurant/settings - Editar datos del restaurante
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/restaurant/settings') {
    try {
      const payload = await readBody();
      const requesterSubrole = payload.requesterSubrole || payload.subrole || 'ADMIN';
      const targetRestId = payload.restaurantId || payload.restaurant_id || '6701bc0c-e5ce-475a-8893-75e9d06e8012';
      const name = payload.name;
      const phone = payload.phone;
      const address = payload.address;
      const openingHours = payload.openingHours || payload.opening_hours;
      const prepTimeMinutes = payload.prepTimeMinutes || payload.estimated_prep_time_minutes;
      const deliveryRadiusKm = payload.deliveryRadiusKm || payload.delivery_radius_km;
      const logoUrl = payload.logoUrl || payload.logo_url;

      if (requesterSubrole === 'STAFF') {
        sendJson(403, {
          success: false,
          error: '🔒 Permiso denegado: Tu usuario es Operador de Cocina. Solo los Administradores del Restaurante pueden modificar la información y configuración del negocio.'
        });
        return;
      }

      const rest = localStore.restaurants.find(r => r.id === targetRestId);
      if (rest) {
        if (name) rest.name = name;
        if (phone) rest.phone = phone;
        if (address) rest.address = address;
        if (openingHours) rest.opening_hours = openingHours;
        if (prepTimeMinutes !== undefined) rest.estimated_prep_time_minutes = parseInt(prepTimeMinutes) || 20;
        if (deliveryRadiusKm !== undefined) rest.delivery_radius_km = parseFloat(deliveryRadiusKm) || 5.0;
        if (logoUrl) rest.logo_url = logoUrl;
      }

      if (broadcastEvent) {
        broadcastEvent({
          type: 'RESTAURANT_SETTINGS_UPDATED',
          restaurantId: targetRestId,
          updates: rest
        });
      }

      sendJson(200, {
        success: true,
        message: 'Configuración del restaurante actualizada correctamente.',
        restaurant: rest || null
      });
    } catch (err) {
      console.error('[Restaurant Settings API] Error:', err);
      sendJson(500, { success: false, error: 'Error al actualizar información del restaurante.' });
    }
    return;
  }

  sendJson(404, { success: false, error: 'Ruta Auth API no encontrada' });
}

module.exports = {
  handleAuthApi
};

  };

  __modules['clientApi'] = function(module, exports, require) {
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

  };

  __modules['driverApi'] = function(module, exports, require) {
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

  };

  __modules['restaurantApi'] = function(module, exports, require) {
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

  };

  const localStore = __require('./localStore');
  const { handleAuthApi } = __require('./authApi');
  const { handleClientApi } = __require('./clientApi');
  const { handleDriverApi } = __require('./driverApi');
  const { handleRestaurantApi } = __require('./restaurantApi');

  // Persistencia automática en localStorage del teléfono
  const STORAGE_KEY = 'pn_embedded_store_v2';
  try {
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    if (savedRaw) {
      const saved = JSON.parse(savedRaw);
      ['restaurants', 'users', 'products', 'orders', 'reviews'].forEach(k => {
        if (Array.isArray(saved[k]) && saved[k].length > 0 && Array.isArray(localStore[k])) {
          localStore[k].splice(0, localStore[k].length, ...saved[k]);
        }
      });
    }
  } catch (_) {}

  function persistLocalStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        restaurants: localStore.restaurants,
        users: localStore.users,
        products: localStore.products,
        orders: localStore.orders,
        reviews: localStore.reviews
      }));
    } catch (_) {}
  }

  // EventBus local para simular Server-Sent Events (/api/live-stream)
  const sseListeners = new Set();
  function broadcastEvent(typeOrObj, payload) {
    persistLocalStore();
    let eventData;
    if (typeof typeOrObj === 'object' && typeOrObj !== null) {
      eventData = Object.assign({}, typeOrObj, { timestamp: Date.now() });
    } else {
      eventData = { type: typeOrObj, payload: payload, timestamp: Date.now() };
    }
    const str = JSON.stringify(eventData);
    sseListeners.forEach(fn => {
      try { fn({ data: str }); } catch (_) {}
    });
  }

  // Mock de EventSource para /api/live-stream cuando corre en modo local
  const NativeEventSource = window.EventSource;
  window.EventSource = function(url) {
    if (typeof url === 'string' && url.includes('/api/live-stream')) {
      if (lanServerOnline && NativeEventSource) {
        try {
          return new NativeEventSource(LAN_SERVER + '/api/live-stream');
        } catch (_) {}
      }
      const instance = {
        onmessage: null,
        onerror: null,
        addEventListener: function(type, handler) {
          if (type === 'message') sseListeners.add(handler);
        },
        close: function() {
          if (instance._wrapped) sseListeners.delete(instance._wrapped);
        }
      };
      instance._wrapped = function(ev) {
        if (typeof instance.onmessage === 'function') instance.onmessage(ev);
      };
      sseListeners.add(instance._wrapped);
      return instance;
    }
    return NativeEventSource ? new NativeEventSource(url) : {};
  };

  // Interceptor inteligente de window.fetch
  let inEmbeddedHandler = false;
  window.fetch = async function(input, init) {
    const rawUrl = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));

    // Si estamos dentro del handler local y éste intenta llamar a Supabase caído o localhost:4000, rechazar en 0ms para usar localStore
    if (inEmbeddedHandler && (rawUrl.includes('zciujeihkvleehhqbeat.supabase.co') || rawUrl.includes('localhost:4000'))) {
      throw new Error('Embedded local mode bypass');
    }

    // Detectar si es una llamada a /api/...
    let apiPath = null;
    if (rawUrl.startsWith('/api/')) {
      apiPath = rawUrl;
    } else if (rawUrl.startsWith('file:///api/')) {
      apiPath = rawUrl.replace('file://', '');
    }

    if (!apiPath) {
      return nativeFetch(input, init);
    }

    // 1. Si el servidor LAN de la PC está alcanzable en la misma red Wi-Fi, sincronizar con él
    if (lanServerOnline) {
      try {
        const lanRes = await nativeFetch(LAN_SERVER + apiPath, init);
        if (lanRes && lanRes.ok) {
          return lanRes;
        }
      } catch (_) {
        lanServerOnline = false;
      }
    }

    // 2. Ejecutar el endpoint /api/... 100% localmente dentro del APK
    const method = (init && init.method ? init.method : 'GET').toUpperCase();
    const bodyText = init && init.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : '';
    const cleanUrl = apiPath.split('?')[0];

    return new Promise(async (resolve) => {
      let statusCode = 200;
      let resHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
      const dataListeners = [];
      const endListeners = [];

      const reqMock = {
        method: method,
        url: apiPath,
        headers: (init && init.headers) || {},
        on: function(event, cb) {
          if (event === 'data') dataListeners.push(cb);
          if (event === 'end') endListeners.push(cb);
          return reqMock;
        }
      };

      let finished = false;
      const resMock = {
        writeHead: function(code, headers) {
          statusCode = code || 200;
          if (headers) Object.assign(resHeaders, headers);
        },
        setHeader: function(k, v) {
          resHeaders[k] = v;
        },
        end: function(payload) {
          if (finished) return;
          finished = true;
          persistLocalStore();
          const outStr = typeof payload === 'string' ? payload : (payload ? String(payload) : '{}');
          resolve(new Response(outStr, { status: statusCode, headers: resHeaders }));
        }
      };

      setTimeout(() => {
        if (bodyText) {
          dataListeners.forEach(fn => fn(bodyText));
        }
        endListeners.forEach(fn => fn());
      }, 0);

      const opts = {
        SUPABASE_URL: 'https://zciujeihkvleehhqbeat.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: '',
        currentCommissionRate: 15.0,
        broadcastEvent: broadcastEvent
      };

      inEmbeddedHandler = true;
      try {
        if (cleanUrl.startsWith('/api/auth/') || cleanUrl === '/api/restaurant/settings') {
          await handleAuthApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl.startsWith('/api/client/')) {
          await handleClientApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl.startsWith('/api/driver/')) {
          await handleDriverApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl.startsWith('/api/restaurant/')) {
          await handleRestaurantApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl === '/api/network-info') {
          resMock.end(JSON.stringify({ lanIp: '192.168.1.20', port: 3000, lanBaseUrl: LAN_SERVER }));
        } else {
          resMock.end(JSON.stringify({ ok: true }));
        }
      } catch (err) {
        if (!finished) {
          resMock.writeHead(500);
          resMock.end(JSON.stringify({ error: err.message || 'Internal Embedded Error' }));
        }
      } finally {
        inEmbeddedHandler = false;
      }
    });
  };

  // Interceptor de navegación para que enlaces internos funcionen entre archivos .html del APK
  const ROUTE_MAP = {
    '/client': 'client.html',
    '/order': 'client.html',
    '/client/tracking': 'client-tracking.html',
    '/driver': 'driver.html',
    '/driver/app': 'driver.html',
    '/restaurant': 'restaurant.html',
    '/restaurant/orders': 'restaurant.html',
    '/restaurant/kds': 'restaurant.html',
    '/restaurant/menu': 'restaurant-menu.html',
    '/restaurant/finances': 'restaurant-finances.html',
    '/restaurant/reviews': 'restaurant-reviews.html',
    '/restaurant/settings': 'restaurant-settings.html',
    '/restaurant/onboard': 'restaurant-onboard.html'
  };

  document.addEventListener('click', function(e) {
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    const cleanHref = href.split('?')[0];
    if (ROUTE_MAP[cleanHref]) {
      e.preventDefault();
      const query = href.includes('?') ? ('?' + href.split('?')[1]) : '';
      window.location.href = ROUTE_MAP[cleanHref] + query;
    }
  }, true);
})();
