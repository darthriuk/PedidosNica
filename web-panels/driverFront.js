// ============================================================================
// PEDIDOSNICA DRIVER - FRONTEND OPERATIVO Y TELEMETRÍA EN TIEMPO REAL
// ============================================================================

(function () {
  'use strict';

  const SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';
  const DEFAULT_DRIVER_ID = '6c5c143c-e567-4e1d-85b7-d4f984628816';

  let currentDriverId = (function() {
    try {
      return localStorage.getItem('pedidosnica_driver_id') || DEFAULT_DRIVER_ID;
    } catch (e) {
      return DEFAULT_DRIVER_ID;
    }
  })();

  let pedidosnica_driver_session = null;
  let isOnline = true;
  let currentViewMode = 'cockpit'; // 'cockpit' | 'phone'
  let driverProfile = null;
  let activeOrder = null;
  let currentStep = 'NONE'; // 'NONE' | 'TO_REST' | 'IN_KITCHEN' | 'TO_CLIENT' | 'DELIVERING' | 'DELIVERED'
  let currentCoordinates = { lng: -86.2650, lat: 12.1260 }; // Managua centro (Los Robles)

  // MapLibre Instances & Markers
  let driverMap = null;
  let phoneMap = null;
  let driverMarker = null;
  let phoneDriverMarker = null;
  let restaurantMarker = null;
  let deliveryMarker = null;

  // Supabase Client & Realtime Channels
  let supabase = null;
  let dispatchChannel = null;
  let orderTrackingChannel = null;

  // Timers & Intervals
  let offerCountdownTimer = null;
  let offerSecondsLeft = 20;
  let currentOfferPayload = null;
  let gpsSimInterval = null;
  let gpsSimProgress = 0;
  let ordersPollInterval = null;

  // Helper de formateo de vehículo
  function formatVehicleLabel(vt) {
    if (vt === 'BICYCLE') return 'Bicicleta Pro';
    if (vt === 'CAR') return 'Automóvil';
    return 'Moto Honda 150';
  }

  // Cálculo de distancia Haversine en kilómetros
  function calculateDistanceKm(coord1, coord2) {
    if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord2.lat !== 'number' || typeof coord1.lng !== 'number' || typeof coord2.lng !== 'number') {
      return '2.5';
    }
    const R = 6371; // radio terrestre en km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }

  // Modal de Perfil de Conductor
  window.openDriverProfileModal = function() {
    const modal = document.getElementById('modalDriverProfile');
    if (modal) modal.classList.remove('hidden');
    fillDriverProfileForm();
  };

  window.closeDriverProfileModal = function() {
    const modal = document.getElementById('modalDriverProfile');
    if (modal) modal.classList.add('hidden');
  };

  // ==========================================================================
  // SESIÓN INDEPENDIENTE DE CONDUCTOR Y BLOQUEO DE RESTAURANTES
  // ==========================================================================
  function initDriverAuth() {
    // 1. Bloqueo estricto: Verificar si el usuario actual es de Restaurante
    try {
      const restSession = JSON.parse(localStorage.getItem('pedidosnica_rest_session') || localStorage.getItem('pedidosnica_rest_user') || 'null');
      if (restSession && (restSession.role === 'RESTAURANT_ADMIN' || restSession.subrole === 'STAFF')) {
        const blockedNotice = document.getElementById('restaurantBlockedDriverNotice');
        const rootContent = document.getElementById('driverAppRootContent');
        const loginGate = document.getElementById('driverLoginGate');

        if (blockedNotice) blockedNotice.classList.remove('hidden');
        if (rootContent) rootContent.classList.add('hidden');
        if (loginGate) loginGate.classList.add('hidden');
        return false;
      }
    } catch (e) {}

    const blockedNotice = document.getElementById('restaurantBlockedDriverNotice');
    if (blockedNotice) blockedNotice.classList.add('hidden');

    // 2. Verificar sesión de conductor
    try {
      const stored = localStorage.getItem('pedidosnica_driver_session');
      if (stored) {
        pedidosnica_driver_session = JSON.parse(stored);
      }
    } catch (e) {}

    const rootContent = document.getElementById('driverAppRootContent');
    const loginGate = document.getElementById('driverLoginGate');

    if (!pedidosnica_driver_session || !pedidosnica_driver_session.id) {
      if (loginGate) loginGate.classList.remove('hidden');
      if (rootContent) rootContent.classList.add('hidden');
      return false;
    }

    if (loginGate) loginGate.classList.add('hidden');
    if (rootContent) rootContent.classList.remove('hidden');

    currentDriverId = pedidosnica_driver_session.id;
    localStorage.setItem('pedidosnica_driver_id', currentDriverId);

    // Actualizar datos del conductor en la barra superior y modal
    const nameHeader = document.getElementById('driverNameHeader');
    const vehicleHeader = document.getElementById('driverVehicleHeader');
    const plateHeader = document.getElementById('driverPlateHeader');
    const cardName = document.getElementById('driverProfileCardName');
    const cardSub = document.getElementById('driverProfileCardSubtitle');

    if (nameHeader) nameHeader.innerText = pedidosnica_driver_session.full_name || 'Conductor';
    if (cardName) cardName.innerText = pedidosnica_driver_session.full_name || 'Conductor';
    if (vehicleHeader) vehicleHeader.innerText = formatVehicleLabel(pedidosnica_driver_session.vehicle_type);
    if (plateHeader) plateHeader.innerText = pedidosnica_driver_session.license_plate || 'A482XYZ';
    if (cardSub) {
      const vPrefix = pedidosnica_driver_session.vehicle_type === 'BICYCLE' ? 'Bicicleta' : (pedidosnica_driver_session.vehicle_type === 'CAR' ? 'Automóvil' : 'Moto');
      cardSub.innerText = vPrefix + ' • ' + (pedidosnica_driver_session.license_plate || '');
    }

    fillDriverProfileForm();
    return true;
  }

  window.logoutRestaurantSessionFromDriver = function() {
    localStorage.removeItem('pedidosnica_rest_session');
    localStorage.removeItem('pedidosnica_rest_user');
    initDriverAuth();
  };

  // Pestañas de Login vs Registro en el Portal de Entrada
  window.switchDriverAuthTab = function(tab) {
    const loginBox = document.getElementById('driverLoginFormBox');
    const regBox = document.getElementById('driverRegisterFormBox');
    const tabLoginBtn = document.getElementById('tabDriverLoginBtn');
    const tabRegBtn = document.getElementById('tabDriverRegisterBtn');

    if (tab === 'register') {
      if (loginBox) loginBox.classList.add('hidden');
      if (regBox) regBox.classList.remove('hidden');
      if (tabRegBtn) {
        tabRegBtn.className = 'flex-1 py-2 rounded-xl text-xs font-black transition-all bg-[#06C167] text-black shadow-md cursor-pointer';
      }
      if (tabLoginBtn) {
        tabLoginBtn.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all text-[#8A94A6] hover:text-white cursor-pointer';
      }
    } else {
      if (regBox) regBox.classList.add('hidden');
      if (loginBox) loginBox.classList.remove('hidden');
      if (tabLoginBtn) {
        tabLoginBtn.className = 'flex-1 py-2 rounded-xl text-xs font-black transition-all bg-[#06C167] text-black shadow-md cursor-pointer';
      }
      if (tabRegBtn) {
        tabRegBtn.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all text-[#8A94A6] hover:text-white cursor-pointer';
      }
    }
  };

  window.loginDriverWithForm = async function() {
    const emailInput = document.getElementById('driverLoginEmail');
    const passInput = document.getElementById('driverLoginPassword');
    if (!emailInput || !passInput) return;
    await loginDriver(emailInput.value.trim(), passInput.value.trim());
  };

  window.quickFillDriverLogin = async function(email, password) {
    const emailInput = document.getElementById('driverLoginEmail');
    const passInput = document.getElementById('driverLoginPassword');
    if (emailInput) emailInput.value = email;
    if (passInput) passInput.value = password;
    await loginDriver(email, password);
  };

  async function loginDriver(email, password) {
    const btn = document.getElementById('btnDriverLoginSubmit');
    if (btn) {
      btn.innerText = 'Verificando con plataforma...';
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
        if (data.user.role !== 'DRIVER') {
          alert('Esta cuenta no pertenece a un repartidor registrado.');
          if (btn) {
            btn.innerText = 'Ingresar y Conectarse';
            btn.disabled = false;
          }
          return;
        }

        pedidosnica_driver_session = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          phone: data.user.phone,
          vehicle_type: (data.user.driver_profile && data.user.driver_profile.vehicle_type) || 'MOTORCYCLE',
          license_plate: (data.user.driver_profile && data.user.driver_profile.license_plate) || 'A482XYZ'
        };

        localStorage.setItem('pedidosnica_driver_session', JSON.stringify(pedidosnica_driver_session));
        currentDriverId = data.user.id;
        localStorage.setItem('pedidosnica_driver_id', currentDriverId);

        const isAuth = initDriverAuth();
        if (isAuth) {
          if (!supabase) initSupabase();
          else { subscribeToDispatchChannel(); subscribeToOrdersChanges(); }
          if (!driverMap) initMap();
          await loadDriverProfile();
          await loadDriverHistoryAndEarnings();
          await checkActiveOrders();
          startPollingOrders();
          playAudioChime(660, 0.2);
        }
      } else {
        alert(data.error || 'Credenciales inválidas de conductor.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      if (btn) {
        btn.innerText = 'Ingresar y Conectarse';
        btn.disabled = false;
      }
    }
  }

  // Registro de nuevo conductor en la plataforma
  window.registerDriverWithForm = async function() {
    const nameInp = document.getElementById('regDriverName');
    const emailInp = document.getElementById('regDriverEmail');
    const phoneInp = document.getElementById('regDriverPhone');
    const vehInp = document.getElementById('regDriverVehicle');
    const plateInp = document.getElementById('regDriverPlate');
    const passInp = document.getElementById('regDriverPassword');
    const btn = document.getElementById('btnDriverRegisterSubmit');

    const full_name = nameInp ? nameInp.value.trim() : '';
    const email = emailInp ? emailInp.value.trim() : '';
    const phone = phoneInp ? phoneInp.value.trim() : '+505 8888-0000';
    const vehicle_type = vehInp ? vehInp.value : 'MOTORCYCLE';
    const license_plate = plateInp ? plateInp.value.trim() : 'M-88991';
    const password = passInp ? passInp.value.trim() : 'Password123!';

    if (!full_name || !email) {
      alert('Por favor completa tu nombre completo y correo electrónico.');
      return;
    }

    if (btn) {
      btn.innerText = 'Creando cuenta de repartidor...';
      btn.disabled = true;
    }

    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name,
          email,
          phone,
          password,
          role: 'DRIVER',
          vehicle_type,
          license_plate
        })
      });
      const data = await resp.json();

      if (data.success && data.user) {
        pedidosnica_driver_session = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          phone: data.user.phone,
          vehicle_type: (data.user.driver_profile && data.user.driver_profile.vehicle_type) || vehicle_type,
          license_plate: (data.user.driver_profile && data.user.driver_profile.license_plate) || license_plate
        };

        localStorage.setItem('pedidosnica_driver_session', JSON.stringify(pedidosnica_driver_session));
        currentDriverId = data.user.id;
        localStorage.setItem('pedidosnica_driver_id', currentDriverId);

        const isAuth = initDriverAuth();
        if (isAuth) {
          if (!supabase) initSupabase();
          else { subscribeToDispatchChannel(); subscribeToOrdersChanges(); }
          if (!driverMap) initMap();
          await loadDriverProfile();
          await loadDriverHistoryAndEarnings();
          await checkActiveOrders();
          startPollingOrders();
          playAudioChime(660, 0.2);
        }
      } else {
        alert(data.error || 'No se pudo completar el registro del repartidor.');
      }
    } catch (e) {
      console.error('Error al registrar conductor:', e);
      alert('Error de conexión al registrar conductor.');
    } finally {
      if (btn) {
        btn.innerText = 'Crear Cuenta de Repartidor y Conectarme';
        btn.disabled = false;
      }
    }
  };

  window.logoutDriver = function() {
    try {
      fetch('/api/driver/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: currentDriverId, status: 'OFFLINE' })
      }).catch(() => {});
    } catch (e) {}

    localStorage.removeItem('pedidosnica_driver_session');
    localStorage.removeItem('pedidosnica_driver_id');
    pedidosnica_driver_session = null;

    if (ordersPollInterval) {
      clearInterval(ordersPollInterval);
      ordersPollInterval = null;
    }
    if (gpsSimInterval) {
      clearInterval(gpsSimInterval);
      gpsSimInterval = null;
    }

    closeDriverProfileModal();
    initDriverAuth();
  };

  function fillDriverProfileForm() {
    const session = pedidosnica_driver_session;
    if (!session) return;

    const nameInp = document.getElementById('driverProfileNameInput');
    const phoneInp = document.getElementById('driverProfilePhoneInput');
    const vehInp = document.getElementById('driverProfileVehicleTypeInput');
    const plateInp = document.getElementById('driverProfilePlateInput');

    if (nameInp) nameInp.value = session.full_name || '';
    if (phoneInp) phoneInp.value = session.phone || '';
    if (vehInp) vehInp.value = session.vehicle_type || 'MOTORCYCLE';
    if (plateInp) plateInp.value = session.license_plate || '';

    loadDriverHistoryAndEarnings();
  }

  window.saveDriverProfile = async function() {
    if (!pedidosnica_driver_session) return;

    const nameInp = document.getElementById('driverProfileNameInput');
    const phoneInp = document.getElementById('driverProfilePhoneInput');
    const vehInp = document.getElementById('driverProfileVehicleTypeInput');
    const plateInp = document.getElementById('driverProfilePlateInput');

    const fullName = nameInp ? nameInp.value.trim() : (pedidosnica_driver_session.full_name || 'Conductor');
    const phone = phoneInp ? phoneInp.value.trim() : '';
    const vehicleType = vehInp ? vehInp.value : 'MOTORCYCLE';
    const licensePlate = plateInp ? plateInp.value.trim() : '';

    pedidosnica_driver_session.full_name = fullName;
    pedidosnica_driver_session.phone = phone;
    pedidosnica_driver_session.vehicle_type = vehicleType;
    pedidosnica_driver_session.license_plate = licensePlate;
    localStorage.setItem('pedidosnica_driver_session', JSON.stringify(pedidosnica_driver_session));

    const nameEl = document.getElementById('driverNameHeader');
    const cardNameEl = document.getElementById('driverProfileCardName');
    const plateEl = document.getElementById('driverPlateHeader');
    const vehEl = document.getElementById('driverVehicleHeader');
    const cardSub = document.getElementById('driverProfileCardSubtitle');

    if (nameEl) nameEl.innerText = fullName;
    if (cardNameEl) cardNameEl.innerText = fullName;
    if (plateEl) plateEl.innerText = licensePlate;
    if (vehEl) vehEl.innerText = formatVehicleLabel(vehicleType);
    if (cardSub) {
      const vPrefix = vehicleType === 'BICYCLE' ? 'Bicicleta' : (vehicleType === 'CAR' ? 'Automóvil' : 'Moto');
      cardSub.innerText = vPrefix + ' • ' + licensePlate;
    }

    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pedidosnica_driver_session.id,
          fullName,
          phone,
          vehicleType,
          licensePlate
        })
      });
    } catch (e) {}

    closeDriverProfileModal();
    playAudioChime(880, 0.25);
  };

  // Reclamo directo atómico de orden de zona
  window.claimZoneOrder = async function(orderId) {
    try {
      const resp = await fetch('/api/driver/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          driverId: currentDriverId
        })
      });
      const data = await resp.json();
      if (data.success) {
        playOfferAlertChime();
        await checkActiveOrders();
      } else {
        alert(data.error || 'Este pedido ya fue tomado por otro conductor en la zona.');
        await checkActiveOrders();
      }
    } catch (e) {
      console.error('Error claiming order:', e);
    }
  };

  // 1. INICIALIZACIÓN AL CARGAR LA PÁGINA
  window.addEventListener('DOMContentLoaded', async () => {
    const isAuth = initDriverAuth();
    if (isAuth) {
      initSupabase();
      initMap();
      await loadDriverProfile();
      await loadDriverHistoryAndEarnings();
      await checkActiveOrders();
      startPollingOrders();
    }
  });

  // 2. INICIALIZACIÓN DE SUPABASE & REALTIME WEBSOCKETS
  function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      subscribeToDispatchChannel();
      subscribeToOrdersChanges();
    }
  }

  function subscribeToDispatchChannel() {
    if (!supabase || !currentDriverId) return;

    if (dispatchChannel) dispatchChannel.unsubscribe();

    const channelName = `driver-dispatch:${currentDriverId}`;
    dispatchChannel = supabase.channel(channelName);

    dispatchChannel
      .on('broadcast', { event: 'new_order_offer' }, ({ payload }) => {
        console.log('[Driver Web] ¡Nueva oferta de despacho recibida!', payload);
        handleIncomingOffer(payload);
      })
      .subscribe((status) => {
        console.log(`[Driver Web] Canal de despacho ${channelName}: ${status}`);
      });
  }

  function subscribeToOrdersChanges() {
    if (!supabase) return;

    supabase
      .channel('driver-general-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[Driver Web] Evento de pedidos en Supabase:', payload.eventType);
        checkActiveOrders();
      })
      .subscribe();
  }

  // 3. INICIALIZACIÓN DEL MAPA CON MAPLIBRE GL
  function initMap() {
    const mapContainer = document.getElementById('driverMap');
    if (!mapContainer || typeof maplibregl === 'undefined') return;

    // Mapa Cockpit Principal
    driverMap = new maplibregl.Map({
      container: 'driverMap',
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [currentCoordinates.lng, currentCoordinates.lat],
      zoom: 14.5
    });

    driverMap.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    driverMap.on('load', () => {
      setupMapLayersAndMarkers(driverMap);
      if (activeOrder) drawOrderOnMap();
    });
  }

  function setupMapLayersAndMarkers(map) {
    if (!map) return;

    const el = document.createElement('div');
    el.id = 'driverLivePin';
    el.className = 'w-11 h-11 rounded-2xl bg-[#06C167] text-black flex items-center justify-center text-xl shadow-2xl shadow-[#06C167]/50 border-2 border-white transition-all transform';
    el.innerHTML = '🛵';

    driverMarker = new maplibregl.Marker({ element: el })
      .setLngLat([currentCoordinates.lng, currentCoordinates.lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<b class="text-slate-900">Tu Ubicación</b><br/><span class="text-xs text-slate-600">En Línea • Managua</span>'))
      .addTo(map);

    if (!map.getSource('driver-route')) {
      map.addSource('driver-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        }
      });

      map.addLayer({
        id: 'driver-route-line',
        type: 'line',
        source: 'driver-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#06C167',
          'line-width': 6,
          'line-dasharray': [2, 1]
        }
      });
    }
  }

  // 4. SELECTOR DE VISTA: SMARTPHONE VS COCKPIT
  window.switchViewMode = function (mode) {
    currentViewMode = mode;
    const cockpitEl = document.getElementById('cockpitContainer');
    const phoneEl = document.getElementById('phoneViewContainer');
    const btnCockpit = document.getElementById('viewModeCockpitBtn');
    const btnPhone = document.getElementById('viewModePhoneBtn');

    if (mode === 'phone') {
      cockpitEl.classList.add('hidden');
      phoneEl.classList.remove('hidden');
      phoneEl.classList.add('flex');

      btnCockpit.className = 'px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-[#8A94A6] hover:text-white';
      btnPhone.className = 'px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-[#06C167] text-black shadow-md';

      initPhoneMapIfNeeded();
    } else {
      phoneEl.classList.add('hidden');
      phoneEl.classList.remove('flex');
      cockpitEl.classList.remove('hidden');

      btnPhone.className = 'px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-[#8A94A6] hover:text-white';
      btnCockpit.className = 'px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-[#06C167] text-black shadow-md';

      if (driverMap) driverMap.resize();
    }
  };

  function initPhoneMapIfNeeded() {
    const container = document.getElementById('phoneDriverMap');
    if (!container || phoneMap || typeof maplibregl === 'undefined') {
      if (phoneMap) phoneMap.resize();
      return;
    }

    phoneMap = new maplibregl.Map({
      container: 'phoneDriverMap',
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [currentCoordinates.lng, currentCoordinates.lat],
      zoom: 14.5
    });

    phoneMap.on('load', () => {
      const el = document.createElement('div');
      el.className = 'w-10 h-10 rounded-2xl bg-[#06C167] text-black flex items-center justify-center text-lg shadow-2xl border-2 border-white';
      el.innerHTML = '🛵';

      phoneDriverMarker = new maplibregl.Marker({ element: el })
        .setLngLat([currentCoordinates.lng, currentCoordinates.lat])
        .addTo(phoneMap);

      if (activeOrder) drawOrderOnPhoneMap();
    });
  }

  // Controles de capa de mapa
  window.setMapStyle = function (style) {
    if (!driverMap) return;
    const url = style === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://tiles.openfreemap.org/styles/bright';
    driverMap.setStyle(url);
    driverMap.once('style.load', () => {
      setupMapLayersAndMarkers(driverMap);
      if (activeOrder) drawOrderOnMap();
    });
  };

  window.centerMapOnDriver = function () {
    const targetMap = currentViewMode === 'phone' ? phoneMap : driverMap;
    if (targetMap) {
      targetMap.flyTo({
        center: [currentCoordinates.lng, currentCoordinates.lat],
        zoom: 15,
        essential: true
      });
    }
  };

  // 5. CARGAR PERFIL DEL REPARTIDOR
  async function loadDriverProfile() {
    try {
      const resp = await fetch(`/api/driver/profile?driverId=${encodeURIComponent(currentDriverId)}`);
      const data = await resp.json();

      if (data.success && data.driver) {
        driverProfile = data.driver;
        isOnline = driverProfile.current_status === 'AVAILABLE' || driverProfile.current_status === 'BUSY';

        // Actualizar UI de cabecera
        const nameEl = document.getElementById('driverNameHeader');
        if (nameEl) nameEl.innerText = driverProfile.full_name;

        const vehicleEl = document.getElementById('driverVehicleHeader');
        if (vehicleEl) vehicleEl.innerText = formatVehicleLabel(driverProfile.vehicle_type);

        const plateEl = document.getElementById('driverPlateHeader');
        if (plateEl) plateEl.innerText = driverProfile.license_plate || 'A482XYZ';

        const batEl = document.getElementById('batteryLevelText');
        if (batEl) batEl.innerText = `${driverProfile.battery_level || 95}%`;

        if (driverProfile.location && typeof driverProfile.location.lng === 'number') {
          currentCoordinates = driverProfile.location;
          updateGpsTelemetryGauges(currentCoordinates.lat, currentCoordinates.lng, 0);
          if (driverMarker) driverMarker.setLngLat([currentCoordinates.lng, currentCoordinates.lat]);
          if (driverMap) driverMap.setCenter([currentCoordinates.lng, currentCoordinates.lat]);
        }

        updateOnlineUi();
      }
    } catch (err) {
      console.warn('[Driver Web] Error cargando perfil:', err);
    }
  }

  // Cargar Historial de Entregas y Ganancias Acumuladas
  async function loadDriverHistoryAndEarnings() {
    if (!currentDriverId) return;
    try {
      const resp = await fetch(`/api/driver/history?driverId=${encodeURIComponent(currentDriverId)}`);
      const data = await resp.json();

      if (data.success) {
        const earnVal = Number(data.totalEarned || 0).toFixed(2);
        const tripsCount = Number(data.deliveredCount || 0);

        const todayEarnEl = document.getElementById('todayEarningsText');
        const phoneEarnEl = document.getElementById('phoneEarningsText');
        const tripsEl = document.getElementById('todayTripsCount');

        if (todayEarnEl) todayEarnEl.innerText = `C$ ${earnVal} NIO`;
        if (phoneEarnEl) phoneEarnEl.innerText = `C$ ${earnVal} NIO`;
        if (tripsEl) tripsEl.innerText = `${tripsCount} Entregas`;

        const histList = document.getElementById('driverHistoryList');
        if (histList) {
          if (!data.history || data.history.length === 0) {
            histList.innerHTML = '<p class="text-xs text-[#8A94A6] italic py-2">No hay entregas registradas en este turno.</p>';
          } else {
            histList.innerHTML = data.history.map(item => `
              <div class="p-2 rounded-xl bg-[#0D0F14] border border-[#222834] flex items-center justify-between">
                <div class="truncate">
                  <p class="font-bold text-white text-[11px] truncate">${item.restaurant || 'Restaurante'}</p>
                  <p class="text-[10px] text-[#8A94A6] truncate">📍 ${item.address || 'Managua'}</p>
                  <p class="text-[9px] text-[#556]">${item.delivered_at ? new Date(item.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}</p>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-xs font-mono font-bold text-[#06C167]">+C$ ${Number(item.payout || 0).toFixed(2)}</span>
                </div>
              </div>
            `).join('');
          }
        }
      }
    } catch (err) {
      console.warn('[Driver Web] Error cargando historial y ganancias:', err);
    }
  }

  // Toggle estado Online / Offline
  window.toggleDriverOnline = async function () {
    isOnline = !isOnline;
    const newStatus = isOnline ? 'AVAILABLE' : 'OFFLINE';

    try {
      await fetch('/api/driver/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: currentDriverId, status: newStatus })
      });
    } catch (e) {}

    updateOnlineUi();
  };

  function updateOnlineUi() {
    const btn = document.getElementById('toggleOnlineBtn');
    const dot = document.getElementById('onlineDot');
    const text = document.getElementById('onlineText');
    const offlineNotice = document.getElementById('offlineNoticeBanner');
    const phoneOnlineBtn = document.getElementById('phoneOnlineBtn');

    if (isOnline) {
      if (btn) btn.className = 'px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 border shadow-lg bg-[#06C167] text-black border-[#06C167] hover:bg-[#05A357]';
      if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-black animate-pulse';
      if (text) text.innerText = 'CONECTADO';
      if (offlineNotice) offlineNotice.classList.add('hidden');
      if (phoneOnlineBtn) {
        phoneOnlineBtn.className = 'px-3.5 py-1.5 rounded-full text-xs font-black bg-[#06C167] text-black';
        phoneOnlineBtn.innerText = 'EN LÍNEA';
      }
    } else {
      if (btn) btn.className = 'px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 border shadow-lg bg-[#2E3542] text-[#8A94A6] border-[#3B4556] hover:bg-[#343D4D]';
      if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
      if (text) text.innerText = 'DESCONECTADO';
      if (offlineNotice) offlineNotice.classList.remove('hidden');
      if (phoneOnlineBtn) {
        phoneOnlineBtn.className = 'px-3.5 py-1.5 rounded-full text-xs font-black bg-[#2E3542] text-[#8A94A6]';
        phoneOnlineBtn.innerText = 'DESCONECTADO';
      }
    }
  }

  // 6. CONSULTAR PEDIDOS ACTIVOS Y EN ESPERA
  async function checkActiveOrders() {
    try {
      const resp = await fetch(`/api/driver/orders?driverId=${encodeURIComponent(currentDriverId)}`);
      const data = await resp.json();

      if (!data.success) return;

      if (data.activeOrder) {
        activeOrder = data.activeOrder;
        renderActiveOrderView();
      } else {
        activeOrder = null;
        renderIdleView(data.readyOrders || []);
      }
    } catch (err) {
      console.warn('[Driver Web] Error al verificar pedidos:', err);
    }
  }

  // 7. RENDERIZADO DEL PEDIDO ACTIVO EN CURSO
  function renderActiveOrderView() {
    const activeCard = document.getElementById('activeOrderCard');
    const idleSec = document.getElementById('idleStateSection');
    if (!activeCard || !idleSec) return;

    activeCard.classList.remove('hidden');
    idleSec.classList.add('hidden');

    const orderIdEl = document.getElementById('activeOrderIdText');
    if (orderIdEl) orderIdEl.innerText = `#${activeOrder.id.slice(0, 8).toUpperCase()}`;

    const restNameEl = document.getElementById('activeRestName');
    if (restNameEl) restNameEl.innerText = activeOrder.restaurants?.name || 'Pupusería & Antojitos El Diamante';

    const restAddrEl = document.getElementById('activeRestAddress');
    if (restAddrEl) restAddrEl.innerText = activeOrder.restaurants?.address || 'Colonial Los Robles, Managua';

    const clientNameEl = document.getElementById('activeClientName');
    if (clientNameEl) clientNameEl.innerText = activeOrder.client_name || 'Cliente';

    const clientAddrEl = document.getElementById('activeClientAddress');
    if (clientAddrEl) clientAddrEl.innerText = activeOrder.delivery_address || 'Galerías Santo Domingo, Managua';

    // Determinar fase
    if (activeOrder.status === 'DRIVER_ASSIGNED') {
      if (currentStep === 'IN_KITCHEN') {
        setupStepInKitchen();
      } else {
        setupStepToRestaurant();
      }
    } else if (activeOrder.status === 'PICKED_UP') {
      if (currentStep === 'DELIVERING') {
        setupStepAtClient();
      } else {
        setupStepToClient();
      }
    }

    // Dibujar en el mapa
    drawOrderOnMap();
    if (phoneMap) drawOrderOnPhoneMap();

    // Actualizar snippet de smartphone
    updatePhoneTripSnippet();

    // Conectar canal de telemetría de esta orden
    connectOrderTrackingChannel(activeOrder.id);
  }

  function updatePhoneTripSnippet() {
    const title = document.getElementById('phoneTripTitle');
    const fare = document.getElementById('phoneTripFare');
    const sub = document.getElementById('phoneTripSubtitle');
    if (!title || !activeOrder) return;

    const payout = (Number(activeOrder.delivery_fee) || 70) * 0.80;
    fare.innerText = `C$ ${Math.round(payout)}.00`;

    if (currentStep === 'TO_REST') {
      title.innerText = '1. Hacia el Restaurante';
      sub.innerText = activeOrder.restaurants?.name || 'Local de Comida';
    } else if (currentStep === 'IN_KITCHEN') {
      title.innerText = '2. En Cocina / Retirar';
      sub.innerText = 'Verificar comanda de productos';
    } else if (currentStep === 'TO_CLIENT') {
      title.innerText = '3. En Camino al Cliente';
      sub.innerText = activeOrder.delivery_address || 'Entrega en Managua';
    } else if (currentStep === 'DELIVERING') {
      title.innerText = '4. Cobrar y Entregar';
      sub.innerText = `Cobro: C$ ${activeOrder.total || 485.00}`;
    }
  }

  function setupStepToRestaurant() {
    currentStep = 'TO_REST';
    document.getElementById('activeStepTitle').innerText = '1. Dirígete al Restaurante';
    document.getElementById('activeStepSubtitle').innerText = 'Conduce al local para retirar los productos.';
    document.getElementById('stepActionBtnText').innerText = 'LLEGUÉ AL LOCAL';
    document.getElementById('itemsChecklistContainer').classList.add('hidden');
    document.getElementById('cashCollectionNotice').classList.add('hidden');
  }

  function setupStepInKitchen() {
    currentStep = 'IN_KITCHEN';
    document.getElementById('activeStepTitle').innerText = '2. Verificación de Comanda';
    document.getElementById('activeStepSubtitle').innerText = 'Revisa que la cocina haya empacado todos los ítems.';
    document.getElementById('stepActionBtnText').innerText = 'CONFIRMAR Y RECOGER PEDIDO';
    
    const container = document.getElementById('itemsChecklistContainer');
    const list = document.getElementById('itemsChecklist');
    container.classList.remove('hidden');
    document.getElementById('cashCollectionNotice').classList.add('hidden');

    list.innerHTML = '';
    const items = activeOrder.order_items || [];
    if (items.length > 0) {
      items.forEach((item) => {
        const prod = item.products || {};
        list.innerHTML += `
          <label class="flex items-center gap-2.5 p-2 rounded-lg bg-[#14171F] border border-[#222938] cursor-pointer hover:border-[#06C167]">
            <input type="checkbox" checked class="w-4 h-4 rounded text-[#06C167] focus:ring-0 bg-[#0C0E12] border-[#333]" />
            <span class="font-bold text-white">${item.quantity}x ${prod.name || 'Producto del Menú'}</span>
          </label>
        `;
      });
    } else {
      list.innerHTML = `
        <label class="flex items-center gap-2.5 p-2 rounded-lg bg-[#14171F] border border-[#222938]">
          <input type="checkbox" checked class="w-4 h-4 rounded text-[#06C167]" />
          <span class="font-bold text-white">2x Super Combo 4 Pupusas + Bebida Típica</span>
        </label>
      `;
    }
  }

  function setupStepToClient() {
    currentStep = 'TO_CLIENT';
    document.getElementById('activeStepTitle').innerText = '3. En Camino al Cliente';
    document.getElementById('activeStepSubtitle').innerText = 'Conduce al domicilio de entrega y mantén el GPS activo.';
    document.getElementById('stepActionBtnText').innerText = 'LLEGUÉ AL DOMICILIO';
    document.getElementById('itemsChecklistContainer').classList.add('hidden');

    const cashNotice = document.getElementById('cashCollectionNotice');
    cashNotice.classList.remove('hidden');
    document.getElementById('cashAmountToCollect').innerText = `C$ ${activeOrder.total || 485.00}`;
  }

  function setupStepAtClient() {
    currentStep = 'DELIVERING';
    document.getElementById('activeStepTitle').innerText = '4. Entregar al Cliente';
    document.getElementById('activeStepSubtitle').innerText = 'Cobra el monto indicado y entrega el paquete.';
    document.getElementById('stepActionBtnText').innerText = 'CONFIRMAR ENTREGA REALIZADA';
    document.getElementById('cashCollectionNotice').classList.remove('hidden');
  }

  // AVANCE DE PASO DINÁMICO
  window.handleStepAdvance = async function () {
    if (!activeOrder) return;

    if (currentStep === 'TO_REST') {
      setupStepInKitchen();
      updatePhoneTripSnippet();
    } else if (currentStep === 'IN_KITCHEN') {
      try {
        await fetch('/api/driver/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            status: 'PICKED_UP',
            driverId: currentDriverId
          })
        });
        activeOrder.status = 'PICKED_UP';
        setupStepToClient();
        updatePhoneTripSnippet();
      } catch (e) {}
    } else if (currentStep === 'TO_CLIENT') {
      setupStepAtClient();
      updatePhoneTripSnippet();
    } else if (currentStep === 'DELIVERING') {
      try {
        await fetch('/api/driver/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            status: 'DELIVERED',
            driverId: currentDriverId
          })
        });

        if (gpsSimInterval) clearInterval(gpsSimInterval);

        const payout = (Number(activeOrder.delivery_fee) || 70) * 0.80;
        document.getElementById('successPayoutEarned').innerText = `+C$ ${Math.round(payout)}.00`;
        document.getElementById('deliveredSuccessModal').classList.remove('hidden');

        playAudioChime(660, 0.2);
        setTimeout(() => playAudioChime(880, 0.4), 220);

        activeOrder = null;
        currentStep = 'NONE';
        await loadDriverHistoryAndEarnings();
      } catch (e) {}
    }
  };

  // 8. RENDERIZADO DEL ESTADO INACTIVO (IDLE) / OPORTUNIDADES EN ZONA
  function renderIdleView(readyOrders) {
    const activeCard = document.getElementById('activeOrderCard');
    const idleSec = document.getElementById('idleStateSection');
    if (!activeCard || !idleSec) return;

    activeCard.classList.add('hidden');
    idleSec.classList.remove('hidden');

    const countEl = document.getElementById('availableOrdersCount');
    const listEl = document.getElementById('readyOrdersList');
    const radarBox = document.getElementById('searchingRadarBox');

    const phoneCont = document.getElementById('phoneAvailableOrdersContainer');
    const phoneList = document.getElementById('phoneAvailableOrdersList');
    const phoneBadge = document.getElementById('phoneAvailableCountBadge');
    const phoneSub = document.getElementById('phoneTripSubtitle');

    if (countEl) countEl.innerText = `${readyOrders.length} disponibles`;

    if (readyOrders.length > 0) {
      if (radarBox) radarBox.classList.add('hidden');
      if (listEl) {
        listEl.innerHTML = '';
        readyOrders.forEach(o => {
          const payout = o.driver_payout || 56;
          const restName = o.restaurants?.name || 'Pupusería & Antojitos El Diamante';
          const itemsCount = (o.order_items && o.order_items.length) || 2;
          const distKm = calculateDistanceKm(currentCoordinates, o.restaurant_location);

          listEl.innerHTML += `
            <div class="p-3.5 bg-[#151922] border-2 border-[#222834] hover:border-[#06C167] rounded-2xl transition-all space-y-2.5 shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-black text-white block">${restName}</span>
                  <span class="text-[10px] text-[#8A94A6]">${itemsCount} ítems • Listo para retiro</span>
                </div>
                <div class="text-right">
                  <span class="font-mono font-black text-base text-[#06C167] block">C$ ${Number(payout).toFixed(2)}</span>
                  <span class="text-[9px] text-[#8A94A6] font-bold uppercase">Pago neto</span>
                </div>
              </div>
              <div class="text-[11px] text-[#8A94A6] flex items-center justify-between pt-1 border-t border-[#222834]">
                <span class="truncate">📍 ${o.delivery_address || 'Galerías Santo Domingo, Managua'}</span>
                <span class="text-white font-medium shrink-0 font-mono ml-2">~${distKm} km</span>
              </div>
              <button onclick="claimZoneOrder('${o.id}')" class="w-full py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs shadow-lg shadow-[#06C167]/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                <span>⚡</span> Tomar Pedido Ahora
              </button>
            </div>
          `;
        });
      }

      if (phoneCont && phoneList) {
        phoneCont.classList.remove('hidden');
        if (phoneBadge) phoneBadge.innerText = readyOrders.length;
        if (phoneSub) phoneSub.innerText = `${readyOrders.length} pedido(s) disponibles en Managua`;
        phoneList.innerHTML = '';
        readyOrders.forEach(o => {
          const payout = o.driver_payout || 56;
          const distKm = calculateDistanceKm(currentCoordinates, o.restaurant_location);
          phoneList.innerHTML += `
            <div class="p-2.5 rounded-xl bg-[#0D0F14] border border-[#222834] flex items-center justify-between gap-2">
              <div class="truncate text-left">
                <p class="font-bold text-white text-[11px] truncate">${o.restaurants?.name || 'Restaurante'}</p>
                <p class="text-[10px] text-[#8A94A6] truncate">📍 ${o.delivery_address || 'Managua'} • ~${distKm} km</p>
              </div>
              <button onclick="claimZoneOrder('${o.id}')" class="px-3 py-1.5 rounded-lg bg-[#06C167] text-black font-black text-[11px] shrink-0">
                ⚡ Tomar C$ ${Math.round(payout)}
              </button>
            </div>
          `;
        });
      }
    } else {
      if (radarBox) radarBox.classList.remove('hidden');
      if (listEl) listEl.innerHTML = '';
      if (phoneCont) phoneCont.classList.add('hidden');
      if (phoneSub) phoneSub.innerText = 'Esperando ofertas en Managua Centro';
    }

    // Limpiar marcadores secundarios
    if (restaurantMarker) restaurantMarker.remove();
    if (deliveryMarker) deliveryMarker.remove();
    if (driverMap && driverMap.getSource('driver-route')) {
      driverMap.getSource('driver-route').setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
    }
  }

  // 9. MANEJO DE OFERTA DE ALTA PRIORIDAD (20s COUNTDOWN)
  function handleIncomingOffer(offer) {
    if (!isOnline || activeOrder) return;

    currentOfferPayload = offer;
    const modal = document.getElementById('incomingOfferModal');
    if (modal) modal.classList.remove('hidden');

    playOfferAlertChime();

    const payout = offer.payout_amount || 56.00;
    const payoutEl = document.getElementById('offerPayoutText');
    const acceptBtnEl = document.getElementById('acceptBtnAmount');
    if (payoutEl) payoutEl.innerText = `C$ ${Number(payout).toFixed(2)}`;
    if (acceptBtnEl) acceptBtnEl.innerText = `(C$ ${Number(payout).toFixed(2)})`;

    const distEl = document.getElementById('offerDistanceText');
    const restNameEl = document.getElementById('offerRestName');
    const restAddrEl = document.getElementById('offerRestAddress');
    const clientAddrEl = document.getElementById('offerClientAddress');
    const itemsEl = document.getElementById('offerItemsSummary');

    if (distEl) distEl.innerText = (offer.distance_km || '2.4') + ' km';
    if (restNameEl) restNameEl.innerText = offer.restaurant_name || offer.restaurants?.name || 'Restaurante Asociado';
    if (restAddrEl) restAddrEl.innerText = offer.restaurant_address || offer.restaurants?.address || 'Managua, Nicaragua';
    if (clientAddrEl) clientAddrEl.innerText = offer.delivery_address || 'Managua, Nicaragua';
    if (itemsEl) itemsEl.innerText = (offer.items_count || 2) + ' ítems • Listo para retiro';

    offerSecondsLeft = offer.expires_in_seconds || 20;
    const secondsText = document.getElementById('timerSecondsText');
    const circle = document.getElementById('timerCircle');
    const totalLength = 125.6;

    if (offerCountdownTimer) clearInterval(offerCountdownTimer);

    offerCountdownTimer = setInterval(() => {
      offerSecondsLeft--;
      if (secondsText) secondsText.innerText = offerSecondsLeft;

      if (circle) {
        const offset = totalLength - (offerSecondsLeft / 20) * totalLength;
        circle.style.strokeDashoffset = offset;
      }

      if (offerSecondsLeft <= 0) {
        clearInterval(offerCountdownTimer);
        rejectIncomingOffer();
      }
    }, 1000);
  }

  window.acceptIncomingOffer = async function () {
    if (offerCountdownTimer) clearInterval(offerCountdownTimer);
    const modal = document.getElementById('incomingOfferModal');
    if (modal) modal.classList.add('hidden');

    if (!currentOfferPayload) return;

    if (dispatchChannel) {
      await dispatchChannel.send({
        type: 'broadcast',
        event: 'offer_response',
        payload: {
          order_id: currentOfferPayload.order_id,
          accepted: true
        }
      });
    }

    try {
      const res = await fetch('/api/driver/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOfferPayload.order_id,
          driverId: currentDriverId
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'El pedido ya fue tomado.');
      }
    } catch (e) {
      console.error('Error accepting offer:', e);
    }

    currentOfferPayload = null;
    await checkActiveOrders();
  };

  window.rejectIncomingOffer = async function () {
    if (offerCountdownTimer) clearInterval(offerCountdownTimer);
    const modal = document.getElementById('incomingOfferModal');
    if (modal) modal.classList.add('hidden');

    if (currentOfferPayload && dispatchChannel) {
      await dispatchChannel.send({
        type: 'broadcast',
        event: 'offer_response',
        payload: {
          order_id: currentOfferPayload.order_id,
          accepted: false
        }
      });
    }
    currentOfferPayload = null;
  };

  window.simulateOrderOffer = function (orderId) {
    handleIncomingOffer({
      order_id: orderId,
      payout_amount: 56.00,
      expires_in_seconds: 20
    });
  };

  // 10. DIBUJAR RUTA Y MARCADORES EN EL MAPA CON SEGURIDAD
  function drawOrderOnMap() {
    if (!driverMap || !driverMap.loaded() || !activeOrder) return;

    // Coordenadas válidas en Managua
    const restCoords = (activeOrder.restaurant_location && typeof activeOrder.restaurant_location.lng === 'number')
      ? activeOrder.restaurant_location
      : { lng: -86.2650, lat: 12.1260 };

    const delivCoords = (activeOrder.delivery_coords && typeof activeOrder.delivery_coords.lng === 'number')
      ? activeOrder.delivery_coords
      : { lng: -86.2480, lat: 12.1060 };

    // Marcador Restaurante
    if (!restaurantMarker) {
      const restEl = document.createElement('div');
      restEl.className = 'w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg shadow-xl border-2 border-slate-900';
      restEl.innerHTML = '🏪';
      restaurantMarker = new maplibregl.Marker(restEl).addTo(driverMap);
    }
    restaurantMarker.setLngLat([restCoords.lng, restCoords.lat]);

    // Marcador Cliente
    if (!deliveryMarker) {
      const destEl = document.createElement('div');
      destEl.className = 'w-9 h-9 rounded-2xl bg-[#06C167] text-black flex items-center justify-center text-lg shadow-xl border-2 border-slate-900';
      destEl.innerHTML = '📍';
      deliveryMarker = new maplibregl.Marker(destEl).addTo(driverMap);
    }
    deliveryMarker.setLngLat([delivCoords.lng, delivCoords.lat]);

    // Línea de Ruta
    const lineCoords = [
      [currentCoordinates.lng, currentCoordinates.lat],
      [restCoords.lng, restCoords.lat],
      [delivCoords.lng, delivCoords.lat]
    ];

    if (driverMap.getSource('driver-route')) {
      driverMap.getSource('driver-route').setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: lineCoords }
      });
    }

    try {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([currentCoordinates.lng, currentCoordinates.lat]);
      bounds.extend([restCoords.lng, restCoords.lat]);
      bounds.extend([delivCoords.lng, delivCoords.lat]);
      driverMap.fitBounds(bounds, { padding: 80, maxZoom: 16 });
    } catch (e) {}
  }

  function drawOrderOnPhoneMap() {
    if (!phoneMap || !phoneMap.loaded() || !activeOrder) return;
    const restCoords = activeOrder.restaurant_location || { lng: -86.2650, lat: 12.1260 };
    phoneMap.flyTo({ center: [restCoords.lng, restCoords.lat], zoom: 14 });
  }

  // 11. CANAL DE TELEMETRÍA WEBSOCKET Y SIMULADOR GPS
  function connectOrderTrackingChannel(orderId) {
    if (!supabase) return;
    if (orderTrackingChannel) orderTrackingChannel.unsubscribe();

    orderTrackingChannel = supabase.channel(`orders:${orderId}:tracking`, {
      config: { broadcast: { self: true } }
    });
    orderTrackingChannel.subscribe();
  }

  // Alternar Simulación GPS en vivo
  window.toggleGpsSimulation = function () {
    const statusEl = document.getElementById('gpsSimStatus');
    const btnText = document.getElementById('simGpsBtnText');

    if (gpsSimInterval) {
      clearInterval(gpsSimInterval);
      gpsSimInterval = null;
      if (statusEl) statusEl.innerText = 'Pausado';
      if (btnText) btnText.innerText = 'Reanudar Simulación GPS';
      updateGpsTelemetryGauges(currentCoordinates.lat, currentCoordinates.lng, 0);
      return;
    }

    if (!activeOrder) {
      alert('Debes tener un pedido en curso para simular el trayecto.');
      return;
    }

    const targetCoords = currentStep === 'TO_REST' 
      ? (activeOrder.restaurant_location || { lng: -86.2650, lat: 12.1260 })
      : (activeOrder.delivery_coords || { lng: -86.2480, lat: 12.1060 });

    const startLng = currentCoordinates.lng;
    const startLat = currentCoordinates.lat;
    gpsSimProgress = 0;

    if (statusEl) statusEl.innerText = '🔴 Transmitiendo GPS...';
    if (btnText) btnText.innerText = 'Pausar Simulación';

    gpsSimInterval = setInterval(async () => {
      gpsSimProgress += 0.05;
      if (gpsSimProgress > 1.0) {
        clearInterval(gpsSimInterval);
        gpsSimInterval = null;
        if (statusEl) statusEl.innerText = 'Llegó al destino';
        if (btnText) btnText.innerText = 'Simulación Completada';
        updateGpsTelemetryGauges(currentCoordinates.lat, currentCoordinates.lng, 0);
        return;
      }

      const nextLng = startLng + (targetCoords.lng - startLng) * gpsSimProgress;
      const nextLat = startLat + (targetCoords.lat - startLat) * gpsSimProgress;
      currentCoordinates = { lng: nextLng, lat: nextLat };

      // Actualizar velocímetro e instrumentos (velocidad aleatoria entre 24 y 35 km/h)
      const currentSpeed = Math.floor(25 + Math.random() * 10);
      updateGpsTelemetryGauges(nextLat, nextLng, currentSpeed);

      // 1. Mover marcador local en MapLibre
      if (driverMarker) driverMarker.setLngLat([nextLng, nextLat]);
      if (phoneDriverMarker) phoneDriverMarker.setLngLat([nextLng, nextLat]);

      // 2. Transmitir por WebSockets Supabase Realtime para que el Cliente lo vea en /client/tracking
      if (orderTrackingChannel && activeOrder) {
        orderTrackingChannel.send({
          type: 'broadcast',
          event: 'driver_location',
          payload: {
            latitude: nextLat,
            longitude: nextLng,
            bearing: 45,
            speed: currentSpeed,
            timestamp: Date.now()
          }
        }).catch(() => {});
      }

      // 2b. Transmitir a la Torre de Control de Flota (/admin/control-tower) en tiempo real
      if (supabase) {
        supabase.channel('admin-telemetry-broadcast').send({
          type: 'broadcast',
          event: 'driver_location',
          payload: {
            driver_id: currentDriverId,
            latitude: nextLat,
            longitude: nextLng,
            speed: `${currentSpeed} km/h`,
            timestamp: Date.now()
          }
        }).catch(() => {});
      }

      // 3. Actualizar base de datos PostGIS (driver_profiles) para Torre de Control
      fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: currentDriverId,
          latitude: nextLat,
          longitude: nextLng,
          bearing: 45,
          speed: currentSpeed
        })
      }).catch(() => {});
    }, 2000);
  };

  function updateGpsTelemetryGauges(lat, lng, speed) {
    const speedVal = document.getElementById('cockpitSpeedVal');
    const hudSpeed = document.getElementById('hudSpeedText');
    const bar = document.getElementById('speedoProgressBar');
    const latEl = document.getElementById('gaugeLatText');
    const lngEl = document.getElementById('gaugeLngText');

    if (speedVal) speedVal.innerText = speed;
    if (hudSpeed) hudSpeed.innerText = speed;
    if (bar) bar.style.width = `${Math.min(100, (speed / 60) * 100)}%`;
    if (latEl) latEl.innerText = `${lat.toFixed(4)}° N`;
    if (lngEl) lngEl.innerText = `${lng.toFixed(4)}° W`;
  }

  // 12. NAVEGACIÓN EXTERNA (WAZE / GOOGLE MAPS)
  window.launchExternalNavigation = function () {
    if (!activeOrder) return;
    const dest = currentStep === 'TO_REST'
      ? (activeOrder.restaurant_location || { lng: -86.2650, lat: 12.1260 })
      : (activeOrder.delivery_coords || { lng: -86.2480, lat: 12.1060 });

    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
    window.open(url, '_blank');
  };

  window.callContactPhone = function () {
    const isClientPhase = (currentStep === 'TO_CLIENT' || currentStep === 'DELIVERING' || currentStep === 'DELIVERED');
    const phone = isClientPhase
      ? (activeOrder?.client_phone || '+505 8899-7711')
      : (activeOrder?.restaurants?.phone || '+505 8899-7711');
    window.open(`tel:${phone}`, '_self');
  };

  window.closeSuccessModal = function () {
    document.getElementById('deliveredSuccessModal').classList.add('hidden');
    checkActiveOrders();
  };

  // 13. SÍNTESIS DE AUDIO WEB (CHIMES & ALARMAS SIN ARCHIVOS EXTERNOS)
  function playAudioChime(freq = 440, duration = 0.2) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playOfferAlertChime() {
    playAudioChime(523.25, 0.15);
    setTimeout(() => playAudioChime(659.25, 0.15), 160);
    setTimeout(() => playAudioChime(783.99, 0.35), 320);
  }

  function startPollingOrders() {
    if (ordersPollInterval) clearInterval(ordersPollInterval);
    ordersPollInterval = setInterval(() => {
      if (!pedidosnica_driver_session || !isOnline) return;
      if (!activeOrder) checkActiveOrders();
    }, 10000);
  }

})();
