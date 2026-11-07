// Configuración de Supabase y comisiones para el cliente
const SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';
const COMMISSION_RATE = 15.0;

let supabaseClient = null;
try {
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
} catch (e) {
  console.warn('Supabase client offline fallback active');
}

    // ESTADO GENERAL
    let currentTab = (document.getElementById('restaurantAppRoot') && document.getElementById('restaurantAppRoot').dataset.initialTab) || 'kds';
    let kdsSubView = 'active'; // 'active' | 'history'
    let storeStatus = 'OPEN'; // 'OPEN' | 'BUSY' | 'CLOSED'
    let basePrepMinutes = 25;
    let isMuted = false;
    let audioCtx = null;
    let soundInterval = null;

    // PEDIDOS (Datos en memoria enriquecidos con fallback para offline / test instantáneo)
    let orders = [
      {
        id: 'ord-81a2',
        status: 'CREATED',
        client_name: 'Mateo Blandón',
        phone: '+505 8711-2299',
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
        delivery_notes: 'Dejar en portería de edificio',
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
        driver: null,
        items: [
          { name: 'Burger Bacon Crispy', quantity: 2, unit_price: 9.00, options: ['+ Doble Panceta (+$2.50)'] },
          { name: 'Postre Tiramisú Clásico', quantity: 1, unit_price: 4.50, options: [] }
        ]
      },
      {
        id: 'ord-72c3',
        status: 'DELIVERED',
        client_name: 'Sofía Martínez',
        phone: '+54 9 11 1122-3344',
        delivery_address: 'Av. Corrientes 1820',
        delivery_notes: 'Entregado en mano',
        subtotal: 14.00,
        delivery_fee: 2.00,
        total: 16.00,
        created_at: new Date(Date.now() - 80 * 60000).toISOString(),
        delivered_at: new Date(Date.now() - 40 * 60000).toISOString(),
        estimated_prep_minutes: 18,
        items: [
          { name: 'Pizza Napolitana Mediana', quantity: 1, unit_price: 14.00, options: [] }
        ]
      },
      {
        id: 'ord-19d4',
        status: 'CANCELLED',
        client_name: 'Gonzalo Pérez',
        phone: '+54 9 11 7788-9900',
        delivery_address: 'Billinghurst 900',
        subtotal: 22.00,
        delivery_fee: 2.00,
        total: 24.00,
        created_at: new Date(Date.now() - 120 * 60000).toISOString(),
        cancellation_reason: 'Cocina saturada / demasiada demora en el turno',
        cancelled_at: new Date(Date.now() - 115 * 60000).toISOString(),
        items: [
          { name: 'Combo Parrillero Doble', quantity: 1, unit_price: 22.00, options: [] }
        ]
      }
    ];

    // CATÁLOGO DE PRODUCTOS (SINCRONIZADO DIRECTAMENTE CON SUPABASE)
    let products = [
      {
        id: 'df91e203-2334-4036-9576-672106dcd72b',
        name: 'Pizza Napolitana Especial',
        category: 'Pizzas',
        price: 14.00,
        discount_price: 11.50,
        is_combo: false,
        is_available: true,
        pause_info: null,
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
        description: 'Muzzarella fundida, rodajas de tomate natural, albahaca fresca y olivas negras.'
      },
      {
        id: 'ec38fb52-2887-4151-a2ce-67416fb30762',
        name: 'Super Combo Doble Cheddar + Papas + Bebida',
        category: 'Combos',
        price: 16.50,
        discount_price: 12.90,
        is_combo: true,
        is_available: true,
        pause_info: null,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        description: 'Doble hamburguesa 150g, bacon crujiente, cheddar doble, papas rústicas y gaseosa 500ml.'
      },
      {
        id: '82cf628b-0dde-44d0-91b8-ee1eb2dfd744',
        name: 'Burger Bacon Crispy',
        category: 'Hamburguesas',
        price: 10.50,
        discount_price: null,
        is_combo: false,
        is_available: true,
        pause_info: null,
        image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
        description: 'Medallón 180g a la parrilla, cebolla caramelizada, panceta crocante y barbacoa casera.'
      },
      {
        id: '93d7858d-184e-4ff9-8824-15cf32deae72',
        name: 'Empanadas Criollas de Carne x6',
        category: 'Entradas',
        price: 9.00,
        discount_price: null,
        is_combo: false,
        is_available: false,
        pause_info: 'Agotado manual',
        image_url: 'https://images.unsplash.com/photo-1628106235973-f69324d08f32?w=400',
        description: 'Carne cortada a cuchillo, huevo duro, cebolla de verdeo y especias norteñas.'
      },
      {
        id: 'fea6cddb-4e28-43d0-b4bc-50d0a573601f',
        name: 'Postre Tiramisú Clásico Italiano',
        category: 'Postres',
        price: 4.50,
        discount_price: null,
        is_combo: false,
        is_available: true,
        pause_info: null,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        description: 'Vainillas embebidas en café espresso y licor amaretto con crema de mascarpone.'
      }
    ];

    // RESEÑAS
    let reviews = [
      {
        id: 'rev-1',
        author: 'Sofía Martínez',
        rating: 5,
        date: 'Hace 40 min',
        order_ref: 'Pedido #ord-72c3',
        comment: '¡La pizza llegó hirviendo y crocante! El adicional de muzzarella extra valió totalmente la pena.',
        reply: null
      },
      {
        id: 'rev-2',
        author: 'Esteban Rossi',
        rating: 5,
        date: 'Ayer',
        order_ref: 'Pedido #ord-22a9',
        comment: 'El combo de hamburguesa doble cheddar es de los mejores de la zona. Excelente empaquetado térmico.',
        reply: '¡Muchas gracias Esteban! Nos alegra que disfrutes nuestras hamburguesas artesanales.'
      },
      {
        id: 'rev-3',
        author: 'Mariana Gómez',
        rating: 4,
        date: 'Hace 3 días',
        order_ref: 'Pedido #ord-11c5',
        comment: 'Muy rico todo, masa en su punto. Tardó unos 5 minutos más de lo pactado pero se compensó con el sabor.',
        reply: null
      }
    ];

    let currentRestaurantId = null;

    // CARGA DE DATOS REALES DE SUPABASE
    async function loadSupabaseRestaurantData() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionRestId = pedidosnica_rest_session && !pedidosnica_rest_session.is_multi_management ? pedidosnica_rest_session.restaurant_id : null;
        const restIdParam = sessionRestId || currentRestaurantId || urlParams.get('restaurant_id') || localStorage.getItem('active_restaurant_id') || '';
        const fetchUrl = restIdParam ? `/api/restaurant/data?restaurant_id=${encodeURIComponent(restIdParam)}` : '/api/restaurant/data';
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        if (data.success) {
          if (data.restaurant && data.restaurant.id) {
            currentRestaurantId = data.restaurant.id;
            localStorage.setItem('active_restaurant_id', currentRestaurantId);
          }

          if (pedidosnica_rest_session && pedidosnica_rest_session.is_multi_management) {
            const sel = document.getElementById('restaurantSelectDropdown');
            if (sel) {
              const authorized = pedidosnica_rest_session.authorized_restaurants || [];
              const opts = [
                `<option value="all" ${currentRestaurantId === 'all' ? 'selected' : ''}>🏢 Todos mis locales</option>`,
                ...authorized.map(rst => 
                  `<option value="${rst.id}" ${rst.id === currentRestaurantId ? 'selected' : ''}>${rst.name}</option>`
                )
              ];
              sel.innerHTML = opts.join('');
            }
          }

          if (Array.isArray(data.orders)) {
            orders = data.orders;
          }
          if (Array.isArray(data.products)) {
            products = data.products;
          }
          if (Array.isArray(data.reviews)) {
            reviews = data.reviews.map(r => ({
              id: r.id,
              author: r.client_name || 'Cliente Verificado',
              rating: r.rating || 5,
              date: new Date(r.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' }),
              order_ref: 'Pedido #' + (r.order_id ? r.order_id.slice(0, 8) : 'Verificado'),
              comment: r.comment || '',
              reply: r.reply || null
            }));
          }
          if (data.restaurant) {
            const r = data.restaurant;
            const hName = document.getElementById('headerRestName');
            if (hName && r.name && currentRestaurantId !== 'all') hName.innerText = r.name;
            const hAddr = document.getElementById('headerRestAddress');
            if (hAddr && r.address) hAddr.innerText = '📍 ' + r.address;
            const hComm = document.getElementById('headerCommissionRate');
            if (hComm && data.commission_rate) hComm.innerText = data.commission_rate + '%';
            const sComm = document.getElementById('settCommissionRateDisplay');
            if (sComm && data.commission_rate) sComm.innerText = data.commission_rate + '%';

            const nameEl = document.getElementById('settStoreName') || document.getElementById('setRestName');
            if (nameEl && r.name) nameEl.value = r.name;
            const phoneEl = document.getElementById('settStorePhone') || document.getElementById('setRestPhone');
            if (phoneEl && r.phone) phoneEl.value = r.phone;
            const addrEl = document.getElementById('settStoreAddress') || document.getElementById('setRestAddress');
            if (addrEl && r.address) addrEl.value = r.address;
            const hoursEl = document.getElementById('settStoreHours') || document.getElementById('setRestHours');
            if (hoursEl && r.opening_hours) hoursEl.value = r.opening_hours;
            const prepEl = document.getElementById('settStorePrepMinutes') || document.getElementById('setRestPrepTime');
            if (prepEl && r.estimated_prep_time_minutes) {
              prepEl.value = r.estimated_prep_time_minutes;
              basePrepMinutes = r.estimated_prep_time_minutes;
            }
            const radiusEl = document.getElementById('settStoreDeliveryRadius');
            if (radiusEl && r.delivery_radius_km) radiusEl.value = r.delivery_radius_km;
            const logoEl = document.getElementById('settStoreLogoUrl');
            if (logoEl && r.logo_url) logoEl.value = r.logo_url;
            const basePrepEl = document.getElementById('basePrepSelect');
            if (basePrepEl && r.estimated_prep_time_minutes) basePrepEl.value = r.estimated_prep_time_minutes;
          }
          switchTab(currentTab);
          console.log('✓ [Supabase Live] Sincronización exitosa con Supabase PostgreSQL.');
        }
      } catch (err) {
        console.warn('⚠️ [Supabase Live Fallback] Usando datos locales:', err);
      }
    }

    // INICIALIZACIÓN
    async function initRestaurantApp() {
      const isAuth = initRestUserAuth();
      // Manejar hash URL si existe (#tab=menu)
      const hash = window.location.hash.replace('#tab=', '');
      if (hash && ['kds', 'menu', 'finances', 'reviews', 'settings'].includes(hash)) {
        currentTab = hash;
      }
      switchTab(currentTab);

      if (isAuth) {
        await loadSupabaseRestaurantData();
        setupSupabaseRealtime();
        initRestaurantLiveStream();
      }
    }

    function initRestaurantLiveStream() {
      try {
        const evtSource = new EventSource('/api/live-stream');
        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PRODUCT_STOCK_CHANGED') {
              const p = products.find(x => x.id === data.productId);
              if (p) {
                p.is_available = data.is_available;
                renderProductsGrid();
              } else {
                loadSupabaseRestaurantData();
              }
            } else if (data.type === 'PRODUCT_SAVED' || data.type === 'PRODUCT_DELETED') {
              loadSupabaseRestaurantData();
            } else if (data.type === 'ORDER_CREATED') {
              loadSupabaseRestaurantData();
              playChimeSound();
              showToast('🔔 Nuevo Pedido PedidosNica', 'Nueva comanda recibida en cocina.');
            }
          } catch (e) {
            console.warn('[Restaurant SSE Parse Error]', e);
          }
        };
      } catch (e) {
        console.warn('[Restaurant SSE Unavailable]', e);
      }

      // Polling de respaldo cada 5 segundos
      setInterval(() => {
        loadSupabaseRestaurantData();
      }, 5000);
    }

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initRestaurantApp);
    } else {
      initRestaurantApp();
    }

    // ========================================================================
    // GESTIÓN DE PESTAÑAS (TABS)
    // ========================================================================
    function switchTab(tabName) {
      currentTab = tabName;
      window.location.hash = 'tab=' + tabName;

      // Ocultar todas las secciones
      document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));
      const activeSec = document.getElementById('section-' + tabName);
      if (activeSec) activeSec.classList.remove('hidden');

      // Actualizar estilo botones de nav desktop/iPad
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-[#A6A6A6] hover:text-white hover:bg-[#1C1C1C]';
      });
      const activeBtn = document.getElementById('nav-' + tabName);
      if (activeBtn) {
        activeBtn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left bg-[#06C167] text-black shadow-lg shadow-[#06C167]/20';
      }

      // Actualizar estilo botones de nav móvil/tablet vertical
      document.querySelectorAll('.nav-btn-mobile').forEach(btn => {
        btn.className = 'nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F]';
      });
      const activeBtnMobile = document.getElementById('nav-mobile-' + tabName);
      if (activeBtnMobile) {
        activeBtnMobile.className = 'nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 bg-[#06C167] text-black shadow';
      }

      // Renderizar la sección específica
      if (tabName === 'kds') renderKdsOrders();
      if (tabName === 'menu') renderProductsGrid();
      if (tabName === 'finances') renderFinances();
      if (tabName === 'reviews') renderReviewsFeed();
    }

    // ========================================================================
    // ALARMA SONORA (WEB AUDIO API)
    // ========================================================================
    function playChimeSound() {
      if (isMuted) return;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.0, now + 0.15); // A5

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(now + 0.45);
      } catch (e) {
        console.warn('Audio Web error:', e);
      }
    }

    function testChimeSound() {
      playChimeSound();
      showToast('🔊 Sonido de Comanda', 'Timbre verificado correctamente.');
    }

    function toggleMute() {
      isMuted = !isMuted;
      const btn = document.getElementById('btnAudioMute');
      const icon = document.getElementById('audioIcon');
      const label = document.getElementById('audioLabel');

      if (isMuted) {
        btn.className = 'px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5';
        icon.innerText = '🔇';
        label.innerText = 'Silenciado';
        showToast('🔇 Alarma Silenciada', 'No sonará el timbre con nuevos pedidos.');
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold flex items-center gap-1.5';
        icon.innerText = '🔔';
        label.innerText = 'Alarma Activa';
        showToast('🔔 Alarma Activada', 'Sonará continuamente con nuevos pedidos.');
      }
    }

    // ========================================================================
    // ESTADO DEL COMERCIO (ABIERTO / SATURADO / CERRADO)
    // ========================================================================
    function toggleStoreStatusMenu() {
      const drop = document.getElementById('storeStatusDropdown');
      drop.classList.toggle('hidden');
    }

    function setStoreStatus(status) {
      storeStatus = status;
      document.getElementById('storeStatusDropdown').classList.add('hidden');

      const btn = document.getElementById('storeStatusBtn');
      const label = document.getElementById('storeStatusLabel');
      const dot = document.getElementById('headerStatusDot');

      if (status === 'OPEN') {
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2';
        label.innerText = 'Local Abierto';
        dot.className = 'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 ring-2 ring-emerald-500/30';
        showToast('🟢 Local Abierto', 'Recibiendo pedidos con normalidad.');
      } else if (status === 'BUSY') {
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2';
        label.innerText = 'Cocina Saturada (20m)';
        dot.className = 'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 ring-2 ring-amber-500/30';
        showToast('🟡 Cocina Saturada', 'Pausa temporal de 20 minutos aplicada a la app de clientes.');
      } else if (status === 'CLOSED') {
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-2';
        label.innerText = 'Local Cerrado';
        dot.className = 'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-400 border-2 border-slate-900 ring-2 ring-rose-500/30';
        showToast('🔴 Local Cerrado', 'Tu comercio figura como cerrado para los clientes.');
      }
    }

    function updateBasePrep(val) {
      basePrepMinutes = parseInt(val);
      showToast('⏱️ Tiempo de Cocina', 'Tiempo estándar actualizado a ' + val + ' minutos.');
    }

    // ========================================================================
    // KDS: GESTIÓN DE COMANDAS EN VIVO & HISTORIAL
    // ========================================================================
    function setKdsView(view) {
      kdsSubView = view;
      const btnActive = document.getElementById('btnKdsActive');
      const btnHistory = document.getElementById('btnKdsHistory');
      const viewActive = document.getElementById('kdsViewActive');
      const viewHistory = document.getElementById('kdsViewHistory');

      if (view === 'active') {
        btnActive.className = 'px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-slate-950 shadow';
        btnHistory.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white transition-colors';
        viewActive.classList.remove('hidden');
        viewHistory.classList.add('hidden');
        renderKdsOrders();
      } else {
        btnHistory.className = 'px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-slate-950 shadow';
        btnActive.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white transition-colors';
        viewActive.classList.add('hidden');
        viewHistory.classList.remove('hidden');
        renderHistoryOrders();
      }
    }

    let currentKdsColumn = 'ALL';
    window.setKdsColumnFilter = function(col) {
      currentKdsColumn = col;
      const colCreated = document.getElementById('col-kds-created');
      const colPrep = document.getElementById('col-kds-prep');
      const colReady = document.getElementById('col-kds-ready');

      // Actualizar botones segmentados
      ['ALL', 'CREATED', 'PREP', 'READY'].forEach(c => {
        const btnId = c === 'ALL' ? 'segKdsAll' : (c === 'CREATED' ? 'segKdsCreated' : (c === 'PREP' ? 'segKdsPrep' : 'segKdsReady'));
        const btn = document.getElementById(btnId);
        if (btn) {
          if (c === col) {
            btn.className = 'flex-1 py-2 text-center font-bold rounded-xl bg-[#06C167] text-black transition-colors';
          } else {
            btn.className = 'flex-1 py-2 text-center font-bold rounded-xl text-[#A6A6A6] hover:text-white transition-colors';
          }
        }
      });

      if (window.innerWidth < 1024) {
        if (col === 'ALL') {
          if (colCreated) colCreated.classList.remove('hidden');
          if (colPrep) colPrep.classList.remove('hidden');
          if (colReady) colReady.classList.remove('hidden');
        } else if (col === 'CREATED') {
          if (colCreated) colCreated.classList.remove('hidden');
          if (colPrep) colPrep.classList.add('hidden');
          if (colReady) colReady.classList.add('hidden');
        } else if (col === 'PREP') {
          if (colCreated) colCreated.classList.add('hidden');
          if (colPrep) colPrep.classList.remove('hidden');
          if (colReady) colReady.classList.add('hidden');
        } else if (col === 'READY') {
          if (colCreated) colCreated.classList.add('hidden');
          if (colPrep) colPrep.classList.add('hidden');
          if (colReady) colReady.classList.remove('hidden');
        }
      }
    };

    function renderKdsOrders() {
      const created = orders.filter(o => o.status === 'CREATED');
      const prep = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_PREPARATION');
      const ready = orders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'DRIVER_ASSIGNED');

      const countCreatedEl = document.getElementById('count-created');
      const countPrepEl = document.getElementById('count-prep');
      const countReadyEl = document.getElementById('count-ready');
      const mobCreated = document.getElementById('kdsMobileCreatedCount');
      const mobPrep = document.getElementById('kdsMobilePrepCount');
      const mobReady = document.getElementById('kdsMobileReadyCount');
      const badgeMobile = document.getElementById('badgeKdsCountMobile');

      if (countCreatedEl) countCreatedEl.innerText = created.length;
      if (countPrepEl) countPrepEl.innerText = prep.length;
      if (countReadyEl) countReadyEl.innerText = ready.length;
      if (mobCreated) mobCreated.innerText = created.length;
      if (mobPrep) mobPrep.innerText = prep.length;
      if (mobReady) mobReady.innerText = ready.length;
      if (badgeMobile) badgeMobile.innerText = created.length + prep.length + ready.length;

      document.getElementById('badgeKdsCount').innerText = created.length + prep.length + ready.length;
      document.getElementById('activeOrdersTotal').innerText = created.length + prep.length + ready.length;

      // Columna 1: Creados
      document.getElementById('list-created').innerHTML = created.length === 0 
        ? '<div class="p-6 text-center text-[#757575] text-xs border border-dashed border-[#262626] rounded-2xl">Sin pedidos entrantes</div>'
        : created.map(o => `
          <div class="bg-[#161616] border-2 border-[#06C167]/50 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-mono font-bold bg-black px-2.5 py-1 rounded-md text-[#06C167] border border-[#06C167]/30">#${o.id.slice(0,8)}</span>
                <span class="text-[11px] text-white block mt-1.5 font-bold">${o.client_name}</span>
              </div>
              <span class="text-lg font-black text-white font-mono">C$ ${Number(o.total).toFixed(2)}</span>
            </div>

            <!-- Ítems -->
            <div class="space-y-1 py-2 border-y border-[#262626] text-xs">
              ${o.items.map(it => `
                <div class="flex justify-between text-white">
                  <span><strong>${it.quantity}x</strong> ${it.name}</span>
                  <span class="font-mono text-[#A6A6A6]">C$ ${(it.quantity * it.unit_price).toFixed(2)}</span>
                </div>
                ${it.options && it.options.length ? `<p class="text-[10px] text-[#06C167] pl-3">${it.options.join(', ')}</p>` : ''}
              `).join('')}
            </div>

            <p class="text-[11px] text-[#A6A6A6]">📍 ${o.delivery_address}</p>
            ${o.delivery_notes ? `<p class="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">Nota: ${o.delivery_notes}</p>` : ''}

            <!-- Tiempo de preparación sugerido -->
            <div class="flex items-center gap-2 text-xs">
              <span class="text-[#A6A6A6]">Cocción:</span>
              <input type="number" id="prep-time-${o.id}" value="${o.estimated_prep_minutes || basePrepMinutes}" class="w-16 bg-black border border-[#2E2E2E] rounded-lg p-1 text-center font-bold text-white font-mono" />
              <span class="text-[#A6A6A6]">min</span>
            </div>

            <!-- Botones de Acción Táctiles (Uber Eats Verde) -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick="openRejectModal('${o.id}')" class="py-2.5 rounded-full bg-[#1F1F1F] hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all">
                ✕ Rechazar
              </button>
              <button onclick="acceptOrder('${o.id}')" class="py-2.5 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black text-xs font-black shadow-lg shadow-[#06C167]/20 transition-all">
                ✓ Aceptar Pedido
              </button>
            </div>

            <button onclick="openThermalTicket('${o.id}')" class="w-full py-1 text-center text-[11px] text-[#A6A6A6] hover:text-white font-semibold transition-colors flex items-center justify-center gap-1">
              <span>🖨️</span> Ver / Imprimir Ticket Térmico
            </button>
          </div>
        `).join('');

      // Columna 2: En Preparación
      document.getElementById('list-prep').innerHTML = prep.length === 0
        ? '<div class="p-6 text-center text-[#757575] text-xs border border-dashed border-[#262626] rounded-2xl">La cocina está al día</div>'
        : prep.map(o => `
          <div class="bg-[#161616] border border-[#2B2B2B] rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-mono font-bold bg-black px-2.5 py-1 rounded-md text-blue-300 border border-blue-500/30">#${o.id.slice(0,8)}</span>
                <span class="text-[11px] text-white block mt-1.5 font-bold">${o.client_name}</span>
              </div>
              <span class="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-0.5 rounded-full font-bold">En Cocina</span>
            </div>

            <!-- Checklist para el cocinero -->
            <div class="space-y-1.5 py-2 border-y border-[#262626] text-xs">
              ${o.items.map((it, idx) => `
                <label class="flex items-start gap-2 text-white cursor-pointer select-none">
                  <input type="checkbox" class="accent-[#06C167] mt-0.5 w-4 h-4 rounded" />
                  <div>
                    <span><strong>${it.quantity}x</strong> ${it.name}</span>
                    ${it.options && it.options.length ? `<p class="text-[10px] text-[#A6A6A6]">${it.options.join(', ')}</p>` : ''}
                  </div>
                </label>
              `).join('')}
            </div>

            <div class="flex justify-between items-center text-xs">
              <span class="text-[#A6A6A6]">Total: <strong class="text-[#06C167] font-mono">C$ ${Number(o.total).toFixed(2)}</strong></span>
              <span class="text-[10px] text-[#A6A6A6] font-mono">⏱️ Est: ${o.estimated_prep_minutes || 20}m</span>
            </div>

            <button onclick="markReadyForPickup('${o.id}')" class="w-full py-2.5 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black text-xs font-black shadow-lg shadow-[#06C167]/20 transition-all flex items-center justify-center gap-1.5">
              <span>🛵</span> Marcar Listo para Recoger
            </button>

            <button onclick="openThermalTicket('${o.id}')" class="w-full py-1 text-center text-[11px] text-[#A6A6A6] hover:text-white font-semibold transition-colors">
              🖨️ Re-imprimir Ticket
            </button>
          </div>
        `).join('');

      // Columna 3: Listos para Despacho
      document.getElementById('list-ready').innerHTML = ready.length === 0
        ? '<div class="p-6 text-center text-[#757575] text-xs border border-dashed border-[#262626] rounded-2xl">Sin pedidos en mostrador</div>'
        : ready.map(o => `
          <div class="bg-[#161616] border border-[#06C167]/40 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-mono font-bold bg-black px-2.5 py-1 rounded-md text-[#06C167] border border-[#06C167]/30">#${o.id.slice(0,8)}</span>
                <span class="text-[11px] text-white block mt-1.5 font-bold">${o.client_name}</span>
              </div>
              <span class="text-xs bg-[#06C167]/15 text-[#06C167] px-2.5 py-0.5 rounded-full font-bold">En Mostrador</span>
            </div>

            <!-- Ficha del Repartidor Asignado o Radar de Espera -->
            ${o.driver ? `
            <div class="p-3 rounded-2xl bg-black border border-[#262626] space-y-2">
              <div class="flex items-center gap-2.5">
                <img src="${o.driver.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="w-9 h-9 rounded-full object-cover border border-[#06C167]/40" />
                <div class="flex-1">
                  <p class="text-xs font-bold text-white">${o.driver.name || 'Repartidor'}</p>
                  <p class="text-[10px] text-[#A6A6A6]">${o.driver.vehicle || 'Moto / Bicicleta'}</p>
                </div>
              </div>
              <div class="flex justify-between items-center text-[11px] pt-1.5 border-t border-[#262626]">
                <span class="text-[#06C167] font-semibold flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-[#06C167] animate-ping"></span>
                  ${o.driver.eta || 'En camino al local'}
                </span>
                <span class="font-mono font-black text-black bg-[#06C167] px-2 py-0.5 rounded-full text-xs">
                  PIN: ${o.driver.pin || '4821'}
                </span>
              </div>
            </div>
            ` : `
            <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1.5">
              <div class="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Buscando repartidor en zona...</span>
              </div>
              <p class="text-[10px] text-[#A6A6A6]">Oferta visible para todos los conductores en Managua</p>
            </div>
            `}

            <button onclick="confirmDriverPickup('${o.id}')" class="w-full py-2.5 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black text-xs font-black shadow-lg shadow-[#06C167]/20 transition-all flex items-center justify-center gap-1.5">
              <span>✓</span> Confirmar Entrega a Repartidor
            </button>

            <button onclick="openThermalTicket('${o.id}')" class="w-full py-1 text-center text-[11px] text-[#A6A6A6] hover:text-white font-semibold transition-colors">
              🖨️ Ver Comanda 80mm
            </button>
          </div>
        `).join('');

      // Control del Timbre Continuo
      if (created.length > 0 && !soundInterval && !isMuted) {
        playChimeSound();
        soundInterval = setInterval(playChimeSound, 3500);
      } else if ((created.length === 0 || isMuted) && soundInterval) {
        clearInterval(soundInterval);
        soundInterval = null;
      }
    }

    // Aceptar Pedido (IN_PREPARATION)
    async function acceptOrder(id) {
      const input = document.getElementById('prep-time-' + id);
      const minutes = input ? parseInt(input.value) : basePrepMinutes;

      orders = orders.map(o => o.id === id ? {
        ...o,
        status: 'IN_PREPARATION',
        accepted_at: new Date().toISOString(),
        estimated_prep_minutes: minutes
      } : o);

      renderKdsOrders();
      showToast('👨‍🍳 Pedido Aceptado', 'Comanda enviada a la línea de cocina (' + minutes + ' min).');
      
      try {
        await fetch('/api/restaurant/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id, status: 'IN_PREPARATION', prepMinutes: minutes })
        });
      } catch (e) {
        console.warn('Sync order status failed:', e);
      }
    }

    // Marcar Listo para Recoger (READY_FOR_PICKUP)
    async function markReadyForPickup(id) {
      orders = orders.map(o => o.id === id ? {
        ...o,
        status: 'READY_FOR_PICKUP',
        ready_at: new Date().toISOString(),
        driver: o.driver || null
      } : o);

      renderKdsOrders();
      showToast('🛵 Listo para Despacho', 'Se ha notificado al repartidor asignado para el retiro.');

      try {
        await fetch('/api/restaurant/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id, status: 'READY_FOR_PICKUP' })
        });
      } catch (e) {
        console.warn('Sync ready status failed:', e);
      }
    }

    // Confirmar Entrega a Repartidor (Pasa a PICKED_UP)
    async function confirmDriverPickup(id) {
      orders = orders.map(o => o.id === id ? {
        ...o,
        status: 'PICKED_UP',
        picked_up_at: new Date().toISOString()
      } : o);

      renderKdsOrders();
      showToast('📦 Despacho Exitoso', 'Comanda entregada al repartidor para viaje al cliente.');

      try {
        await fetch('/api/restaurant/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id, status: 'PICKED_UP' })
        });
      } catch (e) {
        console.warn('Sync pickup status failed:', e);
      }
    }

    // SIMULADOR DE PEDIDO DE CLIENTE (CREA EN SUPABASE REAL)
    async function simulateCustomerOrder() {
      showToast('⏳ Creando Pedido...', 'Insertando orden de prueba en Supabase');
      try {
        const res = await fetch('/api/restaurant/orders/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success && data.order) {
          const newOrd = {
            id: data.order.id,
            status: 'CREATED',
            client_name: 'Mateo Blandón (Simulación)',
            phone: '+505 8711-2299',
            delivery_address: data.order.delivery_address,
            delivery_notes: data.order.delivery_notes || 'Tocar timbre',
            subtotal: parseFloat(data.order.subtotal || data.order.total),
            delivery_fee: parseFloat(data.order.delivery_fee || 2.0),
            total: parseFloat(data.order.total),
            created_at: data.order.created_at,
            estimated_prep_minutes: basePrepMinutes,
            items: [
              { name: 'Pizza Napolitana Especial', quantity: 1, unit_price: 16.50, options: ['Papas Rústicas', 'Bebida 500ml'] }
            ]
          };
          orders.unshift(newOrd);
          renderKdsOrders();
          showToast('🔔 ¡Nuevo Pedido Supabase!', 'Pedido #' + newOrd.id.slice(0, 8) + ' guardado en Base de Datos.');
          playChimeSound();
          return;
        }
      } catch (e) {
        console.warn('Simulate failed on server, using local fallback:', e);
      }

      // Fallback local en caso de desconexión
      const testId = 'ord-' + Date.now().toString(36).slice(-4);
      const fallbackOrd = {
        id: testId,
        status: 'CREATED',
        client_name: 'Cliente ' + Math.floor(Math.random() * 900 + 100),
        phone: '+54 9 11 4099-2311',
        delivery_address: 'Av. Cabildo ' + (Math.floor(Math.random() * 3000) + 500) + ', Belgrano',
        delivery_notes: 'Dejar en puerta',
        subtotal: 16.50,
        delivery_fee: 2.00,
        total: 18.50,
        created_at: new Date().toISOString(),
        estimated_prep_minutes: basePrepMinutes,
        items: [
          { name: 'Super Combo Doble Cheddar', quantity: 1, unit_price: 12.90, options: ['Papas', 'Bebida'] },
          { name: 'Gaseosa 500ml', quantity: 1, unit_price: 3.60, options: [] }
        ]
      };
      orders.unshift(fallbackOrd);
      renderKdsOrders();
      showToast('🔔 ¡Nuevo Pedido Entrante!', 'Pedido #' + testId + ' por C$ ' + fallbackOrd.total.toFixed(2));
      playChimeSound();
    }

    // ========================================================================
    // RECHAZO DE PEDIDO CON MOTIVOS JUSTIFICADOS
    // ========================================================================
    let currentRejectOrderId = null;

    function openRejectModal(id) {
      currentRejectOrderId = id;
      const el = document.getElementById('rejectOrderId');
      if (el) el.value = id;
      const modal = document.getElementById('modalRejectOrder');
      if (modal) modal.classList.remove('hidden');
    }

    function closeRejectModal() {
      currentRejectOrderId = null;
      const modal = document.getElementById('modalRejectOrder');
      if (modal) modal.classList.add('hidden');
    }

    async function confirmRejectOrder() {
      if (!currentRejectOrderId) return;
      const sel = document.getElementById('rejectReasonSelect');
      const reason = sel ? sel.value : 'Rechazado por el comercio';

      const id = currentRejectOrderId;
      orders = orders.map(o => o.id === id ? {
        ...o,
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      } : o);

      closeRejectModal();
      renderKdsOrders();
      showToast('🚫 Pedido Cancelado', 'Motivo: ' + reason);

      try {
        await fetch('/api/restaurant/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id, status: 'CANCELLED', cancellationReason: reason })
        });
      } catch (e) {
        console.warn('Sync reject failed:', e);
      }
    }

    // ========================================================================
    // TICKET TÉRMICO DE COCINA / DESPACHO (80mm)
    // ========================================================================
    function openThermalTicket(id) {
      const order = orders.find(o => o.id === id);
      if (!order) return;

      const restName = document.getElementById('headerRestName')?.innerText || 'PEDIDOSNICA PARTNER';
      const pin = order.driver?.pin || (order.id ? order.id.replace(/[^0-9]/g, '').slice(0, 4).padEnd(4, '8') : '4821');

      const ticketContainer = document.getElementById('printableThermalTicket');
      if (ticketContainer) {
        ticketContainer.innerHTML = `
          <div class="text-center pb-2 border-b border-dashed border-black">
            <h2 class="text-sm font-black uppercase tracking-wider">${restName}</h2>
            <p class="text-[10px] text-gray-700">Ticket de Cocina y Despacho</p>
            <p class="text-xs font-bold font-mono mt-1">#${order.id.slice(0, 8)}</p>
            <p class="text-[10px] text-gray-600">${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Entrega Inmediata</p>
          </div>

          <div class="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
            <p><strong>Cliente:</strong> ${order.client_name}</p>
            <p><strong>Teléfono:</strong> ${order.phone || 'S/D'}</p>
            <p><strong>Dirección:</strong> ${order.delivery_address}</p>
            ${order.delivery_notes ? `<p class="italic text-[9px] bg-yellow-100 p-1 rounded mt-1">Nota: ${order.delivery_notes}</p>` : ''}
          </div>

          <div class="py-2 border-b border-dashed border-black space-y-1">
            <p class="font-bold text-[10px] uppercase">Comanda Detallada:</p>
            ${order.items.map(it => `
              <div class="flex justify-between items-start text-[11px]">
                <span><strong>${it.quantity}x</strong> ${it.name}</span>
                <span class="font-mono font-bold">C$ ${Number(it.unit_price * it.quantity).toFixed(2)}</span>
              </div>
              ${it.options && it.options.length ? `
                <div class="pl-2 text-[9px] text-gray-600 italic">
                  ${it.options.join(', ')}
                </div>
              ` : ''}
            `).join('')}
          </div>

          <div class="pt-2 text-right text-xs space-y-0.5 font-mono">
            <div class="flex justify-between text-gray-600 text-[10px]">
              <span>Subtotal:</span>
              <span>C$ ${Number(order.subtotal || order.total).toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-gray-600 text-[10px]">
              <span>Envío:</span>
              <span>C$ ${Number(order.delivery_fee || 0).toFixed(2)}</span>
            </div>
            <div class="flex justify-between font-black text-sm text-black pt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>C$ ${Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div class="pt-3 text-center text-[9px] border-t border-dashed border-black mt-2 text-gray-500">
            <p>*** COPIA DE COCINA / PEDIDOSNICA ***</p>
            <p>Código de entrega: ${pin}</p>
          </div>
        `;
      }

      const modal = document.getElementById('modalThermalTicket');
      if (modal) modal.classList.remove('hidden');
    }

    function closeThermalTicketModal() {
      const modal = document.getElementById('modalThermalTicket');
      if (modal) modal.classList.add('hidden');
    }

    function closeThermalTicket() {
      closeThermalTicketModal();
    }

    function printThermalTicket() {
      window.print();
    }

    // ========================================================================
    // HISTORIAL DEL TURNO
    // ========================================================================
    function renderHistoryOrders() {
      const search = (document.getElementById('historySearch').value || '').toLowerCase();
      const filter = document.getElementById('historyFilter').value;

      const historyOrders = orders.filter(o => {
        const isHistory = ['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status);
        if (!isHistory) return false;
        if (filter !== 'ALL' && o.status !== filter) return false;
        if (search) {
          const matchId = o.id.toLowerCase().includes(search);
          const matchClient = (o.client_name || '').toLowerCase().includes(search);
          return matchId || matchClient;
        }
        return true;
      });

      document.getElementById('historyCounter').innerText = historyOrders.length;
      document.getElementById('historyOrdersTotal').innerText = orders.filter(o => ['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)).length;

      const container = document.getElementById('historyListContainer');
      container.innerHTML = historyOrders.length === 0
        ? '<div class="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">No se encontraron comandas con ese criterio</div>'
        : historyOrders.map(o => `
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-white text-xs">#${o.id}</span>
                <span class="text-slate-500">•</span>
                <span class="text-xs text-slate-300 font-semibold">${o.client_name}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  o.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                  o.status === 'PICKED_UP' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'
                }">${o.status}</span>
              </div>
              <p class="text-[11px] text-slate-400">${o.items.map(i => i.quantity + 'x ' + i.name).join(', ')}</p>
              ${o.cancellation_reason ? `<p class="text-[10px] text-rose-400 font-semibold">Motivo: ${o.cancellation_reason}</p>` : ''}
            </div>

            <div class="flex items-center gap-4">
              <div class="text-right font-mono">
                <span class="text-xs font-bold text-white">$${Number(o.total).toFixed(2)}</span>
                <p class="text-[10px] text-emerald-400">Neto: $${(o.total * (1 - COMMISSION_RATE / 100)).toFixed(2)}</p>
              </div>
              <button onclick="openThermalTicket('${o.id}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                🖨️ Ver Ticket
              </button>
            </div>
          </div>
        `).join('');
    }

    // ========================================================================
    // CARTA, MENÚ & MODIFICADORES
    // ========================================================================
    let selectedCat = 'ALL';
    let productToPause = null;

    function filterCategory(cat) {
      selectedCat = cat;
      renderProductsGrid();
    }

    function renderProductsGrid() {
      const search = (document.getElementById('menuSearch')?.value || '').toLowerCase();
      const avail = document.getElementById('menuAvailabilityFilter')?.value || 'ALL';

      const categoryPillsContainer = document.getElementById('categoryPills');
      if (categoryPillsContainer) {
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
        const allCategories = ['ALL', ...uniqueCategories];
        categoryPillsContainer.innerHTML = allCategories.map(cat => {
          const isSelected = selectedCat === cat;
          const label = cat === 'ALL' ? 'Todos' : cat;
          const cls = isSelected
            ? 'cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#06C167] text-black shadow cursor-pointer'
            : 'cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F1F1F] text-[#A6A6A6] hover:text-white border border-[#2E2E2E] cursor-pointer';
          return `<button type="button" onclick="filterCategory('${cat}')" class="${cls}">${label}</button>`;
        }).join('');
      }

      const filtered = products.filter(p => {
        if (selectedCat !== 'ALL' && p.category !== selectedCat) return false;
        if ((avail === 'AVAILABLE' || avail === 'ACTIVE') && !p.is_available) return false;
        if (avail === 'PAUSED' && p.is_available) return false;
        if (search && !p.name.toLowerCase().includes(search) && !p.description.toLowerCase().includes(search)) return false;
        return true;
      });

      const badge = document.getElementById('badgeMenuCount');
      if (badge) badge.innerText = products.length;

      const grid = document.getElementById('productsGrid');
      if (!grid) return;

      grid.innerHTML = filtered.map(p => `
        <div class="p-4 sm:p-5 rounded-3xl border transition-all duration-300 shadow-xl flex flex-col justify-between ${
          p.is_available 
            ? 'bg-[#161616] border-[#262626] hover:border-[#383838]' 
            : 'bg-[#161616]/60 border-[#262626] opacity-60'
        }">
          <div>
            <div class="relative h-40 sm:h-44 rounded-2xl overflow-hidden mb-3.5 bg-black">
              <img src="${p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}" class="w-full h-full object-cover" />
              ${p.is_combo ? '<span class="absolute top-2.5 left-2.5 bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">COMBO 🔥</span>' : ''}
              ${p.discount_price ? '<span class="absolute top-2.5 right-2.5 bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">OFERTA</span>' : ''}
              ${!p.is_available ? '<span class="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center font-bold text-rose-400 text-xs uppercase tracking-wider">Agotado</span>' : ''}
            </div>

            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-[10px] font-bold text-[#A6A6A6] uppercase tracking-wider bg-[#1F1F1F] px-2 py-0.5 rounded-md border border-[#2E2E2E]">${p.category}</span>
                <h3 class="font-extrabold text-sm sm:text-base text-white mt-1 leading-snug">${p.name}</h3>
              </div>
              <div class="text-right shrink-0 ml-2">
                ${p.discount_price ? `
                  <span class="text-xs line-through text-[#757575] font-mono">C$ ${Number(p.price).toFixed(2)}</span><br/>
                  <span class="font-mono font-black text-[#06C167] text-base sm:text-lg">C$ ${Number(p.discount_price).toFixed(2)}</span>
                ` : `
                  <span class="font-mono font-black text-white text-base sm:text-lg">C$ ${Number(p.price).toFixed(2)}</span>
                `}
              </div>
            </div>

            <p class="text-xs text-[#A6A6A6] mb-3 leading-relaxed line-clamp-2">${p.description}</p>
          </div>

          <div class="pt-3 border-t border-[#262626] space-y-2.5">
            <div class="grid grid-cols-2 gap-2">
              <button onclick="previewCustomizer('${p.id}')" class="py-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
                <span>🔍</span> Opciones
              </button>
              <button onclick="editProduct('${p.id}')" class="py-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-[#06C167] text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
                <span>✏️</span> Editar
              </button>
            </div>

            <div class="flex justify-between items-center pt-1">
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                p.is_available 
                  ? 'bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }">
                ${p.is_available ? '🟢 Disponible' : '🔴 ' + (p.pause_info || 'Agotado')}
              </span>

              <div class="flex items-center gap-2">
                <button onclick="duplicateProduct('${p.id}')" title="Duplicar Platillo" class="text-xs text-[#A6A6A6] hover:text-white p-1.5 rounded-lg bg-[#1F1F1F]">
                  📋
                </button>
                <button onclick="deleteProduct('${p.id}')" title="Eliminar Platillo" class="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-[#1F1F1F]">
                  🗑️
                </button>
                <!-- Switch de stock estilo iOS / Uber Eats -->
                <button onclick="toggleProductStock('${p.id}')" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  p.is_available ? 'bg-[#06C167]' : 'bg-[#2E2E2E]'
                }">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    p.is_available ? 'translate-x-6' : 'translate-x-1'
                  }"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Switch de Stock con Modal de Temporizador si se desactiva
    async function toggleProductStock(id) {
      const prod = products.find(p => p.id === id);
      if (!prod) return;

      if (prod.is_available) {
        // Al apagar stock, preguntar duración
        productToPause = prod;
        document.getElementById('pauseProductName').innerText = prod.name;
        document.getElementById('modalPauseStock').classList.remove('hidden');
      } else {
        // Al reactivar, reactivar inmediatamente en Supabase
        prod.is_available = true;
        prod.pause_info = null;
        renderProductsGrid();
        showToast('🟢 Stock Reactivado', prod.name + ' vuelve a estar disponible.');

        try {
          const resp = await fetch('/api/restaurant/products/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, is_available: true })
          });
          const resData = await resp.json();
          if (!resData.success) {
            throw new Error(resData.error || 'Fallo al actualizar');
          }
        } catch (e) {
          console.error('Sync toggle stock failed:', e);
          prod.is_available = false;
          renderProductsGrid();
          showToast('❌ Error de Sincronización', 'No se pudo reactivar el stock en Supabase.', '❌');
        }
      }
    }

    function closePauseStockModal() {
      productToPause = null;
      document.getElementById('modalPauseStock').classList.add('hidden');
    }

    async function confirmPauseStock() {
      if (!productToPause) return;
      const duration = document.querySelector('input[name="pauseDuration"]:checked').value;
      let label = 'Agotado';
      if (duration === '1h') label = 'Pausado 1h';
      if (duration === 'today') label = 'Pausado por hoy';
      if (duration === 'permanent') label = 'Agotado permanente';

      const pId = productToPause.id;
      const pName = productToPause.name;
      productToPause.is_available = false;
      productToPause.pause_info = label;

      closePauseStockModal();
      renderProductsGrid();
      showToast('⏸️ Stock Pausado', pName + ' ha sido pausado (' + label + ').');

      try {
        const resp = await fetch('/api/restaurant/products/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: pId, is_available: false })
        });
        const resData = await resp.json();
        if (!resData.success) {
          throw new Error(resData.error || 'Fallo al pausar');
        }
      } catch (e) {
        console.error('Sync pause stock failed:', e);
        if (productToPause) productToPause.is_available = true;
        renderProductsGrid();
        showToast('❌ Error de Sincronización', 'No se pudo pausar el stock en Supabase.', '❌');
      }
    }

    // Modal Crear / Editar Platillo
    function openProductModal(isEdit = false) {
      const titleEl = document.getElementById('prodModalTitle') || document.getElementById('productModalTitle');
      if (titleEl) titleEl.innerText = isEdit ? 'Editar Platillo / Combo' : 'Nuevo Platillo / Combo';
      const modal = document.getElementById('modalProductForm') || document.getElementById('modalProductEditor');
      if (modal) modal.classList.remove('hidden');
    }

    function closeProductModal() {
      const modal = document.getElementById('modalProductForm') || document.getElementById('modalProductEditor');
      if (modal) modal.classList.add('hidden');
      const form = document.getElementById('formProduct');
      if (form) form.reset();
      const editId = document.getElementById('editProductId');
      if (editId) editId.value = '';
    }

    function editProduct(id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      document.getElementById('editProductId').value = p.id;
      document.getElementById('pName').value = p.name;
      document.getElementById('pCategory').value = p.category;
      document.getElementById('pDesc').value = p.description;
      document.getElementById('pPrice').value = p.price;
      document.getElementById('pDiscount').value = p.discount_price || '';
      document.getElementById('pIsCombo').checked = !!p.is_combo;
      document.getElementById('pImage').value = p.image_url || '';
      openProductModal(true);
    }

    function duplicateProduct(id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      const clone = {
        ...p,
        id: 'prod-' + Date.now().toString(36),
        name: p.name + ' (Copia)',
        is_available: true,
        pause_info: null
      };
      products.unshift(clone);
      renderProductsGrid();
      showToast('📋 Platillo Duplicado', 'Se creó una copia de ' + p.name);
    }

    async function deleteProduct(id) {
      if (!confirm('¿Seguro que deseas eliminar este platillo del catálogo?')) return;
      products = products.filter(p => p.id !== id);
      renderProductsGrid();
      showToast('🗑️ Platillo Eliminado', 'El platillo fue retirado de la carta.');

      try {
        await fetch('/api/restaurant/products/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {
        console.warn('Sync delete product failed:', e);
      }
    }

    async function saveProductItem(e) {
      e.preventDefault();
      const editId = document.getElementById('editProductId').value;
      const name = document.getElementById('pName').value;
      const category = document.getElementById('pCategory').value;
      const description = document.getElementById('pDesc').value;
      const price = parseFloat(document.getElementById('pPrice').value);
      const discount_price = parseFloat(document.getElementById('pDiscount').value) || null;
      const is_combo = document.getElementById('pIsCombo').checked;
      const image_url = document.getElementById('pImage').value || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

      const payload = {
        id: editId || undefined,
        restaurant_id: currentRestaurantId,
        name, category, description, price, discount_price, is_combo, image_url
      };

      if (editId) {
        products = products.map(p => p.id === editId ? {
          ...p,
          name, category, description, price, discount_price, is_combo, image_url
        } : p);
        showToast('✓ Platillo Actualizado', name + ' guardado con éxito.');
      } else {
        const newId = 'prod-' + Date.now().toString(36);
        products.unshift({
          id: newId,
          name, category, description, price, discount_price, is_combo, image_url,
          is_available: true,
          pause_info: null
        });
        showToast('✓ Nuevo Platillo Creado', name + ' agregado a la carta.');
      }

      closeProductModal();
      renderProductsGrid();

      try {
        const res = await fetch('/api/restaurant/products/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const saved = await res.json();
        if (saved.success && saved.product && !editId) {
          products[0].id = saved.product.id;
          renderProductsGrid();
        }
      } catch (e) {
        console.warn('Sync save product failed:', e);
      }
    }

    // Modal de Prueba de Personalizaciones para el Cliente
    let customizerBasePrice = 0;

    function previewCustomizer(id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      customizerBasePrice = p.discount_price || p.price;

      document.getElementById('prevTitle').innerText = 'Personalizar ' + p.name;
      document.getElementById('prevContent').innerHTML = `
        <div>
          <label class="block font-bold text-slate-300 mb-1.5 uppercase text-[10px]">1. Selecciona Tamaño</label>
          <div class="space-y-1.5">
            <label class="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span class="flex items-center gap-2 text-white font-semibold">
                <input type="radio" name="optSize" value="0" checked onchange="calcCustomizerTotal()" class="accent-amber-500" /> Individual
              </span>
              <span class="text-slate-400 font-mono">$0.00</span>
            </label>
            <label class="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span class="flex items-center gap-2 text-white font-semibold">
                <input type="radio" name="optSize" value="3.50" onchange="calcCustomizerTotal()" class="accent-amber-500" /> Mediana
              </span>
              <span class="text-emerald-400 font-mono">+$3.50</span>
            </label>
            <label class="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span class="flex items-center gap-2 text-white font-semibold">
                <input type="radio" name="optSize" value="6.50" onchange="calcCustomizerTotal()" class="accent-amber-500" /> Familiar
              </span>
              <span class="text-emerald-400 font-mono">+$6.50</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-300 mb-1.5 uppercase text-[10px]">2. Adicionales con Costo</label>
          <div class="space-y-1.5">
            <label class="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span class="flex items-center gap-2 text-white">
                <input type="checkbox" name="optExtra" value="1.50" onchange="calcCustomizerTotal()" class="accent-amber-500" /> Extra Queso Fundido
              </span>
              <span class="text-emerald-400 font-mono">+$1.50</span>
            </label>
            <label class="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span class="flex items-center gap-2 text-white">
                <input type="checkbox" name="optExtra" value="2.50" onchange="calcCustomizerTotal()" class="accent-amber-500" /> Doble Carne / Panceta
              </span>
              <span class="text-emerald-400 font-mono">+$2.50</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-300 mb-1.5 uppercase text-[10px]">3. Modificadores (Sin cargo)</label>
          <div class="space-y-1.5">
            <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-white">
              <input type="checkbox" class="accent-amber-500" /> Sin Cebolla
            </label>
            <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-white">
              <input type="checkbox" class="accent-amber-500" /> Sin Mayonesa / Salsas
            </label>
          </div>
        </div>
      `;

      calcCustomizerTotal();
      document.getElementById('modalPreviewOptions').classList.remove('hidden');
    }

    function calcCustomizerTotal() {
      const sizeVal = parseFloat(document.querySelector('input[name="optSize"]:checked')?.value || 0);
      let extrasVal = 0;
      document.querySelectorAll('input[name="optExtra"]:checked').forEach(e => extrasVal += parseFloat(e.value));
      const total = customizerBasePrice + sizeVal + extrasVal;
      document.getElementById('prevDynamicPrice').innerText = '$' + total.toFixed(2);
    }

    function closePreviewModal() {
      document.getElementById('modalPreviewOptions').classList.add('hidden');
    }

    // ========================================================================
    // FINANZAS & LIQUIDACIÓN
    // ========================================================================
    function renderFinances() {
      const validOrders = orders.filter(o => o.status !== 'CANCELLED');
      const gross = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
      const commission = gross * (COMMISSION_RATE / 100);
      const net = gross - commission;
      const avg = validOrders.length ? (gross / validOrders.length) : 0;

      const elGross = document.getElementById('finGrossSales') || document.getElementById('finGrossTotal');
      const elComm = document.getElementById('finCommissionAmount') || document.getElementById('finCommissionTotal');
      const elNet = document.getElementById('finNetPayout') || document.getElementById('finNetTotal');
      const elAvg = document.getElementById('finAvgTicket');
      const elCount = document.getElementById('finCompletedCount') || document.getElementById('finOrdersCount');

      if (elGross) elGross.innerText = 'C$ ' + gross.toFixed(2);
      if (elComm) elComm.innerText = '-C$ ' + commission.toFixed(2);
      if (elNet) elNet.innerText = 'C$ ' + net.toFixed(2);
      if (elAvg) elAvg.innerText = 'C$ ' + avg.toFixed(2);
      if (elCount) elCount.innerText = validOrders.length + ' pedidos entregados';

      const tableContainer = document.getElementById('financesOrdersTable');
      if (tableContainer) {
        tableContainer.innerHTML = `
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-[#262626] text-[#A6A6A6] font-bold text-[10px] uppercase">
                <th class="py-2.5 px-3">Pedido</th>
                <th class="py-2.5 px-3">Cliente</th>
                <th class="py-2.5 px-3">Platos</th>
                <th class="py-2.5 px-3 text-right">Bruto</th>
                <th class="py-2.5 px-3 text-right text-rose-400">Comisión</th>
                <th class="py-2.5 px-3 text-right text-[#06C167]">Neto</th>
                <th class="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#262626]">
              ${orders.map(o => {
                const isCancelled = o.status === 'CANCELLED';
                const oGross = isCancelled ? 0 : Number(o.total);
                const oComm = isCancelled ? 0 : (oGross * COMMISSION_RATE / 100);
                const oNet = oGross - oComm;
                return `
                  <tr class="hover:bg-[#1A1A1A] transition-colors">
                    <td class="py-3 px-3 font-mono font-bold text-[#06C167]">#${o.id.slice(0,8)}</td>
                    <td class="py-3 px-3 text-white font-medium">${o.client_name}</td>
                    <td class="py-3 px-3 text-[#A6A6A6] truncate max-w-xs">${o.items.map(i => i.quantity + 'x ' + i.name).join(', ')}</td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-white">C$ ${oGross.toFixed(2)}</td>
                    <td class="py-3 px-3 text-right font-mono text-rose-400">-C$ ${oComm.toFixed(2)}</td>
                    <td class="py-3 px-3 text-right font-mono text-[#06C167] font-bold">C$ ${oNet.toFixed(2)}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isCancelled ? 'bg-rose-500/20 text-rose-300' : 'bg-[#06C167]/20 text-[#06C167]'
                      }">${o.status}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
    }

    function printShiftReport() {
      window.print();
    }

    // ========================================================================
    // RESEÑAS & CALIFICACIONES
    // ========================================================================
    function renderReviewsFeed() {
      const elCount = document.getElementById('reviewsTotalCount') || document.getElementById('reviewsCountBadge');
      if (elCount) elCount.innerText = `(${reviews.length} opiniones)`;

      const elAvg = document.getElementById('reviewsAverageRating');
      if (elAvg && reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        elAvg.innerText = (sum / reviews.length).toFixed(1);
      }

      const listContainer = document.getElementById('reviewsFeedList') || document.getElementById('reviewsList');
      if (listContainer) {
        listContainer.innerHTML = reviews.map(r => `
          <div class="p-5 bg-[#121212] border border-[#262626] rounded-3xl shadow-xl space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-extrabold text-white text-sm flex items-center gap-2">
                  <span>${r.author}</span>
                  <span class="text-[10px] bg-[#06C167]/15 text-[#06C167] px-2 py-0.5 rounded-full border border-[#06C167]/30">Pedido Entregado ✓</span>
                </p>
                <div class="text-amber-400 text-sm mt-0.5">
                  ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                  <span class="text-[10px] text-[#757575] font-mono ml-1.5">${r.order_ref}</span>
                </div>
              </div>
              <span class="text-[11px] text-[#757575] font-mono">${r.date}</span>
            </div>

            <p class="text-xs text-[#A6A6A6] leading-relaxed">${r.comment}</p>

            ${r.reply ? `
              <div class="p-3 rounded-2xl bg-black border border-[#262626] text-xs">
                <p class="font-bold text-[#06C167] text-[11px] mb-1">Respuesta del Comercio:</p>
                <p class="text-white">${r.reply}</p>
              </div>
            ` : `
              <div id="reply-box-${r.id}" class="hidden pt-2 border-t border-[#262626] space-y-2">
                <textarea id="reply-input-${r.id}" placeholder="Escribe tu respuesta pública al cliente..." rows="2" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]"></textarea>
                <div class="flex justify-end gap-2">
                  <button onclick="toggleReplyBox('${r.id}')" class="px-3 py-1.5 rounded-full bg-[#1F1F1F] text-[#A6A6A6] text-xs font-semibold">Cancelar</button>
                  <button onclick="submitReply('${r.id}')" class="px-4 py-1.5 rounded-full bg-[#06C167] text-black text-xs font-black">Enviar Respuesta</button>
                </div>
              </div>
              <div id="reply-btn-${r.id}" class="pt-1">
                <button onclick="toggleReplyBox('${r.id}')" class="text-xs text-[#06C167] hover:underline font-semibold flex items-center gap-1">
                  <span>💬</span> Responder al Cliente
                </button>
              </div>
            `}
          </div>
        `).join('');
      }
    }

    function toggleReplyBox(id) {
      const box = document.getElementById('reply-box-' + id);
      const btn = document.getElementById('reply-btn-' + id);
      if (box) box.classList.toggle('hidden');
      if (btn) btn.classList.toggle('hidden');
    }

    function submitReply(id) {
      const input = document.getElementById('reply-input-' + id);
      const text = input ? input.value : '';
      if (!text) return;
      reviews = reviews.map(r => r.id === id ? { ...r, reply: text } : r);
      renderReviewsFeed();
      showToast('💬 Respuesta Publicada', 'El cliente podrá ver tu agradecimiento o respuesta.');
      fetch('/api/restaurant/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, reply: text })
      }).catch(() => {});
    }

    // ========================================================================
    // AJUSTES DEL COMERCIO (PERSISTENCIA EN SUPABASE)
    // ========================================================================
    
    // ========================================================================
    // GESTIÓN DE ROLES Y NIVELES DE USUARIO (RBAC: ADMIN VS STAFF)
    // ========================================================================
    let pedidosnica_rest_user = {
      id: 'ecaae45b-e723-49b7-8cae-65f0897f1861',
      full_name: 'Roberto Morales',
      email: 'admin@eldiamante.com',
      role: 'RESTAURANT_ADMIN',
      subrole: 'ADMIN',
      phone: '+505 8833-4455'
    };


    // ========================================================================
    // SESIÓN INDEPENDIENTE DE RESTAURANTE Y MULTIGESTIÓN DE SUCURSALES
    // ========================================================================
    let pedidosnica_rest_session = null;

    function initRestUserAuth() {
      try {
        const stored = localStorage.getItem('pedidosnica_rest_session');
        if (stored) {
          pedidosnica_rest_session = JSON.parse(stored);
        }
      } catch (e) {}

      const loginGate = document.getElementById('restaurantLoginGate');
      const rootContent = document.getElementById('restaurantAppRootContent');

      if (!pedidosnica_rest_session || !pedidosnica_rest_session.id) {
        if (loginGate) loginGate.classList.remove('hidden');
        if (rootContent) rootContent.classList.add('hidden');
        return false;
      }

      if (loginGate) loginGate.classList.add('hidden');
      if (rootContent) rootContent.classList.remove('hidden');

      // Asignar ID del restaurante de la sesión
      if (pedidosnica_rest_session.restaurant_id) {
        currentRestaurantId = pedidosnica_rest_session.restaurant_id;
      }

      // Configurar vista de sucursales (Unidad Única vs Multi-gestión)
      const singleView = document.getElementById('singleBranchView');
      const multiView = document.getElementById('multiBranchView');
      const headerName = document.getElementById('headerRestName');
      const dropdown = document.getElementById('restaurantSelectDropdown');
      const modalStoreName = document.getElementById('restModalStoreName');
      const modalAccountType = document.getElementById('restModalAccountType');

      if (headerName) headerName.innerText = pedidosnica_rest_session.restaurant_name || 'Pupusería & Antojitos El Diamante';
      if (modalStoreName) modalStoreName.innerText = pedidosnica_rest_session.restaurant_name || 'Pupusería & Antojitos El Diamante';

      if (pedidosnica_rest_session.is_multi_management) {
        if (singleView) singleView.classList.add('hidden');
        if (multiView) multiView.classList.remove('hidden');
        if (modalAccountType) modalAccountType.innerText = '🏢 Cadena / Multi-gestión';

        if (dropdown && pedidosnica_rest_session.authorized_restaurants) {
          dropdown.innerHTML = pedidosnica_rest_session.authorized_restaurants.map(r => `
            <option value="${r.id}" ${r.id === currentRestaurantId ? 'selected' : ''}>${r.name}</option>
          `).join('');
        }
      } else {
        if (singleView) singleView.classList.remove('hidden');
        if (multiView) multiView.classList.add('hidden');
        if (modalAccountType) modalAccountType.innerText = '🏷️ Sucursal Única (Sin multi-gestión)';
      }

      updateRestUserUi();
      return true;
    }

    window.loginRestaurantWithForm = async function() {
      const emailInput = document.getElementById('restLoginEmail');
      const passInput = document.getElementById('restLoginPassword');
      if (!emailInput || !passInput) return;
      await loginRestaurant(emailInput.value.trim(), passInput.value.trim());
    };

    window.quickFillRestLogin = async function(email, password) {
      const emailInput = document.getElementById('restLoginEmail');
      const passInput = document.getElementById('restLoginPassword');
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = password;
      await loginRestaurant(email, password);
    };

    async function loginRestaurant(email, password) {
      const btn = document.getElementById('btnRestLoginSubmit');
      if (btn) {
        btn.innerText = 'Verificando credenciales...';
        btn.disabled = true;
      }

      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await resp.json();

        if (data.success && data.user) {
          if (data.user.role !== 'RESTAURANT_ADMIN') {
            alert('Esta cuenta (' + data.user.full_name + ') tiene rol ' + data.user.role + '. Solo los usuarios de Restaurante pueden ingresar aquí.');
            if (btn) {
              btn.innerText = 'Ingresar al Panel del Restaurante';
              btn.disabled = false;
            }
            return;
          }

          pedidosnica_rest_session = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name,
            phone: data.user.phone,
            role: data.user.role,
            subrole: data.user.subrole || 'ADMIN',
            is_multi_management: !!data.user.is_multi_management,
            restaurant_id: data.user.restaurant_id || '6701bc0c-e5ce-475a-8893-75e9d06e8012',
            restaurant_name: data.user.restaurant_name || 'Pupusería & Antojitos El Diamante',
            authorized_restaurants: data.user.authorized_restaurants || []
          };

          currentRestaurantId = pedidosnica_rest_session.restaurant_id;
          localStorage.setItem('active_restaurant_id', currentRestaurantId);

          // Sincronizar también pedidosnica_rest_user para compatibilidad interna
          pedidosnica_rest_user = { ...pedidosnica_rest_session };
          localStorage.setItem('pedidosnica_rest_session', JSON.stringify(pedidosnica_rest_session));
          localStorage.setItem('pedidosnica_rest_user', JSON.stringify(pedidosnica_rest_user));

          initRestUserAuth();
          await loadSupabaseRestaurantData();
          showToast('👋 Bienvenido', 'Sesión iniciada como ' + data.user.full_name);
        } else {
          alert(data.error || 'Credenciales inválidas para este comercio.');
        }
      } catch (e) {
        alert('Error de conexión con el servidor.');
      } finally {
        if (btn) {
          btn.innerText = 'Ingresar al Panel del Restaurante';
          btn.disabled = false;
        }
      }
    }

    window.logoutRestaurant = function() {
      localStorage.removeItem('pedidosnica_rest_session');
      localStorage.removeItem('pedidosnica_rest_user');
      pedidosnica_rest_session = null;
      closeRestUserModal();
      initRestUserAuth();
      showToast('👋 Sesión Cerrada', 'Has cerrado la sesión del restaurante.');
    };

    // Cambio de Sucursal (Exclusivo para cuentas con is_multi_management === true)
    async function switchRestaurant(newId) {
      if (!newId) return;

      if (!pedidosnica_rest_session || !pedidosnica_rest_session.is_multi_management) {
        alert('⚠️ ACCESO DENEGADO:\n\nEsta cuenta no posee permisos de multi-gestión de cadena. No puedes alternar a otras sucursales.');
        if (pedidosnica_rest_session && pedidosnica_rest_session.restaurant_id) {
          const dropdown = document.getElementById('restaurantSelectDropdown');
          if (dropdown) dropdown.value = pedidosnica_rest_session.restaurant_id;
        }
        return;
      }

      if (newId === 'all') {
        currentRestaurantId = 'all';
        pedidosnica_rest_session.restaurant_id = 'all';
        pedidosnica_rest_session.restaurant_name = '🏢 Todos mis locales';
        localStorage.setItem('pedidosnica_rest_session', JSON.stringify(pedidosnica_rest_session));
        localStorage.setItem('active_restaurant_id', 'all');

        const headerName = document.getElementById('headerRestName');
        const modalStoreName = document.getElementById('restModalStoreName');
        if (headerName) headerName.innerText = '🏢 Todos mis locales';
        if (modalStoreName) modalStoreName.innerText = '🏢 Todos mis locales';

        showToast('🏢 Sucursales Globales', 'Visualizando métricas consolidadas');
        await loadSupabaseRestaurantData();
        return;
      }

      const match = (pedidosnica_rest_session.authorized_restaurants || []).find(r => r.id === newId);
      if (!match) {
        alert('⚠️ Esta sucursal no forma parte de tu grupo comercial autorizado.');
        return;
      }

      currentRestaurantId = newId;
      pedidosnica_rest_session.restaurant_id = newId;
      pedidosnica_rest_session.restaurant_name = match.name;
      localStorage.setItem('pedidosnica_rest_session', JSON.stringify(pedidosnica_rest_session));
      localStorage.setItem('active_restaurant_id', newId);

      const headerName = document.getElementById('headerRestName');
      const modalStoreName = document.getElementById('restModalStoreName');
      if (headerName) headerName.innerText = match.name;
      if (modalStoreName) modalStoreName.innerText = match.name;

      showToast('🏢 Sucursal Cambiada', 'Operando ahora en ' + match.name);
      await loadSupabaseRestaurantData();
    }


    function openRestUserModal() {
      const modal = document.getElementById('modalRestaurantUserLevel');
      if (modal) modal.classList.remove('hidden');
    }

    function closeRestUserModal() {
      const modal = document.getElementById('modalRestaurantUserLevel');
      if (modal) modal.classList.add('hidden');
    }

    function switchRestUserLevel(level) {
      if (level === 'ADMIN') {
        pedidosnica_rest_user = {
          id: 'ecaae45b-e723-49b7-8cae-65f0897f1861',
          full_name: 'Roberto Morales',
          email: 'admin@eldiamante.com',
          role: 'RESTAURANT_ADMIN',
          subrole: 'ADMIN',
          phone: '+505 8833-4455'
        };
        showToast('👑 Rol Cambiado: Administrador', 'Acceso completo a ajustes de tienda, precios y KDS.');
      } else {
        pedidosnica_rest_user = {
          id: 'eaba2f82-1794-4c73-9c6f-2c426d949ff4',
          full_name: 'Pedro Ruiz',
          email: 'cocina@eldiamante.com',
          role: 'RESTAURANT_ADMIN',
          subrole: 'STAFF',
          phone: '+505 8765-4321'
        };
        showToast('👨‍🍳 Rol Cambiado: Operador de Cocina', 'Acceso exclusivo a comandas KDS. Ajustes comerciales protegidos.');
      }
      localStorage.setItem('pedidosnica_rest_user', JSON.stringify(pedidosnica_rest_user));
      updateRestUserUi();
      closeRestUserModal();
    }

    async function saveRestUserProfile() {
      const nameInput = document.getElementById('restProfileNameInput');
      const phoneInput = document.getElementById('restProfilePhoneInput');
      if (!nameInput || !phoneInput) return;

      const full_name = nameInput.value.trim();
      const phone = phoneInput.value.trim();

      pedidosnica_rest_user.full_name = full_name;
      pedidosnica_rest_user.phone = phone;
      localStorage.setItem('pedidosnica_rest_user', JSON.stringify(pedidosnica_rest_user));

      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: pedidosnica_rest_user.id,
            fullName: full_name,
            phone: phone
          })
        });
      } catch (e) {}

      updateRestUserUi();
      closeRestUserModal();
      showToast('👤 Perfil Actualizado', 'Tus datos fueron guardados exitosamente.');
    }

    function updateRestUserUi() {
      const isStaff = pedidosnica_rest_user && pedidosnica_rest_user.subrole === 'STAFF';

      // Actualizar badge en la cabecera
      const icon = document.getElementById('restRoleIcon');
      const text = document.getElementById('restRoleText');
      const btn = document.getElementById('restUserBadgeBtn');

      if (icon) icon.innerText = isStaff ? '👨‍🍳' : '👑';
      if (text) text.innerText = (isStaff ? 'Cocina: ' : 'Admin: ') + pedidosnica_rest_user.full_name;

      if (btn) {
        if (isStaff) {
          btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 transition-all shadow-md';
        } else {
          btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs text-purple-300 transition-all shadow-md';
        }
      }

      // Actualizar inputs en modal
      const nameInput = document.getElementById('restProfileNameInput');
      const phoneInput = document.getElementById('restProfilePhoneInput');
      if (nameInput) nameInput.value = pedidosnica_rest_user.full_name || '';
      if (phoneInput) phoneInput.value = pedidosnica_rest_user.phone || '';

      // Actualizar estilos activos de tarjetas en modal
      const cardAdmin = document.getElementById('cardRoleAdmin');
      const cardStaff = document.getElementById('cardRoleStaff');
      if (cardAdmin && cardStaff) {
        if (isStaff) {
          cardAdmin.className = 'p-3.5 rounded-2xl bg-[#12151D] border border-[#262D3B] hover:border-purple-500 cursor-pointer transition-all space-y-1';
          cardStaff.className = 'p-3.5 rounded-2xl bg-[#182030] border-2 border-blue-500 cursor-pointer transition-all space-y-1 shadow-lg';
        } else {
          cardAdmin.className = 'p-3.5 rounded-2xl bg-[#1E172B] border-2 border-purple-500 cursor-pointer transition-all space-y-1 shadow-lg';
          cardStaff.className = 'p-3.5 rounded-2xl bg-[#12151D] border border-[#262D3B] hover:border-blue-500 cursor-pointer transition-all space-y-1';
        }
      }

      // Restricción de Ajustes (Ajustes sólo para ADMIN)
      const lockedNotice = document.getElementById('staffSettingsLockedNotice');
      const saveBtn = document.getElementById('btnSaveStoreSettings') || document.querySelector('#section-settings button[type="submit"]');
      const settingsSection = document.getElementById('section-settings');

      if (settingsSection) {
        const inputs = settingsSection.querySelectorAll('input, select, textarea');
        inputs.forEach(inp => {
          if (inp.id !== 'restProfileNameInput' && inp.id !== 'restProfilePhoneInput') {
            inp.disabled = isStaff;
            if (isStaff) {
              inp.classList.add('opacity-60', 'cursor-not-allowed');
            } else {
              inp.classList.remove('opacity-60', 'cursor-not-allowed');
            }
          }
        });
      }

      if (saveBtn) {
        saveBtn.disabled = isStaff;
        if (isStaff) {
          saveBtn.classList.add('opacity-40', 'cursor-not-allowed');
          saveBtn.title = 'Requiere permisos de Administrador de Restaurante';
        } else {
          saveBtn.classList.remove('opacity-40', 'cursor-not-allowed');
          saveBtn.title = '';
        }
      }

      if (lockedNotice) {
        if (isStaff) {
          lockedNotice.classList.remove('hidden');
        } else {
          lockedNotice.classList.add('hidden');
        }
      }
    }

    async function saveStoreSettings(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (pedidosnica_rest_user && pedidosnica_rest_user.subrole === 'STAFF') {
        showToast('🔒 Permiso Insuficiente', 'Solo el Administrador del restaurante puede guardar la configuración del comercio.', '⚠️');
        return;
      }
      const elName = document.getElementById('settStoreName') || document.getElementById('setRestName');
      const elPhone = document.getElementById('settStorePhone') || document.getElementById('setRestPhone');
      const elAddress = document.getElementById('settStoreAddress') || document.getElementById('setRestAddress');
      const elHours = document.getElementById('settStoreHours') || document.getElementById('setRestHours');
      const elPrep = document.getElementById('settStorePrepMinutes') || document.getElementById('basePrepSelect') || document.getElementById('setRestPrepTime');
      const elRadius = document.getElementById('settStoreDeliveryRadius');
      const elLogo = document.getElementById('settStoreLogoUrl');

      const name = elName ? elName.value : 'Pupusería & Antojitos El Diamante';
      const phone = elPhone ? elPhone.value : '+505 8899-7711';
      const address = elAddress ? elAddress.value : 'Colonial Los Robles, Managua';
      const hours = elHours ? elHours.value : '11:00 - 23:00';
      const prep = elPrep ? parseInt(elPrep.value) || 20 : 20;
      const radius = elRadius ? parseFloat(elRadius.value) || 5.0 : 5.0;
      const logo = elLogo ? elLogo.value : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100';

      basePrepMinutes = prep;
      const hName = document.getElementById('headerRestName');
      if (hName) hName.innerText = name;
      const basePrepEl = document.getElementById('basePrepSelect');
      if (basePrepEl) basePrepEl.value = prep;

      showToast('⚙️ Ajustes Guardados', 'Los parámetros de ' + name + ' fueron actualizados.');

      try {
        await fetch('/api/restaurant/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: currentRestaurantId,
            restaurant_id: currentRestaurantId,
            requesterRole: pedidosnica_rest_user?.role || 'RESTAURANT_ADMIN',
            requesterSubrole: pedidosnica_rest_user?.subrole || 'ADMIN',
            name,
            phone,
            address,
            openingHours: hours,
            opening_hours: hours,
            prepTimeMinutes: prep,
            estimated_prep_time_minutes: prep,
            deliveryRadiusKm: radius,
            delivery_radius_km: radius,
            logoUrl: logo,
            logo_url: logo
          })
        });
      } catch (e) {
        console.warn('Sync store settings failed:', e);
      }
    }

    // ========================================================================
    // TOAST NOTIFICATIONS
    // ========================================================================
    let toastTimeout = null;

    function showToast(title, message, icon = '🔔') {
      const toast = document.getElementById('toastNotification');
      if (!toast) return;
      const elTitle = document.getElementById('toastTitle');
      const elMsg = document.getElementById('toastMessage');
      const elIcon = document.getElementById('toastIcon');

      if (elTitle) elTitle.innerText = title;
      if (elMsg) elMsg.innerText = message;
      if (elIcon) elIcon.innerText = icon;

      toast.classList.remove('hidden');
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3500);
    }

    // ========================================================================
    // CONEXIÓN EN TIEMPO REAL CON SUPABASE
    // ========================================================================
    function setupSupabaseRealtime() {
      if (!supabaseClient) return;
      try {
        const channel = supabaseClient.channel('restaurant-orders-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            console.log('[KDS Supabase Realtime]', payload.eventType, payload.new?.id, payload.new?.status);
            loadSupabaseRestaurantData();
            if (payload.eventType === 'INSERT') {
              showToast('🔔 Nuevo Pedido Supabase', 'Orden #' + (payload.new.id ? payload.new.id.slice(0,8) : ''));
              playChimeSound();
            } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'DRIVER_ASSIGNED') {
              showToast('🛵 Repartidor Asignado', 'Un motorizado ha tomado la comanda.');
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime fallback local:', err);
      }
    }

    // ========================================================================
    // EXPOSICIÓN GLOBAL A WINDOW PARA MANEJADORES INLINE HTML
    // ========================================================================
    window.switchTab = switchTab;
    window.toggleStoreStatusMenu = toggleStoreStatusMenu;
    window.setStoreStatus = setStoreStatus;
    window.updateBasePrep = updateBasePrep;
    window.toggleMute = toggleMute;
    window.testChimeSound = testChimeSound;
    window.setKdsView = setKdsView;
    window.setKdsColumnFilter = setKdsColumnFilter;
    window.acceptOrder = acceptOrder;
    window.markReadyForPickup = markReadyForPickup;
    window.openThermalTicket = openThermalTicket;
    window.closeThermalTicketModal = closeThermalTicketModal;
    window.closeThermalTicket = closeThermalTicketModal;
    window.printThermalTicket = printThermalTicket;
    window.openRejectModal = openRejectModal;
    window.closeRejectModal = closeRejectModal;
    window.confirmRejectOrder = confirmRejectOrder;
    window.simulateCustomerOrder = simulateCustomerOrder;
    window.filterCategory = filterCategory;
    window.renderProductsGrid = renderProductsGrid;
    window.openProductModal = openProductModal;
    window.closeProductModal = closeProductModal;
    window.previewCustomizer = previewCustomizer;
    window.closePreviewModal = closePreviewModal;
    window.editProduct = editProduct;
    window.duplicateProduct = duplicateProduct;
    window.deleteProduct = deleteProduct;
    window.toggleProductStock = toggleProductStock;
    window.closePauseStockModal = closePauseStockModal;
    window.confirmPauseStock = confirmPauseStock;
    window.saveProductItem = saveProductItem;
    window.renderHistoryOrders = renderHistoryOrders;
    window.saveStoreSettings = saveStoreSettings;
    window.openRestUserModal = openRestUserModal;
    window.closeRestUserModal = closeRestUserModal;
    window.switchRestUserLevel = switchRestUserLevel;
    window.saveRestUserProfile = saveRestUserProfile;
    window.updateRestUserUi = updateRestUserUi;
    window.printShiftReport = printShiftReport;
    window.toggleReplyBox = toggleReplyBox;
    window.submitReply = submitReply;
    window.showToast = showToast;
    window.switchRestaurant = switchRestaurant;
    window.confirmDriverPickup = confirmDriverPickup;
    window.calcCustomizerTotal = calcCustomizerTotal;