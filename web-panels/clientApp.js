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

  <div id="clientAppRoot" data-initial-view="${initialView}" class="min-h-screen flex flex-col bg-black text-white antialiased selection:bg-[#06C167] selection:text-black pb-20 sm:pb-0">

    <!-- TOPBAR PEDIDOSNICA (RESPONSIVE: PHONE, TABLET & DESKTOP) -->
    <header class="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-[#262626] px-3 sm:px-6 py-2.5 transition-all">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        <!-- Logo PedidosNica + Selector de Dirección Activa (Estilo Uber Eats / Rappi) -->
        <div class="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
          <a href="/client" class="flex items-center gap-1 shrink-0 group">
            <span class="font-extrabold text-xl sm:text-2xl tracking-tighter text-white">Pedidos</span>
            <span class="font-black text-xl sm:text-2xl tracking-tighter text-[#06C167]">Nica</span>
          </a>

          <button type="button" id="headerAddressBtn" onclick="openClientProfileModal('addresses')" class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1F1F1F] hover:bg-[#282828] border border-[#2E2E2E] hover:border-[#06C167]/60 transition-all max-w-[175px] sm:max-w-[260px] text-left group" title="Cambiar o agregar dirección de entrega">
            <span class="text-[#06C167] text-xs shrink-0">📍</span>
            <div class="truncate">
              <span class="text-[9px] uppercase tracking-wider text-[#8A94A6] font-bold block leading-none">Entregar en</span>
              <span id="headerAddressLabel" class="text-[11px] font-bold text-white group-hover:text-[#06C167] truncate block leading-tight">Galerías Santo Domingo, Managua</span>
            </div>
            <span class="text-[9px] text-[#06C167] shrink-0">▼</span>
          </button>
        </div>

        <!-- Buscador Central Unificado (Tablet & Desktop) -->
        <div class="hidden md:flex flex-1 max-w-md mx-2">
          <div class="relative w-full">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757575] text-sm">🔍</span>
            <input 
              type="text" 
              id="searchInputDesktop" 
              oninput="handleSearch(this.value)" 
              placeholder="Buscar restaurantes, pupusas, asados, pizzas..." 
              class="w-full bg-[#1F1F1F] hover:bg-[#262626] border border-[#2E2E2E] focus:border-[#06C167] rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#757575] focus:outline-none transition-all"
            />
          </div>
        </div>

        <!-- Acciones Derecha: Rastrear Pedido, Carrito y Perfil -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          
          <!-- Botón Instalar App (PWA WebAPK) -->
          <button id="floatingInstallBtn" onclick="triggerPWAInstall()" class="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#06C167]/15 hover:bg-[#06C167]/25 border border-[#06C167]/40 text-[#06C167] transition-all flex items-center gap-1.5">
            <span>📲</span>
            <span class="hidden xs:inline">Instalar</span>
          </button>

          <!-- Botón Rastrear Pedido en Vivo -->
          <button id="navTrackingBtn" onclick="toggleTrackingView()" class="px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold bg-[#1F1F1F] hover:bg-[#282828] border border-[#2E2E2E] text-white transition-all flex items-center gap-1.5 relative">
            <span class="text-sm">🧾</span>
            <span class="hidden sm:inline">Pedidos</span>
            <span id="activeOrderBadge" class="hidden w-2.5 h-2.5 rounded-full bg-[#06C167] animate-ping absolute -top-0.5 -right-0.5"></span>
          </button>

          <!-- Botón Carrito Flotante (Uber Eats Verde) -->
          <button id="cartBtn" onclick="toggleCartDrawer(true)" class="px-3.5 sm:px-4 py-2 rounded-full text-xs font-black bg-[#06C167] hover:bg-[#05A357] text-black shadow-lg shadow-[#06C167]/25 transition-all flex items-center gap-2 transform active:scale-95">
            <span class="text-sm">🛒</span>
            <span id="cartCountBadge" class="bg-black text-[#06C167] font-mono text-[11px] px-1.5 py-0.2 rounded-full font-bold">0</span>
            <span id="cartTotalHeader" class="hidden md:inline font-mono font-black">C$ 0.00</span>
          </button>

          <!-- Perfil del Comensal / Cliente -->
          <button onclick="openClientProfileModal()" class="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#262626] hover:opacity-80 transition-opacity cursor-pointer text-left">
            <img id="clientHeaderAvatar" src="https://ui-avatars.com/api/?name=Comensal&background=1F1F1F&color=06C167&bold=true" alt="Mi Cuenta" class="w-8 h-8 rounded-full object-cover border border-[#06C167]/60" />
            <div class="hidden lg:block">
              <span id="clientHeaderName" class="text-xs font-bold text-white block">Iniciar Sesión</span>
              <span id="clientHeaderSublabel" class="text-[10px] text-[#06C167] font-semibold block">Invitado • Entrar ▼</span>
            </div>
          </button>

          <!-- Volver al Hub general -->
          <a href="/" title="Volver al Selector de Portales" class="p-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-[#A6A6A6] hover:text-white transition-colors text-xs flex items-center justify-center">
            🏠
          </a>
        </div>

      </div>

      <!-- Buscador en Teléfonos (Mobile Input Bar) -->
      <div class="mt-2.5 md:hidden">
        <div class="relative w-full">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757575] text-xs">🔍</span>
          <input 
            type="text" 
            id="searchInputMobile" 
            oninput="handleSearch(this.value)" 
            placeholder="Buscar restaurantes, pupusas, asados, pizzas..." 
            class="w-full bg-[#1F1F1F] border border-[#2E2E2E] focus:border-[#06C167] rounded-full pl-8 pr-4 py-1.5 text-xs text-white placeholder-[#757575] focus:outline-none"
          />
        </div>
      </div>
    </header>
 
    <!-- BANNER DE INSTALACIÓN RÁPIDA PARA SMARTPHONES (PEDIDOSNICA PWA/WEBAPK) -->
    <div id="mobileInstallPromptBanner" class="bg-gradient-to-r from-[#06C167]/15 via-[#161616] to-[#121212] border-b border-[#06C167]/30 px-3.5 py-2.5 flex items-center justify-between gap-2.5 sm:hidden">
      <div class="flex items-center gap-2.5 min-w-0">
        <img src="/icon-192.png" alt="PedidosNica" class="w-8 h-8 rounded-lg shrink-0 border border-[#06C167]/50" />
        <div class="truncate">
          <p class="font-bold text-white text-xs truncate">Instalar PedidosNica App</p>
          <p class="text-[10px] text-[#A6A6A6]">Acceso directo y pantalla completa</p>
        </div>
      </div>
      <button onclick="triggerPWAInstall()" class="shrink-0 px-3.5 py-1.5 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs shadow-md shadow-[#06C167]/30 flex items-center gap-1 active:scale-95 transition-all">
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
            <h2 class="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span class="text-yellow-400">⭐</span> Recomendados para Ti
            </h2>
            <p class="text-xs text-[#A6A6A6] mt-0.5">Los favoritos mejor calificados y más pedidos en Managua</p>
          </div>
        </div>
        <div id="recommendedGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Renderizado dinámico desde clientFront.js -->
        </div>
      </section>

      <!-- SECCIÓN 2: LISTA DE RESTAURANTES (RESTAURANTS MARKETPLACE) -->
      <section id="restaurantsSection" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>🏪</span> Restaurantes Populares
            </h2>
            <p class="text-xs text-[#A6A6A6] mt-0.5">Pide directo de tus marcas y cocinas favoritas</p>
          </div>
        </div>
        <div id="restaurantsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Renderizado dinámico desde clientFront.js -->
        </div>
      </section>

      <!-- BARRA DE CATEGORÍAS (UBER EATS HORIZONTAL PILLS CON SNAP SCROLL) -->
      <section class="sticky top-[58px] sm:top-[65px] z-30 bg-black/95 backdrop-blur-md py-2.5 sm:py-3 border-b border-[#262626] mb-6">
        <div id="categoriesList" class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          <button onclick="filterCategory('Todos')" class="category-pill active px-4 py-2 rounded-full text-xs font-bold transition-all bg-[#06C167] text-black shrink-0 snap-start shadow-sm">
            🔥 Todos
          </button>
        </div>
      </section>

      <!-- HEADER DE SECCIÓN DE PRODUCTOS O RESULTADOS -->
      <div id="productsSectionHeader" class="flex items-center justify-between mb-4">
        <h3 id="productsSectionTitle" class="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <span>🍽️</span> Platillos y Comidas
        </h3>
        <span id="activeFilterBadge" class="text-xs text-[#A6A6A6]"></span>
      </div>

      <!-- GRILLA DE PRODUCTOS (UBER EATS CARDS: 1 COL EN PHONE, 2 EN TABLET, 3 EN DESKTOP) -->
      <section>
        <div id="productsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div class="col-span-full py-16 text-center text-[#757575] flex flex-col items-center">
            <div class="w-8 h-8 border-2 border-[#06C167] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs">Cargando menú en vivo desde Supabase...</p>
          </div>
        </div>
      </section>

    </main>

    <!-- VISTA SECUNDARIA: SEGUIMIENTO EN VIVO Y MAPA (UBER EATS LIVE TRACKING) -->
    <main id="trackingView" class="hidden flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
      
      <!-- Top header del tracking -->
      <div class="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#262626]">
        <div>
          <button onclick="toggleTrackingView(false)" class="text-xs font-bold text-[#06C167] hover:underline flex items-center gap-1 mb-1">
            ← Volver al Menú
          </button>
          <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Seguimiento de tu Entrega
            <span id="trackingLiveBadge" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span> En Vivo
            </span>
          </h2>
        </div>

        <div class="text-right">
          <span class="text-[11px] text-[#A6A6A6] block">ID de Pedido</span>
          <span id="trackingOrderId" class="font-mono text-xs sm:text-sm text-white font-bold tracking-wider">#----</span>
        </div>
      </div>

      <!-- Layout Responsive del Tracking (Stack en Mobile, 2 Cols en iPad & Desktop) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        
        <!-- COLUMNA IZQUIERDA: ESTADO, PROGRESS BAR Y REPARTIDOR (5 Cols) -->
        <div class="lg:col-span-5 space-y-4 sm:space-y-6 order-2 lg:order-1">
          
          <!-- TARJETA DE ESTADO ACTUAL ESTILO UBER EATS -->
          <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#121212] border border-[#262626] shadow-xl relative overflow-hidden">
            <div id="statusPulseGlow" class="absolute -top-10 -right-10 w-32 h-32 bg-[#06C167]/15 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3 sm:gap-4 mb-4">
              <div id="statusIconBox" class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#06C167]/10 border border-[#06C167]/30 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                👨‍🍳
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#06C167] font-mono" id="statusSubhead">ESTADO ACTUAL</span>
                <h3 id="statusMainText" class="text-lg sm:text-xl font-black text-white leading-tight">Preparando tu Pedido</h3>
                <p id="statusTimeEstimate" class="text-xs text-[#A6A6A6] mt-0.5">Llegada estimada: ~20-30 mins</p>
              </div>
            </div>

            <!-- BARRA DE PROGRESO UBER EATS (5 ETAPAS) -->
            <div class="space-y-3 pt-3 border-t border-[#262626]">
              
              <div class="timeline-step flex items-start gap-3" data-step="CREATED">
                <div class="step-dot w-6 h-6 rounded-full bg-[#06C167] text-black font-bold text-xs flex items-center justify-center shrink-0">✓</div>
                <div>
                  <h4 class="text-xs font-bold text-white">Pedido Recibido</h4>
                  <p class="text-[11px] text-[#A6A6A6]">Registrado en el sistema.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3" data-step="IN_PREPARATION">
                <div class="step-dot w-6 h-6 rounded-full bg-[#262626] text-[#A6A6A6] font-bold text-xs flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 class="text-xs font-bold text-[#A6A6A6]">En la Cocina</h4>
                  <p id="trackingRestPrepText" class="text-[11px] text-[#A6A6A6]">El restaurante está horneando tus platos.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3" data-step="READY_FOR_PICKUP">
                <div class="step-dot w-6 h-6 rounded-full bg-[#262626] text-[#A6A6A6] font-bold text-xs flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 class="text-xs font-bold text-[#A6A6A6]">Listo para Retiro</h4>
                  <p class="text-[11px] text-[#A6A6A6]">Empaquetado y listo para entregar al repartidor.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3" data-step="DRIVER_ASSIGNED">
                <div class="step-dot w-6 h-6 rounded-full bg-[#262626] text-[#A6A6A6] font-bold text-xs flex items-center justify-center shrink-0">4</div>
                <div>
                  <h4 class="text-xs font-bold text-[#A6A6A6]">Repartidor en Camino</h4>
                  <p class="text-[11px] text-[#A6A6A6]">Motorizado asignado con navegación GPS.</p>
                </div>
              </div>

              <div class="timeline-step flex items-start gap-3" data-step="DELIVERED">
                <div class="step-dot w-6 h-6 rounded-full bg-[#262626] text-[#A6A6A6] font-bold text-xs flex items-center justify-center shrink-0">5</div>
                <div>
                  <h4 class="text-xs font-bold text-[#A6A6A6]">¡Pedido Entregado!</h4>
                  <p class="text-[11px] text-[#A6A6A6]">¡Que lo disfrutes mucho!</p>
                </div>
              </div>

            </div>

            <button id="btnCancelClientOrder" onclick="cancelActiveClientOrder()" class="hidden w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold mt-2">✕ Cancelar Pedido (Aún no aceptado)</button>
          </div>

          <!-- TARJETA DEL REPARTIDOR ASIGNADO (UBER EATS COURIER CARD) -->
          <div id="driverCard" class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#121212] border border-[#262626] shadow-xl">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#A6A6A6] mb-3 flex items-center justify-between">
              <span>Tu Repartidor</span>
              <span id="driverStatusTag" class="text-[10px] text-[#06C167] font-mono bg-[#06C167]/10 px-2 py-0.5 rounded border border-[#06C167]/25">Asignando...</span>
            </h4>

            <div class="flex items-center gap-3 sm:gap-4">
              <img id="driverAvatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" alt="Repartidor" class="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-[#06C167]/50" />
              <div class="flex-1 min-w-0">
                <h5 id="driverName" class="text-sm sm:text-base font-bold text-white truncate">Martín Rivas</h5>
                <p id="driverVehicle" class="text-xs text-[#A6A6A6] truncate">Moto Honda CG 150 • A123BCD</p>
                <div class="flex items-center gap-2 mt-0.5 text-xs">
                  <span id="driverRating" class="font-bold text-[#06C167]">⭐ 4.95</span>
                  <span class="text-[#262626]">•</span>
                  <span class="text-[#757575]">1,240 entregas</span>
                </div>
              </div>
              <button id="btnCallAssignedDriver" onclick="callAssignedDriver()" class="hidden px-3 py-1.5 rounded-xl bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 text-xs font-bold shrink-0">📞 Llamar</button>
            </div>

            <!-- PIN DE ENTREGA SEGURA -->
            <div class="mt-4 p-3 rounded-2xl bg-black border border-[#262626] flex items-center justify-between">
              <div>
                <span class="text-[10px] text-[#A6A6A6] block font-medium">PIN de Seguridad al recibir:</span>
                <span class="text-xs text-white">Díctale este código al repartidor</span>
              </div>
              <div class="px-3 py-1 rounded-xl bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 font-mono font-black text-sm tracking-widest">
                4829
              </div>
            </div>
          </div>

          <!-- RESUMEN DE PRODUCTOS -->
          <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#121212] border border-[#262626] shadow-xl">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#A6A6A6] mb-3">Detalle del Pedido</h4>
            <div id="trackingItemsList" class="space-y-2 text-xs divide-y divide-[#262626]">
              <!-- Renderizado dinámico -->
            </div>
            <div class="pt-3 mt-3 border-t border-[#262626] flex justify-between items-center text-sm font-bold text-white">
              <span>Total Pagado</span>
              <span id="trackingTotalAmount" class="text-[#06C167] font-mono">C$ 0.00</span>
            </div>
          </div>

          <!-- RESEÑA / REVIEW MODAL CARD -->
          <div id="reviewCard" class="hidden p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#06C167]/10 via-[#121212] to-[#121212] border border-[#06C167]/30 shadow-2xl">
            <div class="flex items-center gap-2 mb-2 text-[#06C167]">
              <span class="text-xl">⭐</span>
              <h4 class="text-base font-bold text-white">¿Cómo estuvo tu comida?</h4>
            </div>
            <p id="trackingReviewRestText" class="text-xs text-[#A6A6A6] mb-4">Califica tu experiencia con el restaurante.</p>

            <div class="flex items-center gap-2 mb-4" id="starSelector">
              <button onclick="setReviewRating(1)" class="star-btn text-2xl text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(2)" class="star-btn text-2xl text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(3)" class="star-btn text-2xl text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(4)" class="star-btn text-2xl text-[#757575] hover:text-[#06C167] transition-colors">★</button>
              <button onclick="setReviewRating(5)" class="star-btn text-2xl text-[#06C167] hover:text-[#06C167] transition-colors">★</button>
            </div>

            <textarea id="reviewComment" rows="2" placeholder="Escribe un comentario sobre el pedido..." class="w-full bg-black border border-[#2E2E2E] rounded-xl p-3 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-[#06C167] mb-3"></textarea>

            <button onclick="submitReview()" class="w-full py-2.5 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-bold text-xs shadow-lg shadow-[#06C167]/20 transition-all">
              Enviar Calificación
            </button>
          </div>

        </div>

        <!-- COLUMNA DERECHA: MAPA INTERACTIVO (7 Cols) -->
        <div class="lg:col-span-7 order-1 lg:order-2">
          <div class="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#262626] bg-[#121212] shadow-2xl flex flex-col h-[320px] sm:h-[420px] lg:h-[680px] relative">
            
            <div class="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <div class="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-[#2E2E2E] text-[11px] font-semibold text-white pointer-events-auto flex items-center gap-2 shadow">
                <span class="w-2 h-2 rounded-full bg-[#06C167] animate-ping"></span>
                <span>Telemetría en Vivo</span>
              </div>

              <div class="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-[#2E2E2E] text-xs font-mono font-bold text-[#06C167] pointer-events-auto shadow">
                <span id="mapEtaBadge">ETA: ~18 min</span>
              </div>
            </div>

            <div id="trackingMap" class="w-full h-full"></div>

            <div class="p-2.5 bg-black/90 border-t border-[#262626] flex items-center justify-around text-[10px] sm:text-xs text-[#A6A6A6]">
              <span class="flex items-center gap-1"><span>🏪</span> <span id="mapLegendRestName">Restaurante</span></span>
              <span class="flex items-center gap-1"><span>🛵</span> Repartidor</span>
              <span class="flex items-center gap-1"><span>📍</span> Tu Domicilio</span>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- MODAL DE PERSONALIZACIÓN DE PRODUCTO (BOTTOM SHEET EN PHONE, MODAL EN TABLET & WEB) -->
    <div id="productModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="bg-[#121212] border-t sm:border border-[#262626] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <!-- Drag Handle para Celulares -->
        <div class="sm:hidden w-12 h-1 bg-[#2E2E2E] rounded-full mx-auto my-2 shrink-0"></div>

        <!-- Header con imagen del Producto -->
        <div class="relative h-44 sm:h-52 w-full bg-black shrink-0">
          <img id="modalProductImage" src="" alt="Producto" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
          <button onclick="closeProductModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors shadow">
            ✕
          </button>
        </div>

        <!-- Contenido Scrolleable -->
        <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h3 id="modalProductName" class="text-lg sm:text-xl font-bold text-white">Nombre del Producto</h3>
              <span id="modalProductBasePrice" class="text-base sm:text-lg font-black text-[#06C167] font-mono">C$ 0.00</span>
            </div>
            <p id="modalProductDesc" class="text-xs text-[#A6A6A6] mt-1 leading-relaxed">Descripción detallada.</p>
          </div>

          <!-- Opciones Dinámicas -->
          <div id="modalCustomizationGroups" class="space-y-3.5"></div>

          <!-- Notas para el restaurante -->
          <div class="pt-1">
            <label class="block text-xs font-bold text-white mb-1">Aclaraciones especiales (Opcional):</label>
            <input type="text" id="modalSpecialNotes" placeholder="ej. Sin orégano, bien dorada..." class="w-full bg-black border border-[#2E2E2E] focus:border-[#06C167] rounded-xl px-3 py-2 text-xs text-white placeholder-[#757575] focus:outline-none" />
          </div>
        </div>

        <!-- Barra Inferior de Acción (Touch-Friendly) -->
        <div class="p-3 sm:p-4 bg-black border-t border-[#262626] flex items-center justify-between gap-3 safe-area-bottom">
          <!-- Stepper de Cantidad -->
          <div class="flex items-center bg-[#1F1F1F] border border-[#2E2E2E] rounded-full p-1 shrink-0">
            <button onclick="changeModalQty(-1)" class="w-8 h-8 rounded-full hover:bg-[#282828] flex items-center justify-center text-sm font-bold text-white">-</button>
            <span id="modalQtyDisplay" class="w-8 text-center text-xs font-bold font-mono text-white">1</span>
            <button onclick="changeModalQty(1)" class="w-8 h-8 rounded-full hover:bg-[#282828] flex items-center justify-center text-sm font-bold text-white">+</button>
          </div>

          <!-- Botón Verde Uber Eats -->
          <button id="modalAddToCartBtn" onclick="confirmAddToCart()" class="flex-1 py-3 px-4 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs shadow-lg shadow-[#06C167]/25 transition-all flex items-center justify-between">
            <span>Agregar al Carrito</span>
            <span id="modalTotalCalculated" class="font-mono text-sm font-black">C$ 0.00</span>
          </button>
        </div>

      </div>
    </div>

    <!-- DRAWER DEL CARRITO / CHECKOUT (RESPONSIVE: BOTTOM SHEET EN MOBILE, DRAWER EN TABLET & WEB) -->
    <div id="cartDrawerBackdrop" onclick="toggleCartDrawer(false)" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden transition-opacity"></div>
    <div id="cartDrawer" class="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-[#121212] border-l border-[#262626] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      
      <!-- Header Carrito -->
      <div class="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-black">
        <div class="flex items-center gap-2">
          <span class="text-xl">🛒</span>
          <h3 class="font-bold text-base text-white">Tu Pedido</h3>
          <span id="cartDrawerCount" class="text-xs font-mono bg-[#06C167]/15 text-[#06C167] px-2 py-0.5 rounded-full font-bold">0 ítems</span>
        </div>
        <button onclick="toggleCartDrawer(false)" class="p-2 rounded-full text-[#A6A6A6] hover:text-white hover:bg-[#1F1F1F] transition-colors">
          ✕
        </button>
      </div>

      <!-- Lista de Ítems -->
      <div id="cartItemsList" class="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3"></div>

      <!-- Configuración y Totales -->
      <div class="p-4 sm:p-5 bg-black border-t border-[#262626] space-y-3 safe-area-bottom">
        
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-[10px] font-bold text-[#A6A6A6] uppercase tracking-wider">Dirección de Entrega</label>
            <button type="button" onclick="toggleCartDrawer(false); openClientProfileModal('addresses');" class="text-[10px] font-bold text-[#06C167] hover:underline flex items-center gap-1">
              <span>+ Mis Direcciones</span>
            </button>
          </div>
          <select id="cartSavedAddressSelect" onchange="handleCartAddressSelectChange(this.value)" class="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none">
            <option value="">📍 Seleccionar de mis direcciones guardadas...</option>
          </select>
          <div class="flex items-center gap-2 bg-[#1A1A1A] border border-[#2E2E2E] focus-within:border-[#06C167] rounded-xl p-2 text-xs text-white">
            <span class="text-[#06C167]">📍</span>
            <input type="text" id="cartDeliveryAddress" value="Galerías Santo Domingo, Managua" placeholder="Dirección exacta de entrega..." class="bg-transparent flex-1 focus:outline-none text-xs text-white" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-bold text-[#A6A6A6] uppercase tracking-wider mb-1">Teléfono Contacto</label>
            <div class="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2E2E2E] focus-within:border-[#06C167] rounded-xl px-2.5 py-1.5 text-xs text-white">
              <span class="text-[#06C167] text-xs">📞</span>
              <input type="text" id="cartClientPhone" placeholder="+505 8888-0000" class="bg-transparent w-full focus:outline-none text-xs text-white" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-[#A6A6A6] uppercase tracking-wider mb-1">Notas / Referencia</label>
            <input type="text" id="cartDeliveryNotes" placeholder="ej. Portón negro, llamar..." class="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-[#757575] focus:outline-none" />
          </div>
        </div>

        <!-- Método de Pago -->
        <div>
          <label class="block text-[10px] font-bold text-[#A6A6A6] uppercase tracking-wider mb-1">Forma de Pago</label>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <button type="button" onclick="selectPaymentMethod('CASH')" class="payment-method-btn active p-2 rounded-xl bg-[#06C167]/15 border border-[#06C167] text-[#06C167] font-bold text-center" data-method="CASH">
              💵 Efectivo Córdobas (C$)
            </button>
            <button type="button" onclick="selectPaymentMethod('CARD')" class="payment-method-btn p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#A6A6A6] hover:text-white font-medium text-center" data-method="CARD">
              💳 Tarjeta
            </button>
            <button type="button" onclick="selectPaymentMethod('WALLET')" class="payment-method-btn p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#A6A6A6] hover:text-white font-medium text-center" data-method="WALLET">
              📱 Billetera Móvil
            </button>
          </div>
        </div>

        <!-- Cupón Promocional -->
        <div>
          <label class="block text-[10px] font-bold text-[#A6A6A6] uppercase tracking-wider mb-1">Cupón Promocional</label>
          <div class="flex items-center gap-2">
            <input type="text" id="cartPromoInput" placeholder="Código: NICA20 o ENVIOGRATIS" class="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl px-3 py-1.5 text-xs text-white uppercase placeholder-[#757575] focus:outline-none" />
            <button type="button" onclick="applyPromoCode()" class="px-3 py-1.5 rounded-xl bg-[#06C167]/15 hover:bg-[#06C167]/25 text-[#06C167] border border-[#06C167]/30 font-bold text-xs transition-colors shrink-0">
              Aplicar
            </button>
          </div>
        </div>

        <!-- Resumen de Pago -->
        <div class="space-y-1.5 pt-2 border-t border-[#262626] text-xs">
          <div class="text-[11px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>🧾</span> Resumen de Pago
          </div>
          <div class="flex justify-between text-[#A6A6A6]">
            <span>Subtotal de productos</span>
            <span id="cartSubtotal" class="font-mono text-white">C$ 0.00</span>
          </div>
          <div id="cartDiscountRow" class="hidden flex justify-between text-[#06C167] font-bold">
            <span>Descuento Cupón</span>
            <span id="cartDiscountAmount">-C$ 0.00</span>
          </div>
          <div class="flex justify-between text-[#A6A6A6]">
            <span>Costo de envío</span>
            <span id="cartDeliveryFee" class="font-mono text-[#06C167]">C$ 0.00</span>
          </div>
          <div class="flex justify-between text-[#A6A6A6]">
            <span>Tarifa de servicio</span>
            <span id="cartServiceFee" class="font-mono text-white">C$ 15.00</span>
          </div>
          <div class="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-[#262626]">
            <span>Total a pagar</span>
            <span id="cartTotalFinal" class="font-mono text-[#06C167] text-base">C$ 0.00</span>
          </div>
        </div>

        <button id="checkoutBtn" onclick="submitOrder()" class="w-full py-3.5 rounded-full bg-[#06C167] hover:bg-[#05A357] text-black font-black text-sm shadow-xl shadow-[#06C167]/25 transition-all flex items-center justify-center gap-2">
          <span>Hacer Pedido</span>
          <span class="text-base">→</span>
        </button>

      </div>

    </div>

    <!-- BOTTOM NAVIGATION BAR (EXCLUSIVA PARA SMARTPHONES & TABLETS VERTICALES) -->
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#262626] px-4 py-2 sm:hidden flex items-center justify-around text-center safe-area-bottom">
      <button onclick="toggleTrackingView(false)" class="flex flex-col items-center gap-1 text-[#06C167]">
        <span class="text-base">🏠</span>
        <span class="text-[10px] font-bold">Inicio</span>
      </button>

      <button onclick="document.getElementById('searchInputMobile')?.focus()" class="flex flex-col items-center gap-1 text-[#A6A6A6] hover:text-white">
        <span class="text-base">🔍</span>
        <span class="text-[10px] font-medium">Buscar</span>
      </button>

      <button onclick="toggleCartDrawer(true)" class="flex flex-col items-center gap-1 text-[#A6A6A6] hover:text-white relative">
        <span class="text-base">🛒</span>
        <span class="text-[10px] font-medium">Carrito</span>
        <span id="mobileBottomCartBadge" class="absolute -top-1 right-2 bg-[#06C167] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">0</span>
      </button>

      <button onclick="toggleTrackingView(true)" class="flex flex-col items-center gap-1 text-[#A6A6A6] hover:text-white relative">
        <span class="text-base">🧾</span>
        <span class="text-[10px] font-medium">Pedidos</span>
        <span id="mobileBottomTrackingDot" class="hidden absolute top-0 right-2 w-2 h-2 rounded-full bg-[#06C167]"></span>
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
      <div id="clientProfileModal" class="bg-[#14161D] border-2 border-[#06C167]/40 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-3.5 text-xs max-h-[92vh] flex flex-col">
        
        <!-- Header del Modal -->
        <div class="flex items-center justify-between pb-3 border-b border-[#262D3B] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-[#06C167]/20 text-[#06C167] text-lg">👤</span>
            <div>
              <h3 class="text-sm sm:text-base font-black text-white">Centro de Cuenta y Seguridad</h3>
              <p class="text-[10px] text-[#8A94A6]">Libreta multi-direcciones, teléfono, historial y recuperación de contraseña</p>
            </div>
          </div>
          <button onclick="closeClientProfileModal()" class="text-[#8A94A6] hover:text-white p-1.5 rounded-lg hover:bg-[#1F2430] text-base">✕</button>
        </div>

        <!-- Barra de 4 Pestañas -->
        <div class="grid grid-cols-4 gap-1 p-1 bg-[#0D0F14] border border-[#262D3B] rounded-xl text-[10px] sm:text-[11px] shrink-0">
          <button id="tabBtnAddresses" onclick="switchClientModalTab('addresses')" class="py-1.5 px-1.5 rounded-lg font-bold bg-[#06C167] text-black transition-all truncate">
            📍 Direcciones
          </button>
          <button id="tabBtnProfile" onclick="switchClientModalTab('profile')" class="py-1.5 px-1.5 rounded-lg font-semibold text-[#8A94A6] hover:text-white transition-all truncate">
            👤 Perfil y Tel.
          </button>
          <button id="tabBtnOrders" onclick="switchClientModalTab('orders')" class="py-1.5 px-1.5 rounded-lg font-semibold text-[#8A94A6] hover:text-white transition-all truncate">
            📦 Mis Pedidos
          </button>
          <button id="tabBtnAuth" onclick="switchClientModalTab('auth')" class="py-1.5 px-1.5 rounded-lg font-semibold text-[#8A94A6] hover:text-white transition-all truncate">
            🔐 Acceso / Reset
          </button>
        </div>

        <!-- Contenedor Scrolleable de Contenido -->
        <div class="flex-1 overflow-y-auto space-y-4 pr-1">
          
          <!-- ========================================================== -->
          <!-- PESTAÑA 1: LIBRETA DE MÚLTIPLES DIRECCIONES (ESTILO UBER)  -->
          <!-- ========================================================== -->
          <div id="clientModalTabAddresses" class="space-y-3.5">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-extrabold text-white">📍 Mis Direcciones de Entrega</h4>
                <p class="text-[10px] text-[#8A94A6]">Agrega casa, oficina, universidad o casa de familiares y alterna en 1 clic</p>
              </div>
              <button type="button" onclick="openAddressBookForm()" class="px-3 py-1.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-[11px] shadow transition-all shrink-0">
                + Nueva Dirección
              </button>
            </div>

            <!-- Lista Dinámica de Direcciones Guardadas del Usuario -->
            <div id="clientSavedAddressesList" class="space-y-2.5">
              <!-- Renderizado dinámico por renderClientAddressBook() -->
            </div>

            <!-- Formulario para Agregar / Editar una Dirección en la Libreta -->
            <div id="clientAddressFormBox" class="hidden p-3.5 sm:p-4 rounded-2xl bg-[#0D0F14] border-2 border-[#06C167]/50 space-y-3">
              <div class="flex items-center justify-between border-b border-[#262D3B] pb-2">
                <h5 id="addrFormTitle" class="text-xs font-black text-[#06C167] flex items-center gap-1.5">
                  <span>📍</span> Agregar Nueva Dirección
                </h5>
                <button type="button" onclick="closeAddressBookForm()" class="text-[#8A94A6] hover:text-white text-xs">✕ Cancelar</button>
              </div>

              <input type="hidden" id="addrFormEditId" value="" />

              <!-- Etiqueta Rápida (Casa, Oficina, Pareja, Universidad, Otro) -->
              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Etiqueta de la Dirección *</label>
                <div class="flex flex-wrap gap-1.5 mb-1.5">
                  <button type="button" onclick="selectAddrLabelChip('Casa', '🏠')" class="px-2.5 py-1 rounded-lg bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-[11px] font-bold">🏠 Casa</button>
                  <button type="button" onclick="selectAddrLabelChip('Oficina', '🏢')" class="px-2.5 py-1 rounded-lg bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-[11px] font-bold">🏢 Oficina</button>
                  <button type="button" onclick="selectAddrLabelChip('Pareja / Familia', '❤️')" class="px-2.5 py-1 rounded-lg bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-[11px] font-bold">❤️ Pareja / Familia</button>
                  <button type="button" onclick="selectAddrLabelChip('Universidad', '🎓')" class="px-2.5 py-1 rounded-lg bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-[11px] font-bold">🎓 Universidad</button>
                  <button type="button" onclick="selectAddrLabelChip('Otro', '📍')" class="px-2.5 py-1 rounded-lg bg-[#161922] hover:bg-[#1F2430] border border-[#262D3B] text-white text-[11px] font-bold">📍 Otro</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" id="addrFormLabel" value="Casa" placeholder="Nombre de etiqueta (ej. Casa Mamá)" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                  <select id="addrFormBuildingType" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]">
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
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[10px] text-[#8A94A6] font-semibold">Zona o Sector en Managua (Calcula distancia y envío) *</label>
                  <button type="button" onclick="useCurrentGpsForAddressForm()" class="text-[10px] text-[#06C167] hover:underline font-bold flex items-center gap-1">
                    <span>🎯</span> Usar mi GPS actual
                  </button>
                </div>
                <select id="addrFormZoneSelect" onchange="handleZonePresetChange(this.value)" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]">
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
                <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Dirección Exacta (Calle, número de casa, referencias viales) *</label>
                <input type="text" id="addrFormExact" placeholder="Ej: Del Hotel Colón 1c al Sur, 1/2c al Este, Casa #42" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>

              <!-- Referencia de Entrega y Teléfono Receptor -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Instrucciones para el Repartidor</label>
                  <input type="text" id="addrFormReference" placeholder="Ej: Portón negro, tocar timbre o llamar" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Teléfono de Contacto en este Punto</label>
                  <input type="text" id="addrFormPhone" placeholder="+505 8888-0000" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
              </div>

              <label class="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" id="addrFormDefault" checked class="rounded border-[#262D3B] text-[#06C167] focus:ring-[#06C167]" />
                <span class="text-[11px] text-white font-semibold">Establecer como mi dirección de entrega principal</span>
              </label>

              <button type="button" onclick="saveAddressToBook()" class="w-full py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs shadow-lg shadow-[#06C167]/20 transition-all">
                💾 Guardar Dirección en mi Libreta
              </button>
            </div>
          </div>

          <!-- ========================================================== -->
          <!-- PESTAÑA 2: PERFIL, TELÉFONO Y PREGUNTA DE SEGURIDAD        -->
          <!-- ========================================================== -->
          <div id="clientModalTabProfile" class="hidden space-y-3.5">
            <div class="p-3.5 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-3">
              <h4 class="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>📱</span> Datos Personales y Teléfono de Contacto
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Nombre Completo *</label>
                  <input type="text" id="clientProfileNameInput" value="" placeholder="Ej: Mateo Blandón" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>

                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Teléfono Móvil (+505) *</label>
                  <input type="text" id="clientProfilePhoneInput" value="" placeholder="+505 8888-0000" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1">Correo Electrónico</label>
                <input type="email" id="clientProfileEmailInput" value="" placeholder="tu.correo@pedidosnica.com" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[10px] text-[#8A94A6]">Dirección de Entrega Activa *</label>
                  <button type="button" onclick="switchClientModalTab('addresses')" class="text-[10px] text-[#06C167] hover:underline font-bold">Ver todas mis direcciones →</button>
                </div>
                <input type="text" id="clientProfileAddressInput" value="Galerías Santo Domingo, Managua" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>

              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1">Instrucciones / Notas de Entrega</label>
                <textarea id="clientProfileNotesInput" rows="2" placeholder="Ej: Portón negro, llamar al llegar..." class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#06C167]"></textarea>
              </div>
            </div>

            <!-- Configuración de Pregunta de Seguridad y Contraseña -->
            <div class="p-3.5 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>🛡️</span> Seguridad y Recuperación de Cuenta
                </h4>
                <button type="button" onclick="switchClientModalTab('auth'); toggleClientPasswordRecovery(true);" class="text-[10px] text-[#06C167] hover:underline font-bold">
                  🔓 Resetear por Email/SMS
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Pregunta de Seguridad</label>
                  <select id="clientProfileSecQuestion" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]">
                    <option value="¿Cuál es tu comida nica favorita?">¿Cuál es tu comida nica favorita?</option>
                    <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                    <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                    <option value="¿Cuál es el segundo nombre de tu madre?">¿Cuál es el segundo nombre de tu madre?</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Respuesta de Seguridad</label>
                  <input type="text" id="clientProfileSecAnswer" placeholder="Ej: gallo pinto" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1">Cambiar Contraseña Directamente (Opcional)</label>
                <input type="password" id="clientProfileNewPassword" placeholder="Dejar en blanco para mantener la actual..." class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>
            </div>

            <button onclick="saveClientProfile()" class="w-full py-3 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs transition-colors shadow-lg shadow-[#06C167]/25">
              💾 Guardar Cambios de Perfil, Teléfono y Seguridad
            </button>
          </div>

          <!-- ========================================================== -->
          <!-- PESTAÑA 3: HISTORIAL DE PEDIDOS                            -->
          <!-- ========================================================== -->
          <div id="clientModalTabOrders" class="hidden space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-white">Mis Pedidos Recientes</h4>
              <button onclick="loadClientOrderHistory()" class="text-[11px] text-[#06C167] hover:underline font-semibold flex items-center gap-1">
                <span>🔄</span> Actualizar
              </button>
            </div>
            <div id="clientOrderHistoryList" class="space-y-3 max-h-80 overflow-y-auto">
              Cargando tus pedidos...
            </div>
          </div>

          <!-- ========================================================== -->
          <!-- PESTAÑA 4: CAMBIAR CUENTA / LOGIN / RESET PASSWORD / REG   -->
          <!-- ========================================================== -->
          <div id="clientModalTabAuth" class="hidden space-y-4">
            
            <!-- Cuentas Demo de Cambio Rápido -->
            <div>
              <label class="block text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1.5">⚡ Cambio Rápido a Cuenta Demo (Con Múltiples Direcciones)</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="quickSwitchDemoClient('mateo')" class="p-2.5 rounded-xl bg-[#0D0F14] hover:bg-[#1A1D26] border border-[#262D3B] hover:border-[#06C167] text-left transition-all">
                  <div class="font-bold text-white text-xs">Mateo Blandón</div>
                  <div class="text-[10px] text-[#8A94A6] truncate">mateo@pedidosnica.com • +505 8711-2299</div>
                  <span class="inline-block mt-1 text-[9px] bg-[#06C167]/15 text-[#06C167] px-1.5 py-0.5 rounded font-mono font-bold">3 Direcciones Guardadas</span>
                </button>

                <button type="button" onclick="quickSwitchDemoClient('sofia')" class="p-2.5 rounded-xl bg-[#0D0F14] hover:bg-[#1A1D26] border border-[#262D3B] hover:border-[#06C167] text-left transition-all">
                  <div class="font-bold text-white text-xs">Sofía Chamorro</div>
                  <div class="text-[10px] text-[#8A94A6] truncate">sofia@pedidosnica.com • +505 8899-7711</div>
                  <span class="inline-block mt-1 text-[9px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded font-mono font-bold">2 Direcciones Guardadas</span>
                </button>
              </div>
            </div>

            <!-- Login por Correo o Teléfono -->
            <div id="clientLoginBox" class="p-3.5 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-2.5">
              <div class="flex items-center justify-between">
                <h5 class="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🔑</span> Iniciar Sesión
                </h5>
                <button type="button" onclick="toggleClientPasswordRecovery(true)" class="text-[11px] text-[#06C167] hover:underline font-bold">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1">Correo Electrónico o Teléfono (+505)</label>
                <input type="text" id="clientAuthEmailInput" placeholder="ej. mateo@pedidosnica.com o 8711-2299" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>
              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1">Contraseña</label>
                <input type="password" id="clientAuthPassInput" placeholder="••••••••" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>
              <button onclick="loginClientAccount()" class="w-full py-2.5 rounded-xl bg-[#06C167]/15 hover:bg-[#06C167]/25 text-[#06C167] border border-[#06C167]/40 font-bold text-xs transition-colors">
                Entrar a mi Cuenta
              </button>
            </div>

            <!-- ================================================================== -->
            <!-- CENTRO DE RECUPERACIÓN DE CONTRASEÑA (EMAIL / SMS / PREGUNTA SEG.) -->
            <!-- ================================================================== -->
            <div id="clientPasswordRecoveryBox" class="hidden p-4 rounded-2xl bg-[#0D0F14] border-2 border-[#06C167]/40 space-y-3">
              <div class="flex items-center justify-between border-b border-[#262D3B] pb-2">
                <div>
                  <h5 class="text-xs font-black text-[#06C167] flex items-center gap-1.5">
                    <span>🔓</span> Recuperación y Reseteo de Contraseña
                  </h5>
                  <p class="text-[10px] text-[#8A94A6]">Elige tu método de verificación preferido</p>
                </div>
                <button type="button" onclick="toggleClientPasswordRecovery(false)" class="text-[11px] text-[#8A94A6] hover:text-white">✕ Volver</button>
              </div>

              <!-- Selector de Método: EMAIL | SMS | SECURITY_QUESTION -->
              <div class="grid grid-cols-3 gap-1 p-1 bg-[#14161D] border border-[#262D3B] rounded-xl text-[10px]">
                <button type="button" id="recMethodBtnEMAIL" onclick="selectRecoveryMethod('EMAIL')" class="py-1.5 px-2 rounded-lg font-bold bg-[#06C167] text-black transition-all">
                  📧 Email OTP
                </button>
                <button type="button" id="recMethodBtnSMS" onclick="selectRecoveryMethod('SMS')" class="py-1.5 px-2 rounded-lg font-semibold text-[#8A94A6] hover:text-white transition-all">
                  📱 SMS / Tel.
                </button>
                <button type="button" id="recMethodBtnSECURITY_QUESTION" onclick="selectRecoveryMethod('SECURITY_QUESTION')" class="py-1.5 px-2 rounded-lg font-semibold text-[#8A94A6] hover:text-white transition-all">
                  🛡️ Pregunta
                </button>
              </div>

              <!-- Paso 1: Identificar Cuenta -->
              <div class="space-y-2">
                <label id="recIdentifierLabel" class="block text-[10px] text-[#8A94A6] font-semibold">Ingresa tu Correo Electrónico o Teléfono registrado *</label>
                <div class="flex items-center gap-2">
                  <input type="text" id="recIdentifierInput" placeholder="ej. mateo@pedidosnica.com o +505 8711-2299" class="flex-1 bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                  <button type="button" id="recInitiateBtn" onclick="initiateClientPasswordRecovery()" class="px-3 py-2 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs shrink-0 transition-colors">
                    Enviar Código
                  </button>
                </div>
              </div>

              <!-- Banner de Simulación de Código OTP / Pregunta de Seguridad -->
              <div id="recDemoNotificationBanner" class="hidden p-3 rounded-xl bg-[#06C167]/15 border border-[#06C167]/40 text-xs space-y-1.5">
                <!-- Se llena dinámicamente con el código OTP simulado o la pregunta de seguridad -->
              </div>

              <!-- Paso 2: Verificar Código / Respuesta y Definir Nueva Contraseña -->
              <div id="recStep2Box" class="hidden space-y-2.5 pt-2 border-t border-[#262D3B]">
                <div id="recOtpInputGroup">
                  <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Código de Verificación de 6 dígitos *</label>
                  <input type="text" id="recOtpCodeInput" maxlength="6" placeholder="Ej: 482910" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white font-mono tracking-widest text-center text-sm font-black outline-none focus:border-[#06C167]" />
                </div>

                <div id="recSecQuestionGroup" class="hidden space-y-1.5">
                  <div class="p-2.5 rounded-xl bg-[#14161D] border border-[#262D3B]">
                    <span class="text-[10px] text-[#8A94A6] block">Pregunta de Seguridad de tu Cuenta:</span>
                    <span id="recSecQuestionDisplay" class="text-xs font-bold text-amber-400">¿Cuál es tu comida nica favorita?</span>
                  </div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Tu Respuesta *</label>
                  <input type="text" id="recSecAnswerInput" placeholder="Escribe tu respuesta..." class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Nueva Contraseña *</label>
                    <input type="password" id="recNewPasswordInput" placeholder="Mínimo 6 caracteres" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-[#8A94A6] mb-1 font-semibold">Confirmar Contraseña *</label>
                    <input type="password" id="recConfirmPasswordInput" placeholder="Repite la contraseña" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                  </div>
                </div>

                <button type="button" onclick="completeClientPasswordRecovery()" class="w-full py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs shadow-lg shadow-[#06C167]/25 transition-all">
                  ✅ Verificar y Guardar Nueva Contraseña
                </button>
              </div>
            </div>

            <!-- Registro de Nueva Cuenta con Dirección y Pregunta de Seguridad -->
            <div class="p-3.5 rounded-2xl bg-[#0D0F14] border border-[#262D3B] space-y-2.5">
              <h5 class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>✨</span> Crear Nueva Cuenta de Comensal
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Nombre Completo *</label>
                  <input type="text" id="regClientName" placeholder="Tu Nombre y Apellido" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Teléfono Móvil (+505) *</label>
                  <input type="text" id="regClientPhone" placeholder="+505 8888-0000" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Correo Electrónico *</label>
                  <input type="email" id="regClientEmail" placeholder="comensal@pedidosnica.com" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Contraseña *</label>
                  <input type="password" id="regClientPassword" placeholder="Mínimo 6 caracteres" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
              </div>
              <div>
                <label class="block text-[10px] text-[#8A94A6] mb-1">Dirección Principal en Managua</label>
                <input type="text" id="regClientAddress" placeholder="Ej: Colonia Los Robles, Rotonda El Güegüense 2c al Sur" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Pregunta de Seguridad</label>
                  <select id="regClientSecQuestion" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]">
                    <option value="¿Cuál es tu comida nica favorita?">¿Cuál es tu comida nica favorita?</option>
                    <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                    <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-[#8A94A6] mb-1">Respuesta de Seguridad</label>
                  <input type="text" id="regClientSecAnswer" placeholder="Ej: gallo pinto" class="w-full bg-[#14161D] border border-[#262D3B] rounded-xl p-2 text-white text-xs outline-none focus:border-[#06C167]" />
                </div>
              </div>
              <button onclick="registerClientAccount()" class="w-full py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-extrabold text-xs transition-colors shadow">
                Registrarme como Comensal
              </button>
            </div>

            <!-- Botón Cerrar Sesión -->
            <div class="pt-1">
              <button onclick="logoutClientAccount()" class="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors">
                🚪 Cerrar Sesión Actual
              </button>
            </div>

          </div>

        </div>

        <!-- Footer del Modal -->
        <div class="flex justify-end pt-2 border-t border-[#262D3B] shrink-0">
          <button onclick="closeClientProfileModal()" class="px-4 py-2 rounded-xl bg-[#222] hover:bg-[#333] text-white font-bold text-xs transition-colors">
            Cerrar
          </button>
        </div>

      </div>
    </div>

  <script src="/client/script.js"></script>

  ${getFooter()}`;
}

module.exports = { renderClientApp };
