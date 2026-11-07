
  // ============================================================================
  // GESTIÓN DE PERFIL DEL CLIENTE, MÚLTIPLES DIRECCIONES Y SEGURIDAD
  // ============================================================================
  let clientUser = null;
  window.clientUser = null;

  // Direcciones predeterminadas sugeridas en modo invitado si aún no tiene libreta propia
  const DEFAULT_GUEST_ADDRESSES = [
    {
      id: 'guest-addr-1',
      label: 'Casa',
      icon: '🏠',
      building_type: 'CASA',
      zone: 'Galerías / Las Colinas',
      address: 'Galerías Santo Domingo, Condominio Las Colinas Casa #14, Managua',
      reference: 'Portón negro, llamar al llegar',
      recipient_phone: '+505 8888-0000',
      lat: 12.1022,
      lng: -86.2415,
      is_default: true
    },
    {
      id: 'guest-addr-2',
      label: 'Oficina',
      icon: '🏢',
      building_type: 'OFICINA',
      zone: 'Carretera a Masaya / Centro Pellas',
      address: 'Centro Pellas, Carretera a Masaya Km 4.5, Piso 6, Managua',
      reference: 'Dejar en recepción corporativa',
      recipient_phone: '+505 8888-0000',
      lat: 12.1185,
      lng: -86.2562,
      is_default: false
    }
  ];

  function getActiveSavedAddresses() {
    if (clientUser && Array.isArray(clientUser.saved_addresses) && clientUser.saved_addresses.length > 0) {
      return clientUser.saved_addresses;
    }
    try {
      const guestSaved = localStorage.getItem('pedidosnica_guest_addresses');
      if (guestSaved) {
        const parsed = JSON.parse(guestSaved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_GUEST_ADDRESSES));
  }

  function saveLocalAddressList(list) {
    if (clientUser) {
      clientUser.saved_addresses = list;
      const def = list.find(a => a.is_default) || list[0];
      if (def) {
        clientUser.address = def.address;
        clientUser.notes = def.reference || '';
      }
      try {
        localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
      } catch (e) {}
    } else {
      try {
        localStorage.setItem('pedidosnica_guest_addresses', JSON.stringify(list));
      } catch (e) {}
    }
  }

  function populateCartAddressDropdown() {
    const selectEl = document.getElementById('cartSavedAddressSelect');
    if (!selectEl) return;
    const list = getActiveSavedAddresses();
    const currentAddrText = document.getElementById('cartDeliveryAddress')?.value || clientUser?.address || '';

    selectEl.innerHTML = `<option value="">📍 Elegir de mis direcciones (${list.length} guardadas)...</option>` +
      list.map(a => {
        const isSelected = a.is_default || (currentAddrText && a.address === currentAddrText);
        return `<option value="${a.id}" ${isSelected ? 'selected' : ''}>${a.icon || '📍'} ${a.label}: ${a.address}</option>`;
      }).join('');
  }
  window.populateCartAddressDropdown = populateCartAddressDropdown;

  function initClientAuth() {
    try {
      const stored = localStorage.getItem('pedidosnica_client_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.full_name && parsed.full_name.toLowerCase().includes('valeria rossi')) {
          localStorage.removeItem('pedidosnica_client_user');
          clientUser = null;
        } else if (parsed && parsed.full_name) {
          clientUser = parsed;
        }
      }
    } catch (e) {}
    window.clientUser = clientUser;

    const nameEl = document.getElementById('clientHeaderName');
    const sublabelEl = document.getElementById('clientHeaderSublabel');
    const avatarEl = document.getElementById('clientHeaderAvatar');

    if (clientUser && clientUser.full_name) {
      if (nameEl) nameEl.innerText = clientUser.full_name;
      if (sublabelEl) sublabelEl.innerText = 'Mi Cuenta • Perfil ▼';
      if (avatarEl) {
        avatarEl.src = clientUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientUser.full_name)}&background=06C167&color=000&bold=true`;
        avatarEl.alt = clientUser.full_name;
      }
    } else {
      if (nameEl) nameEl.innerText = 'Iniciar Sesión';
      if (sublabelEl) sublabelEl.innerText = 'Invitado • Entrar ▼';
      if (avatarEl) {
        avatarEl.src = 'https://ui-avatars.com/api/?name=Invitado&background=1F1F1F&color=06C167&bold=true';
        avatarEl.alt = 'Invitado';
      }
    }

    const savedList = getActiveSavedAddresses();
    const defaultAddrObj = savedList.find(a => a.is_default) || savedList[0];
    const activeAddr = (clientUser && clientUser.address)
      ? clientUser.address
      : (defaultAddrObj ? defaultAddrObj.address : 'Galerías Santo Domingo, Managua');
    const activeNotes = (clientUser && clientUser.notes !== undefined)
      ? clientUser.notes
      : (defaultAddrObj ? (defaultAddrObj.reference || '') : '');
    const activePhone = (clientUser && clientUser.phone)
      ? clientUser.phone
      : (defaultAddrObj ? (defaultAddrObj.recipient_phone || '+505 8888-0000') : '+505 8888-0000');

    const cartAddr = document.getElementById('cartDeliveryAddress');
    if (cartAddr) cartAddr.value = activeAddr;

    const cartNotes = document.getElementById('cartDeliveryNotes');
    if (cartNotes && activeNotes) cartNotes.value = activeNotes;

    const cartPhone = document.getElementById('cartClientPhone');
    if (cartPhone) cartPhone.value = activePhone;

    const checkoutAddr = document.getElementById('checkoutAddress');
    if (checkoutAddr) checkoutAddr.value = activeAddr;

    const headerAddr = document.getElementById('headerAddressLabel');
    if (headerAddr) {
      const labelPrefix = defaultAddrObj && defaultAddrObj.address === activeAddr ? `${defaultAddrObj.label}: ` : '';
      headerAddr.innerText = `${labelPrefix}${activeAddr}`;
    }

    populateCartAddressDropdown();
  }
  window.initClientAuth = initClientAuth;

  window.openClientProfileModal = function(initialTab) {
    const modal = document.getElementById('modalClientProfile') || document.getElementById('clientProfileModal');
    if (modal) modal.classList.remove('hidden');

    const nameInput = document.getElementById('clientProfileNameInput');
    const phoneInput = document.getElementById('clientProfilePhoneInput');
    const emailInput = document.getElementById('clientProfileEmailInput');
    const addrInput = document.getElementById('clientProfileAddressInput');
    const notesInput = document.getElementById('clientProfileNotesInput');
    const secQInput = document.getElementById('clientProfileSecQuestion');
    const secAInput = document.getElementById('clientProfileSecAnswer');
    const newPassInput = document.getElementById('clientProfileNewPassword');

    if (nameInput) nameInput.value = clientUser?.full_name || '';
    if (phoneInput) phoneInput.value = clientUser?.phone || '';
    if (emailInput) emailInput.value = clientUser?.email || '';
    if (addrInput) addrInput.value = clientUser?.address || 'Galerías Santo Domingo, Managua';
    if (notesInput) notesInput.value = clientUser?.notes || '';
    if (secQInput && clientUser?.security_question) secQInput.value = clientUser.security_question;
    if (secAInput) secAInput.value = '';
    if (newPassInput) newPassInput.value = '';

    if (typeof window.renderClientAddressBook === 'function') {
      window.renderClientAddressBook();
    }

    if (initialTab && typeof window.switchClientModalTab === 'function') {
      window.switchClientModalTab(initialTab);
      return;
    }

    if (!clientUser || !clientUser.full_name) {
      if (typeof window.switchClientModalTab === 'function') {
        window.switchClientModalTab('auth');
      }
    } else {
      if (typeof window.switchClientModalTab === 'function') {
        window.switchClientModalTab('addresses');
      }
    }
  };

  window.closeClientProfileModal = function() {
    const modal = document.getElementById('modalClientProfile') || document.getElementById('clientProfileModal');
    if (modal) modal.classList.add('hidden');
  };

  window.saveClientProfile = async function() {
    const nameInput = document.getElementById('clientProfileNameInput');
    const phoneInput = document.getElementById('clientProfilePhoneInput');
    const emailInput = document.getElementById('clientProfileEmailInput');
    const addrInput = document.getElementById('clientProfileAddressInput');
    const notesInput = document.getElementById('clientProfileNotesInput');
    const secQInput = document.getElementById('clientProfileSecQuestion');
    const secAInput = document.getElementById('clientProfileSecAnswer');
    const newPassInput = document.getElementById('clientProfileNewPassword');

    const fullName = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '+505 8888-0000';
    const email = emailInput ? emailInput.value.trim() : '';
    const address = addrInput ? addrInput.value.trim() : 'Galerías Santo Domingo, Managua';
    const notes = notesInput ? notesInput.value.trim() : '';
    const securityQuestion = secQInput ? secQInput.value : '¿Cuál es tu comida nica favorita?';
    const securityAnswer = secAInput ? secAInput.value.trim() : '';
    const newPassword = newPassInput ? newPassInput.value.trim() : '';

    if (!fullName) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!clientUser) {
      clientUser = {
        id: 'c91f2a10-1234-4a9b-9c11-887766554433',
        saved_addresses: getActiveSavedAddresses()
      };
    }

    clientUser.full_name = fullName;
    clientUser.phone = phone;
    if (email) clientUser.email = email;
    clientUser.address = address;
    clientUser.notes = notes;
    clientUser.security_question = securityQuestion;

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: clientUser.id,
          fullName,
          phone,
          email: email || undefined,
          address,
          notes,
          savedAddresses: clientUser.saved_addresses,
          securityQuestion,
          securityAnswer: securityAnswer || undefined,
          newPassword: newPassword || undefined
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        clientUser = { ...clientUser, ...data.user };
      }
    } catch (e) {
      console.warn('Error saving client profile:', e);
    }

    try {
      localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
    } catch (e) {}
    window.clientUser = clientUser;
    initClientAuth();

    playNotificationSound();
    alert('✓ Tus datos de perfil, teléfono, dirección y seguridad han sido actualizados.');
  };

// ============================================================================
// CLIENT FRONTEND - LOGICA INTERACTIVA DEL COMENSAL Y TRACKING EN VIVO
// PEDIDOSNICA: BÚSQUEDA AMPLIA POR PALABRA CLAVE, RADIO DELIMITADO Y DESPACHO AUTOMÁTICO
// ============================================================================

(function () {
  const SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';

  // Inicializar Supabase Realtime para clientes
  let supabase = null;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }

  // Estado Global del Comensal
  let allRestaurants = [];
  let catalogProducts = [];
  let categoriesList = ['Todos'];
  let currentCategory = 'Todos';
  let searchQuery = '';
  let selectedRestaurantId = null;
  let activeRestaurantData = null;
  let cart = [];
  let selectedProduct = null;
  let modalQty = 1;
  let activeOrderId = null;
  let activeOrder = null;
  let orderPollingInterval = null;
  let mapInstance = null;
  let driverMarker = null;
  let restaurantMarker = null;
  let destinationMarker = null;
  let selectedRating = 5;
  let selectedPayment = 'CASH';

  // Coordenadas del Comensal en Managua (Galerías Santo Domingo por defecto: [lng, lat])
  let currentDeliveryCoords = [-86.2415, 12.1022];
  let currentDeliveryAddress = 'Galerías Santo Domingo, Managua';

  // Coordenadas dinámicas del restaurante del pedido en curso
  let currentOrderRestCoords = [-86.2635, 12.1265];

  // ============================================================================
  // MOTOR DE BÚSQUEDA AMPLIA (FUZZY / STEMMING / RELACIONES CULINARIAS)
  // ============================================================================
  function normalizeStr(s) {
    if (!s) return '';
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos/tildes
      .trim();
  }

  function getWordStem(word) {
    if (!word || word.length < 3) return word;
    if (word.endsWith('es')) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    return word;
  }

  // Diccionario de relaciones y términos culinarios asociados para búsqueda no estricta
  const CULINARY_RELATIONS = {
    'pupu': ['pupusa', 'pupusas', 'chicharron', 'loroco', 'frijol', 'comal', 'curtido', 'salsa', 'queso'],
    'pupusa': ['pupusas', 'revuelta', 'chicharron', 'loroco', 'frijol', 'maiz', 'arroz', 'curtido', 'queso'],
    'pupusas': ['pupusa', 'revuelta', 'chicharron', 'loroco', 'frijol', 'maiz', 'arroz', 'curtido', 'queso'],
    'asado': ['asados', 'asada', 'carne', 'res', 'cerdo', 'pollo', 'toro', 'costilla', 'gallo pinto', 'tajada', 'maduro', 'queso frito'],
    'asados': ['asado', 'asada', 'carne', 'res', 'cerdo', 'pollo', 'toro', 'costilla', 'gallo pinto', 'tajada', 'maduro', 'queso frito'],
    'asada': ['asado', 'asados', 'carne', 'res', 'cerdo', 'toro', 'gallo pinto'],
    'carne': ['asado', 'asados', 'asada', 'res', 'cerdo', 'toro', 'burger', 'hamburguesa', 'empanada'],
    'cerdo': ['costilla', 'chicharron', 'lomo', 'adobado', 'asado', 'yuca'],
    'chicharron': ['cerdo', 'revuelta', 'pupusa', 'yuca'],
    'pizza': ['pizzas', 'pizzeria', 'napolitana', 'mozzarella', 'culona', 'pepperoni', 'calzone'],
    'pizzas': ['pizza', 'pizzeria', 'napolitana', 'mozzarella', 'culona', 'pepperoni', 'calzone'],
    'burger': ['hamburguesa', 'hamburguesas', 'cheddar', 'bacon', 'papas', 'combo'],
    'hamburguesa': ['burger', 'hamburguesas', 'cheddar', 'bacon', 'papas', 'combo'],
    'hamburguesas': ['burger', 'hamburguesa', 'cheddar', 'bacon', 'papas', 'combo'],
    'combo': ['combos', 'super', 'paquete', 'papas', 'bebida', 'gaseosa'],
    'combos': ['combo', 'super', 'paquete', 'papas', 'bebida', 'gaseosa'],
    'queso': ['pupusa', 'pizza', 'quesillo', 'mozzarella', 'cheddar', 'frito', 'tajadas', 'loroco'],
    'postre': ['tiramisu', 'dulce', 'torta', 'postres'],
    'postres': ['postre', 'tiramisu', 'dulce', 'torta'],
    'bebida': ['cacao', 'leche', 'horchata', 'refresco', 'gaseosa', 'jugo', 'frio'],
    'bebidas': ['bebida', 'cacao', 'leche', 'horchata', 'refresco', 'gaseosa', 'jugo', 'frio'],
    'cacao': ['bebida', 'leche', 'frio', 'artesanal', 'tipica', 'refresco'],
    'toro': ['asado', 'asados', 'carne', 'cerdo', 'cacao', 'gallo pinto', 'nica'],
    'diamante': ['pupusa', 'pupusas', 'antojitos', 'loroco', 'chicharron'],
    'napoli': ['pizza', 'pizzas', 'napolitana', 'italiano', 'tiramisu', 'burger'],
    'valenti': ['pizza', 'pizzas', 'culona']
  };

  function computeMatchScore(product, rawQuery) {
    if (!rawQuery) return 1;
    const qClean = normalizeStr(rawQuery);
    const qTokens = qClean.split(/[\s,+/]+/).filter(t => t.length > 0);
    if (qTokens.length === 0) return 1;

    const pName = normalizeStr(product.name);
    const pDesc = normalizeStr(product.description || '');
    const pCat = normalizeStr(product.category || '');
    const pRest = normalizeStr(product.restaurant_name || '');
    
    let pOptions = '';
    if (product.customization_groups && Array.isArray(product.customization_groups)) {
      product.customization_groups.forEach(g => {
        pOptions += ' ' + normalizeStr(g.title);
        if (g.options && Array.isArray(g.options)) {
          g.options.forEach(o => { pOptions += ' ' + normalizeStr(o.name); });
        }
      });
    }

    const words = `${pName} ${pDesc} ${pCat} ${pRest} ${pOptions}`.split(/[\s,()\-+.]+/).filter(w => w.length > 1);

    let score = 0;
    for (const token of qTokens) {
      const stem = getWordStem(token);

      // 1. Coincidencia directa en el nombre del platillo
      if (pName.includes(token)) score += 100;
      else if (pName.includes(stem)) score += 80;

      // 2. Coincidencia en la categoría
      if (pCat.includes(token) || pCat.includes(stem)) score += 50;

      // 3. Coincidencia en el nombre del restaurante (ej. Toro, Napoli, Diamante, Valenti)
      if (pRest.includes(token)) score += 120;
      else if (pRest.includes(stem)) score += 100;

      // 4. Coincidencia en ingredientes u opciones de personalización (ej. loroco, queso, chicharrón, tajadas)
      if (pOptions.includes(token) || pOptions.includes(stem)) score += 35;

      // 5. Coincidencia en la descripción del plato
      if (pDesc.includes(token) || pDesc.includes(stem)) score += 25;

      // 6. Coincidencia por prefijo / raíz parcial (mínimo 3 letras)
      const hasPrefixMatch = words.some(w => {
        const wStem = getWordStem(w);
        return (token.length >= 3 && (w.startsWith(token) || wStem.startsWith(stem)));
      });
      if (hasPrefixMatch) score += 20;

      // 7. Relaciones culinarias y conceptos asociados
      const relatedList = CULINARY_RELATIONS[token] || CULINARY_RELATIONS[stem] || [];
      for (const rel of relatedList) {
        if (pName.includes(rel)) score += 30;
        else if (pCat.includes(rel)) score += 20;
        else if (pDesc.includes(rel) || pOptions.includes(rel)) score += 15;
      }
    }

    return score;
  }

  function isBroadRelatedMatch(product, rawQuery) {
    return computeMatchScore(product, rawQuery) > 0;
  }

  // 1. INICIALIZACIÓN
  window.addEventListener('DOMContentLoaded', async () => {
    initClientAuth();
    const addrSelect = document.getElementById('quickAddressSelect');
    if (addrSelect && addrSelect.value) {
      const parts = addrSelect.value.split('|');
      currentDeliveryAddress = parts[0];
      currentDeliveryCoords = [parseFloat(parts[2]), parseFloat(parts[1])];
    }

    await loadCatalog();
    checkActiveOrder();
    initLiveSync();

    const urlParams = new URLSearchParams(window.location.search);
    const paramOrderId = urlParams.get('orderId') || urlParams.get('order_id');
    const rootEl = document.getElementById('clientAppRoot');
    const isInitialTracking = (rootEl && rootEl.dataset.initialView === 'tracking') || window.location.pathname.includes('/tracking');

    if (paramOrderId || isInitialTracking) {
      if (paramOrderId) activeOrderId = paramOrderId;
      toggleTrackingView(true, paramOrderId);
    }
  });

  // 1.1 SINCRONIZACIÓN EN VIVO (SSE + POLLING SILENCIOSO)
  function initLiveSync() {
    try {
      const evtSource = new EventSource('/api/live-stream');
      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PRODUCT_STOCK_CHANGED') {
            const p = catalogProducts.find(x => x.id === data.productId);
            if (p) {
              p.is_available = data.is_available;
              renderProducts();
              if (selectedProduct && selectedProduct.id === data.productId && !data.is_available) {
                closeProductModal();
                alert(`⚠️ Atención: "${p.name}" acaba de agotarse en cocina.`);
              }
            } else {
              loadCatalog(true);
            }
          } else if (data.type === 'PRODUCT_SAVED' || data.type === 'PRODUCT_DELETED' || data.type === 'RESTAURANT_ONBOARDED') {
            loadCatalog(true);
          }
        } catch (e) {
          console.warn('[SSE Parse Error]', e);
        }
      };
      evtSource.onerror = () => {};
    } catch (e) {
      console.warn('[SSE Live-Stream Unavailable]', e);
    }

    setInterval(() => {
      loadCatalog(true);
    }, 5000);
  }

  // 2. CARGA DEL CATÁLOGO DESDE EL BACKEND
  let lastCatalogSignature = '';

  async function loadCatalog(silent = false) {
    try {
      const lat = currentDeliveryCoords[1];
      const lng = currentDeliveryCoords[0];
      let queryUrl = `/api/client/catalog?lat=${lat}&lng=${lng}`;
      if (selectedRestaurantId) {
        queryUrl += `&restaurant_id=${selectedRestaurantId}`;
      }

      const res = await fetch(queryUrl);
      const data = await res.json();

      if (data.success) {
        const fetchedProducts = data.products || [];
        const newSignature = JSON.stringify(fetchedProducts.map(p => `${p.id}:${p.is_available}:${p.price}`));

        if (silent && newSignature === lastCatalogSignature) {
          // Si no hubo cambios en productos/precios/disponibilidad en silent polling, evitar re-renderizado
          return;
        }

        lastCatalogSignature = newSignature;
        allRestaurants = data.restaurants || [];
        catalogProducts = fetchedProducts;
        categoriesList = data.categories || ['Todos'];
        activeRestaurantData = data.restaurant || null;

        renderHeroBanner();
        renderRecommendedDishes();
        renderRestaurantsList();
        renderCategories();
        renderProducts();

        // Depurar carrito de productos agotados
        let cartChanged = false;
        cart = cart.filter(item => {
          const p = catalogProducts.find(x => x.id === item.product_id);
          if (p && p.is_available === false) {
            cartChanged = true;
            return false;
          }
          return true;
        });
        if (cartChanged) {
          updateCartUI();
          renderCartDrawerItems();
        }
      }
    } catch (e) {
      if (!silent) {
        console.error('Error al cargar catálogo:', e);
        const grid = document.getElementById('productsGrid');
        if (grid) {
          grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-rose-400 text-xs">
              Error al conectar con la carta. Intenta recargar la página.
            </div>`;
        }
      }
    }
  }

  // 3. RENDERIZADO DEL HERO BANNER
  function renderHeroBanner() {
    const hero = document.getElementById('heroContainer');
    if (!hero) return;

    if (selectedRestaurantId && activeRestaurantData) {
      const r = activeRestaurantData;
      hero.innerHTML = `
        <div class="h-40 sm:h-56 w-full relative">
          <img src="${r.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'}" alt="${r.name}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          
          <div class="absolute top-3 left-3">
            <button onclick="selectRestaurant(null)" class="px-4 py-2.5 min-h-[44px] rounded-2xl bg-black/85 hover:bg-black text-white text-xs sm:text-sm font-extrabold border border-white/25 flex items-center gap-2 backdrop-blur-md transition-all shadow-lg active:scale-95">
              <span class="text-base">←</span>
              <span>Ver todos los restaurantes</span>
            </button>
          </div>
        </div>

        <div class="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 relative -mt-8 sm:-mt-10 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">${r.name}</h1>
            <div class="flex flex-wrap items-center gap-2 mt-1.5 text-xs sm:text-sm text-[#A6A6A6]">
              <span class="flex items-center gap-1 font-bold text-white bg-[#1F1F1F] px-2.5 py-1 rounded-lg">
                ⭐ ${Number(r.rating || 5.0).toFixed(1)}
              </span>
              <span>•</span>
              <span class="truncate max-w-[220px] sm:max-w-none">📍 ${r.address}</span>
              <span>•</span>
              <span class="text-white font-semibold">⏱️ ${r.estimated_time}</span>
            </div>
          </div>

          <div>
            <button onclick="selectRestaurant(null)" class="w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-2xl bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs sm:text-sm font-extrabold border border-[#2E2E2E] transition-all active:scale-95">
              ← Todos los Restaurantes
            </button>
          </div>
        </div>
      `;
    } else {
      // Banner general de bienvenida PedidosNica
      hero.innerHTML = `
        <div class="relative p-5 sm:p-8 bg-gradient-to-r from-[#0d1f14] via-[#121212] to-[#121212] border-b border-[#262626]">
          <div class="max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#06C167]/15 border border-[#06C167]/30 text-[#06C167] text-xs sm:text-sm font-extrabold mb-3">
              <span class="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-pulse"></span>
              <span>Entrega Rápida en Managua</span>
            </div>
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              ¿Qué se te antoja hoy?
            </h1>
            <p class="text-sm text-[#A6A6A6] mt-2 leading-relaxed">
              Pide <span class="text-white font-bold">pupusas, carnes asadas, pizzas, hamburguesas, combos</span> y más con un toque.
            </p>
            <div class="flex items-center gap-2 mt-4">
              <button type="button" onclick="openClientProfileModal('addresses')" class="bg-[#1F1F1F] hover:bg-[#282828] px-4 py-2.5 min-h-[42px] rounded-2xl border border-[#2E2E2E] text-xs sm:text-sm text-white font-bold flex items-center gap-2 active:scale-95 transition-all">
                <span>📍 Entregar en: <strong class="text-[#06C167]">${currentDeliveryAddress.split(',')[0]}</strong></span>
                <span class="text-[#06C167] text-xs">Cambiar ▼</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // 3.1 RENDERIZADO DE PLATILLOS RECOMENDADOS (FEATURED DISHES)
  function renderRecommendedDishes() {
    const section = document.getElementById('recommendedSection');
    const grid = document.getElementById('recommendedGrid');
    if (!section || !grid) return;

    // Solo se muestra en el Inicio (sin búsqueda activa, sin restaurante individual seleccionado y en categoría 'Todos')
    if (searchQuery || selectedRestaurantId || currentCategory !== 'Todos') {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    const available = catalogProducts.filter(p => p.is_available !== false);
    if (available.length === 0) {
      section.style.display = 'none';
      return;
    }

    // Seleccionar hasta 4 platillos destacados de diferentes restaurantes
    const featured = [];
    const seenRest = new Set();

    // Prioridad 1: Platillos con descuento o combos
    available.forEach(p => {
      if ((p.discount_price || p.is_combo) && !seenRest.has(p.restaurant_id) && featured.length < 4) {
        featured.push(p);
        seenRest.add(p.restaurant_id);
      }
    });

    // Prioridad 2: Completar con platillos populares de otros restaurantes
    available.forEach(p => {
      if (!seenRest.has(p.restaurant_id) && featured.length < 4) {
        featured.push(p);
        seenRest.add(p.restaurant_id);
      }
    });

    // Prioridad 3: Si aún hay espacio, completar con cualquier plato disponible
    available.forEach(p => {
      if (!featured.some(f => f.id === p.id) && featured.length < 4) {
        featured.push(p);
      }
    });

    grid.innerHTML = featured.map(p => {
      const isPromo = Boolean(p.discount_price);
      const displayPrice = isPromo ? p.discount_price : p.price;
      const oldPrice = isPromo ? p.price : null;

      let tagText = '⭐ Recomendado';
      let tagClass = 'bg-[#06C167]/20 border-[#06C167]/40 text-[#06C167]';
      if (isPromo) {
        tagText = '🔥 En Oferta';
        tagClass = 'bg-rose-500/20 border-rose-500/40 text-rose-400';
      } else if (p.is_combo) {
        tagText = '🎁 Super Combo';
        tagClass = 'bg-amber-500/20 border-amber-500/40 text-amber-400';
      }

      return `
        <div onclick="openProductModal('${p.id}')" class="bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#06C167]/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-lg active:scale-[0.99]">
          <div class="relative h-40 w-full overflow-hidden bg-black">
            <img src="${p.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30"></div>
            
            <div class="absolute top-2.5 left-2.5">
              <span class="text-xs font-extrabold px-3 py-1 rounded-full border backdrop-blur-md ${tagClass}">
                ${tagText}
              </span>
            </div>

            <div class="absolute bottom-2 left-3 right-3">
              <span class="text-xs font-bold text-white/95 drop-shadow truncate block">
                🏪 ${p.restaurant_name}
              </span>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h4 class="font-extrabold text-white text-base group-hover:text-[#06C167] transition-colors line-clamp-1 mb-1">
                ${p.name}
              </h4>
              <p class="text-xs sm:text-sm text-[#A6A6A6] line-clamp-2 leading-relaxed">
                ${p.description || 'Delicioso platillo preparado fresco al momento con ingredientes seleccionados.'}
              </p>
            </div>

            <div class="flex items-center justify-between mt-3.5 pt-3 border-t border-[#222222] gap-2">
              <div class="flex items-baseline gap-1.5">
                <span class="text-base font-black text-white font-mono">C$ ${Number(displayPrice).toFixed(2)}</span>
                ${oldPrice ? `<span class="text-xs text-[#666666] line-through font-mono">C$ ${Number(oldPrice).toFixed(2)}</span>` : ''}
              </div>

              <button onclick="event.stopPropagation(); openProductModal('${p.id}');" class="px-4 py-2 min-h-[40px] rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all" title="Personalizar y agregar">
                <span>+ Agregar</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const DEFAULT_COVERS = {
    'pupusa': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
    'diamante': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
    'pizza': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    'napoli': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    'asado': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    'toro': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    'valenti': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'
  };

  function getRestaurantVisuals(r) {
    if (!r) return { cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200' };
    const normName = normalizeStr(r.name || '');
    let cover = r.banner_url || r.logo_url;
    for (const [k, url] of Object.entries(DEFAULT_COVERS)) {
      if (normName.includes(k)) {
        cover = url;
        break;
      }
    }
    if (!cover) cover = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';
    const logo = r.logo_url || cover;
    return { cover, logo };
  }

  // 3.2 RENDERIZADO DE LISTA DE RESTAURANTES (RESTAURANTS MARKETPLACE)
  function renderRestaurantsList() {
    const section = document.getElementById('restaurantsSection');
    const grid = document.getElementById('restaurantsGrid');
    if (!section || !grid) return;

    // Solo se muestra en el Inicio (sin búsqueda activa, sin restaurante individual seleccionado y en categoría 'Todos')
    if (searchQuery || selectedRestaurantId || currentCategory !== 'Todos') {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    if (!allRestaurants || allRestaurants.length === 0) {
      section.style.display = 'none';
      return;
    }

    grid.innerHTML = allRestaurants.map(r => {
      const { cover, logo } = getRestaurantVisuals(r);
      const rating = Number(r.rating || 5.0).toFixed(1);
      const time = r.estimated_time || '25 - 35 min';
      const fee = Number(r.delivery_fee || 2.00).toFixed(2);
      const address = (r.address || 'Managua, Nicaragua').split(',')[0];

      return `
        <div onclick="selectRestaurant('${r.id}')" class="bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#06C167] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-lg active:scale-[0.99]">
          
          <!-- Banner Superior del Restaurante -->
          <div class="relative h-36 w-full overflow-hidden bg-black">
            <img src="${cover}" alt="${r.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

            <!-- Logo Avatar flotante -->
            <div class="absolute bottom-2.5 left-3 flex items-center gap-2.5">
              <img src="${logo}" alt="${r.name}" class="w-11 h-11 rounded-full object-cover border-2 border-[#06C167] shadow-md bg-[#1F1F1F]" />
              <span class="text-sm sm:text-base font-black text-white drop-shadow truncate max-w-[160px] sm:max-w-[180px]">${r.name}</span>
            </div>

            <!-- Rating badge -->
            <div class="absolute top-2.5 right-2.5">
              <span class="bg-black/80 backdrop-blur-md text-white text-xs font-extrabold px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1 shadow">
                <span class="text-yellow-400">⭐</span> ${rating}
              </span>
            </div>
          </div>

          <!-- Información y detalles -->
          <div class="p-4 flex-1 flex flex-col justify-between">
            <div class="space-y-1.5">
              <p class="text-xs sm:text-sm text-[#A6A6A6] truncate flex items-center gap-1.5">
                <span>📍</span> ${address}
              </p>
              <div class="flex items-center gap-2 text-xs sm:text-sm text-[#A6A6A6]">
                <span class="text-white font-semibold flex items-center gap-1">⏱️ ${time}</span>
              </div>
            </div>

            <div class="mt-3.5 pt-2.5 border-t border-[#222222]">
              <div class="w-full py-2.5 px-3.5 min-h-[42px] rounded-xl bg-[#06C167]/15 group-hover:bg-[#06C167] text-[#06C167] group-hover:text-black border border-[#06C167]/30 font-black text-xs sm:text-sm flex items-center justify-between transition-all">
                <span>Ver Menú Completo</span>
                <span>→</span>
              </div>
            </div>
          </div>

        </div>
      `;
    }).join('');
  }

  // 4. RENDERIZADO DE CATEGORÍAS (PILLS DINÁMICOS GRANDES Y ERGONÓMICOS)
  function renderCategories() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    list.innerHTML = categoriesList.map(cat => {
      const isActive = currentCategory.toLowerCase() === cat.toLowerCase();
      let icon = '🍽️';
      if (cat.toLowerCase().includes('todo')) icon = '🔥';
      else if (cat.toLowerCase().includes('pupusa')) icon = '🥟';
      else if (cat.toLowerCase().includes('asado') || cat.toLowerCase().includes('carne')) icon = '🥩';
      else if (cat.toLowerCase().includes('pizza')) icon = '🍕';
      else if (cat.toLowerCase().includes('burger') || cat.toLowerCase().includes('hamburguesa')) icon = '🍔';
      else if (cat.toLowerCase().includes('combo')) icon = '🎁';
      else if (cat.toLowerCase().includes('postre')) icon = '🍰';
      else if (cat.toLowerCase().includes('bebida') || cat.toLowerCase().includes('cacao')) icon = '🥤';
      else if (cat.toLowerCase().includes('entrada')) icon = '🥟';

      return `
        <button onclick="filterCategory('${cat}')" class="category-pill ${
          isActive 
            ? 'active bg-[#06C167] text-black shadow-md' 
            : 'bg-[#1F1F1F] hover:bg-[#282828] text-white border border-[#2E2E2E]'
        } px-5 py-3 min-h-[46px] rounded-2xl text-sm font-black transition-all shrink-0 snap-start flex items-center gap-2 active:scale-95">
          <span class="text-base">${icon}</span>
          <span>${cat}</span>
        </button>
      `;
    }).join('');
  }

  // Helper para renderizar tarjeta individual de producto (Botones y Textos Grandes)
  function renderSingleProductCard(p) {
    const isPromo = Boolean(p.discount_price);
    const displayPrice = isPromo ? p.discount_price : p.price;
    const oldPrice = isPromo ? p.price : null;
    const isAvailable = p.is_available !== false;
    const inRadius = p.in_radius;

    return `
      <div ${isAvailable ? `onclick="openProductModal('${p.id}')"` : ''} class="${
        !isAvailable 
          ? 'bg-[#0E0E0E] border border-[#222222] opacity-55 cursor-not-allowed' 
          : 'bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#383838] cursor-pointer'
      } rounded-2xl p-4 sm:p-5 shadow-md transition-all flex justify-between gap-3.5 group relative overflow-hidden select-none active:scale-[0.99]">
        
        <div class="flex-1 flex flex-col justify-between min-w-0 pr-1">
          <div>
            <!-- Nombre del Restaurante Predominante -->
            <div class="flex items-center gap-1.5 text-xs font-black text-[#06C167] mb-1 truncate">
              <span>🏪</span>
              <span class="truncate">${p.restaurant_name || 'Restaurante Asociado'}</span>
            </div>

            <!-- Nombre del Plato -->
            <div class="flex items-center gap-1.5 flex-wrap mb-1">
              <h3 class="font-extrabold ${isAvailable ? 'text-white group-hover:text-[#06C167]' : 'text-[#757575] line-through'} text-base sm:text-lg leading-snug transition-colors">
                ${p.name}
              </h3>
              ${!isAvailable ? '<span class="text-xs font-black uppercase tracking-wider text-rose-400 bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded-md">Agotado</span>' : ''}
            </div>

            <p class="text-xs sm:text-sm ${isAvailable ? 'text-[#A6A6A6]' : 'text-[#666666]'} line-clamp-2 leading-relaxed">
              ${p.description || 'Preparado fresco al momento con ingredientes seleccionados.'}
            </p>
          </div>

          <div class="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#1E1E1E] flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base sm:text-lg font-black ${isAvailable ? 'text-white' : 'text-[#757575]'} font-mono">C$ ${Number(displayPrice).toFixed(2)}</span>
              ${oldPrice ? `<span class="text-xs text-[#555555] line-through font-mono">C$ ${Number(oldPrice).toFixed(2)}</span>` : ''}
              ${isPromo && isAvailable ? `<span class="text-[11px] font-bold text-[#06C167] bg-[#06C167]/15 px-2 py-0.5 rounded-lg">Ahorro</span>` : ''}
              ${p.is_combo && isAvailable ? `<span class="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg">Combo</span>` : ''}
            </div>
            ${isAvailable ? `
              <button onclick="event.stopPropagation(); openProductModal('${p.id}');" class="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs sm:text-sm flex items-center gap-1 shadow-md active:scale-95 transition-all">
                <span>+ Agregar</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Imagen del Producto -->
        <div class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-black shrink-0 self-center">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300'}" alt="${p.name}" class="w-full h-full object-cover ${isAvailable ? 'group-hover:scale-105' : 'grayscale opacity-40'} transition-transform duration-300" />
          
          ${!isAvailable ? `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
              <span class="text-xs font-black tracking-wider uppercase text-rose-300 bg-rose-950/90 px-2 py-1 rounded border border-rose-800">Agotado</span>
            </div>
          ` : ''}
        </div>

      </div>
    `;
  }

  // 5. RENDERIZADO DE PLATILLOS CON BÚSQUEDA AMPLIA
  function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const titleEl = document.getElementById('productsSectionTitle');
    const badgeEl = document.getElementById('activeFilterBadge');
    if (!grid) return;

    // Si hay búsqueda activa por palabra clave (sin importar categoría)
    if (searchQuery) {
      // Aplica el motor de búsqueda amplia con puntuación de relevancia
      const scoredItems = catalogProducts
        .map(p => ({ product: p, score: computeMatchScore(p, searchQuery) }))
        .filter(item => item.score > 0);

      scoredItems.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.product.in_radius && !b.product.in_radius) return -1;
        if (!a.product.in_radius && b.product.in_radius) return 1;
        return a.product.distance_km - b.product.distance_km;
      });

      const filtered = scoredItems.map(item => item.product);

      if (filtered.length === 0) {
        if (titleEl) {
          titleEl.innerHTML = `<span>🔍</span> Resultados para: "<strong class="text-[#06C167]">${searchQuery}</strong>"`;
        }
        if (badgeEl) {
          badgeEl.innerHTML = `<button onclick="clearSearch()" class="text-xs font-bold text-[#06C167] hover:underline">Limpiar búsqueda ✕</button>`;
        }
        grid.innerHTML = `
          <div class="col-span-full py-16 text-center text-[#757575] space-y-2">
            <span class="text-4xl block mb-2">🍽️</span>
            <p class="text-sm font-bold text-white">No encontramos productos relacionados con "${searchQuery}".</p>
            <p class="text-xs text-[#A6A6A6]">Prueba buscando "<span class="text-[#06C167]">pupusas</span>", "<span class="text-[#06C167]">asados</span>", "<span class="text-[#06C167]">pizza</span>" o "<span class="text-[#06C167]">hamburguesa</span>".</p>
            <button onclick="clearSearch()" class="mt-3 px-4 py-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs font-bold border border-[#2E2E2E]">Limpiar Filtros</button>
          </div>`;
        return;
      }

      // Agrupar los resultados por restaurante manteniendo el orden de relevancia
      const restGroupsMap = new Map();

      filtered.forEach(p => {
        const rid = p.restaurant_id || 'unknown';
        if (!restGroupsMap.has(rid)) {
          const restObj = (allRestaurants || []).find(r => r.id === rid) || {
            id: rid,
            name: p.restaurant_name || 'Restaurante Asociado',
            rating: p.restaurant_rating || 5.0,
            address: p.restaurant_address || 'Managua, Nicaragua',
            estimated_time: p.estimated_time || '25 - 35 min',
            logo_url: p.restaurant_logo,
            banner_url: null,
            in_radius: p.in_radius
          };
          restGroupsMap.set(rid, {
            restaurant: restObj,
            products: []
          });
        }
        restGroupsMap.get(rid).products.push(p);
      });

      const restCount = restGroupsMap.size;
      const totalDishes = filtered.length;

      if (titleEl) {
        titleEl.innerHTML = `<span>🔍</span> Resultados para: "<strong class="text-[#06C167]">${searchQuery}</strong>" <span class="text-xs font-medium text-[#A6A6A6] ml-2">(${restCount} restaurante${restCount === 1 ? '' : 's'}, ${totalDishes} platillo${totalDishes === 1 ? '' : 's'})</span>`;
      }
      if (badgeEl) {
        badgeEl.innerHTML = `<button onclick="clearSearch()" class="text-xs font-bold text-[#06C167] hover:underline">Limpiar búsqueda ✕</button>`;
      }

      // Renderizar secciones agrupadas por restaurante donde el nombre del restaurante predomina
      grid.innerHTML = Array.from(restGroupsMap.values()).map(group => {
        const r = group.restaurant;
        const { cover, logo } = getRestaurantVisuals(r);
        const rating = Number(r.rating || 5.0).toFixed(1);
        const time = r.estimated_time || '25 - 35 min';
        const address = (r.address || 'Managua, Nicaragua').split(',')[0];

        return `
          <div class="col-span-full bg-[#141414] border border-[#262626] hover:border-[#383838] rounded-2xl p-4 sm:p-5 mb-2 shadow-xl transition-all">
            
            <!-- CABECERA PREDOMINANTE DEL RESTAURANTE -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-[#222222] gap-3">
              <div onclick="selectRestaurant('${r.id}')" class="flex items-center gap-3 cursor-pointer group flex-1 min-w-0">
                <div class="relative shrink-0">
                  <img src="${logo}" alt="${r.name}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-[#06C167] shadow-lg bg-[#1F1F1F] group-hover:scale-105 transition-transform" />
                  <div class="absolute -bottom-1 -right-1 bg-black/90 rounded-full p-0.5 border border-[#06C167]/50 shadow">
                    <span class="text-xs">🏪</span>
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-lg sm:text-xl font-black text-white group-hover:text-[#06C167] transition-colors tracking-tight truncate">
                      ${r.name}
                    </h2>
                    <span class="bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                      Restaurante
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2 sm:gap-2.5 mt-1 text-xs text-[#A6A6A6] flex-wrap">
                    <span class="text-white font-bold flex items-center gap-1">
                      ⭐ ${rating}
                    </span>
                    <span>•</span>
                    <span class="text-[#CCCCCC] font-medium flex items-center gap-1">
                      ⏱️ ${time}
                    </span>
                    <span>•</span>
                    <span class="truncate max-w-[200px] sm:max-w-xs text-[#888888] flex items-center gap-1">
                      📍 ${address}
                    </span>
                  </div>
                </div>
              </div>

              <!-- BOTÓN PARA VER CARTA COMPLETA DEL RESTAURANTE -->
              <div class="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button onclick="selectRestaurant('${r.id}')" class="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-white hover:text-[#06C167] border border-[#333333] hover:border-[#06C167] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
                  <span>Ver Menú Completo</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <!-- SUBTÍTULO Y GRILLA DE PLATILLOS DEL RESTAURANTE -->
            <div>
              <div class="flex items-center justify-between text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-3 px-0.5">
                <span>Platillos de ${r.name} (${group.products.length}):</span>
                <span class="text-[#06C167]">Precios en C$</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                ${group.products.map(p => renderSingleProductCard(p)).join('')}
              </div>
            </div>

          </div>
        `;
      }).join('');
      return;
    }

    // Filtrado estándar sin búsqueda (por categoría o por restaurante individual seleccionado)
    let filtered = [...catalogProducts];

    if (selectedRestaurantId && activeRestaurantData) {
      if (titleEl) titleEl.innerHTML = `<span>🍽️</span> Carta de <strong class="text-white">${activeRestaurantData.name}</strong>`;
      if (badgeEl) badgeEl.innerHTML = `<button onclick="selectRestaurant(null)" class="text-xs font-bold text-[#06C167] hover:underline">← Ver todos los restaurantes y platillos</button>`;
      filtered = filtered.filter(p => p.restaurant_id === selectedRestaurantId);
    } else {
      if (titleEl) titleEl.innerHTML = `<span>🍽️</span> Explorar Todo el Menú`;
      if (badgeEl) badgeEl.innerHTML = ``;
    }

    if (currentCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
    }

    // Ordenar por cercanía
    filtered.sort((a, b) => {
      if (a.in_radius && !b.in_radius) return -1;
      if (!a.in_radius && b.in_radius) return 1;
      return a.distance_km - b.distance_km;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-[#757575] space-y-2">
          <span class="text-4xl block mb-2">🍽️</span>
          <p class="text-sm font-bold text-white">No encontramos productos en esta categoría.</p>
          <button onclick="filterCategory('Todos')" class="mt-3 px-4 py-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs font-bold border border-[#2E2E2E]">Ver Todo el Menú</button>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => renderSingleProductCard(p)).join('');
  }

  // 6. MANEJO DE BÚSQUEDA Y CATEGORÍAS
  window.handleSearch = function (val) {
    searchQuery = val.trim();
    const desk = document.getElementById('searchInputDesktop');
    const mob = document.getElementById('searchInputMobile');
    if (desk && desk.value !== val) desk.value = val;
    if (mob && mob.value !== val) mob.value = val;

    renderRecommendedDishes();
    renderRestaurantsList();
    renderProducts();
  };

  window.clearSearch = function () {
    searchQuery = '';
    const desk = document.getElementById('searchInputDesktop');
    const mob = document.getElementById('searchInputMobile');
    if (desk) desk.value = '';
    if (mob) mob.value = '';
    renderRecommendedDishes();
    renderRestaurantsList();
    renderProducts();
  };

  window.filterCategory = function (category) {
    currentCategory = category;
    renderCategories();
    renderRecommendedDishes();
    renderRestaurantsList();
    renderProducts();
  };

  window.selectRestaurant = function (restId) {
    selectedRestaurantId = restId;
    currentCategory = 'Todos';
    searchQuery = '';
    const desk = document.getElementById('searchInputDesktop');
    const mob = document.getElementById('searchInputMobile');
    if (desk) desk.value = '';
    if (mob) mob.value = '';

    loadCatalog(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.handleUnavailableProductClick = function (productId) {
    const p = catalogProducts.find(x => x.id === productId);
    if (!p) return;

    if (p.is_available === false) {
      alert(`⚠️ El platillo "${p.name}" se encuentra temporalmente agotado.`);
      return;
    }

    if (!p.in_radius) {
      alert(`⚠️ Cobertura de entrega:\nEl restaurante "${p.restaurant_name}" solo reparte hasta ${p.delivery_radius_km} km.\nTu ubicación actual se encuentra a ${p.distance_km} km.\n\nPor favor selecciona una dirección dentro del radio de entrega.`);
    }
  };

  // 7. CAMBIO DE DIRECCIÓN EN EL TOPBAR
  window.updateSelectedAddress = function (val) {
    const parts = val.split('|');
    const address = parts[0];
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);

    currentDeliveryCoords = [lng, lat];
    currentDeliveryAddress = address;

    const addrInput = document.getElementById('cartDeliveryAddress');
    if (addrInput) addrInput.value = address;

    loadCatalog(false);
  };

  // 8. MODAL DE PERSONALIZACIÓN Y COMPRA
  window.openProductModal = function (productId) {
    const product = catalogProducts.find(p => p.id === productId);
    if (!product) return;

    if (product.is_available === false) {
      alert(`⚠️ El platillo "${product.name}" se encuentra temporalmente agotado.`);
      return;
    }

    if (!product.in_radius) {
      window.handleUnavailableProductClick(productId);
      return;
    }

    selectedProduct = product;
    modalQty = 1;

    document.getElementById('modalProductImage').src = product.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductDesc').innerHTML = `
      <span>${product.description || 'Plato preparado artesanalmente.'}</span>
      <div class="mt-1.5 flex items-center gap-2 text-xs text-[#06C167] font-semibold">
        <span>🏪 ${product.restaurant_name}</span> • <span>📍 a ${product.distance_km} km</span>
      </div>
    `;
    document.getElementById('modalProductBasePrice').textContent = `C$ ${Number(product.discount_price || product.price).toFixed(2)}`;
    document.getElementById('modalQtyDisplay').textContent = modalQty;
    document.getElementById('modalSpecialNotes').value = '';

    const container = document.getElementById('modalCustomizationGroups');
    const groups = product.customization_groups || [];

    if (groups.length === 0) {
      container.innerHTML = `<p class="text-sm text-slate-400 italic">Este producto no requiere configuración adicional.</p>`;
    } else {
      container.innerHTML = groups.map((g, gIdx) => {
        return `
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-extrabold text-white">${g.title}</span>
              <span class="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold">
                ${g.type === 'SINGLE' ? 'Elige 1 opción' : (g.type === 'MULTIPLE' ? 'Opcionales' : 'Modificaciones')}
              </span>
            </div>

            <div class="space-y-2">
              ${(g.options || []).map((opt, optIdx) => {
                const inputName = `opt_group_${gIdx}`;
                const inputId = `opt_${gIdx}_${optIdx}`;
                const isSingle = g.type === 'SINGLE';
                const inputType = isSingle ? 'radio' : 'checkbox';
                const isChecked = isSingle && (opt.is_default || optIdx === 0);
                const delta = Number(opt.price_delta) || 0;

                return `
                  <label for="${inputId}" class="flex items-center justify-between p-3.5 min-h-[48px] rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 cursor-pointer text-sm transition-colors">
                    <div class="flex items-center gap-3">
                      <input 
                        type="${inputType}" 
                        id="${inputId}" 
                        name="${inputName}" 
                        value="${opt.name}" 
                        data-price-delta="${delta}" 
                        data-group-title="${g.title}"
                        ${isChecked ? 'checked' : ''} 
                        onchange="recalculateModalPrice()"
                        class="w-5 h-5 accent-[#06C167] rounded"
                      />
                      <span class="text-white font-semibold">${opt.name}</span>
                    </div>
                    ${delta > 0 ? `<span class="text-xs sm:text-sm font-mono font-black text-[#06C167]">+C$ ${delta.toFixed(2)}</span>` : ''}
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    recalculateModalPrice();
    const modal = document.getElementById('productModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.closeProductModal = function () {
    const modal = document.getElementById('productModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    selectedProduct = null;
  };

  window.changeModalQty = function (delta) {
    modalQty = Math.max(1, modalQty + delta);
    document.getElementById('modalQtyDisplay').textContent = modalQty;
    recalculateModalPrice();
  };

  window.recalculateModalPrice = function () {
    if (!selectedProduct) return;

    let unitPrice = Number(selectedProduct.discount_price || selectedProduct.price);
    let optionsDelta = 0;

    const checkedInputs = document.querySelectorAll('#modalCustomizationGroups input:checked');
    checkedInputs.forEach(input => {
      optionsDelta += Number(input.dataset.priceDelta || 0);
    });

    const total = (unitPrice + optionsDelta) * modalQty;
    document.getElementById('modalTotalCalculated').textContent = `C$ ${total.toFixed(2)}`;
  };

  window.confirmAddToCart = function () {
    if (!selectedProduct) return;

    if (selectedProduct.is_available === false) {
      alert(`⚠️ El producto "${selectedProduct.name}" no está disponible porque está agotado.`);
      closeProductModal();
      return;
    }

    if (!selectedProduct.in_radius) {
      window.handleUnavailableProductClick(selectedProduct.id);
      closeProductModal();
      return;
    }

    // Protección de Carrito Multi-Restaurante
    if (cart.length > 0 && cart[0].restaurant_id && selectedProduct.restaurant_id && cart[0].restaurant_id !== selectedProduct.restaurant_id) {
      const restName = selectedProduct.restaurant_name || 'este restaurante';
      const changeRest = confirm(`Tu carrito contiene platos de otro restaurante. ¿Deseas vaciar el carrito actual para pedir en ${restName}?`);
      if (changeRest) {
        cart = [];
        activePromo = null;
      } else {
        return;
      }
    }

    const checkedInputs = document.querySelectorAll('#modalCustomizationGroups input:checked');
    const selectedOptions = [];
    let customDelta = 0;

    checkedInputs.forEach(input => {
      const delta = Number(input.dataset.priceDelta || 0);
      customDelta += delta;
      selectedOptions.push({
        group: input.dataset.groupTitle,
        name: input.value,
        price_delta: delta
      });
    });

    const specialNotes = document.getElementById('modalSpecialNotes').value.trim();
    const unitPrice = Number(selectedProduct.discount_price || selectedProduct.price);

    cart.push({
      product_id: selectedProduct.id,
      restaurant_id: selectedProduct.restaurant_id,
      restaurant_name: selectedProduct.restaurant_name,
      distance_km: selectedProduct.distance_km,
      delivery_radius_km: selectedProduct.delivery_radius_km,
      in_radius: selectedProduct.in_radius,
      name: selectedProduct.name,
      image_url: selectedProduct.image_url,
      unit_price: unitPrice,
      customization_delta: customDelta,
      quantity: modalQty,
      selected_options: selectedOptions,
      notes: specialNotes
    });

    updateCartUI();
    closeProductModal();

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.classList.add('scale-110');
      setTimeout(() => cartBtn.classList.remove('scale-110'), 300);
    }

    toggleCartDrawer(true);
  };

  // 9. GESTIÓN DEL CARRITO, CUPONES Y CHECKOUT
  let activePromo = null;

  window.applyPromoCode = function () {
    const input = document.getElementById('cartPromoInput');
    const code = input ? input.value.trim().toUpperCase() : '';

    if (!code) {
      alert('Ingresa un código de cupón.');
      return;
    }

    let subtotal = 0;
    cart.forEach(item => {
      subtotal += (item.unit_price + item.customization_delta) * item.quantity;
    });

    if (subtotal <= 0) {
      alert('Tu carrito está vacío. Agrega platos antes de aplicar un cupón.');
      return;
    }

    let deliveryFee = 70.00;
    if (cart.length > 0) {
      const restId = cart[0].restaurant_id;
      const rest = allRestaurants.find(r => r.id === restId);
      deliveryFee = rest ? Number(rest.delivery_fee || 70.00) : 70.00;
    }

    if (code === 'NICA20') {
      activePromo = {
        code: 'NICA20',
        type: 'percent',
        value: 0.20
      };
      alert('✓ ¡Cupón NICA20 aplicado! 20% de descuento sobre el subtotal.');
    } else if (code === 'ENVIOGRATIS') {
      activePromo = {
        code: 'ENVIOGRATIS',
        type: 'delivery',
        value: deliveryFee
      };
      alert('✓ ¡Cupón ENVIOGRATIS aplicado! Envío gratuito.');
    } else if (code === 'BIENVENIDO') {
      activePromo = {
        code: 'BIENVENIDO',
        type: 'fixed',
        value: 50.00
      };
      alert('✓ ¡Cupón BIENVENIDO aplicado! C$ 50.00 de descuento.');
    } else {
      alert(`El código "${code}" no es válido. Prueba con NICA20 o ENVIOGRATIS.`);
      return;
    }

    updateCartUI();
  };

  window.toggleCartDrawer = function (open) {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartDrawerBackdrop');

    if (open) {
      backdrop.classList.remove('hidden');
      drawer.classList.remove('translate-x-full');
      renderCartDrawerItems();
    } else {
      drawer.classList.add('translate-x-full');
      setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
  };

  window.updateCartUI = function () {
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += (item.unit_price + item.customization_delta) * item.quantity;
    });

    const countBadge = document.getElementById('cartCountBadge');
    const totalHeader = document.getElementById('cartTotalHeader');
    const drawerCount = document.getElementById('cartDrawerCount');
    const mobileBottomBadge = document.getElementById('mobileBottomCartBadge');

    if (countBadge) countBadge.textContent = totalCount;
    if (totalHeader) totalHeader.textContent = `C$ ${subtotal.toFixed(2)}`;
    if (drawerCount) drawerCount.textContent = `${totalCount} ítems`;
    if (mobileBottomBadge) mobileBottomBadge.textContent = totalCount;

    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartDeliveryFeeEl = document.getElementById('cartDeliveryFee');
    const cartTotalFinalEl = document.getElementById('cartTotalFinal');

    // Tarifa de entrega real del restaurante en el resumen de pago
    let deliveryFee = 0;
    if (cart.length > 0) {
      const restId = cart[0].restaurant_id;
      const rest = allRestaurants.find(r => r.id === restId);
      deliveryFee = rest ? Number(rest.delivery_fee || 70.00) : 70.00;
    }
    const serviceFee = totalCount > 0 ? 15.00 : 0.00;

    // Calcular descuento de cupón
    let discountAmount = 0;
    if (activePromo && subtotal > 0) {
      if (activePromo.type === 'percent') {
        discountAmount = subtotal * activePromo.value;
      } else if (activePromo.type === 'delivery') {
        discountAmount = deliveryFee;
      } else if (activePromo.type === 'fixed') {
        discountAmount = Math.min(subtotal, activePromo.value);
      }
    }

    const discountRow = document.getElementById('cartDiscountRow');
    const discountAmountEl = document.getElementById('cartDiscountAmount');
    if (discountRow && discountAmountEl) {
      if (discountAmount > 0) {
        discountRow.classList.remove('hidden');
        discountAmountEl.textContent = `-C$ ${discountAmount.toFixed(2)}`;
      } else {
        discountRow.classList.add('hidden');
      }
    }

    const grandTotal = subtotal > 0 ? Math.max(0, subtotal + deliveryFee + serviceFee - discountAmount) : 0;

    if (cartSubtotalEl) cartSubtotalEl.textContent = `C$ ${subtotal.toFixed(2)}`;
    if (cartDeliveryFeeEl) cartDeliveryFeeEl.textContent = `C$ ${deliveryFee.toFixed(2)}`;
    if (cartTotalFinalEl) cartTotalFinalEl.textContent = `C$ ${grandTotal.toFixed(2)}`;
  };

  function renderCartDrawerItems() {
    const list = document.getElementById('cartItemsList');
    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = `
        <div class="text-center py-16 text-slate-500">
          <span class="text-4xl block mb-2">🛍️</span>
          <p class="text-sm font-bold text-slate-400">Tu carrito está vacío.</p>
          <p class="text-xs text-slate-500 mt-1">Busca platillos o bebidas para comenzar tu orden.</p>
        </div>`;
      updateCartUI();
      return;
    }

    list.innerHTML = cart.map((item, index) => {
      const itemTotal = (item.unit_price + item.customization_delta) * item.quantity;
      const optionsText = item.selected_options.map(o => o.name).join(', ');

      return `
        <div class="p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <span class="text-xs text-[#06C167] font-extrabold block truncate">🏪 ${item.restaurant_name}</span>
            <h4 class="text-sm font-extrabold text-white truncate mt-0.5">${item.name}</h4>
            ${optionsText ? `<p class="text-xs text-[#A6A6A6] truncate">${optionsText}</p>` : ''}
            ${item.notes ? `<p class="text-xs text-amber-400/90 italic truncate">Nota: "${item.notes}"</p>` : ''}
            <span class="text-sm font-black text-white font-mono mt-1 block">C$ ${itemTotal.toFixed(2)}</span>
          </div>

          <div class="flex items-center gap-1.5 bg-black border border-[#2E2E2E] rounded-2xl p-1 shrink-0">
            <button onclick="updateCartItemQty(${index}, -1)" class="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#303030] text-white flex items-center justify-center text-base font-black active:scale-95 transition-transform">-</button>
            <span class="w-7 text-center text-sm font-black font-mono text-white">${item.quantity}</span>
            <button onclick="updateCartItemQty(${index}, 1)" class="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#303030] text-white flex items-center justify-center text-base font-black active:scale-95 transition-transform">+</button>
          </div>
        </div>
      `;
    }).join('');

    updateCartUI();
  }

  window.updateCartItemQty = function (index, delta) {
    if (!cart[index]) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    renderCartDrawerItems();
  };

  window.selectPaymentMethod = function (method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
      if (btn.dataset.method === method) {
        btn.classList.add('bg-[#06C167]/15', 'border-[#06C167]', 'text-[#06C167]', 'font-bold');
        btn.classList.remove('bg-[#1A1A1A]', 'border-[#2E2E2E]', 'text-[#A6A6A6]');
      } else {
        btn.classList.remove('bg-[#06C167]/15', 'border-[#06C167]', 'text-[#06C167]', 'font-bold');
        btn.classList.add('bg-[#1A1A1A]', 'border-[#2E2E2E]', 'text-[#A6A6A6]');
      }
    });
  };

  // 10. ENVÍO DEL PEDIDO A SUPABASE
  window.submitOrder = async function () {
    if (cart.length === 0) {
      alert('Tu carrito está vacío. Elige tus platos antes de confirmar.');
      return;
    }

    const outOfRadiusItem = cart.find(it => it.in_radius === false);
    if (outOfRadiusItem) {
      alert(`⚠️ No se puede procesar el pedido:\nEl producto "${outOfRadiusItem.name}" pertenece a ${outOfRadiusItem.restaurant_name}, el cual se encuentra fuera del radio delimitado para tu ubicación actual (${outOfRadiusItem.distance_km} km).\nPor favor selecciona una dirección dentro del radio de entrega.`);
      return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = `
      <div class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      <span>Procesando con Cocina...</span>
    `;

    try {
      const address = (document.getElementById('cartDeliveryAddress')?.value || document.getElementById('checkoutAddress')?.value || currentDeliveryAddress).trim();
      const notes = document.getElementById('cartDeliveryNotes')?.value?.trim() || '';

      let subtotal = 0;
      cart.forEach(item => {
        subtotal += (item.unit_price + item.customization_delta) * item.quantity;
      });

      let deliveryFee = 70.00;
      if (cart.length > 0) {
        const restId = cart[0].restaurant_id;
        const rest = allRestaurants.find(r => r.id === restId);
        deliveryFee = rest ? Number(rest.delivery_fee || 70.00) : 70.00;
      }

      let discountAmount = 0;
      if (activePromo && subtotal > 0) {
        if (activePromo.type === 'percent') {
          discountAmount = subtotal * activePromo.value;
        } else if (activePromo.type === 'delivery') {
          discountAmount = deliveryFee;
        } else if (activePromo.type === 'fixed') {
          discountAmount = Math.min(subtotal, activePromo.value);
        }
      }

      const cartPhoneEl = document.getElementById('cartClientPhone');
      const customPhone = cartPhoneEl && cartPhoneEl.value.trim() ? cartPhoneEl.value.trim() : (clientUser?.phone || '+505 8888-0000');

      const payload = {
        items: cart,
        restaurant_id: cart[0].restaurant_id,
        delivery_address: address,
        delivery_notes: notes,
        delivery_latitude: currentDeliveryCoords[1],
        delivery_longitude: currentDeliveryCoords[0],
        payment_method: selectedPayment,
        client_id: clientUser?.id || 'c91f2a10-1234-4a9b-9c11-887766554433',
        client_name: clientUser?.full_name || 'Cliente Comensal',
        client_phone: customPhone,
        discount_amount: Number(discountAmount.toFixed(2)),
        promo_code: activePromo ? activePromo.code : ''
      };

      const res = await fetch('/api/client/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.orderId) {
        cart = [];
        activePromo = null;
        const promoInput = document.getElementById('cartPromoInput');
        if (promoInput) promoInput.value = '';

        updateCartUI();
        toggleCartDrawer(false);

        playNotificationSound();

        activeOrderId = data.orderId;
        toggleTrackingView(true, data.orderId);
      } else {
        alert('Hubo un inconveniente al crear el pedido: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error al realizar checkout:', e);
      alert('Error de conexión al procesar pedido. Intenta nuevamente.');
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = `<span>Hacer Pedido</span> <span class="text-base">→</span>`;
    }
  };

  // 11. VISTA DE LIVE TRACKING Y MAPA
  window.toggleTrackingView = function (showTracking, orderId = null) {
    const catalogView = document.getElementById('catalogView');
    const trackingView = document.getElementById('trackingView');
    if (!catalogView || !trackingView) return;

    const willShow = (showTracking !== undefined)
      ? Boolean(showTracking)
      : trackingView.classList.contains('hidden');

    if (willShow) {
      catalogView.classList.add('hidden');
      trackingView.classList.remove('hidden');

      if (orderId) {
        activeOrderId = orderId;
      }
      if (activeOrderId) {
        loadOrderTrackingData(activeOrderId);
        startTrackingPoll(activeOrderId);
        initTrackingMap();
      }
    } else {
      trackingView.classList.add('hidden');
      catalogView.classList.remove('hidden');
      if (orderPollingInterval) clearInterval(orderPollingInterval);
    }
  };

  async function checkActiveOrder() {
    try {
      const clientId = clientUser?.id || 'bec363ae-0205-4193-8f01-93e2db50b38e';
      const res = await fetch(`/api/client/orders/active?client_id=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      const activeBadge = document.getElementById('activeOrderBadge');
      const mobileDot = document.getElementById('mobileBottomTrackingDot');

      if (data.success && data.order) {
        activeOrderId = data.order.id;
        if (activeBadge) activeBadge.classList.remove('hidden');
        if (mobileDot) mobileDot.classList.remove('hidden');
      } else {
        if (activeBadge) activeBadge.classList.add('hidden');
        if (mobileDot) mobileDot.classList.add('hidden');
      }
    } catch (e) {}
  }

  async function loadOrderTrackingData(orderId) {
    try {
      const res = await fetch(`/api/client/orders/${orderId}`);
      const data = await res.json();

      if (data.success && data.order) {
        activeOrder = data.order;
        if (data.order.restaurants && data.order.restaurants.coords) {
          currentOrderRestCoords = [data.order.restaurants.coords.lng, data.order.restaurants.coords.lat];
        }
        if (data.order.delivery_coords) {
          currentDeliveryCoords = [data.order.delivery_coords.lng, data.order.delivery_coords.lat];
        }
        if (restaurantMarker && currentOrderRestCoords) {
          restaurantMarker.setLngLat(currentOrderRestCoords);
        }
        if (destinationMarker && currentDeliveryCoords) {
          destinationMarker.setLngLat(currentDeliveryCoords);
        }
        if (data.driver && data.driver.coords && data.driver.coords.lat && data.driver.coords.lng && driverMarker) {
          driverMarker.setLngLat([data.driver.coords.lng, data.driver.coords.lat]);
        }
        updateTrackingUI(data.order, data.items, data.driver);

        // Si el pedido ya fue entregado o cancelado, detener polling
        if (data.order.status === 'DELIVERED' || data.order.status === 'CANCELLED') {
          if (orderPollingInterval) clearInterval(orderPollingInterval);
          if (trackingInterval) clearInterval(trackingInterval);
        }
      }
    } catch (e) {
      console.warn('Error al consultar tracking:', e);
    }
  }

  // Alias para retrocompatibilidad
  window.fetchOrderTracking = loadOrderTrackingData;

  function startTrackingPoll(orderId) {
    if (orderPollingInterval) clearInterval(orderPollingInterval);
    if (trackingInterval) clearInterval(trackingInterval);

    orderPollingInterval = setInterval(() => {
      loadOrderTrackingData(orderId);
    }, 2500);
    trackingInterval = orderPollingInterval;

    if (supabase) {
      supabase
        .channel(`client-order-${orderId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
          console.log('[Realtime Client] Actualización de orden recibida:', payload.new);
          playNotificationSound();
          loadOrderTrackingData(orderId);
        })
        .subscribe();

      supabase
        .channel(`orders:${orderId}:tracking`, { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'driver_location' }, ({ payload }) => {
          if (payload && typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
            if (driverMarker) {
              driverMarker.setLngLat([payload.longitude, payload.latitude]);
            }
          }
        })
        .subscribe();
    }
  }

  // 12. ACTUALIZACIÓN DINÁMICA DE LA UI DE TRACKING
  function updateTrackingUI(order, items = [], driver = null) {
    const orderIdEl = document.getElementById('trackingOrderId');
    const totalEl = document.getElementById('trackingTotalAmount');
    if (orderIdEl) orderIdEl.textContent = `#${order.id.slice(0, 8).toUpperCase()}`;
    if (totalEl) totalEl.textContent = `C$ ${Number(order.total).toFixed(2)}`;

    // Nombre dinámico del restaurante en textos de tracking
    const restName = order.restaurants?.name || 'Restaurante';
    const restPrepText = document.getElementById('trackingRestPrepText');
    if (restPrepText) {
      restPrepText.textContent = `${restName} está horneando tus platos.`;
    }
    const restReviewText = document.getElementById('trackingReviewRestText');
    if (restReviewText) {
      restReviewText.textContent = `Califica tu experiencia con ${restName}.`;
    }
    const mapLegendRest = document.getElementById('mapLegendRestName');
    if (mapLegendRest) {
      mapLegendRest.textContent = restName;
    }

    // Botón Cancelar Pedido: visible ÚNICAMENTE en estado CREATED
    const cancelBtn = document.getElementById('btnCancelClientOrder');
    if (cancelBtn) {
      if (order.status === 'CREATED') {
        cancelBtn.classList.remove('hidden');
      } else {
        cancelBtn.classList.add('hidden');
      }
    }

    // Badge de ETA dinámico según el estado actual
    const mapEtaBadge = document.getElementById('mapEtaBadge');
    if (mapEtaBadge) {
      if (order.status === 'CREATED') {
        mapEtaBadge.textContent = 'Confirmando...';
      } else if (order.status === 'ACCEPTED' || order.status === 'IN_PREPARATION') {
        mapEtaBadge.textContent = `Cocina: ~${order.estimated_prep_time_minutes || 20} min`;
      } else if (order.status === 'READY_FOR_PICKUP' || order.status === 'DRIVER_ASSIGNED') {
        mapEtaBadge.textContent = 'Retirando pedido (~10 min)';
      } else if (order.status === 'PICKED_UP') {
        mapEtaBadge.textContent = 'En camino (~5 min)';
      } else if (order.status === 'DELIVERED') {
        mapEtaBadge.textContent = '¡Entregado!';
      } else if (order.status === 'CANCELLED') {
        mapEtaBadge.textContent = 'Cancelado';
      } else {
        mapEtaBadge.textContent = 'ETA: ~20 min';
      }
    }

    // Desglose de ítems + líneas de Envío y Servicio para cuadrar con Total Pagado
    const itemsList = document.getElementById('trackingItemsList');
    if (itemsList) {
      let itemsHtml = (items || []).map(it => {
        const pName = it.products ? it.products.name : 'Plato';
        const itemTotal = Number(it.unit_price) * it.quantity;
        return `
          <div class="flex justify-between py-1.5 text-slate-300">
            <span><strong class="text-white">${it.quantity}x</strong> ${pName}</span>
            <span class="font-mono text-slate-400">C$ ${itemTotal.toFixed(2)}</span>
          </div>
        `;
      }).join('');

      itemsHtml += `
        <div class="flex justify-between py-1 text-slate-400 text-[11px] pt-2 border-t border-[#262626]">
          <span>Envío</span>
          <span class="font-mono text-[#06C167]">C$ ${Number(order.delivery_fee || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between py-1 text-slate-400 text-[11px]">
          <span>Servicio</span>
          <span class="font-mono text-white">C$ 15.00</span>
        </div>
      `;
      itemsList.innerHTML = itemsHtml;
    }

    const status = order.status;
    const statusMap = {
      'CREATED': {
        icon: '📝',
        head: 'PEDIDO RECIBIDO',
        main: 'Esperando Confirmación',
        desc: 'El local está revisando tu orden.',
        stepIdx: 1
      },
      'ACCEPTED': {
        icon: '👨‍🍳',
        head: 'EN PREPARACIÓN',
        main: 'Orden Confirmada por Cocina',
        desc: 'La cocina ha encendido los fuegos y prepara tus platos.',
        stepIdx: 2
      },
      'IN_PREPARATION': {
        icon: '🔥',
        head: 'COCINANDO',
        main: 'Preparando tus Platos',
        desc: 'Ingredientes frescos en cocción.',
        stepIdx: 2
      },
      'READY_FOR_PICKUP': {
        icon: '📦',
        head: 'LISTO EN MOSTRADOR',
        main: 'Empaquetado y Caliente',
        desc: 'Buscando el repartidor más cercano con OSRM...',
        stepIdx: 3
      },
      'DRIVER_ASSIGNED': {
        icon: '🏍️',
        head: 'REPARTIDOR ASIGNADO',
        main: 'Repartidor yendo al Local',
        desc: 'Repartidor en camino a retirar tu comida.',
        stepIdx: 4
      },
      'PICKED_UP': {
        icon: '🚀',
        head: 'EN CAMINO',
        main: '¡Comida en Camino a tu Puerta!',
        desc: 'El repartidor está navegando hacia tu dirección en Managua.',
        stepIdx: 4
      },
      'DELIVERED': {
        icon: '🎉',
        head: 'ENTREGADO',
        main: '¡Buen Provecho!',
        desc: 'El pedido fue completado exitosamente.',
        stepIdx: 5
      },
      'CANCELLED': {
        icon: '✕',
        head: 'PEDIDO CANCELADO',
        main: 'Pedido Cancelado',
        desc: 'Este pedido ha sido cancelado.',
        stepIdx: 1
      }
    };

    const currentInfo = statusMap[status] || statusMap['CREATED'];

    const iconBox = document.getElementById('statusIconBox');
    const subhead = document.getElementById('statusSubhead');
    const mainText = document.getElementById('statusMainText');
    const timeEst = document.getElementById('statusTimeEstimate');

    if (iconBox) iconBox.textContent = currentInfo.icon;
    if (subhead) subhead.textContent = currentInfo.head;
    if (mainText) mainText.textContent = currentInfo.main;
    if (timeEst) timeEst.textContent = currentInfo.desc;

    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach((stepEl, idx) => {
      const dot = stepEl.querySelector('.step-dot');
      const title = stepEl.querySelector('h4');
      const stepIndex = idx + 1;

      if (dot && title) {
        if (stepIndex < currentInfo.stepIdx) {
          dot.className = 'step-dot w-6 h-6 rounded-full bg-[#06C167] text-black font-bold text-xs flex items-center justify-center shrink-0';
          dot.textContent = '✓';
          title.className = 'text-xs font-bold text-[#06C167]';
        } else if (stepIndex === currentInfo.stepIdx) {
          dot.className = 'step-dot w-6 h-6 rounded-full bg-[#06C167] text-black font-bold text-xs flex items-center justify-center shrink-0 ring-4 ring-[#06C167]/20 animate-pulse';
          dot.textContent = stepIndex;
          title.className = 'text-xs font-bold text-white';
        } else {
          dot.className = 'step-dot w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0';
          dot.textContent = stepIndex;
          title.className = 'text-xs font-bold text-slate-400';
        }
      }
    });

    const driverTag = document.getElementById('driverStatusTag');
    const dName = document.getElementById('driverName') || document.getElementById('trackingDriverName');
    const dVeh = document.getElementById('driverVehicle') || document.getElementById('trackingDriverVehicle');
    const dRat = document.getElementById('driverRating');
    const dAv = document.getElementById('driverAvatar');
    const callBtn = document.getElementById('btnCallAssignedDriver');

    if (driver) {
      if (driverTag) {
        driverTag.textContent = status === 'DELIVERED' ? 'Completado' : 'Asignado';
        driverTag.className = 'text-[10px] text-[#06C167] font-mono bg-[#06C167]/10 px-2 py-0.5 rounded border border-[#06C167]/20';
      }
      if (dName) dName.textContent = driver.name;
      if (dVeh) dVeh.textContent = `${driver.vehicle} • Placa: ${driver.license_plate}`;
      if (dRat) dRat.textContent = `⭐ ${driver.rating}`;
      if (dAv && driver.avatar) dAv.src = driver.avatar;

      if (callBtn) callBtn.classList.remove('hidden');
      window.currentAssignedDriverPhone = driver.phone;
    } else {
      if (driverTag) {
        driverTag.textContent = 'Buscando Repartidor...';
        driverTag.className = 'text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse';
      }
      if (dName) dName.textContent = 'Esperando asignación de motorizado...';
      if (dVeh) dVeh.textContent = 'Sistema de despacho automático activo';
      if (callBtn) callBtn.classList.add('hidden');
      window.currentAssignedDriverPhone = null;
    }

    const reviewCard = document.getElementById('reviewCard');
    if (reviewCard) {
      if (status === 'DELIVERED') {
        reviewCard.classList.remove('hidden');
      } else {
        reviewCard.classList.add('hidden');
      }
    }

    // Telemetría GPS: si hay coordenadas reales del conductor, mover el marcador real
    if (mapInstance && (status === 'DRIVER_ASSIGNED' || status === 'PICKED_UP')) {
      if (driver && driver.coords && typeof driver.coords.lat === 'number' && typeof driver.coords.lng === 'number') {
        const marker = driverMarker || window.trackingDriverMarker;
        if (marker) {
          marker.setLngLat([driver.coords.lng, driver.coords.lat]);
        }
      } else {
        updateDriverMapPosition(status);
      }
    }
  }

  // 13. INICIALIZACIÓN DEL MAPA CON MAPLIBRE GL
  function initTrackingMap() {
    const mapContainer = document.getElementById('trackingMap');
    if (!mapContainer || typeof maplibregl === 'undefined') return;

    if (mapInstance) {
      mapInstance.resize();
      return;
    }

    mapInstance = new maplibregl.Map({
      container: 'trackingMap',
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: currentOrderRestCoords,
      zoom: 13
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    mapInstance.on('load', () => {
      const restEl = document.createElement('div');
      restEl.className = 'w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg shadow-xl shadow-amber-500/40 border-2 border-slate-900';
      restEl.innerHTML = '🏪';
      restaurantMarker = new maplibregl.Marker(restEl)
        .setLngLat(currentOrderRestCoords)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<b class="text-slate-900">Restaurante</b><br/><span class="text-xs text-slate-600">Origen del pedido</span>'))
        .addTo(mapInstance);

      const destEl = document.createElement('div');
      destEl.className = 'w-9 h-9 rounded-2xl bg-[#06C167] text-black flex items-center justify-center text-lg shadow-xl shadow-[#06C167]/40 border-2 border-slate-900';
      destEl.innerHTML = '📍';
      destinationMarker = new maplibregl.Marker(destEl)
        .setLngLat(currentDeliveryCoords)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<b class="text-slate-900">Tu Domicilio</b><br/><span class="text-xs text-slate-600">Punto de entrega</span>'))
        .addTo(mapInstance);

      const driverEl = document.createElement('div');
      driverEl.id = 'driverLiveMarker';
      driverEl.className = 'w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-xl shadow-2xl shadow-indigo-500/50 border-2 border-white animate-bounce';
      driverEl.innerHTML = '🛵';

      const initialDriverCoords = [
        (currentOrderRestCoords[0] + currentDeliveryCoords[0]) / 2,
        (currentOrderRestCoords[1] + currentDeliveryCoords[1]) / 2
      ];

      driverMarker = new maplibregl.Marker(driverEl)
        .setLngLat(initialDriverCoords)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<b class="text-slate-900">Repartidor en Ruta OSRM</b>'))
        .addTo(mapInstance);
      window.trackingDriverMarker = driverMarker;

      mapInstance.addSource('delivery-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              currentOrderRestCoords,
              initialDriverCoords,
              currentDeliveryCoords
            ]
          }
        }
      });

      mapInstance.addLayer({
        id: 'delivery-route-line',
        type: 'line',
        source: 'delivery-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#06C167',
          'line-width': 4,
          'line-dasharray': [2, 2]
        }
      });

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(currentOrderRestCoords);
      bounds.extend(currentDeliveryCoords);
      mapInstance.fitBounds(bounds, { padding: 80 });
    });
  }

  function updateDriverMapPosition(status) {
    const marker = driverMarker || window.trackingDriverMarker;
    if (!marker) return;
    const progress = status === 'PICKED_UP' ? 0.75 : 0.40;
    const newLng = currentOrderRestCoords[0] + (currentDeliveryCoords[0] - currentOrderRestCoords[0]) * progress;
    const newLat = currentOrderRestCoords[1] + (currentDeliveryCoords[1] - currentOrderRestCoords[1]) * progress;
    marker.setLngLat([newLng, newLat]);
  }

  // 14. ACCIONES DEL TRACKING: LLAMAR AL REPARTIDOR Y CANCELAR PEDIDO
  window.callAssignedDriver = function () {
    const phone = window.currentAssignedDriverPhone || '+505 8822-4455';
    const doCall = confirm(`¿Deseas llamar al repartidor asignado al teléfono ${phone}?`);
    if (doCall) {
      window.open(`tel:${phone.replace(/\s+/g, '')}`, '_self');
    }
  };

  window.cancelActiveClientOrder = async function () {
    if (!activeOrderId) return;
    const sure = confirm('¿Confirmas que deseas cancelar este pedido? Esta acción es irreversible.');
    if (!sure) return;

    try {
      const res = await fetch('/api/client/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrderId })
      });
      const data = await res.json();
      if (data.success) {
        alert('✓ Pedido cancelado exitosamente.');
        loadOrderTrackingData(activeOrderId);
        checkActiveOrder();
      } else {
        alert('No se pudo cancelar el pedido: ' + (data.error || 'Solo pedidos pendientes pueden cancelarse.'));
      }
    } catch (e) {
      alert('Error al cancelar el pedido: ' + e.message);
    }
  };

  // 15. ENVIAR RESEÑA / CALIFICACIÓN
  window.setReviewRating = function (stars) {
    selectedRating = stars;
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach((btn, idx) => {
      if (idx < stars) {
        btn.classList.remove('text-[#757575]', 'text-slate-600');
        btn.classList.add('text-[#06C167]', 'text-amber-400');
      } else {
        btn.classList.remove('text-[#06C167]', 'text-amber-400');
        btn.classList.add('text-[#757575]', 'text-slate-600');
      }
    });
  };

  window.submitReview = async function () {
    const comment = document.getElementById('reviewComment').value.trim();
    const reviewCard = document.getElementById('reviewCard');

    try {
      const res = await fetch('/api/client/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrderId,
          rating: selectedRating,
          comment,
          client_id: clientUser?.id || 'bec363ae-0205-4193-8f01-93e2db50b38e',
          client_name: clientUser?.full_name || 'Cliente Comensal'
        })
      });

      const data = await res.json();
      if (data.success) {
        reviewCard.innerHTML = `
          <div class="py-6 text-center text-[#06C167] space-y-2">
            <span class="text-3xl block">⭐</span>
            <h4 class="text-base font-bold text-white">¡Muchas gracias por tu calificación!</h4>
            <p class="text-xs text-slate-400">Tu reseña se ha registrado en el perfil del restaurante.</p>
          </div>
        `;
      }
    } catch (e) {
      alert('Error al publicar reseña.');
    }
  };

  function playNotificationSound() {
    try {
      const audio = document.getElementById('orderNotificationAudio');
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } catch (e) {}
  }

  // ============================================================================
  // 16. CENTRO DE CUENTA: 4 TABS, LIBRETA MULTI-DIRECCIONES, HISTORIAL Y RESET
  // ============================================================================

  window.switchClientModalTab = function (tab) {
    const tabAddresses = document.getElementById('clientModalTabAddresses');
    const tabProfile = document.getElementById('clientModalTabProfile');
    const tabOrders = document.getElementById('clientModalTabOrders');
    const tabAuth = document.getElementById('clientModalTabAuth');

    const btnAddresses = document.getElementById('tabBtnAddresses');
    const btnProfile = document.getElementById('tabBtnProfile');
    const btnOrders = document.getElementById('tabBtnOrders');
    const btnAuth = document.getElementById('tabBtnAuth');

    [tabAddresses, tabProfile, tabOrders, tabAuth].forEach(t => { if (t) t.classList.add('hidden'); });
    [btnAddresses, btnProfile, btnOrders, btnAuth].forEach(b => {
      if (!b) return;
      b.className = 'py-2.5 px-2.5 min-h-[42px] rounded-xl font-bold text-[#8A94A6] hover:text-white transition-all truncate';
    });

    const activeBtnClass = 'py-2.5 px-2.5 min-h-[42px] rounded-xl font-black bg-[#06C167] text-black transition-all truncate';

    if (tab === 'addresses') {
      if (tabAddresses) tabAddresses.classList.remove('hidden');
      if (btnAddresses) btnAddresses.className = activeBtnClass;
      renderClientAddressBook();
    } else if (tab === 'profile') {
      if (tabProfile) tabProfile.classList.remove('hidden');
      if (btnProfile) btnProfile.className = activeBtnClass;
    } else if (tab === 'orders') {
      if (tabOrders) tabOrders.classList.remove('hidden');
      if (btnOrders) btnOrders.className = activeBtnClass;
      loadClientOrderHistory();
    } else if (tab === 'auth') {
      if (tabAuth) tabAuth.classList.remove('hidden');
      if (btnAuth) btnAuth.className = activeBtnClass;
    }
  };

  // --- LIBRETA DE MÚLTIPLES DIRECCIONES DEL USUARIO ---
  window.renderClientAddressBook = function () {
    const container = document.getElementById('clientSavedAddressesList');
    if (!container) return;

    const list = getActiveSavedAddresses();
    if (list.length === 0) {
      container.innerHTML = `
        <div class="p-6 rounded-2xl bg-[#0D0F14] border border-[#262D3B] text-center space-y-2">
          <span class="text-3xl block">📍</span>
          <p class="text-sm font-bold text-white">No tienes direcciones guardadas aún</p>
          <p class="text-xs text-[#8A94A6]">Toca "+ Nueva Dirección" para guardar Casa, Oficina o Familia.</p>
        </div>`;
      return;
    }

    const typeLabels = {
      'CASA': 'Casa',
      'APARTAMENTO': 'Condominio / Apto',
      'OFICINA': 'Oficina',
      'HOTEL': 'Hotel',
      'OTRO': 'Punto de Entrega'
    };

    container.innerHTML = list.map(addr => {
      const isDefault = Boolean(addr.is_default);
      return `
        <div class="p-4 rounded-2xl bg-[#0D0F14] border-2 ${isDefault ? 'border-[#06C167] bg-[#06C167]/5' : 'border-[#262D3B] hover:border-[#06C167]/40'} transition-all space-y-3">
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl ${isDefault ? 'bg-[#06C167] text-black' : 'bg-[#161922] text-[#06C167]'} flex items-center justify-center text-lg shrink-0 font-bold">
                ${addr.icon || '📍'}
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-extrabold text-white text-sm sm:text-base">${addr.label || 'Dirección'}</span>
                  <span class="px-2 py-0.5 rounded-lg bg-[#1A1D26] border border-[#262D3B] text-xs text-[#8A94A6] font-semibold">${typeLabels[addr.building_type] || 'Domicilio'}</span>
                  ${addr.zone ? `<span class="px-2 py-0.5 rounded-lg bg-[#06C167]/10 border border-[#06C167]/30 text-xs text-[#06C167] font-semibold">${addr.zone}</span>` : ''}
                  ${isDefault ? `<span class="px-2.5 py-0.5 rounded-full bg-[#06C167]/20 text-[#06C167] border border-[#06C167]/40 text-xs font-black">★ Activa</span>` : ''}
                </div>
                <p class="text-xs sm:text-sm text-white font-semibold mt-1 break-words">${addr.address}</p>
                ${addr.reference ? `<p class="text-xs text-[#8A94A6] mt-0.5">📝 Ref: ${addr.reference}</p>` : ''}
                <div class="flex items-center gap-3 mt-1.5 text-xs text-[#8A94A6] font-mono">
                  <span>📞 ${addr.recipient_phone || clientUser?.phone || '+505 8888-0000'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2.5 border-t border-[#1C212D] flex-wrap">
            ${!isDefault ? `
              <button type="button" onclick="selectAddressFromBook('${addr.id}')" class="px-4 py-2.5 min-h-[40px] rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs sm:text-sm transition-all active:scale-95">
                ✓ Entregar Aquí
              </button>
            ` : `
              <button type="button" onclick="selectAddressFromBook('${addr.id}')" class="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 font-extrabold text-xs sm:text-sm">
                📍 En uso actualmente
              </button>
            `}
            <button type="button" onclick="editAddressInBook('${addr.id}')" class="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#1A1D26] hover:bg-[#252A36] text-white border border-[#2E3545] text-xs sm:text-sm font-bold active:scale-95">
              ✏️ Editar
            </button>
            ${list.length > 1 ? `
              <button type="button" onclick="deleteAddressFromBook('${addr.id}')" class="px-3 py-2 min-h-[40px] rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs sm:text-sm font-bold active:scale-95" title="Eliminar dirección">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  };

  window.openAddressBookForm = function (editAddr) {
    const box = document.getElementById('clientAddressFormBox');
    if (!box) return;
    box.classList.remove('hidden');

    const titleEl = document.getElementById('addrFormTitle');
    const editIdEl = document.getElementById('addrFormEditId');
    const labelEl = document.getElementById('addrFormLabel');
    const typeEl = document.getElementById('addrFormBuildingType');
    const exactEl = document.getElementById('addrFormExact');
    const refEl = document.getElementById('addrFormReference');
    const phoneEl = document.getElementById('addrFormPhone');
    const latEl = document.getElementById('addrFormLat');
    const lngEl = document.getElementById('addrFormLng');
    const defEl = document.getElementById('addrFormDefault');

    if (editAddr) {
      if (titleEl) titleEl.innerHTML = '<span>✏️</span> Editar Dirección Guardada';
      if (editIdEl) editIdEl.value = editAddr.id;
      if (labelEl) labelEl.value = editAddr.label || 'Casa';
      if (typeEl) typeEl.value = editAddr.building_type || 'CASA';
      if (exactEl) exactEl.value = editAddr.address || '';
      if (refEl) refEl.value = editAddr.reference || '';
      if (phoneEl) phoneEl.value = editAddr.recipient_phone || clientUser?.phone || '+505 8888-0000';
      if (latEl) latEl.value = editAddr.lat || 12.1022;
      if (lngEl) lngEl.value = editAddr.lng || -86.2415;
      if (defEl) defEl.checked = Boolean(editAddr.is_default);
    } else {
      if (titleEl) titleEl.innerHTML = '<span>📍</span> Agregar Nueva Dirección a mi Libreta';
      if (editIdEl) editIdEl.value = '';
      if (labelEl) labelEl.value = 'Casa';
      if (typeEl) typeEl.value = 'CASA';
      if (exactEl) exactEl.value = '';
      if (refEl) refEl.value = '';
      if (phoneEl) phoneEl.value = clientUser?.phone || '+505 8888-0000';
      if (latEl) latEl.value = '12.1022';
      if (lngEl) lngEl.value = '-86.2415';
      if (defEl) defEl.checked = true;
    }
  };

  window.closeAddressBookForm = function () {
    const box = document.getElementById('clientAddressFormBox');
    if (box) box.classList.add('hidden');
  };

  window.selectAddrLabelChip = function (label) {
    const labelEl = document.getElementById('addrFormLabel');
    if (labelEl) labelEl.value = label;
    const typeEl = document.getElementById('addrFormBuildingType');
    if (typeEl) {
      if (label === 'Oficina') typeEl.value = 'OFICINA';
      else if (label === 'Casa' || label === 'Pareja / Familia') typeEl.value = 'CASA';
      else typeEl.value = 'OTRO';
    }
  };

  window.handleZonePresetChange = function (val) {
    if (!val) return;
    const parts = val.split('|');
    if (parts.length >= 3) {
      const latEl = document.getElementById('addrFormLat');
      const lngEl = document.getElementById('addrFormLng');
      if (latEl) latEl.value = parts[1];
      if (lngEl) lngEl.value = parts[2];
    }
  };

  window.useCurrentGpsForAddressForm = function () {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización directa. Selecciona tu zona en la lista.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const latEl = document.getElementById('addrFormLat');
        const lngEl = document.getElementById('addrFormLng');
        if (latEl) latEl.value = lat;
        if (lngEl) lngEl.value = lng;
        alert(`🎯 Coordenadas GPS capturadas con éxito: ${lat}, ${lng}`);
      },
      () => {
        // Fallback amigable en Managua Centro
        const latEl = document.getElementById('addrFormLat');
        const lngEl = document.getElementById('addrFormLng');
        if (latEl) latEl.value = '12.1260';
        if (lngEl) lngEl.value = '-86.2650';
        alert('📍 Ubicación establecida en Managua Centro (Rotonda El Güegüense: 12.1260, -86.2650).');
      },
      { timeout: 5000 }
    );
  };

  window.saveAddressToBook = async function () {
    const editId = document.getElementById('addrFormEditId')?.value || '';
    const label = document.getElementById('addrFormLabel')?.value.trim() || 'Casa';
    const building_type = document.getElementById('addrFormBuildingType')?.value || 'CASA';
    const zoneRaw = document.getElementById('addrFormZoneSelect')?.value || 'Managua|12.1022|-86.2415';
    const zone = zoneRaw.split('|')[0] || 'Managua';
    const address = document.getElementById('addrFormExact')?.value.trim() || '';
    const reference = document.getElementById('addrFormReference')?.value.trim() || '';
    const recipient_phone = document.getElementById('addrFormPhone')?.value.trim() || clientUser?.phone || '+505 8888-0000';
    const lat = parseFloat(document.getElementById('addrFormLat')?.value) || 12.1022;
    const lng = parseFloat(document.getElementById('addrFormLng')?.value) || -86.2415;
    const is_default = Boolean(document.getElementById('addrFormDefault')?.checked);

    if (!address) {
      alert('Por favor escribe la dirección exacta (calle, número de casa o referencia vial).');
      return;
    }

    const iconMap = {
      'Casa': '🏠',
      'Oficina': '🏢',
      'Pareja / Familia': '❤️',
      'Universidad': '🎓',
      'Otro': '📍'
    };
    const icon = iconMap[label] || '📍';

    if (clientUser && clientUser.id) {
      try {
        const res = await fetch('/api/auth/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: editId ? 'UPDATE' : 'ADD',
            userId: clientUser.id,
            addressId: editId || undefined,
            addressData: {
              label,
              icon,
              building_type,
              zone,
              address,
              reference,
              recipient_phone,
              lat,
              lng,
              is_default
            }
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          clientUser = { ...clientUser, ...data.user };
          localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        }
      } catch (e) {
        console.warn('Error guardando dirección en servidor:', e);
      }
    } else {
      const list = getActiveSavedAddresses();
      if (is_default) {
        list.forEach(a => { a.is_default = false; });
      }
      if (editId) {
        const item = list.find(a => a.id === editId);
        if (item) {
          Object.assign(item, { label, icon, building_type, zone, address, reference, recipient_phone, lat, lng, is_default });
        }
      } else {
        list.unshift({
          id: `addr-${Date.now()}`,
          label,
          icon,
          building_type,
          zone,
          address,
          reference,
          recipient_phone,
          lat,
          lng,
          is_default
        });
      }
      saveLocalAddressList(list);
    }

    if (is_default) {
      currentDeliveryCoords = [lng, lat];
      currentDeliveryAddress = address;
    }

    closeAddressBookForm();
    initClientAuth();
    renderClientAddressBook();
    loadCatalog();
    playNotificationSound();
  };

  window.selectAddressFromBook = async function (addressId) {
    const list = getActiveSavedAddresses();
    const target = list.find(a => a.id === addressId);
    if (!target) return;

    list.forEach(a => { a.is_default = (a.id === addressId); });
    saveLocalAddressList(list);

    if (clientUser && clientUser.id) {
      try {
        const res = await fetch('/api/auth/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SET_DEFAULT',
            userId: clientUser.id,
            addressId
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          clientUser = { ...clientUser, ...data.user };
          localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        }
      } catch (e) {}
    }

    currentDeliveryCoords = [Number(target.lng || -86.2415), Number(target.lat || 12.1022)];
    currentDeliveryAddress = target.address;

    initClientAuth();
    renderClientAddressBook();
    loadCatalog();
    playNotificationSound();
  };

  window.editAddressInBook = function (addressId) {
    const list = getActiveSavedAddresses();
    const target = list.find(a => a.id === addressId);
    if (target) {
      openAddressBookForm(target);
    }
  };

  window.deleteAddressFromBook = async function (addressId) {
    const list = getActiveSavedAddresses();
    if (list.length <= 1) {
      alert('Debes conservar al menos una dirección en tu libreta.');
      return;
    }

    if (clientUser && clientUser.id) {
      try {
        const res = await fetch('/api/auth/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'DELETE',
            userId: clientUser.id,
            addressId
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          clientUser = { ...clientUser, ...data.user };
          localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        }
      } catch (e) {}
    } else {
      const updated = list.filter(a => a.id !== addressId);
      if (!updated.some(a => a.is_default) && updated.length > 0) {
        updated[0].is_default = true;
      }
      saveLocalAddressList(updated);
    }

    initClientAuth();
    renderClientAddressBook();
    loadCatalog();
  };

  window.handleCartAddressSelectChange = function (addressId) {
    if (!addressId) return;
    selectAddressFromBook(addressId);
  };

  window.selectSavedClientAddress = function (label, address, lat, lng) {
    if (clientUser) {
      clientUser.address = address;
      try {
        localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
      } catch (e) {}
    }
    currentDeliveryCoords = [Number(lng), Number(lat)];
    currentDeliveryAddress = address;
    initClientAuth();
    loadCatalog();
  };

  // --- HISTORIAL DE PEDIDOS Y RE-ORDENAR ---
  let cachedOrdersHistory = [];

  window.loadClientOrderHistory = async function () {
    const listEl = document.getElementById('clientOrderHistoryList');
    if (!listEl) return;

    listEl.innerHTML = `
      <div class="py-8 text-center text-[#8A94A6]">
        <div class="w-6 h-6 border-2 border-[#06C167] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="text-xs">Cargando tus pedidos...</p>
      </div>`;

    try {
      const clientId = clientUser?.id || 'c91f2a10-1234-4a9b-9c11-887766554433';
      const res = await fetch(`/api/client/orders-history?client_id=${encodeURIComponent(clientId)}`);
      const data = await res.json();

      if (!data.success || !Array.isArray(data.orders) || data.orders.length === 0) {
        listEl.innerHTML = `
          <div class="py-8 text-center text-[#8A94A6] space-y-1">
            <span class="text-3xl block">📦</span>
            <p class="font-bold text-white text-xs">No tienes pedidos registrados aún</p>
            <p class="text-[10px]">¡Explora el menú y haz tu primer pedido en Managua!</p>
          </div>`;
        return;
      }

      cachedOrdersHistory = data.orders;
      const activeStatuses = ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP'];

      listEl.innerHTML = data.orders.map(ord => {
        const isActive = activeStatuses.includes(ord.status);
        const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        const restName = ord.restaurants?.name || 'Restaurante';
        const total = Number(ord.total || 0).toFixed(2);
        const itemsSummary = (ord.order_items || []).map(i => `${i.quantity}x ${i.products?.name || 'Platillo'}`).join(', ') || 'Platillos varios';

        const statusBadges = {
          'CREATED': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Recibido</span>',
          'ACCEPTED': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">Confirmado</span>',
          'IN_PREPARATION': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">En Cocina</span>',
          'READY_FOR_PICKUP': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Listo</span>',
          'DRIVER_ASSIGNED': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Motorizado</span>',
          'PICKED_UP': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">En Camino</span>',
          'DELIVERED': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">Entregado</span>',
          'CANCELLED': '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">Cancelado</span>'
        };

        const badgeHtml = statusBadges[ord.status] || `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#262626] text-white">${ord.status}</span>`;

        return `
          <div class="p-4 rounded-2xl bg-[#0D0F14] border border-[#262D3B] hover:border-[#06C167]/40 transition-colors space-y-2.5">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-extrabold text-white text-sm">🏪 ${restName}</span>
                  ${badgeHtml}
                </div>
                <div class="text-xs text-[#8A94A6] mt-0.5 font-mono">#${ord.id.slice(0, 8).toUpperCase()} • ${dateStr}</div>
              </div>
              <div class="text-right">
                <span class="font-black text-[#06C167] font-mono text-sm">C$ ${total}</span>
              </div>
            </div>

            <p class="text-xs sm:text-sm text-[#A6A6A6] truncate">${itemsSummary}</p>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1C212D]">
              ${isActive ? `
                <button type="button" onclick="toggleTrackingView(true, '${ord.id}'); closeClientProfileModal();" class="px-4 py-2 min-h-[40px] rounded-xl bg-[#06C167]/15 hover:bg-[#06C167]/25 text-[#06C167] border border-[#06C167]/30 text-xs sm:text-sm font-black transition-all active:scale-95">
                  📍 Ver Tracking
                </button>
              ` : ''}
              <button type="button" onclick="reorderPastOrder('${ord.id}')" class="px-4 py-2 min-h-[40px] rounded-xl bg-[#1A1D26] hover:bg-[#252A36] text-white border border-[#2E3545] text-xs sm:text-sm font-extrabold transition-all active:scale-95">
                🔄 Pedir de Nuevo
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      listEl.innerHTML = `
        <div class="py-6 text-center text-rose-400 text-xs">
          Error al cargar historial: ${e.message}
        </div>`;
    }
  };

  window.reorderPastOrder = async function (orderId) {
    let targetOrder = cachedOrdersHistory.find(o => o.id === orderId);
    if (!targetOrder) {
      try {
        const res = await fetch(`/api/client/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.order) {
          targetOrder = data.order;
          targetOrder.order_items = data.items;
        }
      } catch (e) {}
    }

    if (!targetOrder || !targetOrder.order_items || !targetOrder.order_items.length) {
      alert('No se pudieron obtener los platos de esta orden previa.');
      return;
    }

    cart = [];
    const restId = targetOrder.restaurant_id;
    const restName = targetOrder.restaurants?.name || 'Restaurante';

    targetOrder.order_items.forEach(it => {
      const prod = it.products || {};
      const unitPrice = Number(it.unit_price || prod.price || 0);
      const customDelta = Number(it.customizations?.price_delta || 0);
      const selectedOpts = it.customizations?.options || [];
      const notes = it.customizations?.special_notes || '';

      cart.push({
        product_id: it.product_id || prod.id,
        restaurant_id: restId,
        restaurant_name: restName,
        distance_km: 3.0,
        delivery_radius_km: 10.0,
        in_radius: true,
        name: prod.name || 'Platillo',
        image_url: prod.image_url || '',
        unit_price: unitPrice,
        customization_delta: customDelta,
        quantity: it.quantity || 1,
        selected_options: selectedOpts,
        notes: notes
      });
    });

    updateCartUI();
    renderCartDrawerItems();
    closeClientProfileModal();
    toggleCartDrawer(true);
    playNotificationSound();
  };

  // --- AUTENTICACIÓN, CAMBIO DE CUENTA DEMO Y RECUPERACIÓN DE CONTRASEÑA ---
  window.quickSwitchDemoClient = async function (who) {
    const email = who === 'sofia' ? 'sofia@pedidosnica.com' : 'mateo@pedidosnica.com';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' })
      });
      const data = await res.json();
      if (data.success && data.user) {
        clientUser = data.user;
        localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        const defAddr = (clientUser.saved_addresses || []).find(a => a.is_default) || (clientUser.saved_addresses || [])[0];
        if (defAddr) {
          currentDeliveryCoords = [Number(defAddr.lng || -86.2415), Number(defAddr.lat || 12.1022)];
          currentDeliveryAddress = defAddr.address;
        }
        initClientAuth();
        checkActiveOrder();
        loadCatalog();
        switchClientModalTab('addresses');
        return;
      }
    } catch (e) {}
  };

  window.loginClientAccount = async function () {
    const identifierInput = document.getElementById('clientAuthEmailInput');
    const passInput = document.getElementById('clientAuthPassInput');
    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!identifier || !password) {
      alert('Ingresa tu correo o teléfono y tu contraseña.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, email: identifier, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        clientUser = data.user;
        localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        const defAddr = (clientUser.saved_addresses || []).find(a => a.is_default) || (clientUser.saved_addresses || [])[0];
        if (defAddr) {
          currentDeliveryCoords = [Number(defAddr.lng || -86.2415), Number(defAddr.lat || 12.1022)];
          currentDeliveryAddress = defAddr.address;
        }
        initClientAuth();
        checkActiveOrder();
        loadCatalog();
        alert(`¡Bienvenido de vuelta, ${clientUser.full_name}!`);
        closeClientProfileModal();
      } else {
        alert(data.error || 'Credenciales incorrectas.');
      }
    } catch (e) {
      alert('Error al iniciar sesión: ' + e.message);
    }
  };

  // --- FLUJO DE RECUPERACIÓN DE CONTRASEÑA (EMAIL OTP / SMS OTP / PREGUNTA DE SEGURIDAD) ---
  let activeRecoveryMethod = 'EMAIL';
  let activeRecoveryUserId = null;

  window.toggleClientPasswordRecovery = function (show) {
    const recBox = document.getElementById('clientPasswordRecoveryBox');
    const loginBox = document.getElementById('clientLoginBox');
    if (recBox) recBox.classList.toggle('hidden', !show);
    if (loginBox) loginBox.classList.toggle('hidden', Boolean(show));

    if (show) {
      const loginEmail = document.getElementById('clientAuthEmailInput')?.value.trim() || clientUser?.email || '';
      const recInput = document.getElementById('recIdentifierInput');
      if (recInput && loginEmail) recInput.value = loginEmail;
      selectRecoveryMethod('EMAIL');
    }
  };

  window.selectRecoveryMethod = function (method) {
    activeRecoveryMethod = method;
    ['EMAIL', 'SMS', 'SECURITY_QUESTION'].forEach(m => {
      const btn = document.getElementById(`recMethodBtn${m}`);
      if (!btn) return;
      if (m === method) {
        btn.className = 'py-1.5 px-2 rounded-lg font-bold bg-[#06C167] text-black transition-all';
      } else {
        btn.className = 'py-1.5 px-2 rounded-lg font-semibold text-[#8A94A6] hover:text-white transition-all';
      }
    });

    const lbl = document.getElementById('recIdentifierLabel');
    const initBtn = document.getElementById('recInitiateBtn');
    const banner = document.getElementById('recDemoNotificationBanner');
    const step2 = document.getElementById('recStep2Box');

    if (banner) banner.classList.add('hidden');
    if (step2) step2.classList.add('hidden');

    if (method === 'EMAIL') {
      if (lbl) lbl.innerText = 'Ingresa tu Correo Electrónico registrado *';
      if (initBtn) initBtn.innerText = 'Enviar Código Email';
    } else if (method === 'SMS') {
      if (lbl) lbl.innerText = 'Ingresa tu Número de Teléfono (+505) o Correo *';
      if (initBtn) initBtn.innerText = 'Enviar SMS';
    } else {
      if (lbl) lbl.innerText = 'Ingresa tu Correo Electrónico o Teléfono *';
      if (initBtn) initBtn.innerText = 'Ver Pregunta';
    }
  };

  window.fillDemoOtpCode = function (code) {
    const otpInput = document.getElementById('recOtpCodeInput');
    if (otpInput) {
      otpInput.value = code;
      otpInput.focus();
    }
  };

  window.initiateClientPasswordRecovery = async function () {
    const identifier = document.getElementById('recIdentifierInput')?.value.trim() || '';
    if (!identifier) {
      alert('Por favor ingresa tu correo electrónico o número de teléfono.');
      return;
    }

    try {
      const res = await fetch('/api/auth/recovery/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          method: activeRecoveryMethod
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'No se pudo iniciar la recuperación.');
        return;
      }

      activeRecoveryUserId = data.userId;

      const banner = document.getElementById('recDemoNotificationBanner');
      const step2 = document.getElementById('recStep2Box');
      const otpGroup = document.getElementById('recOtpInputGroup');
      const secGroup = document.getElementById('recSecQuestionGroup');
      const secDisplay = document.getElementById('recSecQuestionDisplay');

      if (step2) step2.classList.remove('hidden');

      if (activeRecoveryMethod === 'EMAIL' || activeRecoveryMethod === 'SMS') {
        if (otpGroup) otpGroup.classList.remove('hidden');
        if (secGroup) secGroup.classList.add('hidden');
        if (banner) {
          banner.classList.remove('hidden');
          const icon = activeRecoveryMethod === 'EMAIL' ? '📧' : '💬';
          const channelName = activeRecoveryMethod === 'EMAIL' ? 'Correo Electrónico' : 'Mensaje SMS / WhatsApp';
          banner.innerHTML = `
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-black text-[#06C167] text-[11px]">${icon} ${channelName} enviado a ${data.maskedDestination}</div>
                <p class="text-[11px] text-white mt-0.5">Hola <b>${data.fullName}</b>, tu código de seguridad de PedidosNica es: <span class="font-mono font-black text-amber-400 bg-black px-2 py-0.5 rounded border border-amber-500/40">${data.demoOtpCode}</span></p>
              </div>
              <button type="button" onclick="fillDemoOtpCode('${data.demoOtpCode}')" class="px-2.5 py-1 rounded-lg bg-[#06C167] text-black font-black text-[10px] shrink-0">
                Autocompletar
              </button>
            </div>
          `;
        }
      } else {
        if (otpGroup) otpGroup.classList.add('hidden');
        if (secGroup) secGroup.classList.remove('hidden');
        if (secDisplay) secDisplay.innerText = data.securityQuestion || '¿Cuál es tu comida nica favorita?';
        if (banner) {
          banner.classList.remove('hidden');
          banner.innerHTML = `
            <div class="text-[11px] text-white">
              🛡️ Cuenta localizada: <b>${data.fullName}</b>. Responde tu pregunta de seguridad para continuar.
            </div>
          `;
        }
      }
      playNotificationSound();
    } catch (e) {
      alert('Error de conexión: ' + e.message);
    }
  };

  window.completeClientPasswordRecovery = async function () {
    const identifier = document.getElementById('recIdentifierInput')?.value.trim() || '';
    const code = document.getElementById('recOtpCodeInput')?.value.trim() || '';
    const securityAnswer = document.getElementById('recSecAnswerInput')?.value.trim() || '';
    const newPassword = document.getElementById('recNewPasswordInput')?.value.trim() || '';
    const confirmPassword = document.getElementById('recConfirmPasswordInput')?.value.trim() || '';

    if (!newPassword || newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden. Verifícalas por favor.');
      return;
    }

    try {
      const res = await fetch('/api/auth/recovery/verify-and-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeRecoveryUserId,
          identifier,
          method: activeRecoveryMethod,
          code,
          securityAnswer,
          newPassword
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Error al verificar código o respuesta.');
        return;
      }

      if (data.user) {
        clientUser = data.user;
        localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        initClientAuth();
        checkActiveOrder();
        loadCatalog();
      }

      playNotificationSound();
      alert(data.message || '¡Contraseña actualizada con éxito! Has iniciado sesión automáticamente.');
      toggleClientPasswordRecovery(false);
      closeClientProfileModal();
    } catch (e) {
      alert('Error al restablecer contraseña: ' + e.message);
    }
  };

  window.registerClientAccount = async function () {
    const name = document.getElementById('regClientName')?.value.trim();
    const email = document.getElementById('regClientEmail')?.value.trim();
    const phone = document.getElementById('regClientPhone')?.value.trim();
    const password = document.getElementById('regClientPassword')?.value.trim();
    const address = document.getElementById('regClientAddress')?.value.trim() || 'Galerías Santo Domingo, Managua';
    const security_question = document.getElementById('regClientSecQuestion')?.value || '¿Cuál es tu comida nica favorita?';
    const security_answer = document.getElementById('regClientSecAnswer')?.value.trim() || 'gallo pinto';

    if (!name || !email || !password) {
      alert('Por favor completa nombre, correo y contraseña.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          phone: phone || '+505 8888-0000',
          password,
          address,
          security_question,
          security_answer,
          role: 'CLIENT'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        clientUser = data.user;
        localStorage.setItem('pedidosnica_client_user', JSON.stringify(clientUser));
        initClientAuth();
        checkActiveOrder();
        loadCatalog();
        alert(`¡Cuenta creada con éxito! Bienvenido, ${clientUser.full_name}`);
        closeClientProfileModal();
      } else {
        alert('Error al crear cuenta: ' + (data.error || 'Verifica los datos.'));
      }
    } catch (e) {
      alert('Error en registro: ' + e.message);
    }
  };

  window.logoutClientAccount = function () {
    clientUser = null;
    window.clientUser = null;
    try {
      localStorage.removeItem('pedidosnica_client_user');
    } catch (e) {}
    initClientAuth();
    checkActiveOrder();
    alert('Has cerrado sesión. Ahora navegas como Invitado.');
    closeClientProfileModal();
  };

})();
