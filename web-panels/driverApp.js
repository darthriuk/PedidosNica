// ============================================================================
// SUITE DE REPARTIDOR - PEDIDOSNICA DRIVER COCKPIT & SMARTPHONE VIEW
// ============================================================================

function renderDriverApp(options = {}) {
  const {
    SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co',
    SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w',
    getHeader,
    getFooter
  } = options;

  return `${getHeader('PedidosNica Driver | App de Repartidor')}

  <!-- MAPLIBRE GL CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>

  <style>
    /* Estilos del mockup de teléfono para visualización 1:1 en escritorio */
    .phone-frame {
      width: 412px;
      height: 840px;
      max-height: calc(100vh - 90px);
      border-radius: 44px;
      border: 8px solid #222;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 2px #333;
      overflow: hidden;
      position: relative;
      background: #000;
    }
    .phone-notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 140px;
      height: 24px;
      background: #181818;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .phone-notch .camera {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0d0d0d;
      border: 1px solid #222;
    }
    .phone-notch .speaker {
      width: 40px;
      height: 4px;
      border-radius: 2px;
      background: #262626;
    }
    /* Estilos de velocímetro */
    .speedo-glow {
      box-shadow: 0 0 35px -5px rgba(6, 193, 103, 0.35);
    }
  </style>

  <div id="driverAppRoot" class="min-h-screen flex flex-col bg-[#08090C] text-white antialiased selection:bg-[#06C167] selection:text-black">

    <!-- BLOQUEO ESTRICTO: RESTAURANTE INTENTANDO ENTRAR A DRIVER -->
    <div id="restaurantBlockedDriverNotice" class="hidden max-w-lg mx-auto my-16 p-8 bg-[#151214] border-2 border-rose-500/50 rounded-3xl text-center space-y-4 shadow-2xl">
      <div class="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 text-3xl flex items-center justify-center mx-auto border border-rose-500/40">
        🚫
      </div>
      <div>
        <h2 class="text-xl font-black text-white">Acceso Bloqueado para Personal de Restaurante</h2>
        <p class="text-xs text-rose-200/90 mt-1.5 leading-relaxed">
          Tu cuenta está identificada como <strong class="text-white underline">Administrador / Personal de Restaurante</strong>. Por separación estricta de funciones operativas, el personal del restaurante tiene terminantemente prohibido acceder a la aplicación de repartidores.
        </p>
      </div>
      <div class="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
        <a href="/restaurant" class="px-5 py-2.5 rounded-xl bg-[#06C167] text-black font-extrabold text-xs shadow-lg shadow-[#06C167]/20 flex items-center justify-center gap-1.5">
          <span>🏪</span> Volver a mi Restaurante
        </a>
        <button onclick="logoutRestaurantSessionFromDriver()" class="px-4 py-2.5 rounded-xl bg-[#222] hover:bg-[#333] text-[#A6A6A6] hover:text-white font-bold text-xs">
          Cerrar Sesión de Restaurante
        </button>
      </div>
    </div>

    <!-- PORTAL DE ACCESO / LOGIN INDEPENDIENTE DE REPARTIDORES -->
    <div id="driverLoginGate" class="hidden max-w-md mx-auto my-12 px-4 space-y-4">
      <div class="text-center mb-4">
        <div class="w-16 h-16 rounded-3xl bg-[#06C167]/15 border border-[#06C167]/40 flex items-center justify-center text-3xl mx-auto shadow-2xl mb-2">
          🛵
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">
          PedidosNica Driver
        </h1>
        <p class="text-xs text-[#8A94A6] mt-0.5">
          Ingreso independiente para conductores. Cada cuenta opera de forma personal e intransferible.
        </p>
      </div>

      <div class="bg-[#12141C] border-2 border-[#262D3B] focus-within:border-[#06C167] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <!-- Pestañas Superiores: Login vs Registro -->
        <div class="flex items-center gap-1 p-1 bg-[#181D26] rounded-2xl border border-[#2B3444]">
          <button type="button" id="tabDriverLoginBtn" onclick="switchDriverAuthTab('login')" class="flex-1 py-2 rounded-xl text-xs font-black transition-all bg-[#06C167] text-black shadow-md cursor-pointer">
            Iniciar Sesión
          </button>
          <button type="button" id="tabDriverRegisterBtn" onclick="switchDriverAuthTab('register')" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all text-[#8A94A6] hover:text-white cursor-pointer">
            Registrarme como Conductor
          </button>
        </div>

        <!-- FORMULARIO DE INICIO DE SESIÓN -->
        <div id="driverLoginFormBox" class="space-y-4">
          <form onsubmit="event.preventDefault(); loginDriverWithForm();" class="space-y-3.5">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Correo Electrónico de Conductor</label>
              <input type="email" id="driverLoginEmail" required placeholder="driver.martin@pedidosnica.com" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Contraseña</label>
              <input type="password" id="driverLoginPassword" required value="Password123!" placeholder="••••••••" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <button type="submit" id="btnDriverLoginSubmit" class="w-full py-3.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-[#06C167]/25 transition-all cursor-pointer">
              Ingresar y Conectarse
            </button>
          </form>

          <!-- Accesos rápidos a conductores registrados -->
          <div class="pt-3 border-t border-[#222938] space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">Ingreso Rápido de Conductor:</span>
            
            <div class="space-y-1.5 text-left text-xs">
              <button onclick="quickFillDriverLogin('driver.martin@pedidosnica.com', 'Password123!')" class="w-full p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
                <div>
                  <p class="font-bold text-white text-[11px]">Martín Rivas <span class="text-[10px] text-amber-400 font-mono">⭐ 4.95</span></p>
                  <p class="text-[10px] text-[#8A94A6]">driver.martin@pedidosnica.com • Moto CB125</p>
                </div>
                <span class="text-xs text-[#06C167]">Conectar →</span>
              </button>

              <button onclick="quickFillDriverLogin('driver.carlos@pedidosnica.com', 'Password123!')" class="w-full p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
                <div>
                  <p class="font-bold text-white text-[11px]">Carlos Gómez <span class="text-[10px] text-amber-400 font-mono">⭐ 4.88</span></p>
                  <p class="text-[10px] text-[#8A94A6]">driver.carlos@pedidosnica.com • Yamaha FZ</p>
                </div>
                <span class="text-xs text-[#06C167]">Conectar →</span>
              </button>

              <button onclick="quickFillDriverLogin('driver.matias@pedidosnica.com', 'Password123!')" class="w-full p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
                <div>
                  <p class="font-bold text-white text-[11px]">Matías Pérez <span class="text-[10px] text-amber-400 font-mono">⭐ 4.92</span></p>
                  <p class="text-[10px] text-[#8A94A6]">driver.matias@pedidosnica.com • Bicicleta Pro</p>
                </div>
                <span class="text-xs text-[#06C167]">Conectar →</span>
              </button>
            </div>
          </div>
        </div>

        <!-- FORMULARIO DE REGISTRO NUEVO REPARTIDOR -->
        <div id="driverRegisterFormBox" class="hidden space-y-3">
          <form onsubmit="event.preventDefault(); registerDriverWithForm();" class="space-y-3">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Nombre Completo</label>
              <input type="text" id="regDriverName" required placeholder="Ej. Roberto Morales" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Correo Electrónico</label>
              <input type="email" id="regDriverEmail" required placeholder="driver.roberto@pedidosnica.com" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Teléfono WhatsApp</label>
                <input type="text" id="regDriverPhone" required placeholder="+505 8888-0000" value="+505 8888-0000" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Tipo de Vehículo</label>
                <select id="regDriverVehicle" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]">
                  <option value="MOTORCYCLE">Motocicleta</option>
                  <option value="BICYCLE">Bicicleta</option>
                  <option value="CAR">Automóvil</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Placa / Identificador</label>
                <input type="text" id="regDriverPlate" required placeholder="M-88991" value="M-88991" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Contraseña</label>
                <input type="password" id="regDriverPassword" required value="Password123!" placeholder="••••••••" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
              </div>
            </div>

            <button type="submit" id="btnDriverRegisterSubmit" class="w-full py-3.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-[#06C167]/25 transition-all cursor-pointer">
              Crear Cuenta de Repartidor y Conectarme
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- CONTENEDOR OPERATIVO DEL DRIVER (OCULTO HASTA LOGIN) -->
    <div id="driverAppRootContent" class="flex-1 flex flex-col overflow-hidden">

    <!-- TOPBAR DRIVER APP -->
    <header class="bg-[#12141A] border-b border-[#222630] sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xl">
      
      <!-- Identidad Repartidor -->
      <div class="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <a href="/" class="flex items-center gap-1 shrink-0 group" title="Volver al Hub">
          <span class="font-extrabold text-lg sm:text-xl tracking-tighter text-white">Pedidos</span>
          <span class="font-black text-lg sm:text-xl tracking-tighter text-[#06C167]">Nica</span>
          <span class="text-[10px] font-bold uppercase tracking-wider bg-[#1F242D] text-[#06C167] px-2 py-0.5 rounded-full border border-[#2E3542] ml-1">Driver</span>
        </a>

        <div class="h-5 w-px bg-[#262D3B] hidden sm:block"></div>

        <!-- Perfil y Cambio de Conductor -->
        <button onclick="openDriverProfileModal()" id="driverProfileBadgeBtn" class="flex items-center gap-2 min-w-0 px-2.5 py-1.5 rounded-2xl bg-[#1A1F29] hover:bg-[#252C3A] border border-[#2B3444] text-left transition-all group cursor-pointer shadow-md">
          <div class="w-8 h-8 rounded-full bg-[#06C167]/15 border border-[#06C167]/40 flex items-center justify-center text-sm font-bold text-[#06C167] shrink-0">
            🛵
          </div>
          <div class="truncate hidden sm:block">
            <h3 class="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span id="driverNameHeader">Martín Rivas</span>
              <span class="text-[10px] font-mono text-amber-400 font-normal">⭐ 4.95</span>
              <span class="text-[9px] text-[#06C167] font-semibold group-hover:underline">Perfil ▼</span>
            </h3>
            <p class="text-[10px] text-[#8A94A6] font-mono truncate">
              <span id="driverVehicleHeader">Moto Honda 150</span> • <span id="driverPlateHeader">A482XYZ</span>
            </p>
          </div>
        </button>
      </div>

      <!-- SELECTOR DE VISTA: SMARTPHONE VS COCKPIT ESCRITORIO -->
      <div class="hidden md:flex items-center bg-[#181D26] p-1 rounded-full border border-[#28303F]">
        <button id="viewModeCockpitBtn" onclick="switchViewMode('cockpit')" class="px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-[#06C167] text-black shadow-md">
          <span>🖥️</span>
          <span>Cockpit Completo</span>
        </button>
        <button id="viewModePhoneBtn" onclick="switchViewMode('phone')" class="px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-[#8A94A6] hover:text-white">
          <span>📱</span>
          <span>Vista Smartphone</span>
        </button>
      </div>

      <!-- Control de Estado Online / Offline -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Switch de Conexión -->
        <button id="toggleOnlineBtn" onclick="toggleDriverOnline()" class="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 border shadow-lg bg-[#06C167] text-black border-[#06C167] hover:bg-[#05A357]">
          <span id="onlineDot" class="w-2.5 h-2.5 rounded-full bg-black animate-pulse"></span>
          <span id="onlineText">CONECTADO</span>
        </button>

        <!-- Botón Cerrar Turno / Salir -->
        <button onclick="logoutDriver()" title="Cerrar turno de conductor y salir a la pantalla de login" class="px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-md">
          <span>🚪</span>
          <span class="hidden sm:inline">Salir</span>
        </button>

        <a href="/" class="p-2 rounded-full bg-[#181D26] hover:bg-[#222938] text-[#8A94A6] hover:text-white border border-[#28303F] transition-all" title="Ir al Hub">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </a>
      </div>
    </header>

    <!-- BANNER DE ESTADO CUANDO ESTÁ OFFLINE -->
    <div id="offlineNoticeBanner" class="hidden bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
      <span>⚠️ Estás en modo <strong>DESCONECTADO</strong>. Activa tu estado para recibir pedidos y comisiones.</span>
      <button onclick="toggleDriverOnline()" class="underline font-bold text-amber-200 hover:text-white">Conectarse ahora</button>
    </div>

    <!-- MODO 1: CONSOLA EXTENDIDA / COCKPIT DE ESCRITORIO (3 COLUMNAS BALANCEADAS) -->
    <div id="cockpitContainer" class="flex-1 grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden h-[calc(100vh-62px)]">

      <!-- COLUMNA 1 (IZQUIERDA, 3.5 cols): GESTIÓN OPERATIVA & PEDIDOS -->
      <aside class="lg:col-span-4 xl:col-span-3 bg-[#101217] border-r border-[#1F242D] flex flex-col justify-between overflow-y-auto p-4 space-y-4 z-10 shadow-2xl">
        
        <div class="space-y-4">
          
          <!-- TARJETA RESUMEN DE GANANCIAS DEL DÍA -->
          <div class="bg-gradient-to-br from-[#181D26] to-[#0E1015] border border-[#28303F] rounded-2xl p-4 relative overflow-hidden shadow-lg">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-[#06C167]/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div class="flex items-center justify-between text-xs text-[#8A94A6] mb-1">
              <span class="font-bold uppercase tracking-wider">Ganancias de Hoy</span>
              <span class="text-[#06C167] font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#06C167]"></span>
                80% Neta Driver
              </span>
            </div>

            <div class="flex items-baseline justify-between mt-1">
              <div>
                <span class="text-3xl font-black text-white font-mono tracking-tight" id="todayEarningsText">C$ 560.00</span>
                <span class="text-xs text-[#6C768A] ml-1">NIO</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-white font-mono" id="todayTripsCount">4</span>
                <span class="text-[11px] text-[#6C768A] block">Entregas</span>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-[#222938] flex items-center justify-between text-[11px] text-[#8A94A6]">
              <span>Batería: <strong class="text-white font-mono" id="batteryLevelText">95%</strong></span>
              <span>Calificación: <strong class="text-amber-400 font-mono">⭐ 4.95</strong></span>
              <span>Vehículo: <strong class="text-white">Moto</strong></span>
            </div>
          </div>

          <!-- TARJETA: PEDIDO EN CURSO (SI HAY UNO ASIGNADO) -->
          <div id="activeOrderCard" class="hidden bg-[#151922] border-2 border-[#06C167] rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <span id="activeOrderBadge" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/40 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-[#06C167] animate-ping"></span>
                EN REPARTO
              </span>
              <span id="activeOrderIdText" class="font-mono text-xs text-[#8A94A6]">#----</span>
            </div>

            <!-- Título del Paso Actual -->
            <div class="space-y-1">
              <h4 id="activeStepTitle" class="text-sm font-extrabold text-white">Dirígete al Restaurante</h4>
              <p id="activeStepSubtitle" class="text-xs text-[#8A94A6]">Recoge los productos y verifica la comanda en cocina.</p>
            </div>

            <!-- Puntos de Ruta Origen -> Destino -->
            <div class="space-y-2 bg-[#0C0E12] p-3 rounded-xl border border-[#222834] text-xs">
              <div class="flex items-start gap-2.5">
                <span class="text-base">🏪</span>
                <div class="truncate">
                  <span class="font-bold text-white block truncate" id="activeRestName">Restaurante</span>
                  <span class="text-[11px] text-[#6C768A] block truncate" id="activeRestAddress">Dirección</span>
                </div>
              </div>
              <div class="pl-2.5 py-0.5">
                <div class="w-0.5 h-3 bg-[#06C167]/40 ml-1"></div>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="text-base">📍</span>
                <div class="truncate">
                  <span class="font-bold text-white block truncate" id="activeClientName">Cliente</span>
                  <span class="text-[11px] text-[#6C768A] block truncate" id="activeClientAddress">Dirección de Entrega</span>
                </div>
              </div>
            </div>

            <!-- Checklist de Ítems (Fase 2) -->
            <div id="itemsChecklistContainer" class="hidden bg-[#0C0E12] border border-[#222834] rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-[#8A94A6] uppercase tracking-wider">
                <span>Verificación de Comanda</span>
                <span class="text-[10px] text-[#06C167]">Revisar en cocina</span>
              </div>
              <div id="itemsChecklist" class="space-y-1.5 text-xs text-white max-h-36 overflow-y-auto"></div>
            </div>

            <!-- Aviso de Cobro en Efectivo -->
            <div id="cashCollectionNotice" class="hidden bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-300 flex items-center justify-between">
              <span>💵 <strong>Cobro en Efectivo:</strong></span>
              <strong id="cashAmountToCollect" class="font-mono text-white text-sm">C$ 0.00</strong>
            </div>

            <!-- BOTONES DE ACCIÓN PRINCIPALES DEL PEDIDO -->
            <div class="space-y-2 pt-1">
              <button id="stepActionBtn" onclick="handleStepAdvance()" class="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-[#06C167] text-black hover:bg-[#05A357] shadow-xl shadow-[#06C167]/25 transition-all flex items-center justify-center gap-2">
                <span id="stepActionBtnText">LLEGUÉ AL LOCAL</span>
                <span>→</span>
              </button>

              <div class="grid grid-cols-2 gap-2">
                <button onclick="launchExternalNavigation()" class="py-2 px-3 rounded-xl bg-[#1F242F] hover:bg-[#28303F] text-white border border-[#2E3747] font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                  <span>🧭</span>
                  <span>Navegar GPS</span>
                </button>
                <button onclick="callContactPhone()" class="py-2 px-3 rounded-xl bg-[#1F242F] hover:bg-[#28303F] text-white border border-[#2E3747] font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                  <span>📞</span>
                  <span>Llamar</span>
                </button>
              </div>

              <!-- Simulador de Telemetría GPS -->
              <div class="pt-2 border-t border-[#222834] flex items-center justify-between">
                <button id="simGpsBtn" onclick="toggleGpsSimulation()" class="text-[11px] text-[#06C167] font-bold hover:underline flex items-center gap-1">
                  <span>📡</span>
                  <span id="simGpsBtnText">Simular GPS en Vivo</span>
                </button>
                <span id="gpsSimStatus" class="text-[10px] text-[#6C768A] font-mono">En reposo</span>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: OPORTUNIDADES EN ZONA (CUANDO ESTÁ LIBRE) -->
          <div id="idleStateSection" class="space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-[#06C167]"></span>
                Oportunidades en Zona
              </span>
              <span class="text-[10px] text-[#6C768A] font-mono" id="availableOrdersCount">Buscando...</span>
            </div>

            <div id="readyOrdersList" class="space-y-2"></div>

            <div id="searchingRadarBox" class="p-6 text-center bg-[#0C0E12] border border-[#1F242D] rounded-2xl flex flex-col items-center justify-center gap-3">
              <div class="relative w-14 h-14 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border border-[#06C167]/30 animate-ping"></div>
                <div class="absolute inset-2 rounded-full border border-[#06C167]/50 animate-pulse"></div>
                <span class="text-2xl">📡</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Buscando pedidos cercanos</h4>
                <p class="text-[11px] text-[#6C768A] mt-0.5">Te notificaremos inmediatamente con alarma sonora cuando haya una oferta.</p>
              </div>
            </div>
          </div>

        </div>

        <div class="pt-3 border-t border-[#1F242D] flex items-center justify-between text-[11px] text-[#6C768A]">
          <span class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-[#06C167]"></span>
            Motor OSRM :4000
          </span>
          <span class="font-mono text-white">Managua, NI</span>
        </div>
      </aside>

      <!-- COLUMNA 2 (CENTRO, 5.5 cols): MAPA EN VIVO INTERACTIVO CON CONTROLES HUD -->
      <main class="lg:col-span-5 xl:col-span-6 relative h-[50vh] lg:h-full bg-[#07080B] flex flex-col">
        
        <!-- BARRA SUPERIOR FLOTANTE DEL MAPA (HUD) -->
        <div class="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div class="bg-[#12151D]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#283244] shadow-xl text-xs font-bold text-white flex items-center gap-2 pointer-events-auto">
            <span class="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
            <span>📍 Managua Centro</span>
            <span class="text-[10px] text-[#06C167] bg-[#06C167]/15 px-2 py-0.5 rounded-full border border-[#06C167]/30">Alta Demanda 🔥</span>
          </div>

          <!-- Selector de Capas del Mapa -->
          <div class="flex items-center gap-1.5 bg-[#12151D]/90 backdrop-blur-md p-1 rounded-full border border-[#283244] shadow-xl pointer-events-auto">
            <button onclick="setMapStyle('dark')" class="px-2.5 py-1 rounded-full text-[11px] font-bold text-white hover:bg-[#202737] transition-all" title="Modo Oscuro">
              🌙 Noche
            </button>
            <button onclick="setMapStyle('streets')" class="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#8A94A6] hover:text-white hover:bg-[#202737] transition-all" title="Modo Calles Claras">
              🗺️ Calles
            </button>
            <button onclick="centerMapOnDriver()" class="px-2 py-1 rounded-full text-[11px] font-bold text-[#06C167] hover:bg-[#06C167]/20 transition-all" title="Centrar en mi ubicación">
              🎯 Centrar
            </button>
          </div>
        </div>

        <!-- CONTENEDOR DEL MAPA MAPLIBRE GL -->
        <div id="driverMap" class="w-full h-full relative"></div>

        <!-- BADGE INFERIOR FLOTANTE CON VELOCIDAD Y RUTA -->
        <div class="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div class="bg-[#12151D]/90 backdrop-blur-md border border-[#283244] px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto">
            <div class="flex items-baseline gap-1">
              <span id="hudSpeedText" class="text-xl font-black font-mono text-[#06C167]">28</span>
              <span class="text-[10px] font-bold text-[#8A94A6]">KM/H</span>
            </div>
            <div class="h-6 w-px bg-[#262D3B]"></div>
            <div class="text-[11px]">
              <span class="font-bold text-white block">Rumbo 45° NE</span>
              <span class="text-[10px] text-[#6C768A]">Telemetría GPS Activa</span>
            </div>
          </div>
        </div>

      </main>

      <!-- COLUMNA 3 (DERECHA, 3 cols): TELEMETRÍA, INSTRUMENTACIÓN Y HISTORIAL -->
      <aside class="hidden lg:flex lg:col-span-3 xl:col-span-3 bg-[#101217] border-l border-[#1F242D] flex-col justify-between p-4 space-y-4 overflow-y-auto">
        
        <div class="space-y-4">
          
          <div class="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1F242D]">
            <span>Instrumentación en Vivo</span>
            <span class="text-[10px] text-[#06C167] font-mono">ENLACE ACTIVO</span>
          </div>

          <!-- VELOCÍMETRO / INSTRUMENTO DE TELEMETRÍA -->
          <div class="bg-gradient-to-br from-[#151922] to-[#0D0F14] border border-[#222938] rounded-2xl p-4 text-center relative overflow-hidden speedo-glow">
            <span class="text-[10px] font-bold uppercase tracking-widest text-[#8A94A6]">Velocidad de Desplazamiento</span>
            <div class="my-2 flex items-baseline justify-center gap-1.5">
              <span id="cockpitSpeedVal" class="text-5xl font-black font-mono tracking-tight text-white">28</span>
              <span class="text-xs font-bold text-[#06C167]">km/h</span>
            </div>
            <div class="w-full bg-[#1F242D] h-2 rounded-full overflow-hidden mt-3">
              <div id="speedoProgressBar" class="h-full bg-gradient-to-r from-[#06C167] to-emerald-300 w-1/3 transition-all duration-500"></div>
            </div>
            <div class="flex justify-between text-[10px] text-[#6C768A] mt-1 font-mono">
              <span>0 km/h</span>
              <span>Límite Urbano 45</span>
              <span>80 km/h</span>
            </div>
          </div>

          <!-- GAUGES DE COORDENADAS Y PRECISIÓN -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#151922] p-3 rounded-xl border border-[#222834]">
              <span class="text-[10px] text-[#6C768A] block uppercase font-bold">Latitud</span>
              <span id="gaugeLatText" class="font-mono font-bold text-white text-[11px]">12.1260° N</span>
            </div>
            <div class="bg-[#151922] p-3 rounded-xl border border-[#222834]">
              <span class="text-[10px] text-[#6C768A] block uppercase font-bold">Longitud</span>
              <span id="gaugeLngText" class="font-mono font-bold text-white text-[11px]">-86.2650° W</span>
            </div>
            <div class="bg-[#151922] p-3 rounded-xl border border-[#222834]">
              <span class="text-[10px] text-[#6C768A] block uppercase font-bold">Señal GPS</span>
              <span class="font-bold text-[#06C167] text-[11px] flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#06C167]"></span>
                Precisión ±3m
              </span>
            </div>
            <div class="bg-[#151922] p-3 rounded-xl border border-[#222834]">
              <span class="text-[10px] text-[#6C768A] block uppercase font-bold">Canal Realtime</span>
              <span class="font-mono text-white text-[11px]">orders:tracking</span>
            </div>
          </div>

          <!-- DESGLOSE DE TURNO Y COMISIONES -->
          <div class="bg-[#151922] border border-[#222834] rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-white uppercase tracking-wider">Desglose de Turno</span>
              <span class="text-[10px] text-[#06C167] font-bold">Retención 0%</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-[#8A94A6]">
                <span>Tarifas cobradas:</span>
                <span class="font-mono text-white font-bold">C$ 700.00</span>
              </div>
              <div class="flex justify-between text-[#8A94A6]">
                <span>Comisión de app (20%):</span>
                <span class="font-mono text-red-400">-C$ 140.00</span>
              </div>
              <div class="flex justify-between text-[#8A94A6]">
                <span>Propinas recibidas:</span>
                <span class="font-mono text-amber-400 font-bold">+C$ 60.00</span>
              </div>
              <div class="pt-2 border-t border-[#222834] flex justify-between font-bold text-white">
                <span>Total a Billetera:</span>
                <span class="font-mono text-[#06C167] text-sm">C$ 620.00 NIO</span>
              </div>
            </div>
          </div>

        </div>

        <div class="pt-3 border-t border-[#1F242D] text-[10px] text-[#6C768A] text-center">
          Telemetría y Despacho en Tiempo Real • PedidosNica Driver
        </div>
      </aside>

    </div>

    <!-- MODO 2: VISTA SMARTPHONE SIMULADA (PARA PRUEBAS 1:1 EN ESCRITORIO O PANTALLAS GRANDES) -->
    <div id="phoneViewContainer" class="hidden flex-1 items-center justify-center p-4 bg-[#050608] overflow-hidden">
      <div class="phone-frame flex flex-col relative">
        
        <!-- Notch / Cámara Superior del Smartphone -->
        <div class="phone-notch">
          <div class="speaker"></div>
          <div class="camera"></div>
        </div>

        <!-- Barra de Estado Android / iOS -->
        <div class="px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold text-white z-40 bg-gradient-to-b from-black/80 to-transparent">
          <span>9:41</span>
          <div class="flex items-center gap-1 text-[10px]">
            <span>5G</span>
            <span>📶</span>
            <span>🔋 95%</span>
          </div>
        </div>

        <!-- Contenedor del Mapa en el Smartphone -->
        <div class="flex-1 relative bg-black">
          <div id="phoneDriverMap" class="w-full h-full"></div>

          <!-- Botón flotante superior para volver a modo escritorio -->
          <button onclick="switchViewMode('cockpit')" class="absolute top-10 right-4 z-40 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#333] text-[10px] font-bold text-white hover:text-[#06C167] shadow-xl flex items-center gap-1">
            <span>🖥️</span> Salir de vista móvil
          </button>

          <!-- BOTTOM SHEET FLOTANTE DEL SMARTPHONE (IGUAL QUE EN ANDROID) -->
          <div class="absolute bottom-0 left-0 right-0 z-30 bg-[#14161C] border-t border-[#262D3B] rounded-t-3xl p-4 shadow-2xl space-y-3">
            <div class="w-10 h-1 bg-[#2C3444] rounded-full mx-auto -mt-1 mb-2"></div>
            
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-[#8A94A6] uppercase">Ganancias de Hoy</span>
                <p class="text-xl font-black text-white font-mono" id="phoneEarningsText">C$ 560.00</p>
              </div>
              <button onclick="toggleDriverOnline()" id="phoneOnlineBtn" class="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#06C167] text-black">
                EN LÍNEA
              </button>
            </div>

            <!-- Resumen de viaje activo en el teléfono -->
            <div id="phoneActiveTripSnippet" class="p-3 rounded-xl bg-[#0D0F14] border border-[#222834] text-xs">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-[#06C167] text-[11px]" id="phoneTripTitle">Esperando pedidos...</span>
                <span class="font-mono text-[#8A94A6]" id="phoneTripFare">80% Neto</span>
              </div>
              <p class="text-[11px] text-[#8A94A6] truncate" id="phoneTripSubtitle">Zona activa: Managua Central</p>
            </div>

            <!-- Pedidos Disponibles en Zona para Smartphone -->
            <div id="phoneAvailableOrdersContainer" class="hidden space-y-2 max-h-48 overflow-y-auto pt-1">
              <div class="flex items-center justify-between text-[10px] font-bold text-white uppercase">
                <span>Oportunidades en Zona</span>
                <span id="phoneAvailableCountBadge" class="text-[#06C167]">0</span>
              </div>
              <div id="phoneAvailableOrdersList" class="space-y-1.5"></div>
            </div>
          </div>
        </div>

      </div>
    </div>

    </div>

    <!-- MODAL DE OFERTA DE ALTA PRIORIDAD (20 SEGUNDOS COUNTDOWN) -->
    <div id="incomingOfferModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#14161D] border-2 border-[#06C167] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden animate-bounce-short">
        
        <!-- Header con Temporizador Circular de 20 Segundos -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-[#06C167]/15 text-[#06C167] text-lg">⚡</span>
            <div>
              <span class="text-[10px] font-bold text-[#06C167] uppercase tracking-wider block">¡NUEVA OFERTA DE PEDIDO!</span>
              <h3 class="text-lg font-black text-white">Tienes 20s para Aceptar</h3>
            </div>
          </div>

          <!-- SVG Circular Countdown -->
          <div class="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg class="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#262626" stroke-width="4" fill="none"/>
              <circle id="timerCircle" cx="24" cy="24" r="20" stroke="#06C167" stroke-width="4" fill="none" stroke-dasharray="125.6" stroke-dashoffset="0" class="transition-all duration-1000"/>
            </svg>
            <span id="timerSecondsText" class="absolute font-mono font-black text-sm text-white">20</span>
          </div>
        </div>

        <!-- Tarjeta de Ganancia Estimada -->
        <div class="bg-black/60 border border-[#2E2E2E] rounded-2xl p-4 text-center my-4">
          <span class="text-xs text-[#8A94A6] block uppercase tracking-wider">Tu Ganancia Estimada</span>
          <div class="flex items-baseline justify-center gap-1.5 mt-1">
            <span class="text-4xl font-black text-[#06C167] font-mono tracking-tight" id="offerPayoutText">C$ 56.00</span>
            <span class="text-xs text-[#6C768A] font-bold">NIO</span>
          </div>
          <p class="text-[11px] text-[#8A94A6] mt-1">Distancia estimada: <strong id="offerDistanceText" class="text-white">2.8 km</strong></p>
        </div>

        <!-- Detalles de Origen y Destino -->
        <div class="space-y-2.5 text-xs bg-[#1C2029] p-3.5 rounded-xl border border-[#2B3342] mb-5">
          <div class="flex items-start gap-2.5">
            <span class="text-base">🏪</span>
            <div>
              <strong id="offerRestName" class="text-white block font-bold text-xs sm:text-sm">Pupusería & Antojitos El Diamante</strong>
              <span id="offerRestAddress" class="text-[#8A94A6] text-[11px] block">Colonial Los Robles, Managua</span>
            </div>
          </div>
          <div class="flex items-start gap-2.5 pt-2 border-t border-[#2B3342]">
            <span class="text-base">📍</span>
            <div>
              <strong id="offerClientAddress" class="text-white block font-bold text-xs sm:text-sm">Galerías Santo Domingo, Managua</strong>
              <span id="offerItemsSummary" class="text-[#8A94A6] text-[11px] block">2 ítems • Prep. Lista</span>
            </div>
          </div>
        </div>

        <!-- Botones de Aceptar / Rechazar -->
        <div class="space-y-2">
          <button id="acceptOfferBtn" onclick="acceptIncomingOffer()" class="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-[#06C167] text-black hover:bg-[#05A357] shadow-xl shadow-[#06C167]/30 transition-all flex items-center justify-center gap-2">
            <span>ACEPTAR PEDIDO</span>
            <span id="acceptBtnAmount" class="font-mono">(C$ 56.00)</span>
          </button>
          <button onclick="rejectIncomingOffer()" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-[#8A94A6] hover:text-white hover:bg-[#202737] transition-colors">
            Rechazar / Pasar al siguiente
          </button>
        </div>

      </div>
    </div>

    
    <!-- ================================================================ -->
    <!-- MODAL: PERFIL DE CONDUCTOR Y CAMBIO DE CUENTA (RBAC) -->
    <!-- ================================================================ -->
    <div id="modalDriverProfile" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#14161D] border-2 border-[#06C167]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-[#262D3B]">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-[#06C167]/20 text-[#06C167] text-lg">🛵</span>
            <div>
              <h3 class="text-sm font-black text-white">Perfil del Repartidor</h3>
              <p class="text-[10px] text-[#8A94A6]">Edita tus datos o cambia de conductor</p>
            </div>
          </div>
          <button onclick="closeDriverProfileModal()" class="text-[#8A94A6] hover:text-white p-1 text-base">✕</button>
        </div>

        <!-- Identidad Personal del Conductor (Perfil Aislado) -->
        <div class="p-3.5 rounded-2xl bg-[#181D26] border-2 border-[#06C167]/40 flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#06C167]/20 border border-[#06C167]/50 flex items-center justify-center text-xl">
              🛵
            </div>
            <div>
              <p class="font-black text-white text-sm" id="driverProfileCardName">Carlos Gómez</p>
              <p class="text-[10px] text-[#8A94A6]" id="driverProfileCardSubtitle">Conductor Independiente • Turno Activo</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-amber-400 bg-black px-2 py-1 rounded-lg border border-amber-500/30">⭐ 4.90</span>
        </div>

        <!-- Formulario de Edición de Perfil de Conductor -->
        <div class="pt-3 border-t border-[#222938] space-y-2.5">
          <span class="text-[11px] font-bold text-white block">Editar Datos de mi Perfil:</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-0.5">Nombre Completo</label>
              <input type="text" id="driverProfileNameInput" value="Martín Rivas" class="w-full bg-[#0D0F14] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
            </div>
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-0.5">Teléfono Móvil</label>
              <input type="text" id="driverProfilePhoneInput" value="+505 8899-7766" class="w-full bg-[#0D0F14] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-0.5">Tipo de Vehículo</label>
              <select id="driverProfileVehicleTypeInput" class="w-full bg-[#0D0F14] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]">
                <option value="MOTORCYCLE">Motocicleta</option>
                <option value="BICYCLE">Bicicleta</option>
                <option value="CAR">Automóvil</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-0.5">Placa / Matrícula</label>
              <input type="text" id="driverProfilePlateInput" value="A482XYZ" class="w-full bg-[#0D0F14] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
            </div>
          </div>

          <button onclick="saveDriverProfile()" class="w-full py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs transition-colors shadow-lg shadow-[#06C167]/25">
            Guardar Cambios de Perfil
          </button>
        </div>

        <!-- Historial de Entregas Recientes en el Turno -->
        <div class="pt-3 border-t border-[#222834]">
          <p class="text-[11px] font-bold uppercase text-[#8A94A6] mb-2">Historial de Entregas Recientes</p>
          <div id="driverHistoryList" class="space-y-1.5 max-h-36 overflow-y-auto text-xs text-[#8A94A6]">Cargando historial...</div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-[#222938]">
          <button onclick="logoutDriver()" class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5">
            <span>🚪</span> Cerrar Turno / Salir
          </button>
          <button onclick="closeDriverProfileModal()" class="px-4 py-2 rounded-xl bg-[#222] hover:bg-[#333] text-white font-bold text-xs">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE ENTREGA COMPLETADA CON ÉXITO -->
    <div id="deliveredSuccessModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#14161D] border-2 border-[#06C167] rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scale-up">
        <div class="w-16 h-16 rounded-full bg-[#06C167]/20 text-[#06C167] flex items-center justify-center text-3xl mx-auto border-2 border-[#06C167]">
          ✓
        </div>
        <div>
          <h3 class="text-xl font-black text-white">¡Entrega Completada!</h3>
          <p class="text-xs text-[#8A94A6] mt-1">Has entregado el pedido con éxito al cliente.</p>
        </div>
        <div class="bg-black/60 p-3.5 rounded-2xl border border-[#2E2E2E]">
          <span class="text-xs text-[#8A94A6]">Ganancia Acreditada</span>
          <p id="successPayoutEarned" class="text-3xl font-black text-[#06C167] font-mono mt-0.5">+C$ 56.00</p>
        </div>
        <button onclick="closeSuccessModal()" class="w-full py-3.5 rounded-xl font-bold text-xs bg-[#06C167] text-black hover:bg-[#05A357] transition-all">
          Listo para el siguiente viaje
        </button>
      </div>
    </div>

  </div>

  <!-- SCRIPT CLIENTE ESPECÍFICO DEL DRIVER APP -->
  <script src="/driver/script.js"></script>
  ${getFooter()}`;
}

module.exports = {
  renderDriverApp
};
