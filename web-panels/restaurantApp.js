// ============================================================================
// SUITE UNIFICADA DE RESTAURANTE - UBER EATS ORDERS / RESTAURANT MANAGER
// ============================================================================

function renderRestaurantApp(initialTab = 'kds', options = {}) {
  const {
    currentCommissionRate = 15.0,
    SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co',
    SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w',
    getHeader,
    getFooter
  } = options;

  return `${getHeader('PedidosNica Orders | Panel de Restaurante')}

  <div id="restaurantAppRoot" data-initial-tab="${initialTab}" class="min-h-screen flex flex-col bg-black text-white antialiased selection:bg-[#06C167] selection:text-black">

    <!-- PORTAL DE ACCESO / LOGIN INDEPENDIENTE DE RESTAURANTES -->
    <div id="restaurantLoginGate" class="hidden max-w-md mx-auto my-12 px-4 space-y-4">
      <div class="text-center mb-4">
        <div class="w-16 h-16 rounded-3xl bg-[#06C167]/15 border border-[#06C167]/40 flex items-center justify-center text-3xl mx-auto shadow-2xl mb-2">
          🏪
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">
          Portal de Restaurante
        </h1>
        <p class="text-xs text-[#8A94A6] mt-0.5 max-w-sm mx-auto">
          Inicia sesión con tu cuenta de comercio. Cada restaurante opera con accesos y permisos independientes.
        </p>
      </div>

      <div class="bg-[#12141C] border-2 border-[#262D3B] focus-within:border-[#06C167] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <form onsubmit="event.preventDefault(); loginRestaurantWithForm();" class="space-y-3.5">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Correo Electrónico del Local</label>
            <input type="email" id="restLoginEmail" required placeholder="admin@eldiamante.com" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Contraseña</label>
            <input type="password" id="restLoginPassword" required value="Password123!" placeholder="••••••••" class="w-full bg-[#181D26] border border-[#2B3444] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#06C167]" />
          </div>

          <button type="submit" id="btnRestLoginSubmit" class="w-full py-3.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-[#06C167]/25 transition-all cursor-pointer">
            Ingresar al Panel del Restaurante
          </button>
        </form>

        <!-- Accesos rápidos demostrativos -->
        <div class="pt-3 border-t border-[#222938] space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">Ingreso Rápido por Local Independiente:</span>
          
          <div class="grid grid-cols-1 gap-1.5 text-left text-xs">
            <button onclick="quickFillRestLogin('admin@eldiamante.com', 'Password123!')" class="p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
              <div>
                <p class="font-bold text-white text-[11px]">Pupusería El Diamante <span class="text-[9px] text-purple-400 font-mono">(Admin)</span></p>
                <p class="text-[10px] text-[#8A94A6]">admin@eldiamante.com • Unidad Única</p>
              </div>
              <span class="text-xs text-[#06C167]">Entrar →</span>
            </button>

            <button onclick="quickFillRestLogin('cocina@eldiamante.com', 'Password123!')" class="p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
              <div>
                <p class="font-bold text-white text-[11px]">Pupusería El Diamante <span class="text-[9px] text-blue-400 font-mono">(Cocina/KDS)</span></p>
                <p class="text-[10px] text-[#8A94A6]">cocina@eldiamante.com • Unidad Única</p>
              </div>
              <span class="text-xs text-blue-400">Entrar →</span>
            </button>

            <button onclick="quickFillRestLogin('admin@asadoseltoro.ni', 'Password123!')" class="p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
              <div>
                <p class="font-bold text-white text-[11px]">Asados El Toro Nica <span class="text-[9px] text-purple-400 font-mono">(Admin)</span></p>
                <p class="text-[10px] text-[#8A94A6]">admin@asadoseltoro.ni • Unidad Única</p>
              </div>
              <span class="text-xs text-[#06C167]">Entrar →</span>
            </button>

            <button onclick="quickFillRestLogin('admin@pizzeriadnapoli.com', 'Password123!')" class="p-2.5 rounded-xl bg-[#181D26] hover:bg-[#202737] border border-[#283244] flex items-center justify-between text-left transition-colors">
              <div>
                <p class="font-bold text-white text-[11px]">Pizzería Di Napoli <span class="text-[9px] text-purple-400 font-mono">(Admin)</span></p>
                <p class="text-[10px] text-[#8A94A6]">admin@pizzeriadnapoli.com • Unidad Única</p>
              </div>
              <span class="text-xs text-[#06C167]">Entrar →</span>
            </button>

            <button onclick="quickFillRestLogin('franquicia@gruponica.com', 'Password123!')" class="p-2.5 rounded-xl bg-[#1E182A] hover:bg-[#261E36] border border-purple-500/40 flex items-center justify-between text-left transition-colors">
              <div>
                <p class="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <span>🏢 Grupo Gastronómico Nica</span>
                  <span class="text-[9px] font-black uppercase bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded">Multi-gestión</span>
                </p>
                <p class="text-[10px] text-purple-200/70">franquicia@gruponica.com • Alterna entre sucursales</p>
              </div>
              <span class="text-xs text-purple-300">Entrar →</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTENEDOR OPERATIVO DEL RESTAURANTE -->
    <div id="restaurantAppRootContent" class="flex-1 flex flex-col overflow-hidden">

    <!-- TOPBAR PEDIDOSNICA ORDERS (OPTIMIZADA PARA IPADS, TELÉFONOS Y WEB) -->
    <header class="bg-[#121212] border-b border-[#262626] sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
      
      <!-- Identidad PedidosNica & Restaurante -->
      <div class="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <!-- Logo PedidosNica Orders -->
        <a href="/" class="flex items-center gap-1 shrink-0">
          <span class="font-extrabold text-lg sm:text-xl tracking-tighter text-white">Pedidos</span>
          <span class="font-black text-lg sm:text-xl tracking-tighter text-[#06C167]">Nica</span>
          <span class="text-[10px] font-bold uppercase tracking-wider bg-[#1F1F1F] text-[#06C167] px-2 py-0.5 rounded-full border border-[#2E2E2E] ml-1">Orders</span>
        </a>

        <!-- Divider -->
        <div class="h-6 w-px bg-[#262626] hidden sm:block"></div>

        <!-- Info Local -->
        <div class="flex items-center gap-2 min-w-0">
          <div class="relative shrink-0">
            <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100" class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-[#2E2E2E]" alt="Logo Local" />
            <span id="headerStatusDot" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#06C167] border-2 border-[#121212]"></span>
          </div>
          <div class="truncate">
            <div id="multiUnitBranchContainer" class="flex items-center gap-1.5 truncate">
              <!-- Renderizado dinámico según sea multi-gestión o unidad única -->
              <div id="singleBranchView" class="flex items-center gap-1.5 truncate">
                <span id="headerRestName" class="font-extrabold text-white text-xs sm:text-sm truncate">Pupusería & Antojitos El Diamante</span>
                <span id="branchModeBadge" class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">Unidad Única</span>
              </div>
              <div id="multiBranchView" class="hidden flex items-center gap-1.5 truncate">
                <select id="restaurantSelectDropdown" onchange="switchRestaurant(this.value)" class="bg-[#1A1F2C] text-[#06C167] text-xs font-black border-2 border-[#06C167]/50 rounded-xl px-2.5 py-1 outline-none max-w-[190px] sm:max-w-[260px] truncate cursor-pointer shadow-md">
                  <option value="">Cargando sucursales autorizadas...</option>
                </select>
                <span class="text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full shrink-0">Multi-gestión</span>
              </div>
            </div>
            <p class="text-[11px] text-[#A6A6A6] truncate hidden sm:block mt-0.5">
              <span id="headerRestAddress">📍 Managua, Nicaragua</span>
              <span>•</span>
              <span class="text-[#06C167]">Comisión: <strong id="headerCommissionRate" class="font-mono">${currentCommissionRate}%</strong></span>
            </p>
          </div>
        </div>
      </div>

      <!-- Controles Rápidos Tablet & Cocina -->
      <div class="flex items-center gap-2 shrink-0">
        
        <!-- Switch de Estado del Local: Abierto / Saturado / Cerrado -->
        <div class="relative">
          <button id="storeStatusBtn" onclick="toggleStoreStatusMenu()" class="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 text-xs font-bold flex items-center gap-1.5 hover:bg-[#06C167]/25 transition-all">
            <span class="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
            <span id="storeStatusLabel">Abierto</span>
            <span class="text-[9px] opacity-70">▼</span>
          </button>
          
          <div id="storeStatusDropdown" class="hidden absolute right-0 mt-2 w-56 bg-[#161616] border border-[#2B2B2B] rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs">
            <button onclick="setStoreStatus('OPEN')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-[#222222] flex items-center gap-2.5 text-[#06C167] font-semibold">
              <span class="w-2.5 h-2.5 rounded-full bg-[#06C167]"></span>
              <div>
                <p class="font-bold">Abierto</p>
                <p class="text-[10px] text-[#A6A6A6]">Recibiendo pedidos con normalidad</p>
              </div>
            </button>
            <button onclick="setStoreStatus('BUSY')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-[#222222] flex items-center gap-2.5 text-amber-400 font-semibold">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <div>
                <p class="font-bold">Cocina Saturada</p>
                <p class="text-[10px] text-[#A6A6A6]">Pausar pedidos por 20 minutos</p>
              </div>
            </button>
            <button onclick="setStoreStatus('CLOSED')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-[#222222] flex items-center gap-2.5 text-rose-400 font-semibold">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <div>
                <p class="font-bold">Cerrado</p>
                <p class="text-[10px] text-[#A6A6A6]">No recibir pedidos</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Tiempo de Preparación Base -->
        <div class="hidden sm:flex items-center gap-1.5 bg-[#1F1F1F] border border-[#2E2E2E] px-2.5 py-1.5 rounded-full text-xs">
          <span class="text-[#A6A6A6]">⏱️</span>
          <select id="basePrepSelect" onchange="updateBasePrep(this.value)" class="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer">
            <option value="15" class="bg-[#121212]">15 min</option>
            <option value="20" class="bg-[#121212]">20 min</option>
            <option value="25" selected class="bg-[#121212]">25 min</option>
            <option value="35" class="bg-[#121212]">35 min</option>
            <option value="45" class="bg-[#121212]">45 min</option>
          </select>
        </div>

        <!-- Alarma Sonora Web Audio API -->
        <button id="btnAudioMute" onclick="toggleMute()" title="Silenciar / Activar Alarma de Cocina" class="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 hover:bg-[#06C167]/25 text-xs font-semibold flex items-center gap-1.5 transition-all">
          <span id="audioIcon">🔔</span>
          <span id="audioLabel" class="hidden sm:inline">Alarma Activa</span>
        </button>

        <button onclick="testChimeSound()" title="Probar sonido del timbre" class="p-1.5 text-xs text-[#A6A6A6] hover:text-white bg-[#1F1F1F] hover:bg-[#282828] rounded-full transition-colors">
          🔊
        </button>

        <!-- Selector de Nivel de Usuario / Perfil de Restaurante -->
        <button onclick="openRestUserModal()" id="restUserBadgeBtn" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-xs transition-all shadow-md">
          <span id="restRoleIcon">👑</span>
          <span id="restRoleText" class="font-bold text-white text-[11px]">Admin: Roberto Morales</span>
          <span class="text-[9px] text-[#A6A6A6]">▼</span>
        </button>

        <!-- Botón Directo para Cerrar Sesión e Ingresar a Otro Local -->
        <button onclick="logoutRestaurant()" title="Cerrar sesión del comercio e ingresar con otro restaurante" class="px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-md">
          <span>🚪</span>
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>

    <!-- BARRA DE NAVEGACIÓN HORIZONTAL PARA SMARTPHONES & TABLETS VERTICALES -->
    <nav class="md:hidden bg-[#121212] border-b border-[#262626] px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
      <button onclick="switchTab('kds')" id="nav-mobile-kds" class="nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 bg-[#06C167] text-black">
        <span>🛎️</span>
        <span>Comandas</span>
        <span id="badgeKdsCountMobile" class="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-black text-[#06C167]">1</span>
      </button>

      <button onclick="switchTab('menu')" id="nav-mobile-menu" class="nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F]">
        <span>📋</span>
        <span>Menú</span>
      </button>

      <button onclick="switchTab('finances')" id="nav-mobile-finances" class="nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F]">
        <span>📊</span>
        <span>Finanzas</span>
      </button>

      <button onclick="switchTab('reviews')" id="nav-mobile-reviews" class="nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F]">
        <span>⭐</span>
        <span>Opiniones</span>
      </button>

      <button onclick="switchTab('settings')" id="nav-mobile-settings" class="nav-btn-mobile px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F]">
        <span>⚙️</span>
        <span>Ajustes</span>
      </button>
    </nav>

    <!-- CUERPO PRINCIPAL CON SIDEBAR (DESKTOP/IPAD LANDSCAPE) Y CONTENIDO -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">

      <!-- SIDEBAR DE NAVEGACIÓN UBER EATS (DESKTOP & IPAD HORIZONTAL) -->
      <aside class="hidden md:flex w-60 bg-[#121212] border-r border-[#262626] p-4 flex-col justify-between shrink-0">
        <nav class="space-y-1.5 w-full">
          <!-- Tab KDS -->
          <button onclick="switchTab('kds')" id="nav-kds" class="nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left bg-[#06C167] text-black shadow-lg shadow-[#06C167]/20">
            <span class="flex items-center gap-2.5">
              <span class="text-base">🛎️</span>
              <span>Comandas en Vivo</span>
            </span>
            <span id="badgeKdsCount" class="px-2 py-0.5 text-[10px] font-black rounded-full bg-black text-[#06C167]">1</span>
          </button>

          <!-- Tab Menú -->
          <button onclick="switchTab('menu')" id="nav-menu" class="nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-[#A6A6A6] hover:text-white hover:bg-[#1C1C1C]">
            <span class="flex items-center gap-2.5">
              <span class="text-base">📋</span>
              <span>Carta & Modificadores</span>
            </span>
            <span id="badgeMenuCount" class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#262626] text-[#A6A6A6]">4</span>
          </button>

          <!-- Tab Finanzas -->
          <button onclick="switchTab('finances')" id="nav-finances" class="nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-[#A6A6A6] hover:text-white hover:bg-[#1C1C1C]">
            <span class="flex items-center gap-2.5">
              <span class="text-base">📊</span>
              <span>Caja & Finanzas</span>
            </span>
            <span class="text-[10px] font-bold font-mono text-[#06C167]">C$ 2,280.00</span>
          </button>

          <!-- Tab Reseñas -->
          <button onclick="switchTab('reviews')" id="nav-reviews" class="nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-[#A6A6A6] hover:text-white hover:bg-[#1C1C1C]">
            <span class="flex items-center gap-2.5">
              <span class="text-base">⭐</span>
              <span>Calificaciones</span>
            </span>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">4.9 ★</span>
          </button>

          <!-- Tab Configuración -->
          <button onclick="switchTab('settings')" id="nav-settings" class="nav-btn w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-[#A6A6A6] hover:text-white hover:bg-[#1C1C1C]">
            <span class="flex items-center gap-2.5">
              <span class="text-base">⚙️</span>
              <span>Ajustes del Local</span>
            </span>
          </button>
        </nav>

        <!-- Bloque de Sucursales y Ayuda -->
        <div class="pt-4 border-t border-[#262626] space-y-3">
          <div class="p-3 rounded-2xl bg-black border border-[#262626] text-xs">
            <p class="text-[11px] font-bold text-white">¿Tienes otra sucursal?</p>
            <p class="text-[10px] text-[#A6A6A6] mt-0.5">Registra un nuevo local con su propio menú e impresora.</p>
            <a href="/restaurant/onboard" class="mt-2 block text-center py-2 rounded-xl bg-[#06C167]/15 hover:bg-[#06C167]/25 text-[#06C167] font-bold text-[11px] transition-colors">
              + Afiliar Otra Sucursal
            </a>
          </div>
          <p class="text-[10px] text-[#757575] text-center font-mono">PedidosNica Orders v2.4</p>
        </div>
      </aside>

      <!-- ÁREA DE CONTENIDO DINÁMICO (RESPONSIVE: PHONE, TABLET & DESKTOP) -->
      <main class="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">

        <!-- ================================================================ -->
        <!-- SECCIÓN 1: COMANDAS KDS & HISTORIAL -->
        <!-- ================================================================ -->
        <section id="section-kds" class="tab-section space-y-4 sm:space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-ping"></span>
                <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Comandas de Cocina & Despacho</h2>
              </div>
              <p class="text-xs text-[#A6A6A6] mt-0.5">
                Pantalla táctil para cocineros y despachadores sincronizada en tiempo real.
              </p>
            </div>

            <!-- Subtabs y simulador -->
            <div class="flex items-center gap-2">
              <div class="bg-[#161616] p-1 rounded-full border border-[#262626] flex items-center text-xs">
                <button onclick="setKdsView('active')" id="btnKdsActive" class="px-3 py-1.5 rounded-full font-bold bg-[#06C167] text-black shadow">
                  En Vivo (<span id="activeOrdersTotal">3</span>)
                </button>
                <button onclick="setKdsView('history')" id="btnKdsHistory" class="px-3 py-1.5 rounded-full font-bold text-[#A6A6A6] hover:text-white transition-colors">
                  Historial (<span id="historyOrdersTotal">2</span>)
                </button>
              </div>

              <button onclick="simulateCustomerOrder()" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#06C167] hover:bg-[#05A357] text-black shadow-lg shadow-[#06C167]/20 transition-all flex items-center gap-1.5 shrink-0">
                <span>+</span> Simular Pedido
              </button>
            </div>
          </div>

          <!-- FILTRO SEGMENTADO PARA CELULARES & IPADS VERTICALES -->
          <div class="flex lg:hidden bg-[#161616] p-1 rounded-2xl border border-[#262626] gap-1 text-xs">
            <button id="segKdsAll" onclick="setKdsColumnFilter('ALL')" class="flex-1 py-2 text-center font-bold rounded-xl bg-[#06C167] text-black transition-colors">
              Todos
            </button>
            <button id="segKdsCreated" onclick="setKdsColumnFilter('CREATED')" class="flex-1 py-2 text-center font-bold rounded-xl text-[#A6A6A6] hover:text-white transition-colors">
              Nuevos (<span id="kdsMobileCreatedCount">0</span>)
            </button>
            <button id="segKdsPrep" onclick="setKdsColumnFilter('PREP')" class="flex-1 py-2 text-center font-bold rounded-xl text-[#A6A6A6] hover:text-white transition-colors">
              Cocina (<span id="kdsMobilePrepCount">0</span>)
            </button>
            <button id="segKdsReady" onclick="setKdsColumnFilter('READY')" class="flex-1 py-2 text-center font-bold rounded-xl text-[#A6A6A6] hover:text-white transition-colors">
              Listos (<span id="kdsMobileReadyCount">0</span>)
            </button>
          </div>

          <!-- SUBVISTA 1: COMANDAS ACTIVAS EN VIVO (KANBAN RESPONSIVE: 1 COL EN PHONE, 3 EN TABLET/WEB) -->
          <div id="kdsViewActive" class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            <!-- COLUMNA 1: NUEVOS PEDIDOS (CREATED) -->
            <div id="col-kds-created" class="bg-[#121212] border-2 border-[#06C167]/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#262626]">
                  <h3 class="font-extrabold text-[#06C167] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-ping"></span>
                    <span>1. Nuevos Entrantes (<span id="count-created">0</span>)</span>
                  </h3>
                  <span class="text-[10px] bg-[#06C167]/20 text-[#06C167] font-bold px-2 py-0.5 rounded-full font-mono">Alarma</span>
                </div>
                <div id="list-created" class="space-y-3.5"></div>
              </div>
            </div>

            <!-- COLUMNA 2: EN COCINA / PREPARACIÓN (ACCEPTED / IN_PREPARATION) -->
            <div id="col-kds-prep" class="bg-[#121212] border border-[#262626] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#262626]">
                  <h3 class="font-extrabold text-blue-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <span>👨‍🍳</span>
                    <span>2. En Preparación (<span id="count-prep">0</span>)</span>
                  </h3>
                  <span class="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full font-mono">En Hornos</span>
                </div>
                <div id="list-prep" class="space-y-3.5"></div>
              </div>
            </div>

            <!-- COLUMNA 3: LISTO / ESPERANDO REPARTIDOR (READY_FOR_PICKUP) -->
            <div id="col-kds-ready" class="bg-[#121212] border border-[#262626] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#262626]">
                  <h3 class="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <span>🛵</span>
                    <span>3. Mostrador / Despacho (<span id="count-ready">0</span>)</span>
                  </h3>
                  <span class="text-[10px] bg-[#06C167]/20 text-[#06C167] font-bold px-2 py-0.5 rounded-full font-mono">PIN Seguro</span>
                </div>
                <div id="list-ready" class="space-y-3.5"></div>
              </div>
            </div>

          </div>

          <!-- SUBVISTA 2: HISTORIAL DEL TURNO -->
          <div id="kdsViewHistory" class="hidden space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] p-4 rounded-2xl border border-[#262626]">
              <div class="flex items-center gap-2 flex-wrap">
                <input type="text" id="historySearch" oninput="renderHistoryOrders()" placeholder="Buscar por #ID o cliente..." class="bg-black border border-[#262626] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06C167] w-60" />
                <select id="historyFilter" onchange="renderHistoryOrders()" class="bg-black border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#A6A6A6] focus:outline-none">
                  <option value="ALL">Todos los Estados</option>
                  <option value="DELIVERED">Entregados con Éxito</option>
                  <option value="PICKED_UP">Despachados con Repartidor</option>
                  <option value="CANCELLED">Cancelados / Rechazados</option>
                </select>
              </div>
              <p class="text-xs text-[#A6A6A6]">Total registrados: <strong class="text-white font-mono" id="historyCounter">0</strong> pedidos</p>
            </div>

            <div id="historyListContainer" class="space-y-3"></div>
          </div>
        </section>

        <!-- ================================================================ -->
        <!-- SECCIÓN 2: CARTA, MENÚ & MODIFICADORES -->
        <!-- ================================================================ -->
        <section id="section-menu" class="tab-section hidden space-y-4 sm:space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Gestor de Carta & Modificadores</h2>
              <p class="text-xs text-[#A6A6A6] mt-0.5">
                Control de disponibilidad de platos, combos, tamaños y adicionales con recargo.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openProductModal()" class="px-4 py-2 rounded-full text-xs font-black bg-[#06C167] hover:bg-[#05A357] text-black shadow-lg shadow-[#06C167]/20 transition-all flex items-center gap-1.5">
                <span>+</span> Crear Platillo o Combo
              </button>
            </div>
          </div>

          <!-- Filtros de Categoría y Búsqueda -->
          <div class="flex flex-wrap items-center justify-between gap-3 bg-[#121212] p-3.5 rounded-2xl border border-[#262626]">
            <div class="flex flex-wrap items-center gap-1.5" id="categoryPills">
              <button onclick="filterCategory('ALL')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#06C167] text-black shadow">Todos</button>
              <button onclick="filterCategory('Pizzas')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F1F1F] text-[#A6A6A6] hover:text-white border border-[#2E2E2E]">Pizzas</button>
              <button onclick="filterCategory('Hamburguesas')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F1F1F] text-[#A6A6A6] hover:text-white border border-[#2E2E2E]">Hamburguesas</button>
              <button onclick="filterCategory('Combos')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F1F1F] text-[#A6A6A6] hover:text-white border border-[#2E2E2E]">Combos 🔥</button>
              <button onclick="filterCategory('Entradas')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F1F1F] text-[#A6A6A6] hover:text-white border border-[#2E2E2E]">Entradas</button>
              <button onclick="filterCategory('Bebidas')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F1F1F] text-[#A6A6A6] hover:text-white border border-[#2E2E2E]">Bebidas</button>
            </div>

            <div class="flex items-center gap-2">
              <input type="text" id="menuSearch" oninput="renderProductsGrid()" placeholder="Buscar platillo..." class="bg-black border border-[#262626] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#06C167] w-44" />
              <select id="menuAvailabilityFilter" onchange="renderProductsGrid()" class="bg-black border border-[#262626] rounded-xl px-3 py-1.5 text-xs text-[#A6A6A6] focus:outline-none">
                <option value="ALL">Todo el Stock</option>
                <option value="ACTIVE">Disponibles</option>
                <option value="PAUSED">Pausados</option>
              </select>
            </div>
          </div>

          <!-- Grilla de Productos -->
          <div id="productsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        </section>

        <!-- ================================================================ -->
        <!-- SECCIÓN 3: FINANZAS & LIQUIDACIONES -->
        <!-- ================================================================ -->
        <section id="section-finances" class="tab-section hidden space-y-4 sm:space-y-6">
          <div class="pb-3 border-b border-[#262626]">
            <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Finanzas & Desglose de Comisión</h2>
            <p class="text-xs text-[#A6A6A6] mt-0.5">
              Cálculo transparente de ingresos brutos, retención de la plataforma (${currentCommissionRate}%) y transferencias netas.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 rounded-3xl bg-[#121212] border border-[#262626]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">Facturación Bruta (Hoy)</span>
              <p class="text-2xl font-black text-white font-mono mt-1" id="finGrossSales">C$ 0.00</p>
              <p class="text-[11px] text-[#A6A6A6] mt-1" id="finCompletedCount">0 pedidos entregados</p>
            </div>

            <div class="p-5 rounded-3xl bg-[#121212] border border-[#262626]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-rose-400">Comisión Plataforma (${currentCommissionRate}%)</span>
              <p class="text-2xl font-black text-rose-400 font-mono mt-1" id="finCommissionAmount">-C$ 0.00</p>
              <p class="text-[11px] text-[#A6A6A6] mt-1">Retenido automáticamente</p>
            </div>

            <div class="p-5 rounded-3xl bg-[#121212] border border-[#262626]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#06C167]">Ingreso Neto Transferible</span>
              <p class="text-2xl font-black text-[#06C167] font-mono mt-1" id="finNetPayout">C$ 0.00</p>
              <p class="text-[11px] text-[#A6A6A6] mt-1">Listo para liquidación bancaria</p>
            </div>

            <div class="p-5 rounded-3xl bg-[#121212] border border-[#262626]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">Ticket Promedio</span>
              <p class="text-2xl font-black text-blue-400 font-mono mt-1" id="finAvgTicket">C$ 0.00</p>
              <p class="text-[11px] text-[#A6A6A6] mt-1">Por orden completada</p>
            </div>
          </div>

          <div class="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-xl">
            <h3 class="text-sm font-bold text-white mb-3">Detalle de Órdenes Liquidadas</h3>
            <div id="financesOrdersTable" class="overflow-x-auto text-xs"></div>
          </div>
        </section>

        <!-- ================================================================ -->
        <!-- SECCIÓN 4: CALIFICACIONES & REVIEWS -->
        <!-- ================================================================ -->
        <section id="section-reviews" class="tab-section hidden space-y-4 sm:space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Opiniones de Clientes Verificados</h2>
              <p class="text-xs text-[#A6A6A6] mt-0.5">
                Calificaciones reales de clientes que recibieron su pedido mediante la app.
              </p>
            </div>
            <div class="flex items-center gap-2 bg-[#121212] px-3.5 py-1.5 rounded-full border border-[#262626]">
              <span class="text-amber-400 text-base">★</span>
              <span class="font-black text-white text-sm" id="reviewsAverageRating">4.9</span>
              <span class="text-xs text-[#A6A6A6]" id="reviewsTotalCount">(0 opiniones)</span>
            </div>
          </div>

          <div id="reviewsFeedList" class="space-y-3.5"></div>
        </section>

        <!-- ================================================================ -->
        <!-- SECCIÓN 5: AJUSTES DEL COMERCIO (RBAC: EDITABLE SOLO POR ADMIN) -->
        <!-- ================================================================ -->
        <section id="section-settings" class="tab-section hidden space-y-4 sm:space-y-6">
          <div class="pb-3 border-b border-[#262626] flex items-center justify-between">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Ajustes & Configuración del Local</h2>
              <p class="text-xs text-[#A6A6A6] mt-0.5">
                Administra los datos comerciales, horarios y parámetros de cocina de tu sucursal.
              </p>
            </div>
            <span id="settingsRoleBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              👑 Nivel Administrador
            </span>
          </div>

          <!-- AVISO DE RESTRICCIÓN CUANDO ESTÁ COMO COCINERO/STAFF -->
          <div id="staffSettingsLockedNotice" class="hidden p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🔒</span>
              <div>
                <p class="font-bold text-white text-sm">Ajustes en Modo Solo Lectura</p>
                <p class="text-amber-200/90 text-xs mt-0.5">Tu nivel de usuario actual es <strong class="underline font-bold text-white">Operador de Cocina (Staff)</strong>. Puedes gestionar comandas en KDS, pero solo el <strong>Administrador del Restaurante</strong> puede modificar datos del local, comisiones y configuración.</p>
              </div>
            </div>
            <button onclick="switchRestUserLevel('ADMIN')" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition-all shadow-lg shadow-purple-600/30">
              👑 Cambiar a Administrador
            </button>
          </div>

          <div class="max-w-2xl bg-[#121212] border border-[#262626] rounded-3xl p-5 sm:p-6 space-y-4 text-xs">
            <div>
              <label class="block font-bold text-white mb-1">Nombre Comercial del Restaurante</label>
              <input type="text" id="settStoreName" value="Pupusería & Antojitos El Diamante" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-white mb-1">Teléfono / WhatsApp de Contacto</label>
                <input type="text" id="settStorePhone" value="+505 8899-7711" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
              </div>
              <div>
                <label class="block font-bold text-white mb-1">Horario de Atención</label>
                <input type="text" id="settStoreHours" value="11:00 - 23:00" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-white mb-1">Dirección Física del Local (Managua, Nicaragua)</label>
              <input type="text" id="settStoreAddress" value="Colonial Los Robles, Managua" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-white mb-1">Tiempo de Cocina Estimado Base</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="settStorePrepMinutes" value="20" min="5" max="90" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-[#06C167]" />
                  <span class="text-[#A6A6A6]">min</span>
                </div>
              </div>
              <div>
                <label class="block font-bold text-white mb-1">Radio Máximo de Entrega</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="settStoreDeliveryRadius" value="5" step="0.5" min="1" max="25" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-[#06C167]" />
                  <span class="text-[#A6A6A6]">km</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block font-bold text-white mb-1">URL de Logo del Restaurante</label>
              <input type="url" id="settStoreLogoUrl" value="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
            </div>

            <div class="p-3 bg-black/60 rounded-xl border border-[#262626] flex items-center justify-between text-[11px]">
              <div>
                <span class="text-white font-bold">Comisión de Plataforma:</span>
                <span class="text-[#A6A6A6] block">Retenida automáticamente por PedidosNica</span>
              </div>
              <span class="font-mono font-bold text-[#06C167] text-sm" id="settCommissionRateDisplay">${currentCommissionRate}%</span>
            </div>

            <div class="pt-2">
              <button id="btnSaveStoreSettings" onclick="saveStoreSettings()" class="py-2.5 px-6 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs shadow-lg shadow-[#06C167]/20 transition-all">
                Guardar Cambios del Comercio
              </button>
            </div>
          </div>
        </section>

      </main>

    </div>

    <!-- ================================================================ -->
    <!-- MODAL 1: RECHAZAR PEDIDO -->
    <!-- ================================================================ -->
    <div id="modalRejectOrder" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#161616] border border-[#262626] rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-white">Rechazar Pedido</h3>
        <p class="text-xs text-[#A6A6A6]">Indica el motivo para notificar al cliente en la app:</p>
        
        <input type="hidden" id="rejectOrderId" value="" />
        <select id="rejectReasonSelect" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-xs text-white focus:outline-none">
          <option value="Falta de ingredientes clave">Falta de ingredientes clave</option>
          <option value="Cocina sobrecargada / Alta demanda">Cocina sobrecargada / Alta demanda</option>
          <option value="Problemas técnicos con el horno">Problemas técnicos con el horno</option>
          <option value="Horario de cierre alcanzado">Horario de cierre alcanzado</option>
        </select>

        <div class="flex justify-end gap-2 pt-2">
          <button onclick="closeRejectModal()" class="px-3.5 py-2 rounded-full bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-semibold">
            Cancelar
          </button>
          <button onclick="confirmRejectOrder()" class="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow">
            Confirmar Rechazo
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- MODAL 2: TICKET TÉRMICO DE COCINA (80MM) -->
    <!-- ================================================================ -->
    <div id="modalThermalTicket" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#161616] border border-[#262626] rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-2 border-b border-[#262626]">
          <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
            <span>🖨️</span> Ticket de Cocina 80mm
          </h3>
          <button onclick="closeThermalTicketModal()" class="text-[#A6A6A6] hover:text-white">✕</button>
        </div>

        <div id="printableThermalTicket" class="flex-1 overflow-y-auto bg-white text-black p-4 rounded-xl font-mono text-[11px] space-y-2 border border-slate-300">
          <!-- Generado dinámicamente -->
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button onclick="closeThermalTicketModal()" class="px-4 py-2 rounded-full bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-semibold">
            Cerrar
          </button>
          <button onclick="window.print()" class="px-5 py-2 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs shadow">
            🖨️ Imprimir Ticket
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- MODAL 3: CREAR / EDITAR PLATILLO O COMBO -->
    <!-- ================================================================ -->
    <div id="modalProductForm" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#161616] border border-[#262626] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-[#262626]">
          <h3 class="text-base font-bold text-white" id="prodModalTitle">Nuevo Platillo o Combo</h3>
          <button onclick="closeProductModal()" class="text-[#A6A6A6] hover:text-white">✕</button>
        </div>

        <form id="formProduct" onsubmit="saveProductItem(event)" class="space-y-4 text-xs">
          <input type="hidden" id="editProductId" value="" />

          <div>
            <label class="block font-bold text-white mb-1">Nombre del Platillo</label>
            <input type="text" id="pName" required placeholder="ej. Pizza Cuatro Quesos" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-white mb-1">Categoría</label>
              <select id="pCategory" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none">
                <option value="Especialidades">Especialidades</option>
                <option value="Pupusas">Pupusas</option>
                <option value="Asados">Asados</option>
                <option value="Antojitos">Antojitos</option>
                <option value="Pizzas">Pizzas</option>
                <option value="Hamburguesas">Hamburguesas</option>
                <option value="Combos">Combos 🔥</option>
                <option value="Entradas">Entradas</option>
                <option value="Postres">Postres</option>
                <option value="Bebidas">Bebidas</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-white mb-1">Precio Base (C$)</label>
              <input type="number" step="1" id="pPrice" required placeholder="150" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-[#06C167]" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-white mb-1">Precio Descuento (C$ Opcional)</label>
              <input type="number" step="1" id="pDiscount" placeholder="120" class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-[#06C167]" />
            </div>
            <div class="flex items-center pt-5">
              <label class="flex items-center gap-2 cursor-pointer text-white font-bold">
                <input type="checkbox" id="pIsCombo" class="w-4 h-4 rounded bg-black border-[#262626] text-[#06C167] focus:ring-0" />
                <span>¿Es un Combo?</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block font-bold text-white mb-1">Descripción</label>
            <textarea id="pDesc" rows="2" placeholder="Ingredientes, preparación..." class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]"></textarea>
          </div>

          <div>
            <label class="block font-bold text-white mb-1">URL de Foto</label>
            <input type="url" id="pImage" placeholder="https://images.unsplash.com/..." class="w-full bg-black border border-[#262626] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06C167]" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeProductModal()" class="px-4 py-2 rounded-full bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-semibold">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs shadow">
              Guardar Platillo
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- MODAL 4: PAUSAR STOCK TEMPORALMENTE -->
    <!-- ================================================================ -->
    <div id="modalPauseStock" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#161616] border border-[#262626] rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
        <h3 class="text-base font-bold text-white flex items-center gap-1.5">
          <span>⏸️</span> Pausar Stock
        </h3>
        <p class="text-[#A6A6A6]">¿Por cuánto tiempo deseas pausar <strong class="text-white" id="pauseProductName">este producto</strong> en la carta?</p>

        <div class="space-y-2">
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-black border border-[#262626] cursor-pointer hover:border-[#06C167]">
            <input type="radio" name="pauseDuration" value="1h" checked class="accent-[#06C167]" />
            <span class="text-white font-medium">Por 1 hora</span>
          </label>
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-black border border-[#262626] cursor-pointer hover:border-[#06C167]">
            <input type="radio" name="pauseDuration" value="today" class="accent-[#06C167]" />
            <span class="text-white font-medium">Por el resto del día</span>
          </label>
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-black border border-[#262626] cursor-pointer hover:border-[#06C167]">
            <input type="radio" name="pauseDuration" value="permanent" class="accent-[#06C167]" />
            <span class="text-white font-medium">Agotado indefinido</span>
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button onclick="closePauseStockModal()" class="px-4 py-2 rounded-full bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-semibold">
            Cancelar
          </button>
          <button onclick="confirmPauseStock()" class="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow">
            Confirmar Pausa
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- MODAL 5: PREVISUALIZAR PERSONALIZACIONES -->
    <!-- ================================================================ -->
    <div id="modalPreviewOptions" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#161616] border border-[#262626] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
        <div class="flex items-center justify-between pb-2 border-b border-[#262626]">
          <h3 class="text-base font-bold text-white" id="prevTitle">Personalización</h3>
          <button onclick="closePreviewModal()" class="text-[#A6A6A6] hover:text-white">✕</button>
        </div>

        <div id="prevContent" class="space-y-3 max-h-80 overflow-y-auto"></div>

        <div class="flex justify-between items-center pt-3 border-t border-[#262626]">
          <div>
            <span class="text-[10px] text-[#A6A6A6] block uppercase">Precio Simulado</span>
            <span id="prevDynamicPrice" class="text-base font-bold text-[#06C167] font-mono">C$ 0.00</span>
          </div>
          <button onclick="closePreviewModal()" class="px-5 py-2 rounded-full bg-[#06C167] text-black font-bold text-xs">
            Listo
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- MODAL 6: NIVELES DE USUARIO Y LOGIN DE RESTAURANTE (RBAC) -->
    <!-- ================================================================ -->
    <div id="modalRestaurantUserLevel" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#14161D] border-2 border-purple-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-[#262D3B]">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-purple-500/20 text-purple-300 text-lg">👥</span>
            <div>
              <h3 class="text-sm font-black text-white">Nivel de Usuario del Restaurante</h3>
              <p class="text-[10px] text-[#8A94A6]">Cambia de rol o administra tu cuenta</p>
            </div>
          </div>
          <button onclick="closeRestUserModal()" class="text-[#8A94A6] hover:text-white p-1 text-base">✕</button>
        </div>

        <p class="text-[11px] text-[#A6A6A6]">
          El sistema ofrece dos niveles de usuario diferenciados según las funciones en el local:
        </p>

        <!-- Selector Rápido de Nivel de Usuario -->
        <div class="space-y-2.5">
          
          <!-- Opción 1: Administrador / Dueño -->
          <div onclick="switchRestUserLevel('ADMIN')" id="cardRoleAdmin" class="p-3.5 rounded-2xl bg-[#1A1F2B] border-2 border-purple-500 hover:border-purple-400 cursor-pointer transition-all space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white flex items-center gap-1.5 text-xs">
                <span>👑</span> Roberto Morales (Dueño / Manager)
              </span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500 text-white">ADMIN</span>
            </div>
            <p class="text-[10px] text-purple-200/80">
              ✓ Control total: Configura nombre, teléfono, horarios, comisiones, precios de carta y comanda KDS.
            </p>
          </div>

          <!-- Opción 2: Operador de Cocina / Staff -->
          <div onclick="switchRestUserLevel('STAFF')" id="cardRoleStaff" class="p-3.5 rounded-2xl bg-[#12151D] border border-[#262D3B] hover:border-blue-500 cursor-pointer transition-all space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white flex items-center gap-1.5 text-xs">
                <span>👨‍🍳</span> Pedro Ruiz (Operador de Cocina)
              </span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">COCINA</span>
            </div>
            <p class="text-[10px] text-[#8A94A6]">
              ✓ Operación táctica: Acepta comandas, gestiona tiempos de preparación y despacha a repartidores. (Ajustes comerciales bloqueados).
            </p>
          </div>

        </div>

        <!-- Editar Nombre / Teléfono del Usuario Actual -->
        <div class="pt-3 border-t border-[#222938] space-y-2">
          <span class="text-[11px] font-bold text-white block">Editar mis Datos de Perfil:</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-0.5">Nombre Completo</label>
              <input type="text" id="restProfileNameInput" value="Roberto Morales" class="w-full bg-[#0D0F14] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
            </div>
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-0.5">Teléfono Directo</label>
              <input type="text" id="restProfilePhoneInput" value="+505 8833-4455" class="w-full bg-[#0D0F14] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
            </div>
          </div>
          <button onclick="saveRestUserProfile()" class="w-full py-2 rounded-xl bg-[#1F2430] hover:bg-[#06C167] text-white hover:text-black font-bold text-xs transition-colors">
            Guardar mis Datos de Perfil
          </button>
        </div>

        <!-- Información de Sucursal y Multigestión -->
        <div id="restModalMultiUnitNotice" class="p-3 rounded-2xl bg-[#0D0F14] border border-[#222938] space-y-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[#8A94A6]">Sucursal Activa:</span>
            <strong id="restModalStoreName" class="text-white">Pupusería & Antojitos El Diamante</strong>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#8A94A6]">Tipo de Cuenta:</span>
            <span id="restModalAccountType" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">Unidad Única</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-[#222938]">
          <button onclick="logoutRestaurant()" class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5">
            <span>🚪</span> Cerrar Sesión
          </button>
          <button onclick="closeRestUserModal()" class="px-4 py-2 rounded-xl bg-[#222] hover:bg-[#333] text-white font-bold text-xs">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST NOTIFICATIONS -->
    <div id="toastNotification" class="hidden fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#161616] border border-[#262626] shadow-2xl flex items-center gap-3 text-xs text-white max-w-sm transition-all transform duration-300">
      <span class="text-2xl" id="toastIcon">🔔</span>
      <div>
        <p class="font-bold text-white" id="toastTitle">Notificación</p>
        <p class="text-[11px] text-[#A6A6A6]" id="toastMessage">Detalle del mensaje</p>
      </div>
    </div>

  </div>

  <script src="/restaurant/client.js"></script>

  ${getFooter()}`;
}

module.exports = {
  renderRestaurantApp
};
