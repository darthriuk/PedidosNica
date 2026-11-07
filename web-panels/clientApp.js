// ============================================================================
// UBER EATS CLIENT APP TEMPLATE - RESPONSIVE PARA PHONES, IPADS/TABLETS Y WEB
// ============================================================================

function renderClientApp(initialView = 'catalog', options = {}) {
  const {
    SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co',
    SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w',
    getHeader,
    getFooter
  } = options;

  return `${getHeader('PedidosNica | Comida a Domicilio')}

  <div id="clientAppRoot" data-initial-view="${initialView}" class="min-h-screen flex flex-col bg-black text-white antialiased selection:bg-[#06C167] selection:text-black pb-28 sm:pb-0">

    <!-- TOPBAR PEDIDOSNICA (RESPONSIVE: PHONE, TABLET & DESKTOP - BOTONES GRANDES Y ERGONÓMICOS) -->
    <header class="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-[#262626] px-3 sm:px-6 py-3 transition-all">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        <!-- Logo PedidosNica + Selector de Dirección Activa (Estilo Uber Eats / Rappi) -->
        <div class="flex items-center gap-2.5 sm:gap-4 shrink-0 min-w-0">
          <a href="/client" class="flex items-center gap-1 shrink-0 group py-1">
            <span class="font-extrabold text-xl sm:text-2xl tracking-tighter text-white">Pedidos</span>
            <span class="font-black text-xl sm:text-2xl tracking-tighter text-[#06C167]">Nica</span>
          </a>

          <button type="button" id="headerAddressBtn" onclick="openClientProfileModal('addresses')" class="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-2xl bg-[#1F1F1F] hover:bg-[#282828] border border-[#2E2E2E] hover:border-[#06C167]/60 transition-all max-w-[190px] sm:max-w-[290px] text-left group active:scale-95" title="Cambiar o agregar dirección de entrega">
            <span class="text-[#06C167] text-base shrink-0">📍</span>
            <div class="truncate">
              <span class="text-[10px] uppercase tracking-wider text-[#8A94A6] font-extrabold block leading-none mb-0.5">Entregar en</span>
              <span id="headerAddressLabel" class="text-xs sm:text-sm font-extrabold text-white group-hover:text-[#06C167] truncate block leading-tight">Galerías Santo Domingo, Managua</span>
            </div>
            <span class="text-xs text-[#06C167] shrink-0">▼</span>
          </button>
        </div>

        <!-- Buscador Central Unificado (Tablet & Desktop) -->
        <div class="hidden md:flex flex-1 max-w-md mx-2">
          <div class="relative w-full">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#757575] text-base">🔍</span>
            <input 
              type="text" 
              id="searchInputDesktop" 
              oninput="handleSearch(this.value)" 
              placeholder="Buscar restaurantes, pupusas, asados, pizzas..." 
              class="w-full bg-[#1F1F1F] hover:bg-[#262626] border border-[#2E2E2E] focus:border-[#06C167] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-[#757575] focus:outline-none transition-all"
            />
          </div>
        </div>

        <!-- Acciones Derecha: Rastrear Pedido, Carrito y Perfil -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          
          <!-- Botón Instalar App (PWA WebAPK) -->
          <button id="floatingInstallBtn" onclick="triggerPWAInstall()" class="hidden sm:flex px-3.5 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-extrabold bg-[#06C167]/15 hover:bg-[#06C167]/25 border border-[#06C167]/40 text-[#06C167] transition-all items-center gap-1.5 active:scale-95">
            <span class="text-base">📲</span>
            <span>Instalar</span>
          </button>

          <!-- Botón Rastrear Pedido en Vivo -->
          <button id="navTrackingBtn" onclick="toggleTrackingView()" class="px-3.5 sm:px-4 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-extrabold bg-[#1F1F1F] hover:bg-[#282828] border border-[#2E2E2E] text-white transition-all flex items-center gap-2 relative active:scale-95">
            <span class="text-base">🧾</span>
            <span class="hidden sm:inline">Pedidos</span>
            <span id="activeOrderBadge" class="hidden w-3 h-3 rounded-full bg-[#06C167] animate-ping absolute -top-1 -right-1"></span>
          </button>

          <!-- Botón Carrito Flotante (Uber Eats Verde) -->
          <button id="cartBtn" onclick="toggleCartDrawer(true)" class="px-4 sm:px-5 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-black bg-[#06C167] hover:bg-[#05A357] text-black shadow-lg shadow-[#06C167]/25 transition-all flex items-center gap-2 transform active:scale-95">
            <span class="text-base">🛒</span>
            <span id="cartCountBadge" class="bg-black text-[#06C167] font-mono text-xs px-2 py-0.5 rounded-full font-black">0</span>
            <span id="cartTotalHeader" class="hidden md:inline font-mono font-black text-sm">C$ 0.00</span>
          </button>

          <!-- Perfil del Comensal / Cliente -->
          <button onclick="openClientProfileModal()" class="flex items-center gap-2 pl-1.5 sm:pl-2.5 py-1 min-h-[44px] border-l border-[#262626] hover:opacity-80 transition-opacity cursor-pointer text-left active:scale-95">
            <img id="clientHeaderAvatar" src="https://ui-avatars.com/api/?name=Comensal&background=1F1F1F&color=06C167&bold=true" alt="Mi Cuenta" class="w-10 h-10 rounded-full object-cover border-2 border-[#06C167]/70" />
            <div class="hidden lg:block">
              <span id="clientHeaderName" class="text-sm font-extrabold text-white block">Iniciar Sesión</span>
              <span id="clientHeaderSublabel" class="text-xs text-[#06C167] font-bold block">Invitado • Entrar ▼</span>
            </div>
          </button>

          <!-- Volver al Hub general -->
          <a href="/" title="Volver al Selector de Portales" class="w-11 h-11 rounded-2xl bg-[#1F1F1F] hover:bg-[#282828] border border-[#2E2E2E] text-[#A6A6A6] hover:text-white transition-colors text-base flex items-center justify-center active:scale-95">
            🏠
          </a>
        </div>

      </div>

      <!-- Buscador en Teléfonos (Mobile Input Bar Grande y Fácil de Tocar) -->
      <div class="mt-3 md:hidden">
        <div class="relative w-full">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#757575] text-base">🔍</span>
          <input 
            type="text" 
            id="searchInputMobile" 
            oninput="handleSearch(this.value)" 
            placeholder="Buscar restaurantes, pupusas, asados, pizzas..." 
            class="w-full bg-[#1F1F1F] border border-[#2E2E2E] focus:border-[#06C167] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-[#757575] focus:outline-none"
          />
        </div>
      </div>
    </header>
 
    <!-- BANNER DE INSTALACIÓN RÁPIDA PARA SMARTPHONES (PEDIDOSNICA PWA/WEBAPK) -->
    <div id="mobileInstallPromptBanner" class="bg-gradient-to-r from-[#06C167]/15 via-[#161616] to-[#121212] border-b border-[#06C167]/30 px-4 py-3 flex items-center justify-between gap-3 sm:hidden">
      <div class="flex items-center gap-3 min-w-0">
        <img src="/icon-192.png" alt="PedidosNica" class="w-10 h-10 rounded-xl shrink-0 border border-[#06C167]/50" />
        <div class="truncate">
          <p class="font-extrabold text-white text-sm truncate">PedidosNica App</p>
          <p class="text-xs text-[#A6A6A6]">Pantalla completa y acceso rápido</p>
        </div>
      </div>
      <button onclick="triggerPWAInstall()" class="shrink-0 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs sm:text-sm shadow-md shadow-[#06C167]/30 flex items-center gap-1.5 active:scale-95 transition-all">
        <span>📲 Instalar</span>
      </button>
    </div>

    <!-- VISTA PRINCIPAL: CATÁLOGO DE MENÚ (RESPONSIVE GRID) -->
    <main id="catalogView" class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 transition-opacity">
      
      <!-- HERO DINÁMICO: BANNER DE RESTAURANTE O MARKETPLACE -->
      <section id="heroContainer" class="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#262626] bg-[#121212] mb-6 sm:mb-8 shadow-xl">
        <!-- Renderizado dinámico desde script.js -->
        <div class="h-36 sm:h-56 md:h-64 w-full relative bg-gradient-to-r from-zinc-900 via-neutral-900 to-black flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-[#06C167] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>

      <!-- SECCIÓN 1: PLATILLOS RECOMENDADOS (FEATURED DISHES) -->
      <section id="recommendedSection" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span class="text-yellow-400">⭐</span> Recomendados para Ti
            </h2>
            <p class="text-xs sm:text-sm text-[#A6A6A6] mt-0.5">Los favoritos mejor calificados y más pedidos en Managua</p>
          </div>
        </div>
        <div id="recommendedGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Renderizado dinámico desde clientFront.js -->
        </div>
      </section>

      <!-- SECCIÓN 2: LISTA DE RESTAURANTES (RESTAURANTS MARKETPLACE) -->
      <section id="restaurantsSection" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🏪</span> Restaurantes Populares
            </h2>
            <p class="text-xs sm:text-sm text-[#A6A6A6] mt-0.5">Pide directo de tus marcas y cocinas favoritas</p>
          </div>
        </div>
        <div id="restaurantsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Renderizado dinámico desde clientFront.js -->
        </div>
      </section>

      <!-- BARRA DE CATEGORÍAS (UBER EATS HORIZONTAL PILLS CON SNAP SCROLL - BOTONES GRANDES) -->
      <section class="sticky top-[68px] sm:top-[72px] z-30 bg-black/95 backdrop-blur-md py-3 border-b border-[#262626] mb-6">
        <div id="categoriesList" class="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          <button onclick="filterCategory('Todos')" class="category-pill active px-5 py-3 min-h-[46px] rounded-2xl text-sm font-black transition-all bg-[#06C167] text-black shrink-0 snap-start shadow-sm">
            🔥 Todos
          </button>
        </div>
      </section>

      <!-- HEADER DE SECCIÓN DE PRODUCTOS O RESULTADOS -->
      <div id="productsSectionHeader" class="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 id="productsSectionTitle" class="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <span>🍽️</span> Platillos y Comidas
        </h3>
        <span id="activeFilterBadge" class="text-sm text-[#A6A6A6]"></span>
      </div>

      <!-- GRILLA DE PRODUCTOS (UBER EATS CARDS: 1 COL EN PHONE, 2 EN TABLET, 3 EN DESKTOP) -->
      <section>
        <div id="productsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div class="col-span-full py-16 text-center text-[#757575] flex flex-col items-center">
            <div class="w-9 h-9 border-2 border-[#06C167] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-sm font-semibold">Cargando menú en vivo desde Supabase...</p>
          </div>
        </div>
      </section>

    </main>

    <!-- VISTA SECUNDARIA: SEGUIMIENTO EN VIVO Y MAPA (UBER EATS LIVE TRACKING) -->
    <main id="trackingView" class="hidden flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
      
      <!-- Top header del tracking -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#262626]">
        <div>
          <button onclick="toggleTrackingView(false)" class="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#1F1F1F] hover:bg-[#282828] border border-[#2E2E2E] text-sm font-black text-[#06C167] flex items-center gap-2 mb-2 active:scale-95 transition-all">
            <span>←</span>
            <span>Volver al Menú</span>
          </button>
          <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 flex-wrap">
            Seguimiento de tu Entrega
            <span id="trackingLiveBadge" class="text-xs font-bold px-3 py-1 rounded-full bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-pulse"></span> En Vivo
            </span>
          </h2>
        </div>

        <div class="text-right bg-[#121212] border border-[#262626] px-4 py-2.5 rounded-2xl">
          <span class="text-xs text-[#A6A6A6] block font-semibold">ID de Pedido</span>
          <span id="trackingOrderId" class="font-mono text-sm sm:text-base text-white font-black tracking-wider">#----</span>
        </div>
      </div>

      <!-- Layout Responsive del Tracking (Stack en Mobile, 2 Cols en iPad & Desktop) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        
        <!-- COLUMNA IZQUIERDA: ESTADO, PROGRESS BAR Y REPARTIDOR (5 Cols) -->
        <div class="lg:col-span-5 space-y-4 sm:space-y-6 order-2 lg:order-1">
          
          <!-- TARJETA DE ESTADO ACTUAL ESTILO UBER EATS -->
          <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#121212] border border-[#262626] shadow-xl relative overflow-hidden">
            <div id="statusPulseGlow" class="absolute -top-10 -right-10 w-32 h-32 bg-[#06C167]/15 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3.5 sm:gap-4 mb-4">
              <div id="statusIconBox" class="w-14 h-14 rounded-2xl bg-[#06C167]/10 border border-[#06C167]/30 flex items-center justify-center text-3xl shrink-0">
                👨‍🍳
              </div>
              <div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-[#06C167] font-mono" id="statusSubhead">ESTADO ACTUAL</span>
                <h3 id="statusMainText" class="text-xl sm:text-2xl font-black text-white leading-tight">Preparando tu Pedido</h3>
                <p id="statusTimeEstimate" class="text-sm text-[#A6A6A6] mt-0.5">Llegada estimada: ~20-30 mins</p>
              </div>
            </div>

            <!-- BARRA DE PROGRESO UBER EATS (5 ETAPAS) -->
            <div class="space-y-3.5 pt-4 border-t border-[#262626]">
              
              <div class="timeline-step flex items-start gap-3.5" data-step="CREATED">
                <div class="step-dot w-7 h-7 rounded-full bg-[#06C167] text-black font-black text-xs flex items-center justify-center shrink-0">✓</div>
                <div>
                  <h4 class="text-sm font-bold text-white">Pedido Recibido</h4>
                  <p class="text-xs text-[#A6A6A6]">Registrado en el sistema.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3.5" data-step="IN_PREPARATION">
                <div class="step-dot w-7 h-7 rounded-full bg-[#262626] text-[#A6A6A6] font-black text-xs flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 class="text-sm font-bold text-[#A6A6A6]">En la Cocina</h4>
                  <p id="trackingRestPrepText" class="text-xs text-[#A6A6A6]">El restaurante está horneando tus platos.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3.5" data-step="READY_FOR_PICKUP">
                <div class="step-dot w-7 h-7 rounded-full bg-[#262626] text-[#A6A6A6] font-black text-xs flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 class="text-sm font-bold text-[#A6A6A6]">Listo para Retiro</h4>
                  <p class="text-xs text-[#A6A6A6]">Empaquetado y listo para entregar al repartidor.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3.5" data-step="DRIVER_ASSIGNED">
                <div class="step-dot w-7 h-7 rounded-full bg-[#262626] text-[#A6A6A6] font-black text-xs flex items-center justify-center shrink-0">4</div>
                <div>
                  <h4 class="text-sm font-bold text-[#A6A6A6]">Repartidor en Camino</h4>
                  <p class="text-xs text-[#A6A6A6]">Motorizado asignado con navegación GPS.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3.5" data-step="DELIVERED">
                <div class="step-dot w-7 h-7 rounded-full bg-[#262626] text-[#A6A6A6] font-black text-xs flex items-center justify-center shrink-0">5</div>
                <div>
                  <h4 class="text-sm font-bold text-[#A6A6A6]">¡Pedido Entregado!</h4>
                  <p class="text-xs text-[#A6A6A6]">¡Que lo disfrutes mucho!</p>
                </div>
              </div>

            </div>

            <button id="btnCancelClientOrder" onclick="cancelActiveClientOrder()" class="hidden w-full py-3.5 min-h-[48px] rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-sm font-black mt-4 active:scale-95 transition-all">✕ Cancelar Pedido (Aún no aceptado)</button>
          </div>

          <!-- TARJETA DEL REPARTIDOR ASIGNADO (UBER EATS COURIER CARD) -->
          <div id="driverCard" class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#121212] border border-[#262626] shadow-xl">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-[#A6A6A6] mb-3.5 flex items-center justify-between">
              <span>Tu Repartidor</span>
              <span id="driverStatusTag" class="text-xs text-[#06C167] font-mono bg-[#06C167]/10 px-2.5 py-1 rounded-lg border border-[#06C167]/25 font-bold">Asignando...</span>
            </h4>

            <div class="flex items-center gap-3.5 sm:gap-4">
              <img id="driverAvatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" alt="Repartidor" class="w-14 h-14 rounded-full object-cover border-2 border-[#06C167]/50" />
              <div class="flex-1 min-w-0">
                <h5 id="driverName" class="text-base font-extrabold text-white truncate">Martín Rivas</h5>
                <p id="driverVehicle" class="text-xs sm:text-sm text-[#A6A6A6] truncate">Moto Honda CG 150 • A123BCD</p>
                <div class="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                  <span id="driverRating" class="font-bold text-[#06C167]">⭐ 4.95</span>
                  <span class="text-[#262626]">•</span>
                  <span class="text-[#757575]">1,240 entregas</span>
                </div>
              </div>
              <button id="btnCallAssignedDriver" onclick="callAssignedDriver()" class="hidden px-4 py-3 min-h-[46px] rounded-2xl bg-[#06C167] text-black font-black text-sm shrink-0 shadow-lg active:scale-95 transition-all">📞 Llamar</button>
            </div>

            <!-- PIN DE ENTREGA SEGURA -->
            <div class="mt-4 p-3.5 rounded-2xl bg-black border border-[#262626] flex items-center justify-between">
              <div>
                <span class="text-xs text-[#A6A6A6] block font-semibold">PIN de Seguridad al recibir:</span>
                <span class="text-xs sm:text-sm text-white font-bold">Díctale este código al repartidor</span>
              </div>
              <div class="px-4 py-2 rounded-xl bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 font-mono font-black text-base tracking-widest">
                4829
              </div>
            </div>
          </div>

          <!-- RESUMEN DE PRODUCTOS -->
          <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#121212] border border-[#262626] shadow-xl">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-[#A6A6A6] mb-3">Detalle del Pedido</h4>
            <div id="trackingItemsList" class="space-y-2.5 text-sm divide-y divide-[#262626]">
              <!-- Renderizado dinámico -->
            </div>
            <div class="pt-3.5 mt-3.5 border-t border-[#262626] flex justify-between items-center text-base font-black text-white">
              <span>Total Pagado</span>
              <span id="trackingTotalAmount" class="text-[#06C167] font-mono text-lg">C$ 0.00</span>
            </div>
          </div>

          <!-- RESEÑA / REVIEW MODAL CARD -->
          <div id="reviewCard" class="hidden p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#06C167]/10 via-[#121212] to-[#121212] border border-[#06C167]/30 shadow-2xl">
            <div class="flex items-center gap-2 mb-2 text-[#06C167]">
              <span class="text-2xl">⭐</span>
              <h4 class="text-lg font-black text-white">¿Cómo estuvo tu comida?</h4>
            </div>
            <p id="trackingReviewRestText" class="text-xs sm:text-sm text-[#A6A6A6] mb-4">Califica tu experiencia con el restaurante.</p>

            <div class="flex items-center gap-3 mb-4" id="starSelector">
              <button onclick="setReviewRating(1)" class="star-btn text-3xl p-1.5 text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(2)" class="star-btn text-3xl p-1.5 text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(3)" class="star-btn text-3xl p-1.5 text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(4)" class="star-btn text-3xl p-1.5 text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(5)" class="star-btn text-3xl p-1.5 text-[#06C167] hover:text-[#06C167] transition-colors">★</button>
            </div>

            <textarea id="reviewComment" rows="2" placeholder="Escribe un comentario sobre el pedido..." class="w-full bg-black border border-[#2E2E2E] rounded-2xl p-3.5 text-sm text-white placeholder-[#757575] focus:outline-none focus:border-[#06C167] mb-3.5"></textarea>

            <button onclick="submitReview()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm shadow-lg shadow-[#06C167]/20 transition-all active:scale-95">
              Enviar Calificación
            </button>
          </div>

        </div>

        <!-- COLUMNA DERECHA: MAPA INTERACTIVO (7 Cols) -->
        <div class="lg:col-span-7 order-1 lg:order-2">
          <div class="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#262626] bg-[#121212] shadow-2xl flex flex-col h-[340px] sm:h-[440px] lg:h-[680px] relative">
            
            <div class="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <div class="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#2E2E2E] text-xs font-bold text-white pointer-events-auto flex items-center gap-2 shadow">
                <span class="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-ping"></span>
                <span>Telemetría en Vivo</span>
              </div>

              <div class="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#2E2E2E] text-xs sm:text-sm font-mono font-black text-[#06C167] pointer-events-auto shadow">
                <span id="mapEtaBadge">ETA: ~18 min</span>
              </div>
            </div>

            <div id="trackingMap" class="w-full h-full"></div>

            <div class="p-3 bg-black/90 border-t border-[#262626] flex items-center justify-around text-xs sm:text-sm text-[#A6A6A6] font-semibold">
              <span class="flex items-center gap-1.5"><span>🏪</span> <span id="mapLegendRestName">Restaurante</span></span>
              <span class="flex items-center gap-1.5"><span>🛵</span> Repartidor</span>
              <span class="flex items-center gap-1.5"><span>📍</span> Tu Domicilio</span>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- MODAL DE PERSONALIZACIÓN DE PRODUCTO (BOTTOM SHEET EN PHONE, MODAL EN TABLET & WEB) -->
    <div id="productModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="bg-[#121212] border-t sm:border border-[#262626] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <!-- Drag Handle para Celulares -->
        <div class="sm:hidden w-14 h-1.5 bg-[#383838] rounded-full mx-auto my-2.5 shrink-0"></div>

        <!-- Header con imagen del Producto -->
        <div class="relative h-48 sm:h-56 w-full bg-black shrink-0">
          <img id="modalProductImage" src="" alt="Producto" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
          <button onclick="closeProductModal()" class="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/80 hover:bg-black border border-white/20 text-white flex items-center justify-center text-lg font-bold transition-colors shadow-xl active:scale-95">
            ✕
          </button>
        </div>

        <!-- Contenido Scrolleable -->
        <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <div class="flex items-start justify-between gap-3">
              <h3 id="modalProductName" class="text-xl sm:text-2xl font-black text-white leading-snug">Nombre del Producto</h3>
              <span id="modalProductBasePrice" class="text-lg sm:text-xl font-black text-[#06C167] font-mono shrink-0">C$ 0.00</span>
            </div>
            <p id="modalProductDesc" class="text-sm text-[#A6A6A6] mt-1.5 leading-relaxed">Descripción detallada.</p>
          </div>

          <!-- Opciones Dinámicas -->
          <div id="modalCustomizationGroups" class="space-y-4"></div>

          <!-- Notas para el restaurante -->
          <div class="pt-1">
            <label class="block text-sm font-bold text-white mb-1.5">Aclaraciones especiales (Opcional):</label>
            <input type="text" id="modalSpecialNotes" placeholder="ej. Sin orégano, bien dorada..." class="w-full bg-black border border-[#2E2E2E] focus:border-[#06C167] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#757575] focus:outline-none" />
          </div>
        </div>

        <!-- Barra Inferior de Acción (Touch-Friendly 52px+) -->
        <div class="p-4 bg-black border-t border-[#262626] flex items-center justify-between gap-3 safe-area-bottom">
          <!-- Stepper de Cantidad Grande -->
          <div class="flex items-center bg-[#1F1F1F] border border-[#2E2E2E] rounded-2xl p-1.5 shrink-0">
            <button onclick="changeModalQty(-1)" class="w-11 h-11 rounded-xl bg-[#282828] hover:bg-[#333333] flex items-center justify-center text-xl font-black text-white active:scale-95 transition-transform">-</button>
            <span id="modalQtyDisplay" class="w-10 text-center text-base font-black font-mono text-white">1</span>
            <button onclick="changeModalQty(1)" class="w-11 h-11 rounded-xl bg-[#282828] hover:bg-[#333333] flex items-center justify-center text-xl font-black text-white active:scale-95 transition-transform">+</button>
          </div>

          <!-- Botón Verde Uber Eats Grande -->
          <button id="modalAddToCartBtn" onclick="confirmAddToCart()" class="flex-1 py-4 px-5 min-h-[52px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm sm:text-base shadow-lg shadow-[#06C167]/25 transition-all flex items-center justify-between active:scale-95">
            <span>Agregar al Carrito</span>
            <span id="modalTotalCalculated" class="font-mono text-base font-black">C$ 0.00</span>
          </button>
        </div>

      </div>
    </div>

    <!-- DRAWER DEL CARRITO / CHECKOUT (RESPONSIVE: BOTTOM SHEET EN MOBILE, DRAWER EN TABLET & WEB) -->
    <div id="cartDrawerBackdrop" onclick="toggleCartDrawer(false)" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden transition-opacity"></div>
    <div id="cartDrawer" class="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] bg-[#121212] border-l border-[#262626] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      
      <!-- Header Carrito -->
      <div class="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-black">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">🛒</span>
          <h3 class="font-black text-lg text-white">Tu Pedido</h3>
          <span id="cartDrawerCount" class="text-xs font-mono bg-[#06C167]/15 text-[#06C167] px-2.5 py-1 rounded-full font-extrabold">0 ítems</span>
        </div>
        <button onclick="toggleCartDrawer(false)" class="w-10 h-10 rounded-full text-white bg-[#1F1F1F] hover:bg-[#282828] flex items-center justify-center text-base font-bold transition-colors active:scale-95">
          ✕
        </button>
      </div>

      <!-- Lista de Ítems -->
      <div id="cartItemsList" class="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3"></div>

      <!-- Configuración y Totales -->
      <div class="p-4 sm:p-5 bg-black border-t border-[#262626] space-y-3.5 safe-area-bottom overflow-y-auto max-h-[65vh]">
        
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-extrabold text-[#A6A6A6] uppercase tracking-wider">Dirección de Entrega</label>
            <button type="button" onclick="toggleCartDrawer(false); openClientProfileModal('addresses');" class="px-2.5 py-1 rounded-lg bg-[#06C167]/15 text-xs font-black text-[#06C167] hover:underline flex items-center gap-1">
              <span>+ Mis Direcciones</span>
            </button>
          </div>
          <select id="cartSavedAddressSelect" onchange="handleCartAddressSelectChange(this.value)" class="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#06C167] rounded-2xl px-3.5 py-3 text-sm text-white focus:outline-none">
            <option value="">📍 Seleccionar de mis direcciones guardadas...</option>
          </select>
          <div class="flex items-center gap-2.5 bg-[#1A1A1A] border border-[#2E2E2E] focus-within:border-[#06C167] rounded-2xl px-3.5 py-3 text-sm text-white">
            <span class="text-[#06C167] text-base">📍</span>
            <input type="text" id="cartDeliveryAddress" value="Galerías Santo Domingo, Managua" placeholder="Dirección exacta de entrega..." class="bg-transparent flex-1 focus:outline-none text-sm text-white" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-extrabold text-[#A6A6A6] uppercase tracking-wider mb-1">Teléfono Contacto</label>
            <div class="flex items-center gap-2 bg-[#1A1A1A] border border-[#2E2E2E] focus-within:border-[#06C167] rounded-2xl px-3.5 py-3 text-sm text-white">
              <span class="text-[#06C167] text-sm">📞</span>
              <input type="text" id="cartClientPhone" placeholder="+505 8888-0000" class="bg-transparent w-full focus:outline-none text-sm text-white" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-[#A6A6A6] uppercase tracking-wider mb-1">Notas / Referencia</label>
            <input type="text" id="cartDeliveryNotes" placeholder="ej. Portón negro, llamar..." class="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#06C167] rounded-2xl px-3.5 py-3 text-sm text-white placeholder-[#757575] focus:outline-none" />
          </div>
        </div>

        <!-- Método de Pago -->
        <div>
          <label class="block text-xs font-extrabold text-[#A6A6A6] uppercase tracking-wider mb-1.5">Forma de Pago</label>
          <div class="grid grid-cols-3 gap-2 text-xs sm:text-sm">
            <button type="button" onclick="selectPaymentMethod('CASH')" class="payment-method-btn active py-3 px-2 min-h-[48px] rounded-2xl bg-[#06C167]/15 border-2 border-[#06C167] text-[#06C167] font-extrabold text-center active:scale-95 transition-all" data-method="CASH">
              💵 Efectivo (C$)
            </button>
            <button type="button" onclick="selectPaymentMethod('CARD')" class="payment-method-btn py-3 px-2 min-h-[48px] rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#A6A6A6] hover:text-white font-bold text-center active:scale-95 transition-all" data-method="CARD">
              💳 Tarjeta
            </button>
            <button type="button" onclick="selectPaymentMethod('WALLET')" class="payment-method-btn py-3 px-2 min-h-[48px] rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#A6A6A6] hover:text-white font-bold text-center active:scale-95 transition-all" data-method="WALLET">
              📱 Billetera
            </button>
          </div>
        </div>

        <!-- Cupón Promocional -->
        <div>
          <label class="block text-xs font-extrabold text-[#A6A6A6] uppercase tracking-wider mb-1.5">Cupón Promocional</label>
          <div class="flex items-center gap-2">
            <input type="text" id="cartPromoInput" placeholder="Código: NICA20 o ENVIOGRATIS" class="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#06C167] rounded-2xl px-3.5 py-3 text-sm text-white uppercase placeholder-[#757575] focus:outline-none" />
            <button type="button" onclick="applyPromoCode()" class="px-4 py-3 min-h-[46px] rounded-2xl bg-[#06C167]/15 hover:bg-[#06C167]/25 text-[#06C167] border border-[#06C167]/30 font-extrabold text-sm transition-colors shrink-0 active:scale-95">
              Aplicar
            </button>
          </div>
        </div>

        <!-- Resumen de Pago -->
        <div class="space-y-2 pt-2.5 border-t border-[#262626] text-sm">
          <div class="text-xs font-extrabold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>🧾</span> Resumen de Pago
          </div>
          <div class="flex justify-between text-[#A6A6A6]">
            <span>Subtotal de productos</span>
            <span id="cartSubtotal" class="font-mono text-white font-semibold">C$ 0.00</span>
          </div>
          <div id="cartDiscountRow" class="hidden flex justify-between text-[#06C167] font-bold">
            <span>Descuento Cupón</span>
            <span id="cartDiscountAmount">-C$ 0.00</span>
          </div>
          <div class="flex justify-between text-[#A6A6A6]">
            <span>Costo de envío</span>
            <span id="cartDeliveryFee" class="font-mono text-[#06C167] font-semibold">C$ 0.00</span>
          </div>
          <div class="flex justify-between text-[#A6A6A6]">
            <span>Tarifa de servicio</span>
            <span id="cartServiceFee" class="font-mono text-white font-semibold">C$ 15.00</span>
          </div>
          <div class="flex justify-between items-center text-base font-black text-white pt-2.5 border-t border-[#262626]">
            <span>Total a pagar</span>
            <span id="cartTotalFinal" class="font-mono text-[#06C167] text-lg">C$ 0.00</span>
          </div>
        </div>

        <button id="checkoutBtn" onclick="submitOrder()" class="w-full py-4 min-h-[54px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-base shadow-xl shadow-[#06C167]/25 transition-all flex items-center justify-center gap-2 active:scale-95">
          <span>Hacer Pedido</span>
          <span class="text-lg">→</span>
        </button>

      </div>

    </div>

    <!-- BOTTOM NAVIGATION BAR (EXCLUSIVA PARA SMARTPHONES & TABLETS - BOTONES GRANDES SIN OBSTRUCCIÓN) -->
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#262626] px-2 py-2 sm:hidden grid grid-cols-5 gap-1 text-center safe-area-bottom shadow-2xl">
      <button onclick="toggleTrackingView(false)" class="flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] rounded-2xl text-[#06C167] hover:bg-[#1F1F1F] active:scale-95 transition-all">
        <span class="text-xl leading-none">🏠</span>
        <span class="text-xs font-extrabold">Inicio</span>
      </button>

      <button onclick="toggleTrackingView(false); setTimeout(() => document.getElementById('searchInputMobile')?.focus(), 100);" class="flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] rounded-2xl text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F] active:scale-95 transition-all">
        <span class="text-xl leading-none">🔍</span>
        <span class="text-xs font-bold">Buscar</span>
      </button>

      <button onclick="toggleCartDrawer(true)" class="flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] rounded-2xl text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F] relative active:scale-95 transition-all">
        <span class="text-xl leading-none">🛒</span>
        <span class="text-xs font-bold">Carrito</span>
        <span id="mobileBottomCartBadge" class="absolute top-1 right-3 bg-[#06C167] text-black text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">0</span>
      </button>

      <button onclick="toggleTrackingView(true)" class="flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] rounded-2xl text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F] relative active:scale-95 transition-all">
        <span class="text-xl leading-none">🧾</span>
        <span class="text-xs font-bold">Pedidos</span>
        <span id="mobileBottomTrackingDot" class="hidden absolute top-1.5 right-4 w-2.5 h-2.5 rounded-full bg-[#06C167]"></span>
      </button>

      <button onclick="openClientProfileModal()" class="flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] rounded-2xl text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F] active:scale-95 transition-all">
        <span class="text-xl leading-none">👤</span>
        <span class="text-xs font-bold">Cuenta</span>
      </button>
    </nav>

  </div>

  <audio id="orderNotificationAudio" preload="auto">
    <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg">
  </audio>

  
    <!-- ================================================================ -->
    <!-- MODAL: CENTRO DE CUENTA, LIBRETA DE DIRECCIONES Y SEGURIDAD      -->
    <!-- ================================================================ -->
    <div id="modalClientProfile" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div id="clientProfileModal" class="bg-[#14161D] border-2 border-[#06C167]/40 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-sm max-h-[92vh] flex flex-col">
        
        <!-- Header del Modal -->
        <div class="flex items-center justify-between pb-3 border-b border-[#262D3B] shrink-0">
          <div class="flex items-center gap-3">
            <span class="p-2.5 rounded-2xl bg-[#06C167]/20 text-[#06C167] text-xl">👤</span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-white">Centro de Cuenta y Seguridad</h3>
              <p class="text-xs text-[#8A94A6]">Direcciones, perfil, pedidos y recuperación de cuenta</p>
            </div>
          </div>
          <button onclick="closeClientProfileModal()" class="w-10 h-10 rounded-full text-white bg-[#1F2430] hover:bg-[#2A3142] flex items-center justify-center text-base font-bold active:scale-95 transition-all">✕</button>
        </div>

        <!-- Barra de 4 Pestañas (2x2 en móviles pequeños, 4 columnas en pantallas medianas) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-[#0D0F14] border border-[#262D3B] rounded-2xl text-xs sm:text-sm shrink-0">
          <button id="tabBtnAddresses" onclick="switchClientModalTab('addresses')" class="py-2.5 px-2.5 min-h-[42px] rounded-xl font-black bg-[#06C167] text-black transition-all truncate">
            📍 Direcciones
          </button>
          <button id="tabBtnProfile" onclick="switchClientModalTab('profile')" class="py-2.5 px-2.5 min-h-[42px] rounded-xl font-bold text-[#8A94A6] hover:text-white transition-all truncate">
            👤 Perfil y Tel.
          </button>
          <button id="tabBtnOrders" onclick="switchClientModalTab('orders')" class="py-2.5 px-2.5 min-h-[42px] rounded-xl font-bold text-[#8A94A6] hover:text-white transition-all truncate">
            📦 Mis Pedidos
          </button>
          <button id="tabBtnAuth" onclick="switchClientModalTab('auth')" class="py-2.5 px-2.5 min-h-[42px] rounded-xl font-bold text-[#8A94A6] hover:text-white transition-all truncate">
            🔐 Acceso / Reset
          </button>
        </div>

        <!-- Contenedor Scrolleable de Contenido -->
        <div class="flex-1 overflow-y-auto space-y-4 pr-1">
          
          <!-- ========================================================== -->
          <!-- PESTAÑA 1: LIBRETA DE MÚLTIPLES DIRECCIONES (ESTILO UBER)  -->
          <!-- ========================================================== -->
          <div id="clientModalTabAddresses" class="space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h4 class="text-sm sm:text-base font-black text-white">📍 Mis Direcciones de Entrega</h4>
                <p class="text-xs text-[#8A94A6]">Alterna entre Casa, Oficina o Familia con 1 toque</p>
              </div>
              <button type="button" onclick="openAddressBookForm()" class="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs sm:text-sm shadow transition-all shrink-0 active:scale-95">
                + Nueva Dirección
              </button>
            </div>

            <!-- Lista Dinámica de Direcciones Guardadas del Usuario -->
            <div id="clientSavedAddressesList" class="space-y-3">
              <!-- Renderizado dinámico por renderClientAddressBook() -->
            </div>

            <!-- Formulario para Agregar / Editar una Dirección en la Libreta -->
            <div id="clientAddressFormBox" class="hidden p-4 rounded-2xl bg-[#0D0F14] border-2 border-[#06C167]/50 space-y-3.5">
              <div class="flex items-center justify-between border-b border-[#262D3B] pb-2.5">
                <h5 id="addrFormTitle" class="text-sm font-black text-[#06C167] flex items-center gap-1.5">
                  <span>📍</span> Agregar Nueva Dirección
                </h5>
                <button type="button" onclick="closeAddressBookForm()" class="px-3 py-1.5 rounded-xl bg-[#1A1D26] text-white text-xs font-bold">✕ Cancelar</button>
              </div>

              <input type="hidden" id="addrFormEditId" value="" />

              <!-- Etiqueta Rápida (Casa, Oficina, Pareja, Universidad, Otro) -->
              <div>
                <label class="block text-xs text-[#8A94A6] mb-1.5 font-bold">Etiqueta de la Dirección *</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <button type="button" onclick="selectAddrLabelChip('Casa', '🏠')" class="px-3.5 py-2 rounded-xl bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-xs font-bold active:scale-95">🏠 Casa</button>
                  <button type="button" onclick="selectAddrLabelChip('Oficina', '🏢')" class="px-3.5 py-2 rounded-xl bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-xs font-bold active:scale-95">🏢 Oficina</button>
                  <button type="button" onclick="selectAddrLabelChip('Pareja / Familia', '❤️')" class="px-3.5 py-2 rounded-xl bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-xs font-bold active:scale-95">❤️ Pareja / Familia</button>
                  <button type="button" onclick="selectAddrLabelChip('Universidad', '🎓')" class="px-3.5 py-2 rounded-xl bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-xs font-bold active:scale-95">🎓 Universidad</button>
                  <button type="button" onclick="selectAddrLabelChip('Otro', '📍')" class="px-3.5 py-2 rounded-xl bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-xs font-bold active:scale-95">📍 Otro</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" id="addrFormLabel" value="Casa" placeholder="Nombre de etiqueta (ej. Casa Mamá)" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                  <select id="addrFormBuildingType" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]">
                    <option value="CASA">🏠 Casa Independiente</option>
                    <option value="APARTAMENTO">🏢 Apartamento / Condominio</option>
                    <option value="OFICINA">💼 Oficina / Edificio Corporativo</option>
                    <option value="HOTEL">🏨 Hotel / Hospedaje</option>
                    <option value="OTRO">📍 Otro Punto</option>
                  </select>
                </div>
              </div>

              <!-- Zona de Managua + Botón GPS en Vivo -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs text-[#8A94A6] font-bold">Zona o Sector en Managua *</label>
                  <button type="button" onclick="useCurrentGpsForAddressForm()" class="px-2.5 py-1 rounded-lg bg-[#06C167]/15 text-xs text-[#06C167] font-black flex items-center gap-1">
                    <span>🎯</span> Usar mi GPS actual
                  </button>
                </div>
                <select id="addrFormZoneSelect" onchange="handleZonePresetChange(this.value)" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]">
                  <option value="Galerías / Las Colinas|12.1022|-86.2415">📍 Galerías Santo Domingo / Las Colinas (Sur)</option>
                  <option value="Colonia Los Robles|12.1260|-86.2650">📍 Colonia Los Robles / Rotonda El Güegüense</option>
                  <option value="Carretera a Masaya / Centro Pellas|12.1185|-86.2562">📍 Carretera a Masaya Km 4.5 / Centro Pellas</option>
                  <option value="Metrocentro / UCA|12.1282|-86.2695">📍 Metrocentro / UCA / Rubén Darío</option>
                  <option value="Altamira / Planes de Altamira|12.1235|-86.2510">📍 Altamira / Planes de Altamira</option>
                  <option value="Bolonia / Plaza España|12.1390|-86.2785">📍 Bolonia / Plaza España</option>
                  <option value="Bello Horizonte / Carretera Norte|12.1445|-86.2280">📍 Bello Horizonte / Carretera Norte</option>
                  <option value="Linda Vista / Las Brisas|12.1480|-86.2980">📍 Linda Vista / Las Brisas (Occidente)</option>
                </select>
                <input type="hidden" id="addrFormLat" value="12.1022" />
                <input type="hidden" id="addrFormLng" value="-86.2415" />
              </div>

              <!-- Dirección Exacta -->
              <div>
                <label class="block text-xs text-[#8A94A6] mb-1.5 font-bold">Dirección Exacta (Calle, número de casa, referencias viales) *</label>
                <input type="text" id="addrFormExact" placeholder="Ej: Del Hotel Colón 1c al Sur, 1/2c al Este, Casa #42" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>

              <!-- Referencia de Entrega y Teléfono Receptor -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1.5 font-bold">Instrucciones para el Repartidor</label>
                  <input type="text" id="addrFormReference" placeholder="Ej: Portón negro, tocar timbre o llamar" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1.5 font-bold">Teléfono de Contacto en este Punto</label>
                  <input type="text" id="addrFormPhone" placeholder="+505 8888-0000" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
              </div>

              <label class="flex items-center gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" id="addrFormDefault" checked class="w-5 h-5 rounded border-[#262D3B] text-[#06C167] focus:ring-[#06C167]" />
                <span class="text-xs sm:text-sm text-white font-bold">Establecer como mi dirección de entrega principal</span>
              </label>

              <button type="button" onclick="saveAddressToBook()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm shadow-lg shadow-[#06C167]/20 transition-all active:scale-95">
                💾 Guardar Dirección en mi Libreta
              </button>
            </div>
          </div>

          <!-- ========================================================== -->
          <!-- PESTAÑA 2: PERFIL, TELÉFONO Y PREGUNTA DE SEGURIDAD        -->
          <!-- ========================================================== -->
          <div id="clientModalTabProfile" class="hidden space-y-4">
            <div class="p-4 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-3.5">
              <h4 class="text-sm font-black text-white flex items-center gap-2">
                <span>📱</span> Datos Personales y Teléfono de Contacto
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Nombre Completo *</label>
                  <input type="text" id="clientProfileNameInput" value="" placeholder="Ej: Mateo Blandón" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>

                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Teléfono Móvil (+505) *</label>
                  <input type="text" id="clientProfilePhoneInput" value="" placeholder="+505 8888-0000" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
              </div>

              <div>
                <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Correo Electrónico</label>
                <input type="email" id="clientProfileEmailInput" value="" placeholder="tu.correo@pedidosnica.com" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs text-[#8A94A6] font-bold">Dirección de Entrega Activa *</label>
                  <button type="button" onclick="switchClientModalTab('addresses')" class="text-xs text-[#06C167] hover:underline font-black">Ver todas mis direcciones →</button>
                </div>
                <input type="text" id="clientProfileAddressInput" value="Galerías Santo Domingo, Managua" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>

              <div>
                <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Instrucciones / Notas de Entrega</label>
                <textarea id="clientProfileNotesInput" rows="2" placeholder="Ej: Portón negro, llamar al llegar..." class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]"></textarea>
              </div>
            </div>

            <!-- Configuración de Pregunta de Seguridad y Contraseña -->
            <div class="p-4 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-3.5">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-black text-white flex items-center gap-2">
                  <span>🛡️</span> Seguridad y Recuperación
                </h4>
                <button type="button" onclick="switchClientModalTab('auth'); toggleClientPasswordRecovery(true);" class="text-xs text-[#06C167] hover:underline font-black">
                  🔓 Resetear por Email/SMS
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Pregunta de Seguridad</label>
                  <select id="clientProfileSecQuestion" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]">
                    <option value="¿Cuál es tu comida nica favorita?">¿Cuál es tu comida nica favorita?</option>
                    <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                    <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                    <option value="¿Cuál es el segundo nombre de tu madre?">¿Cuál es el segundo nombre de tu madre?</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Respuesta de Seguridad</label>
                  <input type="text" id="clientProfileSecAnswer" placeholder="Ej: gallo pinto" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
              </div>

              <div>
                <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Cambiar Contraseña Directamente (Opcional)</label>
                <input type="password" id="clientProfileNewPassword" placeholder="Dejar en blanco para mantener la actual..." class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>
            </div>

            <button onclick="saveClientProfile()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm transition-all shadow-lg shadow-[#06C167]/25 active:scale-95">
              💾 Guardar Cambios de Perfil y Seguridad
            </button>
          </div>

          <!-- ========================================================== -->
          <!-- PESTAÑA 3: HISTORIAL DE PEDIDOS                            -->
          <!-- ========================================================== -->
          <div id="clientModalTabOrders" class="hidden space-y-3.5">
            <div class="flex items-center justify-between">
              <h4 class="text-sm sm:text-base font-black text-white">Mis Pedidos Recientes</h4>
              <button onclick="loadClientOrderHistory()" class="px-3.5 py-2 rounded-xl bg-[#1A1D26] text-xs text-[#06C167] font-bold flex items-center gap-1.5 active:scale-95">
                <span>🔄</span> Actualizar
              </button>
            </div>
            <div id="clientOrderHistoryList" class="space-y-3 max-h-96 overflow-y-auto">
              Cargando tus pedidos...
            </div>
          </div>

          <!-- ========================================================== -->
          <!-- PESTAÑA 4: CAMBIAR CUENTA / LOGIN / RESET PASSWORD / REG   -->
          <!-- ========================================================== -->
          <div id="clientModalTabAuth" class="hidden space-y-4">
            
            <!-- Cuentas Demo de Cambio Rápido -->
            <div>
              <label class="block text-xs font-extrabold text-[#8A94A6] uppercase tracking-wider mb-2">⚡ Cambio Rápido a Cuenta Demo</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button type="button" onclick="quickSwitchDemoClient('mateo')" class="p-3.5 rounded-2xl bg-[#0D0F14] hover:bg-[#1A1D26] border border-[#262D3B] hover:border-[#06C167] text-left transition-all active:scale-95">
                  <div class="font-extrabold text-white text-sm">Mateo Blandón</div>
                  <div class="text-xs text-[#8A94A6] truncate">mateo@pedidosnica.com • +505 8711-2299</div>
                  <span class="inline-block mt-1.5 text-xs bg-[#06C167]/15 text-[#06C167] px-2.5 py-1 rounded-lg font-mono font-bold">3 Direcciones Guardadas</span>
                </button>

                <button type="button" onclick="quickSwitchDemoClient('sofia')" class="p-3.5 rounded-2xl bg-[#0D0F14] hover:bg-[#1A1D26] border border-[#262D3B] hover:border-[#06C167] text-left transition-all active:scale-95">
                  <div class="font-extrabold text-white text-sm">Sofía Chamorro</div>
                  <div class="text-xs text-[#8A94A6] truncate">sofia@pedidosnica.com • +505 8899-7711</div>
                  <span class="inline-block mt-1.5 text-xs bg-sky-500/15 text-sky-400 px-2.5 py-1 rounded-lg font-mono font-bold">2 Direcciones Guardadas</span>
                </button>
              </div>
            </div>

            <!-- Login por Correo o Teléfono -->
            <div id="clientLoginBox" class="p-4 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-3">
              <div class="flex items-center justify-between">
                <h5 class="text-sm font-black text-white flex items-center gap-1.5">
                  <span>🔑</span> Iniciar Sesión
                </h5>
                <button type="button" onclick="toggleClientPasswordRecovery(true)" class="text-xs text-[#06C167] hover:underline font-extrabold">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div>
                <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Correo Electrónico o Teléfono (+505)</label>
                <input type="text" id="clientAuthEmailInput" placeholder="ej. mateo@pedidosnica.com o 8711-2299" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>
              <div>
                <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Contraseña</label>
                <input type="password" id="clientAuthPassInput" placeholder="••••••••" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>
              <button onclick="loginClientAccount()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm transition-all active:scale-95">
                Entrar a mi Cuenta
              </button>
            </div>

            <!-- ================================================================== -->
            <!-- CENTRO DE RECUPERACIÓN DE CONTRASEÑA (EMAIL / SMS / PREGUNTA SEG.) -->
            <!-- ================================================================== -->
            <div id="clientPasswordRecoveryBox" class="hidden p-4 rounded-2xl bg-[#0D0F14] border-2 border-[#06C167]/40 space-y-3.5">
              <div class="flex items-center justify-between border-b border-[#262D3B] pb-2.5">
                <div>
                  <h5 class="text-sm font-black text-[#06C167] flex items-center gap-1.5">
                    <span>🔓</span> Recuperación y Reseteo de Contraseña
                  </h5>
                  <p class="text-xs text-[#8A94A6]">Elige tu método de verificación preferido</p>
                </div>
                <button type="button" onclick="toggleClientPasswordRecovery(false)" class="px-3 py-1.5 rounded-xl bg-[#1A1D26] text-xs text-white font-bold">✕ Volver</button>
              </div>

              <!-- Selector de Método: EMAIL | SMS | SECURITY_QUESTION -->
              <div class="grid grid-cols-3 gap-1.5 p-1.5 bg-[#14161D] border border-[#262D3B] rounded-2xl text-xs">
                <button type="button" id="recMethodBtnEMAIL" onclick="selectRecoveryMethod('EMAIL')" class="py-2.5 px-2 rounded-xl font-black bg-[#06C167] text-black transition-all">
                  📧 Email OTP
                </button>
                <button type="button" id="recMethodBtnSMS" onclick="selectRecoveryMethod('SMS')" class="py-2.5 px-2 rounded-xl font-bold text-[#8A94A6] hover:text-white transition-all">
                  📱 SMS / Tel.
                </button>
                <button type="button" id="recMethodBtnSECURITY_QUESTION" onclick="selectRecoveryMethod('SECURITY_QUESTION')" class="py-2.5 px-2 rounded-xl font-bold text-[#8A94A6] hover:text-white transition-all">
                  🛡️ Pregunta
                </button>
              </div>

              <!-- Paso 1: Identificar Cuenta -->
              <div class="space-y-2">
                <label id="recIdentifierLabel" class="block text-xs text-[#8A94A6] font-bold">Ingresa tu Correo Electrónico o Teléfono registrado *</label>
                <div class="flex items-center gap-2">
                  <input type="text" id="recIdentifierInput" placeholder="ej. mateo@pedidosnica.com o +505 8711-2299" class="flex-1 bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                  <button type="button" id="recInitiateBtn" onclick="initiateClientPasswordRecovery()" class="px-4 py-3 min-h-[46px] rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs sm:text-sm shrink-0 transition-all active:scale-95">
                    Enviar Código
                  </button>
                </div>
              </div>

              <!-- Banner de Simulación de Código OTP / Pregunta de Seguridad -->
              <div id="recDemoNotificationBanner" class="hidden p-3.5 rounded-2xl bg-[#06C167]/15 border border-[#06C167]/40 text-xs sm:text-sm space-y-1.5">
                <!-- Se llena dinámicamente con el código OTP simulado o la pregunta de seguridad -->
              </div>

              <!-- Paso 2: Verificar Código / Respuesta y Definir Nueva Contraseña -->
              <div id="recStep2Box" class="hidden space-y-3 pt-2.5 border-t border-[#262D3B]">
                <div id="recOtpInputGroup">
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Código de Verificación de 6 dígitos *</label>
                  <input type="text" id="recOtpCodeInput" maxlength="6" placeholder="Ej: 482910" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white font-mono tracking-widest text-center text-base font-black outline-none focus:border-[#06C167]" />
                </div>

                <div id="recSecQuestionGroup" class="hidden space-y-2">
                  <div class="p-3 rounded-xl bg-[#14161D] border border-[#262D3B]">
                    <span class="text-xs text-[#8A94A6] block">Pregunta de Seguridad de tu Cuenta:</span>
                    <span id="recSecQuestionDisplay" class="text-sm font-black text-amber-400">¿Cuál es tu comida nica favorita?</span>
                  </div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Tu Respuesta *</label>
                  <input type="text" id="recSecAnswerInput" placeholder="Escribe tu respuesta..." class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Nueva Contraseña *</label>
                    <input type="password" id="recNewPasswordInput" placeholder="Mínimo 6 caracteres" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                  </div>
                  <div>
                    <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Confirmar Contraseña *</label>
                    <input type="password" id="recConfirmPasswordInput" placeholder="Repite la contraseña" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                  </div>
                </div>

                <button type="button" onclick="completeClientPasswordRecovery()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm shadow-lg shadow-[#06C167]/25 transition-all active:scale-95">
                  ✅ Verificar y Guardar Nueva Contraseña
                </button>
              </div>
            </div>

            <!-- Registro de Nueva Cuenta con Dirección y Pregunta de Seguridad -->
            <div class="p-4 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-3">
              <h5 class="text-sm font-black text-white flex items-center gap-1.5">
                <span>✨</span> Crear Nueva Cuenta de Comensal
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Nombre Completo *</label>
                  <input type="text" id="regClientName" placeholder="Tu Nombre y Apellido" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Teléfono Móvil (+505) *</label>
                  <input type="text" id="regClientPhone" placeholder="+505 8888-0000" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Correo Electrónico *</label>
                  <input type="email" id="regClientEmail" placeholder="comensal@pedidosnica.com" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Contraseña *</label>
                  <input type="password" id="regClientPassword" placeholder="Mínimo 6 caracteres" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
              </div>
              <div>
                <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Dirección Principal en Managua</label>
                <input type="text" id="regClientAddress" placeholder="Ej: Colonia Los Robles, Rotonda El Güegüense 2c al Sur" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Pregunta de Seguridad</label>
                  <select id="regClientSecQuestion" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]">
                    <option value="¿Cuál es tu comida nica favorita?">¿Cuál es tu comida nica favorita?</option>
                    <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                    <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-[#8A94A6] mb-1 font-bold">Respuesta de Seguridad</label>
                  <input type="text" id="regClientSecAnswer" placeholder="Ej: gallo pinto" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-3 text-white text-sm outline-none focus:border-[#06C167]" />
                </div>
              </div>
              <button onclick="registerClientAccount()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm transition-all shadow active:scale-95">
                Registrarme como Comensal
              </button>
            </div>

            <!-- Botón Cerrar Sesión -->
            <div class="pt-1">
              <button onclick="logoutClientAccount()" class="w-full py-3.5 min-h-[48px] rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-sm font-black transition-all active:scale-95">
                🚪 Cerrar Sesión Actual
              </button>
            </div>

          </div>

        </div>

        <!-- Footer del Modal -->
        <div class="flex justify-end pt-3 border-t border-[#262D3B] shrink-0">
          <button onclick="closeClientProfileModal()" class="px-6 py-3 min-h-[44px] rounded-2xl bg-[#222] hover:bg-[#333] text-white font-black text-sm transition-all active:scale-95">
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>

  <script src="/client/script.js"></script>

  ${getFooter()}`;
}

module.exports = { renderClientApp };
