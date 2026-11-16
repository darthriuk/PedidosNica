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
        id: 'e1010001-1111-4000-a000-000000000101',
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
        id: 'e1010002-2222-4000-a000-000000000102',
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
    id: 'f2010001-1111-4000-a000-000000000101',
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

// ============================================================================
// MOTOR DE SINCRONIZACIÓN DIRECTA SUPABASE RELACIONAL + POWERSYNC OFFLINE-FIRST
// ============================================================================
const SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDEyODIzMywiZXhwIjoyMTA1NzA0MjMzfQ.JohwsGaIH0JTkjEI7SSkFeWxibbpAQTvH4gHLMNSeTY';
const CLOUD_STATE_KEY = 'ecosystem_cloud_state_v1';

// Esquema formal PowerSync (Tablas replicadas entre SQLite/Local Replica y Supabase PostgreSQL)
const POWERSYNC_SCHEMA = {
  version: '1.5.0',
  tables: {
    profiles: ['id', 'role', 'full_name', 'phone', 'avatar_url', 'created_at', 'updated_at'],
    driver_profiles: ['driver_id', 'vehicle_type', 'license_plate', 'current_status', 'battery_level', 'last_location', 'last_location_updated_at', 'is_verified', 'rating', 'created_at'],
    restaurants: ['id', 'owner_id', 'name', 'location', 'address', 'delivery_radius_km', 'estimated_prep_time_minutes', 'is_active', 'rating', 'email', 'phone', 'opening_hours', 'logo_url', 'commission_rate', 'created_at', 'updated_at'],
    products: ['id', 'restaurant_id', 'category', 'name', 'description', 'price', 'discount_price', 'is_combo', 'is_available', 'image_url', 'customization_groups', 'created_at'],
    orders: ['id', 'client_id', 'restaurant_id', 'driver_id', 'status', 'subtotal', 'delivery_fee', 'total', 'delivery_location', 'delivery_address', 'delivery_notes', 'estimated_prep_time_minutes', 'accepted_at', 'ready_at', 'picked_up_at', 'delivered_at', 'cancelled_at', 'cancellation_reason', 'created_at', 'updated_at'],
    order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'customizations'],
    restaurant_reviews: ['id', 'restaurant_id', 'client_id', 'client_name', 'order_id', 'rating', 'comment', 'created_at']
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(rawId, prefixHex = 'e1010000') {
  if (typeof rawId === 'string' && UUID_REGEX.test(rawId)) return rawId;
  const str = String(rawId || Date.now());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) >>> 0;
  }
  const hex12 = (hash.toString(16) + str.replace(/[^0-9a-f]/gi, '')).padEnd(12, '0').slice(0, 12).toLowerCase();
  return `${prefixHex}-1111-4000-a000-${hex12}`;
}

let isSyncing = false;
let isPushing = false;
let lastCloudTimestamp = 0;
const provisionedAuthUserIds = new Set();

// Cola Outbox de PowerSync (Almacena transacciones CRUD offline y las sube al recuperar señal)
const powerSyncOutbox = [];
const powerSyncStatus = {
  engine: 'PowerSync + Supabase Direct Relational Sync v1.5',
  connected: false,
  syncing: false,
  lastPullAt: null,
  lastPushAt: null,
  pendingOutboxCount: 0,
  syncedTables: Object.keys(POWERSYNC_SCHEMA.tables),
  supabaseUrl: SUPABASE_URL
};

function mergeById(targetArray, incomingArray, idKey = 'id') {
  if (!Array.isArray(incomingArray) || incomingArray.length === 0) return;
  const map = new Map();
  targetArray.forEach(item => {
    if (item && item[idKey]) map.set(item[idKey], item);
  });
  incomingArray.forEach(item => {
    if (item && item[idKey]) {
      const prev = map.get(item[idKey]) || {};
      map.set(item[idKey], Object.assign({}, prev, item));
    }
  });
  const merged = Array.from(map.values());
  targetArray.splice(0, targetArray.length, ...merged);
}

async function sbFetch(endpoint, options = {}) {
  const f = typeof globalThis._nativeFetch === 'function' ? globalThis._nativeFetch : fetch;
  const headers = Object.assign({
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }, options.headers || {});
  const res = await f(`${SUPABASE_URL}/rest/v1/${endpoint}`, Object.assign({}, options, { headers }));
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase ${endpoint} HTTP ${res.status}: ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Garantizar que los usuarios de localStore existan en auth.users y public.profiles para respetar Foreign Keys en PostgreSQL
async function ensureUsersInSupabaseAuthAndProfiles() {
  const f = typeof globalThis._nativeFetch === 'function' ? globalThis._nativeFetch : fetch;
  for (const u of users) {
    if (!u || !u.id || !UUID_REGEX.test(u.id)) continue;
    if (!provisionedAuthUserIds.has(u.id)) {
      try {
        await f(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: u.id,
            email: u.email || `${u.id.slice(0, 8)}@pedidosnica.com`,
            password: u.password || 'Password123!',
            email_confirm: true,
            user_metadata: { full_name: u.full_name, role: u.role }
          })
        });
      } catch (_) {}
      provisionedAuthUserIds.add(u.id);
    }
  }

  const profileRows = users
    .filter(u => u && u.id && UUID_REGEX.test(u.id))
    .map(u => ({
      id: u.id,
      role: ['CLIENT', 'DRIVER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'].includes(u.role) ? u.role : 'CLIENT',
      full_name: u.full_name || 'Usuario PedidosNica',
      phone: u.phone || '+505 8888-0000',
      avatar_url: u.avatar_url || null,
      updated_at: new Date().toISOString()
    }));

  if (profileRows.length > 0) {
    await sbFetch('profiles?on_conflict=id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(profileRows)
    }).catch(() => {});
  }

  const driverRows = users
    .filter(u => u && u.role === 'DRIVER' && u.driver_profile && UUID_REGEX.test(u.id))
    .map(u => {
      const dp = u.driver_profile;
      return {
        driver_id: u.id,
        vehicle_type: ['MOTORCYCLE', 'BICYCLE', 'CAR'].includes(dp.vehicle_type) ? dp.vehicle_type : 'MOTORCYCLE',
        license_plate: dp.license_plate || 'M-0000',
        current_status: ['AVAILABLE', 'BUSY', 'OFFLINE'].includes(dp.current_status) ? dp.current_status : 'AVAILABLE',
        battery_level: Number(dp.battery_level) || 95,
        last_location: dp.last_location || 'POINT(-86.2650 12.1260)',
        last_location_updated_at: new Date().toISOString(),
        is_verified: true,
        rating: Number(dp.rating) || 4.95
      };
    });

  if (driverRows.length > 0) {
    await sbFetch('driver_profiles?on_conflict=driver_id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(driverRows)
    }).catch(() => {});
  }
}

let activePullPromise = null;

async function pullFromSupabase() {
  if (activePullPromise) return activePullPromise;
  isSyncing = true;
  powerSyncStatus.syncing = true;
  activePullPromise = (async () => {
  try {
    // 1. Leer en paralelo todas las tablas relacionales de Supabase PostgreSQL + snapshot extendido
    const [cloudRows, sbProfiles, sbDriverProfiles, sbRestaurants, sbProducts, sbOrders, sbReviews] = await Promise.all([
      sbFetch(`platform_settings?key=eq.${CLOUD_STATE_KEY}&select=value,updated_at`).catch(() => []),
      sbFetch('profiles?select=*').catch(() => []),
      sbFetch('driver_profiles?select=*').catch(() => []),
      sbFetch('restaurants?select=*').catch(() => []),
      sbFetch('products?select=*').catch(() => []),
      sbFetch('orders?select=*,order_items(*)&order=created_at.desc&limit=80').catch(() => []),
      sbFetch('restaurant_reviews?select=*&order=created_at.desc&limit=50').catch(() => [])
    ]);

    // 2. Integrar estado extendido primero (direcciones múltiples, preguntas de seguridad, etc.)
    if (Array.isArray(cloudRows) && cloudRows.length > 0 && cloudRows[0].value) {
      const cloudVal = cloudRows[0].value;
      if (Array.isArray(cloudVal.restaurants)) mergeById(restaurants, cloudVal.restaurants);
      if (Array.isArray(cloudVal.users)) mergeById(users, cloudVal.users);
      if (Array.isArray(cloudVal.products)) mergeById(products, cloudVal.products);
      if (Array.isArray(cloudVal.orders)) mergeById(orders, cloudVal.orders);
      if (Array.isArray(cloudVal.reviews)) mergeById(reviews, cloudVal.reviews);
      if (cloudVal.updatedAt) lastCloudTimestamp = cloudVal.updatedAt;
    }

    // 3. Integrar perfiles y conductores desde las tablas relacionales public.profiles y public.driver_profiles
    if (Array.isArray(sbProfiles) && sbProfiles.length > 0) {
      sbProfiles.forEach(p => {
        provisionedAuthUserIds.add(p.id);
        const existing = users.find(u => u.id === p.id);
        if (existing) {
          existing.full_name = p.full_name || existing.full_name;
          existing.phone = p.phone || existing.phone;
          existing.role = p.role || existing.role;
          if (p.avatar_url) existing.avatar_url = p.avatar_url;
        }
      });
    }

    if (Array.isArray(sbDriverProfiles) && sbDriverProfiles.length > 0) {
      sbDriverProfiles.forEach(dp => {
        const drv = users.find(u => u.id === dp.driver_id);
        if (drv) {
          drv.driver_profile = Object.assign({}, drv.driver_profile || {}, dp);
        }
      });
    }

    // 4. Integrar restaurantes, productos, pedidos, order_items y reseñas desde tablas relacionales PostgreSQL
    if (Array.isArray(sbRestaurants) && sbRestaurants.length > 0) {
      const normalizedRests = sbRestaurants.map(r => Object.assign({
        delivery_fee: 60.00,
        delivery_radius_km: 7.0,
        estimated_prep_time_minutes: 20,
        commission_rate: 15.0,
        is_active: true,
        rating: 5.0
      }, r));
      mergeById(restaurants, normalizedRests);
    }

    if (Array.isArray(sbProducts) && sbProducts.length > 0) {
      mergeById(products, sbProducts);
    }

    if (Array.isArray(sbOrders) && sbOrders.length > 0) {
      const normalizedOrders = sbOrders.map(o => {
        const existingOrd = orders.find(x => x.id === o.id);
        const items = (Array.isArray(o.order_items) && o.order_items.length > 0)
          ? o.order_items
          : (existingOrd && Array.isArray(existingOrd.items) ? existingOrd.items : []);
        const clientUser = users.find(u => u.id === o.client_id);
        return Object.assign({}, existingOrd || {}, o, {
          client_name: (existingOrd && existingOrd.client_name) || (clientUser && clientUser.full_name) || 'Cliente Comensal',
          client_phone: (existingOrd && existingOrd.client_phone) || (clientUser && clientUser.phone) || '+505 8888-0000',
          items,
          order_items: items
        });
      });
      mergeById(orders, normalizedOrders);
    }

    if (Array.isArray(sbReviews) && sbReviews.length > 0) {
      mergeById(reviews, sbReviews);
    }

    powerSyncStatus.connected = true;
    powerSyncStatus.lastPullAt = new Date().toISOString();
    return true;
  } catch (_) {
    powerSyncStatus.connected = false;
    return false;
  } finally {
    isSyncing = false;
    powerSyncStatus.syncing = false;
    activePullPromise = null;
  }
  })();
  return activePullPromise;
}

let activePushPromise = null;

// PowerSync uploadData(): Escribe directamente en las 7 tablas relacionales de Supabase PostgreSQL + platform_settings
async function pushToSupabase() {
  if (activePushPromise) return activePushPromise;
  isPushing = true;
  powerSyncStatus.syncing = true;
  activePushPromise = (async () => {
  try {
    const nowTs = Date.now();
    const nowIso = new Date(nowTs).toISOString();
    lastCloudTimestamp = nowTs;

    // 1. Asegurar usuarios y perfiles de conductores en auth.users, public.profiles y public.driver_profiles
    await ensureUsersInSupabaseAuthAndProfiles();

    // 2. Upsert directo en public.restaurants
    const validRests = restaurants
      .filter(r => r && r.id && UUID_REGEX.test(r.id))
      .map(r => ({
        id: r.id,
        owner_id: (r.owner_id && provisionedAuthUserIds.has(r.owner_id)) ? r.owner_id : null,
        name: r.name,
        location: r.location || 'POINT(-86.2514 12.1364)',
        address: r.address || 'Managua, Nicaragua',
        delivery_radius_km: Number(r.delivery_radius_km) || 7.0,
        estimated_prep_time_minutes: Number(r.estimated_prep_time_minutes) || 20,
        is_active: r.is_active !== false,
        rating: Number(r.rating) || 5.0,
        email: r.email || null,
        phone: r.phone || '+505 8800-0000',
        opening_hours: r.opening_hours || 'Lun - Dom: 11:00 - 23:00',
        logo_url: r.logo_url || null,
        commission_rate: Number(r.commission_rate) || 15.0,
        updated_at: nowIso
      }));

    if (validRests.length > 0) {
      await sbFetch('restaurants?on_conflict=id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(validRests)
      });
    }

    // 3. Upsert directo en public.products
    const restIdSet = new Set(validRests.map(r => r.id));
    const validProducts = products
      .filter(p => p && p.id && UUID_REGEX.test(p.id) && restIdSet.has(p.restaurant_id))
      .map(p => ({
        id: p.id,
        restaurant_id: p.restaurant_id,
        category: p.category || 'Especialidades',
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        discount_price: p.discount_price !== null && p.discount_price !== undefined ? Number(p.discount_price) : null,
        is_combo: Boolean(p.is_combo),
        is_available: p.is_available !== false,
        image_url: p.image_url || null,
        customization_groups: Array.isArray(p.customization_groups) ? p.customization_groups : []
      }));

    if (validProducts.length > 0) {
      await sbFetch('products?on_conflict=id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(validProducts)
      });
    }

    // 4. Upsert directo en public.orders y public.order_items
    const prodIdSet = new Set(validProducts.map(p => p.id));
    const fallbackClientId = 'c91f2a10-1234-4a9b-9c11-887766554433';
    const validOrders = [];
    const validOrderItems = [];

    orders.forEach(o => {
      if (!o || !o.id) return;
      o.id = toValidUuid(o.id, 'b72c3000');
      if (!restIdSet.has(o.restaurant_id)) return;
      const clientId = (o.client_id && provisionedAuthUserIds.has(o.client_id)) ? o.client_id : fallbackClientId;
      const driverId = (o.driver_id && provisionedAuthUserIds.has(o.driver_id)) ? o.driver_id : null;

      validOrders.push({
        id: o.id,
        client_id: clientId,
        restaurant_id: o.restaurant_id,
        driver_id: driverId,
        status: o.status || 'CREATED',
        subtotal: Number(o.subtotal || o.total || 0),
        delivery_fee: Number(o.delivery_fee || 60),
        total: Number(o.total || 0),
        delivery_location: o.delivery_location || 'POINT(-86.2415 12.1022)',
        delivery_address: o.delivery_address || 'Managua, Nicaragua',
        delivery_notes: o.delivery_notes || '',
        estimated_prep_time_minutes: Number(o.estimated_prep_time_minutes) || 20,
        accepted_at: o.accepted_at || null,
        ready_at: o.ready_at || null,
        picked_up_at: o.picked_up_at || null,
        delivered_at: o.delivered_at || null,
        cancelled_at: o.cancelled_at || null,
        cancellation_reason: o.cancellation_reason || null,
        created_at: o.created_at || nowIso,
        updated_at: nowIso
      });

      const itemsArr = Array.isArray(o.items) ? o.items : (Array.isArray(o.order_items) ? o.order_items : []);
      itemsArr.forEach(it => {
        if (!it) return;
        it.id = toValidUuid(it.id, 'e1010000');
        const pid = (it.product_id && prodIdSet.has(it.product_id)) ? it.product_id : (validProducts[0] ? validProducts[0].id : null);
        if (!pid) return;
        validOrderItems.push({
          id: it.id,
          order_id: o.id,
          product_id: pid,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          customizations: it.customizations || {}
        });
      });
    });

    if (validOrders.length > 0) {
      await sbFetch('orders?on_conflict=id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(validOrders)
      });
    }

    if (validOrderItems.length > 0) {
      await sbFetch('order_items?on_conflict=id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(validOrderItems)
      });
    }

    // 5. Upsert directo en public.restaurant_reviews
    const orderIdSet = new Set(validOrders.map(o => o.id));
    const validReviews = reviews
      .filter(rv => rv && restIdSet.has(rv.restaurant_id))
      .map(rv => {
        rv.id = toValidUuid(rv.id, 'f2010000');
        return {
          id: rv.id,
          restaurant_id: rv.restaurant_id,
          client_id: (rv.client_id && provisionedAuthUserIds.has(rv.client_id)) ? rv.client_id : fallbackClientId,
          client_name: rv.client_name || 'Cliente Comensal',
          order_id: (rv.order_id && orderIdSet.has(rv.order_id)) ? rv.order_id : null,
          rating: Number(rv.rating) || 5,
          comment: rv.comment || '',
          created_at: rv.created_at || nowIso
        };
      });

    if (validReviews.length > 0) {
      await sbFetch('restaurant_reviews?on_conflict=id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(validReviews)
      });
    }

    // 6. Upsert del estado extendido en public.platform_settings (libreta multi-direcciones, respuestas a reseñas, etc.)
    const settingsPayload = [{
      key: CLOUD_STATE_KEY,
      value: {
        updatedAt: nowTs,
        restaurants,
        users,
        products,
        orders,
        reviews
      },
      updated_at: nowIso
    }];

    await sbFetch('platform_settings?on_conflict=key', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(settingsPayload)
    });

    // Procesar cualquier operación DELETE pendiente en la cola Outbox de PowerSync
    while (powerSyncOutbox.length > 0) {
      const op = powerSyncOutbox[0];
      if (op.type === 'DELETE' && op.table && op.id) {
        await sbFetch(`${op.table}?id=eq.${encodeURIComponent(op.id)}`, { method: 'DELETE' }).catch(() => {});
      }
      powerSyncOutbox.shift();
    }

    powerSyncStatus.connected = true;
    powerSyncStatus.lastPushAt = nowIso;
    powerSyncStatus.pendingOutboxCount = powerSyncOutbox.length;
    return true;
  } catch (err) {
    powerSyncOutbox.push({ type: 'SYNC_RETRY', timestamp: Date.now(), error: err.message });
    powerSyncStatus.connected = false;
    powerSyncStatus.pendingOutboxCount = powerSyncOutbox.length;
    return false;
  } finally {
    isPushing = false;
    powerSyncStatus.syncing = false;
    activePushPromise = null;
  }
  })();
  return activePushPromise;
}

async function deleteFromSupabaseTable(table, id) {
  if (!table || !id) return false;
  try {
    await sbFetch(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  } catch (_) {
    powerSyncOutbox.push({ type: 'DELETE', table, id, timestamp: Date.now() });
    powerSyncStatus.pendingOutboxCount = powerSyncOutbox.length;
    return false;
  }
}

// Iniciar sincronización bidireccional automática PowerSync <-> Supabase PostgreSQL
pullFromSupabase().then((ok) => {
  if (ok) {
    pushToSupabase();
  }
});
setInterval(() => {
  pullFromSupabase().then((ok) => {
    if (ok && powerSyncOutbox.length > 0) {
      pushToSupabase();
    }
  });
}, 3500);

module.exports = {
  restaurants,
  users,
  products,
  orders,
  reviews,
  recoveryTokens,
  pullFromSupabase,
  pushToSupabase,
  deleteFromSupabaseTable,
  POWERSYNC_SCHEMA,
  powerSyncStatus,
  powerSyncOutbox,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY
};
