// ============================================================================
// CENTRAL HUB - CONSOLA EXCLUSIVA DEL APP MANAGER (SUPER_ADMIN) & GESTIÓN IAM
// ============================================================================

function renderHub(options = {}) {
  const {
    currentCommissionRate = 15.0,
    SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co',
    getHeader,
    getFooter,
    lanIp = '192.168.1.20',
    port = 3000,
    tunnelBaseUrl = 'https://1de3b77b254e8b.lhr.life'
  } = options;

  return `${getHeader('Central Hub | App Manager & Gestión de Usuarios')}
  
  <!-- ACCESO RESTRINGIDO - GATEWAY DEL APP MANAGER -->
  <div id="managerAccessGate" class="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 bg-[#06C167]/10 text-[#06C167] border border-[#06C167]/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
        <span class="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
        Seguridad de Plataforma • Acceso Restringido
      </div>
      <h1 class="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight">
        Central Hub — Consola del App Manager
      </h1>
      <p class="text-xs sm:text-sm text-[#A6A6A6] mt-2 max-w-xl mx-auto">
        Esta consola central gestiona los usuarios y roles (RBAC), comisiones de la red, Torre de Control de toda la flota y configuración global. <strong class="text-white">Uso reservado exclusivamente para el Administrador de la Plataforma</strong>.
      </p>
    </div>

    <!-- TARJETA DESTACADA DE ACCESO MÓVIL (RED LOCAL WI-FI + TÚNEL QR) -->
    <div class="mb-8 p-5 rounded-3xl bg-[#121212] border-2 border-[#06C167]/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="space-y-1.5 text-center md:text-left">
        <div class="inline-flex items-center gap-2 text-xs font-black text-[#06C167] uppercase tracking-wider">
          <span>📲</span> Acceso en Vivo desde tu Teléfono
        </div>
        <h3 class="text-base font-black text-white">¿Quieres abrir las Apps en tu Celular?</h3>
        <p class="text-xs text-[#A6A6A6] max-w-xl leading-relaxed">
          En tu teléfono no escribas <code class="text-white font-mono bg-black px-1.5 py-0.5 rounded">localhost</code>. Entra usando la IP local de tu PC en Wi-Fi (<code class="text-[#06C167] font-mono font-bold">http://${lanIp}:${port}</code>) o el Túnel HTTPS Universal (<code class="text-[#06C167] font-mono font-bold">${tunnelBaseUrl}</code>).
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-2 shrink-0">
        <button onclick="window.openMobileAccessModal('lan')" class="px-4 py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-[#06C167]/20">
          <span>📲</span> Ver Códigos QR (Wi-Fi Local)
        </button>
        <button onclick="window.openMobileAccessModal('tunnel')" class="px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#06C167]/40 font-bold text-xs transition-all flex items-center gap-1.5">
          <span>⚡</span> QR Túnel Anti-Bloqueo
        </button>
      </div>
    </div>

    <!-- AVISO CUANDO UN RESTAURANTE O DRIVER INTENTA ENTRAR -->
    <div id="nonManagerRoleNotice" class="hidden mb-6 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
      <div class="flex items-center gap-2.5">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-bold text-white text-sm">Acceso No Permitido a la Consola Global</p>
          <p class="text-amber-200/90 text-xs mt-0.5">Tu cuenta actual tiene rol de <strong id="detectedRoleName" class="underline text-white font-bold">Restaurante</strong>. Como Administrador de Restaurante o Repartidor, no puedes ver la Torre de Control ni la consola del Manager.</p>
        </div>
      </div>
      <button onclick="logoutAppManager()" class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-xs shrink-0 transition-all">
        Cerrar Sesión Actual
      </button>
    </div>

    <!-- CUADRÍCULA DE PORTALES DEDICADOS PARA OTROS ROLES -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      
      <!-- Card Restaurante -->
      <a href="/restaurant" class="p-5 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#06C167] transition-all group flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="p-2.5 rounded-xl bg-[#1C1C1C] text-2xl group-hover:scale-110 transition-transform">🏪</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F1F1F] text-[#A6A6A6]">Admin / Cocina</span>
          </div>
          <h3 class="text-sm font-bold text-white group-hover:text-[#06C167] transition-colors">Portal de Restaurante</h3>
          <p class="text-[11px] text-[#8A94A6] mt-1">Acceso para dueños (configuración) y cocineros (comandas KDS).</p>
        </div>
        <span class="text-xs font-bold text-[#06C167] mt-4 flex items-center gap-1">Entrar a Restaurante →</span>
      </a>

      <!-- Card Driver -->
      <a href="/driver" class="p-5 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#06C167] transition-all group flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="p-2.5 rounded-xl bg-[#1C1C1C] text-2xl group-hover:scale-110 transition-transform">🛵</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F1F1F] text-[#A6A6A6]">Repartidores</span>
          </div>
          <h3 class="text-sm font-bold text-white group-hover:text-[#06C167] transition-colors">App de Repartidor</h3>
          <p class="text-[11px] text-[#8A94A6] mt-1">Radar en tiempo real, bolsa de pedidos de zona y navegación GPS.</p>
        </div>
        <span class="text-xs font-bold text-[#06C167] mt-4 flex items-center gap-1">Entrar a Driver App →</span>
      </a>

      <!-- Card Cliente -->
      <a href="/client" class="p-5 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#06C167] transition-all group flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="p-2.5 rounded-xl bg-[#1C1C1C] text-2xl group-hover:scale-110 transition-transform">🍔</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F1F1F] text-[#A6A6A6]">Comensales</span>
          </div>
          <h3 class="text-sm font-bold text-white group-hover:text-[#06C167] transition-colors">App de Clientes</h3>
          <p class="text-[11px] text-[#8A94A6] mt-1">Catálogo de comidas, pedidos online y live tracking con MapLibre.</p>
        </div>
        <span class="text-xs font-bold text-[#06C167] mt-4 flex items-center gap-1">Entrar a Clientes →</span>
      </a>

    </div>

    <!-- FORMULARIO DE ACCESO EXCLUSIVO APP MANAGER -->
    <div class="max-w-md mx-auto bg-[#121212] border-2 border-[#06C167]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
      <div class="text-center space-y-1">
        <span class="text-3xl">🛡️</span>
        <h2 class="text-lg font-black text-white">Ingreso de App Manager</h2>
        <p class="text-xs text-[#8A94A6]">Introduce tus credenciales de Super Administrador para desbloquear el Hub.</p>
      </div>

      <form onsubmit="event.preventDefault(); window.loginAsManager(document.getElementById('managerEmailInput').value, document.getElementById('managerPasswordInput').value);" class="space-y-3.5 pt-2">
        <div>
          <label class="block text-[11px] uppercase font-bold text-[#8A94A6] mb-1">Correo Electrónico</label>
          <input type="email" id="managerEmailInput" value="manager@pedidosnica.com" required class="w-full bg-[#181D26] border border-[#2B3444] focus:border-[#06C167] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none" />
        </div>
        <div>
          <label class="block text-[11px] uppercase font-bold text-[#8A94A6] mb-1">Contraseña</label>
          <input type="password" id="managerPasswordInput" value="Password123!" required class="w-full bg-[#181D26] border border-[#2B3444] focus:border-[#06C167] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none" />
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#06C167]/20 flex items-center justify-center gap-2">
          <span>🔓</span> Iniciar Sesión como App Manager
        </button>
      </form>

      <div class="pt-2 border-t border-[#222938] text-center">
        <button onclick="quickDemoManagerLogin()" class="text-xs text-[#06C167] font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
          <span>⚡</span> Acceso Rápido Demo: Carlos Ortega (App Manager)
        </button>
      </div>
    </div>
  </div>

  <!-- CONTENIDO COMPLETO DEL HUB (VISIBLE ÚNICAMENTE PARA SUPER_ADMIN) -->
  <div id="managerHubContent" class="hidden max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
    
    <!-- TOPBAR PRIVADA DEL APP MANAGER -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#141720] border border-[#252E3E] rounded-2xl shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 flex items-center justify-center text-xl">
          🛡️
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-white" id="managerDisplayName">Carlos Ortega</h2>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#06C167] text-black">SUPER_ADMIN</span>
          </div>
          <p class="text-[11px] text-[#8A94A6] font-mono">manager@pedidosnica.com • Director de Operaciones & IAM</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <a href="#iamSection" class="px-3.5 py-2 rounded-xl bg-[#06C167]/15 hover:bg-[#06C167]/25 text-[#06C167] border border-[#06C167]/30 text-xs font-bold transition-all flex items-center gap-1.5">
          <span>👥</span> Gestión de Usuarios (<span id="topCountUsers">0</span>)
        </a>
        <a href="/admin/control-tower" class="px-3.5 py-2 rounded-xl bg-[#1E2532] hover:bg-[#2A3446] text-white border border-[#2E3A4E] text-xs font-bold transition-all flex items-center gap-1.5">
          <span>📡</span> Torre de Control GPS
        </a>
        <a href="/admin/fares" class="px-3.5 py-2 rounded-xl bg-[#1E2532] hover:bg-[#2A3446] text-white border border-[#2E3A4E] text-xs font-bold transition-all flex items-center gap-1.5">
          <span>⚙️</span> Tarifas & Geocercas
        </a>
        <button onclick="logoutAppManager()" class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5">
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </div>

    <header class="text-center">
      <div class="inline-flex items-center gap-2 bg-[#06C167]/10 text-[#06C167] border border-[#06C167]/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
        <span class="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
        Consola Global Centralizada • App Manager
      </div>
      <div class="flex items-center justify-center gap-1.5 mt-3">
        <span class="font-extrabold text-3xl sm:text-4xl tracking-tighter text-white">Pedidos</span>
        <span class="font-black text-3xl sm:text-4xl tracking-tighter text-[#06C167]">Nica</span>
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A6A6A6] bg-[#1F1F1F] px-2.5 py-1 rounded-lg border border-[#2E2E2E] ml-2">Manager Hub</span>
      </div>
      <p class="text-[#A6A6A6] text-xs sm:text-sm mt-2 max-w-xl mx-auto">
        Panel administrativo exclusivo para gestionar identidades y roles de usuarios, supervisar restaurantes afiliados, flota de motorizados y parámetros de rentabilidad.
      </p>
    </header>

    <!-- ====================================================================== -->
    <!-- NUEVO MÓDULO TOP: CENTRO DE GESTIÓN DE USUARIOS, ROLES Y ACCESOS (IAM) -->
    <!-- ====================================================================== -->
    <section id="iamSection" class="bg-[#121212] border-2 border-[#06C167]/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242B38]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#06C167]/20 text-[#06C167] border border-[#06C167]/40">
              IAM & RBAC En Vivo
            </span>
            <span class="text-[11px] text-[#8A94A6] font-mono">Supabase Auth + Profiles</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black text-white mt-1">Centro de Gestión de Usuarios y Roles</h3>
          <p class="text-xs text-[#8A94A6] mt-0.5">
            Crea cuentas, asigna roles (SUPER_ADMIN, RESTAURANT_ADMIN, COCINA, DRIVER, CLIENT), verifica conductores o inicia sesión instantáneamente en cualquier cuenta.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="loadHubUsersDirectory()" class="px-3.5 py-2.5 rounded-xl bg-[#1A202C] hover:bg-[#242C3D] text-white border border-[#2D3748] text-xs font-bold transition-all">
            🔄 Sincronizar
          </button>
          <button onclick="openCreateUserModal()" class="px-4 py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs shadow-lg shadow-[#06C167]/25 transition-all flex items-center gap-1.5">
            <span>➕</span> Crear Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- KPIs de Usuarios por Rol (Color de Icono Uniforme #06C167) -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="p-3.5 rounded-2xl bg-[#161922] border border-[#252B3B]">
          <span class="text-[10px] uppercase font-bold text-[#06C167]">👥 Total Cuentas</span>
          <p class="text-2xl font-black text-white font-mono mt-0.5" id="iamCountTotal">0</p>
        </div>
        <div class="p-3.5 rounded-2xl bg-[#161922] border border-[#06C167]/30">
          <span class="text-[10px] uppercase font-bold text-[#06C167]">🍔 Clientes</span>
          <p class="text-2xl font-black text-white font-mono mt-0.5" id="iamCountClients">0</p>
        </div>
        <div class="p-3.5 rounded-2xl bg-[#161922] border border-[#06C167]/30">
          <span class="text-[10px] uppercase font-bold text-[#06C167]">🏪 Comercios / Staff</span>
          <p class="text-2xl font-black text-white font-mono mt-0.5" id="iamCountRests">0</p>
        </div>
        <div class="p-3.5 rounded-2xl bg-[#161922] border border-[#06C167]/30">
          <span class="text-[10px] uppercase font-bold text-[#06C167]">🛵 Repartidores</span>
          <p class="text-2xl font-black text-white font-mono mt-0.5" id="iamCountDrivers">0</p>
        </div>
        <div class="p-3.5 rounded-2xl bg-[#161922] border border-[#06C167]/30 col-span-2 sm:col-span-1">
          <span class="text-[10px] uppercase font-bold text-[#06C167]">🛡️ Super Admins</span>
          <p class="text-2xl font-black text-white font-mono mt-0.5" id="iamCountAdmins">0</p>
        </div>
      </div>

      <!-- Barra de Filtros por Rol y Búsqueda -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#161922] p-3 rounded-2xl border border-[#242B38]">
        <div class="flex flex-wrap items-center gap-1.5" id="iamRoleFilterPills">
          <button onclick="setIamRoleFilter('ALL')" data-role="ALL" class="iam-role-pill px-3 py-1.5 rounded-xl text-xs font-black bg-[#06C167] text-black transition-all">
            Todos
          </button>
          <button onclick="setIamRoleFilter('CLIENT')" data-role="CLIENT" class="iam-role-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1F2430] text-[#A6A6A6] hover:text-white transition-all">
            🍔 Clientes
          </button>
          <button onclick="setIamRoleFilter('RESTAURANT_ADMIN')" data-role="RESTAURANT_ADMIN" class="iam-role-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1F2430] text-[#A6A6A6] hover:text-white transition-all">
            🏪 Restaurantes & Cocina
          </button>
          <button onclick="setIamRoleFilter('DRIVER')" data-role="DRIVER" class="iam-role-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1F2430] text-[#A6A6A6] hover:text-white transition-all">
            🛵 Repartidores
          </button>
          <button onclick="setIamRoleFilter('SUPER_ADMIN')" data-role="SUPER_ADMIN" class="iam-role-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1F2430] text-[#A6A6A6] hover:text-white transition-all">
            🛡️ Super Admins
          </button>
        </div>

        <div class="flex items-center gap-2">
          <input type="text" id="iamSearchInput" oninput="renderIamUsersList()" placeholder="Buscar por nombre, correo, teléfono o local..." class="w-full md:w-72 bg-black border border-[#2E3646] focus:border-[#06C167] rounded-xl px-3.5 py-2 text-xs text-white outline-none" />
        </div>
      </div>

      <!-- Tabla / Lista de Usuarios -->
      <div class="overflow-x-auto rounded-2xl border border-[#242B38] bg-[#0E1017]">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#242B38] text-[10px] uppercase font-bold text-[#8A94A6] bg-[#141822]">
              <th class="py-3 px-4">Usuario / Identidad</th>
              <th class="py-3 px-4">Rol & Nivel RBAC</th>
              <th class="py-3 px-4">Asignación / Vehículo</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4 text-right">Acciones & Acceso Rápido</th>
            </tr>
          </thead>
          <tbody id="iamUsersTableBody" class="divide-y divide-[#1E2433] text-xs">
            <tr>
              <td colspan="5" class="py-8 text-center text-[#8A94A6]">Cargando directorio de usuarios desde Supabase...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ACCESO DIRECTO A LA TORRE DE CONTROL Y CONTROL DE COMISIÓN -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      <!-- Torre de Control -->
      <div class="md:col-span-8 bg-[#121212] border border-[#2E2E2E] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#06C167] animate-ping"></span>
              RADAR GLOBAL EN VIVO
            </span>
            <span class="text-xs text-[#8A94A6] font-mono">Managua Central</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black text-white">Torre de Control de Flota & Pedidos</h3>
          <p class="text-xs text-[#8A94A6] leading-relaxed">
            Supervisa en el mapa interactivo todos los repartidores activos en Managua, sus ubicaciones exactas transmitidas vía WebSockets, velocidades y pedidos en tránsito.
          </p>
        </div>
        <div class="pt-5 mt-4 border-t border-[#222938] flex items-center justify-between">
          <span class="text-xs text-[#8A94A6]">Telemetría en tiempo real</span>
          <a href="/admin/control-tower" class="px-5 py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs transition-all shadow-lg shadow-[#06C167]/20 flex items-center gap-2">
            <span>Abrir Torre de Control</span>
            <span>→</span>
          </a>
        </div>
      </div>

      <!-- Ajuste Global de Comisión -->
      <div class="md:col-span-4 bg-[#121212] border border-[#2E2E2E] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold uppercase text-[#8A94A6] block mb-2">Comisión Plataforma</span>
          <div class="flex items-baseline gap-2 mb-3">
            <span class="text-4xl font-black text-[#06C167] font-mono" id="hubCommissionDisplay">${currentCommissionRate}%</span>
            <span class="text-xs text-[#8A94A6]">Global</span>
          </div>
          <p class="text-[11px] text-[#8A94A6] leading-relaxed">
            Porcentaje retenido a los restaurantes por cada comanda para cubrir soporte, pasarela y tecnología.
          </p>
        </div>
        <div class="pt-4 border-t border-[#262626] space-y-2">
          <div class="flex items-center gap-2">
            <input type="number" id="quickCommissionInput" value="${currentCommissionRate}" step="0.5" min="5" max="35" class="w-20 bg-black border border-[#2E2E2E] focus:border-[#06C167] rounded-lg px-2 py-1.5 text-center text-xs text-white font-mono" />
            <button onclick="updatePlatformCommission(document.getElementById('quickCommissionInput').value)" class="flex-1 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-[#06C167] hover:text-black text-white text-xs font-bold transition-all border border-[#2E2E2E]">
              Guardar %
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- SECCIONES DE ACCESO RÁPIDO PARA AUDITORÍA -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Panel de Restaurante -->
      <div class="bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-2xl p-2.5 rounded-xl bg-[#1C1C1C]">🏪</span>
          <a href="/restaurant/onboard" class="text-[11px] text-[#06C167] hover:underline font-bold">+ Nuevo Local</a>
        </div>
        <div>
          <h4 class="text-base font-bold text-white">Red de Restaurantes</h4>
          <p class="text-xs text-[#8A94A6] mt-1">Supervisa las cocinas activas, comisiones y cartas de comida.</p>
        </div>
        <div class="space-y-2 pt-2 border-t border-[#222938]">
          <a href="/restaurant/orders" class="block p-2.5 rounded-xl bg-black hover:border-[#06C167] border border-[#262626] text-xs font-bold text-white flex justify-between items-center transition-colors">
            <span>🛎️ KDS de Cocina</span>
            <span class="text-[#06C167]">Abrir →</span>
          </a>
          <a href="/restaurant/menu" class="block p-2.5 rounded-xl bg-black hover:border-[#06C167] border border-[#262626] text-xs font-bold text-white flex justify-between items-center transition-colors">
            <span>📋 Carta y Modificadores</span>
            <span class="text-[#06C167]">Abrir →</span>
          </a>
        </div>
      </div>

      <!-- App de Repartidores -->
      <div class="bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-2xl p-2.5 rounded-xl bg-[#1C1C1C]">🛵</span>
          <span class="text-[10px] text-[#06C167] bg-[#06C167]/15 px-2 py-0.5 rounded-full font-bold">Flota Activa</span>
        </div>
        <div>
          <h4 class="text-base font-bold text-white">Flota de Conducción</h4>
          <p class="text-xs text-[#8A94A6] mt-1">Consola móvil de despachos, GPS Waze/Google Maps y bolsa de pedidos.</p>
        </div>
        <div class="space-y-2 pt-2 border-t border-[#222938]">
          <a href="/driver" class="block p-2.5 rounded-xl bg-black hover:border-[#06C167] border border-[#262626] text-xs font-bold text-white flex justify-between items-center transition-colors">
            <span>📲 App de Repartidor</span>
            <span class="text-[#06C167]">Abrir →</span>
          </a>
        </div>
      </div>

      <!-- App de Clientes -->
      <div class="bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-2xl p-2.5 rounded-xl bg-[#1C1C1C]">🍔</span>
          <span class="text-[10px] text-[#06C167] bg-[#06C167]/15 px-2 py-0.5 rounded-full font-bold">E-Commerce</span>
        </div>
        <div>
          <h4 class="text-base font-bold text-white">Experiencia de Comensal</h4>
          <p class="text-xs text-[#8A94A6] mt-1">Catálogo de productos, carrito de compra y live tracking con MapLibre.</p>
        </div>
        <div class="space-y-2 pt-2 border-t border-[#222938]">
          <a href="/client" class="block p-2.5 rounded-xl bg-black hover:border-[#06C167] border border-[#262626] text-xs font-bold text-white flex justify-between items-center transition-colors">
            <span>🛍️ Catálogo de Platos</span>
            <span class="text-[#06C167]">Abrir →</span>
          </a>
          <a href="/client/tracking" class="block p-2.5 rounded-xl bg-black hover:border-[#06C167] border border-[#262626] text-xs font-bold text-white flex justify-between items-center transition-colors">
            <span>📍 Tracking Live GPS</span>
            <span class="text-[#06C167]">Abrir →</span>
          </a>
        </div>
      </div>

    </div>

    <footer class="mt-12 text-center text-xs text-[#757575] border-t border-[#262626] pt-6">
      Base de Datos: <span class="font-mono text-[#A6A6A6]">${SUPABASE_URL}</span> • Motor de Despacho OSRM: <span class="font-mono text-[#A6A6A6]">http://localhost:4000</span>
    </footer>
  </div>

  <!-- ====================================================================== -->
  <!-- MODAL DE CREACIÓN / EDICIÓN DE USUARIO Y PERMISOS RBAC (HUB IAM)       -->
  <!-- ====================================================================== -->
  <div id="modalHubUserForm" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-[#141720] border-2 border-[#06C167]/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
      <div class="flex items-center justify-between pb-3 border-b border-[#252E3E]">
        <div class="flex items-center gap-2.5">
          <span class="p-2 rounded-xl bg-[#06C167]/15 text-[#06C167] text-lg">👥</span>
          <div>
            <h3 class="text-base font-black text-white" id="hubUserModalTitle">Crear Nuevo Usuario</h3>
            <p class="text-[11px] text-[#8A94A6]">Configura identidad, rol de plataforma y permisos específicos</p>
          </div>
        </div>
        <button onclick="closeHubUserModal()" class="text-[#8A94A6] hover:text-white text-base p-1">✕</button>
      </div>

      <form id="hubUserForm" onsubmit="saveHubUserForm(event)" class="space-y-3.5">
        <input type="hidden" id="hubFormUserId" value="" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] font-bold uppercase text-[#8A94A6] mb-1">Nombre Completo *</label>
            <input type="text" id="hubFormFullName" required placeholder="Ej: Andrea Castillo" class="w-full bg-[#0D1017] border border-[#283244] focus:border-[#06C167] rounded-xl p-2.5 text-white outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-[#8A94A6] mb-1">Teléfono / WhatsApp *</label>
            <input type="text" id="hubFormPhone" required placeholder="+505 8888-1122" class="w-full bg-[#0D1017] border border-[#283244] focus:border-[#06C167] rounded-xl p-2.5 text-white outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] font-bold uppercase text-[#8A94A6] mb-1">Correo Electrónico *</label>
            <input type="email" id="hubFormEmail" required placeholder="usuario@pedidosnica.com" class="w-full bg-[#0D1017] border border-[#283244] focus:border-[#06C167] rounded-xl p-2.5 text-white outline-none" />
          </div>
          <div id="hubFormPasswordWrap">
            <label class="block text-[10px] font-bold uppercase text-[#8A94A6] mb-1">Contraseña (Crear / Resetear)</label>
            <input type="text" id="hubFormPassword" value="Password123!" placeholder="Nueva contraseña..." class="w-full bg-[#0D1017] border border-[#283244] focus:border-[#06C167] rounded-xl p-2.5 text-white font-mono outline-none" />
          </div>
        </div>

        <!-- Dirección Principal y Pregunta de Seguridad -->
        <div class="p-3.5 rounded-2xl bg-[#0D1017] border border-[#283244] space-y-3">
          <p class="text-[11px] font-bold text-[#06C167] flex items-center justify-between">
            <span>📍 Dirección Principal, Libreta Multi-Dirección y Seguridad</span>
            <span id="hubFormAddrCountBadge" class="text-[10px] bg-[#06C167]/15 px-2 py-0.5 rounded-full font-mono">0 guardadas</span>
          </p>
          <div>
            <label class="block text-[10px] text-[#8A94A6] mb-1">Dirección Activa / Principal</label>
            <input type="text" id="hubFormAddress" placeholder="Ej: Colonia Los Robles, Rotonda El Güegüense 2c al Sur, Managua" class="w-full bg-[#141822] border border-[#283244] focus:border-[#06C167] rounded-xl p-2 text-white outline-none" />
          </div>

          <!-- Lista de múltiples direcciones del usuario y botón para agregar otra -->
          <div id="hubFormSavedAddressesList" class="space-y-1.5 max-h-32 overflow-y-auto"></div>
          <div class="flex items-center gap-2">
            <input type="text" id="hubFormNewExtraLabel" placeholder="Etiqueta (ej. Oficina)" class="w-28 bg-[#141822] border border-[#283244] rounded-xl p-1.5 text-white text-[11px] outline-none" />
            <input type="text" id="hubFormNewExtraAddr" placeholder="Agregar otra dirección para este usuario..." class="flex-1 bg-[#141822] border border-[#283244] rounded-xl p-1.5 text-white text-[11px] outline-none" />
            <button type="button" onclick="addHubUserExtraAddress()" class="px-2.5 py-1.5 rounded-xl bg-[#06C167]/20 hover:bg-[#06C167] text-[#06C167] hover:text-black font-bold text-[11px] transition-all shrink-0">+ Dirección</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#1E2534]">
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-1">Pregunta de Seguridad (Reset)</label>
              <select id="hubFormSecQuestion" class="w-full bg-[#141822] border border-[#283244] rounded-xl p-2 text-white outline-none">
                <option value="¿Cuál es tu comida nica favorita?">¿Cuál es tu comida nica favorita?</option>
                <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-1">Respuesta de Seguridad</label>
              <input type="text" id="hubFormSecAnswer" value="gallo pinto" placeholder="Respuesta..." class="w-full bg-[#141822] border border-[#283244] rounded-xl p-2 text-white outline-none" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#222938]">
          <div>
            <label class="block text-[10px] font-bold uppercase text-[#06C167] mb-1">Rol Principal en Ecosistema *</label>
            <select id="hubFormRole" onchange="onHubFormRoleChange()" class="w-full bg-[#0D1017] border border-[#06C167]/50 rounded-xl p-2.5 text-white font-bold outline-none">
              <option value="CLIENT">🍔 Cliente / Comensal (CLIENT)</option>
              <option value="RESTAURANT_ADMIN">🏪 Comercio / Restaurante (RESTAURANT_ADMIN)</option>
              <option value="DRIVER">🛵 Repartidor de Flota (DRIVER)</option>
              <option value="SUPER_ADMIN">🛡️ Super Admin Plataforma (SUPER_ADMIN)</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-[#8A94A6] mb-1">Estado de la Cuenta</label>
            <select id="hubFormStatus" class="w-full bg-[#0D1017] border border-[#283244] rounded-xl p-2.5 text-white font-bold outline-none">
              <option value="ACTIVE">🟢 Activo / Verificado</option>
              <option value="PENDING">🟡 Pendiente de Aprobación</option>
              <option value="SUSPENDED">🔴 Suspendido / Bloqueado</option>
            </select>
          </div>
        </div>

        <!-- Campos exclusivos para RESTAURANT_ADMIN -->
        <div id="hubFormRestaurantSection" class="hidden p-3.5 rounded-2xl bg-[#0D1017] border border-purple-500/40 space-y-3">
          <p class="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
            <span>🏪</span> Configuración de Acceso a Restaurante
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-1">Nivel Operativo (Subrol)</label>
              <select id="hubFormSubrole" class="w-full bg-[#141822] border border-[#283244] rounded-xl p-2 text-white outline-none">
                <option value="ADMIN">👑 Dueño / Administrador Total</option>
                <option value="STAFF">👨‍🍳 Operador de Cocina (Solo KDS)</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-1">Sucursal Asignada</label>
              <select id="hubFormRestaurantId" class="w-full bg-[#141822] border border-[#283244] rounded-xl p-2 text-white outline-none">
              </select>
            </div>
          </div>
          <label class="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" id="hubFormMultiManage" class="accent-purple-500 w-4 h-4 rounded" />
            <span class="text-purple-200 font-semibold">Habilitar Multi-Gestión de Cadena (Puede alternar entre varias sucursales)</span>
          </label>
        </div>

        <!-- Campos exclusivos para DRIVER -->
        <div id="hubFormDriverSection" class="hidden p-3.5 rounded-2xl bg-[#0D1017] border border-blue-500/40 space-y-3">
          <p class="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
            <span>🛵</span> Datos de Flota y Vehículo del Conductor
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-1">Tipo de Vehículo</label>
              <select id="hubFormVehicleType" class="w-full bg-[#141822] border border-[#283244] rounded-xl p-2 text-white outline-none">
                <option value="MOTORCYCLE">🛵 Motocicleta</option>
                <option value="BICYCLE">🚲 Bicicleta</option>
                <option value="CAR">🚗 Automóvil</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-[#8A94A6] mb-1">Placa / Identificador</label>
              <input type="text" id="hubFormLicensePlate" placeholder="M-48291" value="M-48291" class="w-full bg-[#141822] border border-[#283244] rounded-xl p-2 text-white font-mono outline-none" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#252E3E]">
          <button type="button" onclick="closeHubUserModal()" class="px-4 py-2.5 rounded-xl bg-[#1F2430] hover:bg-[#2A3142] text-white font-bold">
            Cancelar
          </button>
          <button type="submit" id="btnHubSaveUser" class="px-5 py-2.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black shadow-lg shadow-[#06C167]/25">
            Guardar Usuario
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- TOAST DE RETROALIMENTACIÓN HUB -->
  <div id="hubToast" class="hidden fixed bottom-6 right-6 z-50 bg-[#141822] border-2 border-[#06C167] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5">
    <span id="hubToastIcon" class="text-lg">✓</span>
    <span id="hubToastText">Acción completada</span>
  </div>

  <script>
    (function() {
      let allHubUsers = [];
      let allHubRestaurants = [];
      let currentIamRoleFilter = 'ALL';

      function showHubToast(msg, icon = '✓') {
        const t = document.getElementById('hubToast');
        const txt = document.getElementById('hubToastText');
        const ic = document.getElementById('hubToastIcon');
        if (!t || !txt) return;
        txt.innerText = msg;
        if (ic) ic.innerText = icon;
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 3200);
      }

      function checkManagerAuth() {
        let user = JSON.parse(localStorage.getItem('pedidosnica_user') || 'null');
        const restUser = JSON.parse(localStorage.getItem('pedidosnica_rest_user') || 'null');

        if ((!user || user.role !== 'SUPER_ADMIN') && restUser) {
          user = {
            full_name: restUser.full_name || 'Roberto Morales',
            role: 'RESTAURANT_ADMIN',
            subrole: restUser.subrole || 'ADMIN'
          };
        }

        const gate = document.getElementById('managerAccessGate');
        const content = document.getElementById('managerHubContent');
        const notice = document.getElementById('nonManagerRoleNotice');
        const roleLabel = document.getElementById('detectedRoleName');
        const nameDisplay = document.getElementById('managerDisplayName');

        if (!user || user.role !== 'SUPER_ADMIN') {
          if (gate) gate.classList.remove('hidden');
          if (content) content.classList.add('hidden');
          if (user) {
            if (notice) notice.classList.remove('hidden');
            if (roleLabel) {
              const rMap = {
                'RESTAURANT_ADMIN': user.subrole === 'STAFF' ? 'Operador de Cocina (Staff)' : 'Administrador de Restaurante',
                'DRIVER': 'Repartidor',
                'CLIENT': 'Cliente / Comensal'
              };
              roleLabel.innerText = rMap[user.role] || user.role;
            }
          } else {
            if (notice) notice.classList.add('hidden');
          }
        } else {
          if (gate) gate.classList.add('hidden');
          if (content) content.classList.remove('hidden');
          if (nameDisplay) nameDisplay.innerText = user.full_name || 'Carlos Ortega';
          loadHubUsersDirectory();
        }
      }

      window.loadHubUsersDirectory = async function() {
        try {
          const resp = await fetch('/api/auth/users');
          const data = await resp.json();
          if (data.success) {
            allHubUsers = data.users || [];
            allHubRestaurants = data.restaurants || [];
            populateRestaurantSelect();
            updateIamKpis();
            renderIamUsersList();
          }
        } catch (err) {
          console.error('Error cargando directorio IAM:', err);
        }
      };

      function populateRestaurantSelect() {
        const sel = document.getElementById('hubFormRestaurantId');
        if (!sel) return;
        if (allHubRestaurants.length === 0) {
          sel.innerHTML = '<option value="6701bc0c-e5ce-475a-8893-75e9d06e8012">Pupusería & Antojitos El Diamante</option>';
          return;
        }
        sel.innerHTML = allHubRestaurants.map(r => \`<option value="\${r.id}">\${r.name}</option>\`).join('');
      }

      function updateIamKpis() {
        const total = allHubUsers.length;
        const clients = allHubUsers.filter(u => u.role === 'CLIENT').length;
        const rests = allHubUsers.filter(u => u.role === 'RESTAURANT_ADMIN').length;
        const drivers = allHubUsers.filter(u => u.role === 'DRIVER').length;
        const admins = allHubUsers.filter(u => u.role === 'SUPER_ADMIN').length;

        const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
        setTxt('topCountUsers', total);
        setTxt('iamCountTotal', total);
        setTxt('iamCountClients', clients);
        setTxt('iamCountRests', rests);
        setTxt('iamCountDrivers', drivers);
        setTxt('iamCountAdmins', admins);
      }

      window.setIamRoleFilter = function(role) {
        currentIamRoleFilter = role;
        document.querySelectorAll('.iam-role-pill').forEach(btn => {
          if (btn.getAttribute('data-role') === role) {
            btn.className = 'iam-role-pill px-3 py-1.5 rounded-xl text-xs font-black bg-[#06C167] text-black transition-all';
          } else {
            btn.className = 'iam-role-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1F2430] text-[#A6A6A6] hover:text-white transition-all';
          }
        });
        renderIamUsersList();
      };

      window.renderIamUsersList = function() {
        const tbody = document.getElementById('iamUsersTableBody');
        if (!tbody) return;

        const search = (document.getElementById('iamSearchInput')?.value || '').toLowerCase().trim();

        const filtered = allHubUsers.filter(u => {
          if (currentIamRoleFilter !== 'ALL' && u.role !== currentIamRoleFilter) return false;
          if (search) {
            const hay = \`\${u.full_name || ''} \${u.email || ''} \${u.phone || ''} \${u.restaurant_name || ''} \${u.driver_profile?.license_plate || ''}\`.toLowerCase();
            return hay.includes(search);
          }
          return true;
        });

        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-[#8A94A6]">No se encontraron usuarios con ese filtro.</td></tr>';
          return;
        }

        tbody.innerHTML = filtered.map(u => {
          let roleBadge = '';
          if (u.role === 'SUPER_ADMIN') {
            roleBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">🛡️ SUPER ADMIN</span>';
          } else if (u.role === 'RESTAURANT_ADMIN') {
            if (u.subrole === 'STAFF') {
              roleBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">👨‍🍳 COCINA (STAFF)</span>';
            } else {
              roleBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">👑 ADMIN LOCAL</span>';
            }
          } else if (u.role === 'DRIVER') {
            roleBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">🛵 REPARTIDOR</span>';
          } else {
            roleBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">🍔 CLIENTE</span>';
          }

          let assignmentInfo = \`
            <div>
              <p class="font-bold text-white truncate max-w-[220px]">📍 \${u.address || 'Managua, Nicaragua'}</p>
              <span class="text-[10px] text-[#06C167] font-semibold">📚 \${(u.saved_addresses || []).length || 1} dirección(es) • 🛡️ Pregunta activa</span>
            </div>
          \`;
          if (u.role === 'RESTAURANT_ADMIN') {
            assignmentInfo = \`
              <div>
                <p class="font-bold text-white truncate max-w-[210px]">🏪 \${u.restaurant_name || 'Local Asignado'}</p>
                <span class="text-[10px] \${u.is_multi_management ? 'text-purple-400 font-bold' : 'text-[#8A94A6]'}">
                  \${u.is_multi_management ? '🏢 Multi-Sucursal Autorizado' : '🏷️ Unidad Única'}
                </span>
              </div>
            \`;
          } else if (u.role === 'DRIVER') {
            const vt = u.driver_profile?.vehicle_type || 'MOTORCYCLE';
            const plate = u.driver_profile?.license_plate || 'M-1029';
            const vLabel = vt === 'BICYCLE' ? '🚲 Bicicleta' : (vt === 'CAR' ? '🚗 Automóvil' : '🛵 Motocicleta');
            assignmentInfo = \`
              <div>
                <p class="font-bold text-white">\${vLabel} • <span class="font-mono text-[#06C167]">\${plate}</span></p>
                <span class="text-[10px] text-[#8A94A6]">Estado GPS: \${u.driver_profile?.current_status || 'OFFLINE'}</span>
              </div>
            \`;
          } else if (u.role === 'SUPER_ADMIN') {
            assignmentInfo = '<span class="text-amber-300 font-semibold">Torre de Control & Tarifas Globales</span>';
          }

          const st = u.account_status || 'ACTIVE';
          let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30">🟢 Activo</span>';
          if (st === 'PENDING') {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">🟡 Pendiente</span>';
          } else if (st === 'SUSPENDED') {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">🔴 Suspendido</span>';
          }

          const nextToggleStatus = st === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          const toggleLabel = st === 'ACTIVE' ? '⏸️ Suspender' : '✅ Activar';

          return \`
            <tr class="hover:bg-[#151924] transition-colors">
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#1E2536] border border-[#2E384D] flex items-center justify-center font-black text-[#06C167] text-xs shrink-0">
                    \${(u.full_name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-white text-xs truncate">\${u.full_name || 'Usuario'}</p>
                    <p class="text-[11px] text-[#8A94A6] font-mono truncate">\${u.email}</p>
                    <p class="text-[10px] text-[#6C768A]">\${u.phone || '+505 8888-0000'}</p>
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-4">\${roleBadge}</td>
              <td class="py-3.5 px-4">\${assignmentInfo}</td>
              <td class="py-3.5 px-4">\${statusBadge}</td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5 flex-wrap">
                  <button onclick="impersonateHubUser('\${u.id}')" title="Iniciar sesión como este usuario y abrir su aplicación" class="px-2.5 py-1.5 rounded-lg bg-[#06C167]/15 hover:bg-[#06C167] text-[#06C167] hover:text-black border border-[#06C167]/30 font-bold text-[11px] transition-all">
                    🔑 Entrar como
                  </button>
                  <button onclick="openEditUserModal('\${u.id}')" class="px-2.5 py-1.5 rounded-lg bg-[#1C2230] hover:bg-[#283145] text-white border border-[#2C364C] font-semibold text-[11px] transition-all">
                    ✏️ Editar
                  </button>
                  <button onclick="toggleHubUserStatus('\${u.id}', '\${nextToggleStatus}')" class="px-2.5 py-1.5 rounded-lg bg-[#1C2230] hover:bg-[#283145] text-[#A6A6A6] hover:text-white border border-[#2C364C] font-semibold text-[11px] transition-all">
                    \${toggleLabel}
                  </button>
                  <button onclick="deleteHubUser('\${u.id}')" title="Eliminar usuario" class="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/25 font-bold text-[11px] transition-all">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          \`;
        }).join('');
      };

      window.onHubFormRoleChange = function() {
        const role = document.getElementById('hubFormRole').value;
        const restSec = document.getElementById('hubFormRestaurantSection');
        const drvSec = document.getElementById('hubFormDriverSection');
        if (restSec) restSec.classList.toggle('hidden', role !== 'RESTAURANT_ADMIN');
        if (drvSec) drvSec.classList.toggle('hidden', role !== 'DRIVER');
      };

      let editingUserAddresses = [];

      function renderHubModalSavedAddresses() {
        const listEl = document.getElementById('hubFormSavedAddressesList');
        const badgeEl = document.getElementById('hubFormAddrCountBadge');
        if (badgeEl) badgeEl.innerText = \`\${editingUserAddresses.length} guardadas\`;
        if (!listEl) return;
        if (editingUserAddresses.length === 0) {
          listEl.innerHTML = '<p class="text-[10px] text-[#6C768A] italic">Sin direcciones adicionales registradas.</p>';
          return;
        }
        listEl.innerHTML = editingUserAddresses.map((a, idx) => \`
          <div class="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#141822] border border-[#252E3E] text-[11px]">
            <div class="truncate">
              <span class="font-bold text-[#06C167]">\${a.icon || '📍'} \${a.label}:</span>
              <span class="text-white ml-1">\${a.address}</span>
            </div>
            <button type="button" onclick="removeHubUserExtraAddress(\${idx})" class="text-rose-400 hover:text-rose-300 font-bold px-1">✕</button>
          </div>
        \`).join('');
      }

      window.addHubUserExtraAddress = function() {
        const lbl = document.getElementById('hubFormNewExtraLabel')?.value.trim() || 'Otra';
        const addr = document.getElementById('hubFormNewExtraAddr')?.value.trim() || '';
        if (!addr) return;
        editingUserAddresses.push({
          id: 'addr-' + Date.now() + '-' + Math.floor(Math.random() * 100),
          label: lbl,
          icon: lbl.toLowerCase().includes('oficina') ? '🏢' : (lbl.toLowerCase().includes('casa') ? '🏠' : '📍'),
          building_type: 'CASA',
          zone: 'Managua',
          address: addr,
          reference: '',
          recipient_phone: document.getElementById('hubFormPhone')?.value.trim() || '+505 8888-0000',
          lat: 12.1185,
          lng: -86.2562,
          is_default: editingUserAddresses.length === 0
        });
        document.getElementById('hubFormNewExtraLabel').value = '';
        document.getElementById('hubFormNewExtraAddr').value = '';
        if (!document.getElementById('hubFormAddress').value) {
          document.getElementById('hubFormAddress').value = addr;
        }
        renderHubModalSavedAddresses();
      };

      window.removeHubUserExtraAddress = function(idx) {
        editingUserAddresses.splice(idx, 1);
        renderHubModalSavedAddresses();
      };

      window.openCreateUserModal = function() {
        document.getElementById('hubUserModalTitle').innerText = '➕ Crear Nuevo Usuario';
        document.getElementById('hubFormUserId').value = '';
        document.getElementById('hubFormFullName').value = '';
        document.getElementById('hubFormPhone').value = '+505 ';
        document.getElementById('hubFormEmail').value = '';
        document.getElementById('hubFormPassword').value = 'Password123!';
        document.getElementById('hubFormPasswordWrap').classList.remove('hidden');
        document.getElementById('hubFormAddress').value = 'Galerías Santo Domingo, Managua';
        document.getElementById('hubFormSecQuestion').value = '¿Cuál es tu comida nica favorita?';
        document.getElementById('hubFormSecAnswer').value = 'gallo pinto';
        editingUserAddresses = [];
        renderHubModalSavedAddresses();
        document.getElementById('hubFormRole').value = 'CLIENT';
        document.getElementById('hubFormStatus').value = 'ACTIVE';
        document.getElementById('hubFormSubrole').value = 'ADMIN';
        document.getElementById('hubFormMultiManage').checked = false;
        onHubFormRoleChange();
        document.getElementById('modalHubUserForm').classList.remove('hidden');
      };

      window.openEditUserModal = function(userId) {
        const u = allHubUsers.find(x => x.id === userId);
        if (!u) return;
        document.getElementById('hubUserModalTitle').innerText = '✏️ Editar Usuario, Direcciones y Contraseña';
        document.getElementById('hubFormUserId').value = u.id;
        document.getElementById('hubFormFullName').value = u.full_name || '';
        document.getElementById('hubFormPhone').value = u.phone || '';
        document.getElementById('hubFormEmail').value = u.email || '';
        document.getElementById('hubFormPassword').value = u.password || 'Password123!';
        document.getElementById('hubFormPasswordWrap').classList.remove('hidden');
        document.getElementById('hubFormAddress').value = u.address || 'Galerías Santo Domingo, Managua';
        document.getElementById('hubFormSecQuestion').value = u.security_question || '¿Cuál es tu comida nica favorita?';
        document.getElementById('hubFormSecAnswer').value = u.security_answer || 'gallo pinto';
        editingUserAddresses = Array.isArray(u.saved_addresses) ? JSON.parse(JSON.stringify(u.saved_addresses)) : [];
        renderHubModalSavedAddresses();
        document.getElementById('hubFormRole').value = u.role || 'CLIENT';
        document.getElementById('hubFormStatus').value = u.account_status || 'ACTIVE';
        document.getElementById('hubFormSubrole').value = u.subrole || 'ADMIN';
        if (u.restaurant_id) {
          document.getElementById('hubFormRestaurantId').value = u.restaurant_id;
        }
        document.getElementById('hubFormMultiManage').checked = !!u.is_multi_management;
        if (u.driver_profile) {
          document.getElementById('hubFormVehicleType').value = u.driver_profile.vehicle_type || 'MOTORCYCLE';
          document.getElementById('hubFormLicensePlate').value = u.driver_profile.license_plate || 'M-1029';
        }
        onHubFormRoleChange();
        document.getElementById('modalHubUserForm').classList.remove('hidden');
      };

      window.closeHubUserModal = function() {
        document.getElementById('modalHubUserForm').classList.add('hidden');
      };

      window.saveHubUserForm = async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btnHubSaveUser');
        btn.disabled = true;
        btn.innerText = 'Guardando...';

        const userId = document.getElementById('hubFormUserId').value;
        const full_name = document.getElementById('hubFormFullName').value.trim();
        const phone = document.getElementById('hubFormPhone').value.trim();
        const email = document.getElementById('hubFormEmail').value.trim();
        const password = document.getElementById('hubFormPassword').value.trim();
        const address = document.getElementById('hubFormAddress').value.trim();
        const security_question = document.getElementById('hubFormSecQuestion').value;
        const security_answer = document.getElementById('hubFormSecAnswer').value.trim();
        const role = document.getElementById('hubFormRole').value;
        const account_status = document.getElementById('hubFormStatus').value;
        const subrole = document.getElementById('hubFormSubrole').value;
        const restaurant_id = document.getElementById('hubFormRestaurantId').value;
        const restObj = allHubRestaurants.find(r => r.id === restaurant_id);
        const restaurant_name = restObj ? restObj.name : 'Pupusería & Antojitos El Diamante';
        const is_multi_management = document.getElementById('hubFormMultiManage').checked;
        const vehicle_type = document.getElementById('hubFormVehicleType').value;
        const license_plate = document.getElementById('hubFormLicensePlate').value.trim();

        const authorized_restaurants = is_multi_management
          ? allHubRestaurants.map(r => ({ id: r.id, name: r.name }))
          : (restaurant_id ? [{ id: restaurant_id, name: restaurant_name }] : []);

        try {
          if (!userId) {
            // Crear nuevo usuario
            const resp = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                full_name,
                email,
                phone,
                password,
                address,
                security_question,
                security_answer,
                role,
                subrole,
                restaurant_id: role === 'RESTAURANT_ADMIN' ? restaurant_id : null,
                restaurant_name: role === 'RESTAURANT_ADMIN' ? restaurant_name : null,
                is_multi_management: role === 'RESTAURANT_ADMIN' ? is_multi_management : false,
                authorized_restaurants: role === 'RESTAURANT_ADMIN' ? authorized_restaurants : [],
                vehicle_type,
                license_plate
              })
            });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Error al crear usuario');
            showHubToast('Usuario creado y sincronizado con éxito', '🎉');
          } else {
            // Actualizar usuario existente
            const resp = await fetch('/api/auth/admin/user-action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'UPDATE_USER',
                userId,
                full_name,
                email,
                phone,
                password,
                address,
                security_question,
                security_answer,
                saved_addresses: editingUserAddresses,
                role,
                subrole: role === 'RESTAURANT_ADMIN' ? subrole : 'STANDARD',
                account_status,
                restaurant_id: role === 'RESTAURANT_ADMIN' ? restaurant_id : null,
                restaurant_name: role === 'RESTAURANT_ADMIN' ? restaurant_name : null,
                is_multi_management: role === 'RESTAURANT_ADMIN' ? is_multi_management : false,
                authorized_restaurants: role === 'RESTAURANT_ADMIN' ? authorized_restaurants : [],
                vehicle_type,
                license_plate,
                is_verified: account_status === 'ACTIVE'
              })
            });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Error al actualizar usuario');
            showHubToast('Usuario, direcciones y seguridad actualizados', '✓');
          }
          closeHubUserModal();
          await loadHubUsersDirectory();
        } catch (err) {
          alert(err.message);
        } finally {
          btn.disabled = false;
          btn.innerText = 'Guardar Usuario';
        }
      };

      window.toggleHubUserStatus = async function(userId, nextStatus) {
        try {
          const resp = await fetch('/api/auth/admin/user-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'SET_STATUS',
              userId,
              account_status: nextStatus
            })
          });
          const data = await resp.json();
          if (data.success) {
            showHubToast('Estado actualizado a ' + nextStatus, nextStatus === 'ACTIVE' ? '🟢' : '🔴');
            await loadHubUsersDirectory();
          }
        } catch (e) {
          alert('Error al cambiar estado de la cuenta.');
        }
      };

      window.deleteHubUser = async function(userId) {
        const u = allHubUsers.find(x => x.id === userId);
        if (!confirm('¿Estás seguro de eliminar permanentemente la cuenta de ' + (u?.full_name || userId) + '?')) return;
        try {
          const resp = await fetch('/api/auth/admin/user-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE', userId })
          });
          const data = await resp.json();
          if (data.success) {
            showHubToast('Usuario eliminado del sistema', '🗑️');
            await loadHubUsersDirectory();
          }
        } catch (e) {
          alert('Error al eliminar usuario.');
        }
      };

      // Impersonation / Acceso directo en 1 clic a cualquier rol
      window.impersonateHubUser = async function(userId) {
        try {
          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          const data = await resp.json();
          if (!data.success || !data.user) {
            alert(data.error || 'No se pudo iniciar sesión en esta cuenta.');
            return;
          }
          const u = data.user;
          if (u.role === 'CLIENT') {
            localStorage.setItem('pedidosnica_client_user', JSON.stringify({
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              phone: u.phone || '+505 8899-7711',
              address: u.address || 'Galerías Santo Domingo, Managua',
              notes: u.notes || ''
            }));
            window.location.href = '/client';
          } else if (u.role === 'RESTAURANT_ADMIN') {
            localStorage.removeItem('pedidosnica_driver_session');
            const restSession = {
              id: u.id,
              email: u.email,
              full_name: u.full_name,
              phone: u.phone,
              role: u.role,
              subrole: u.subrole || 'ADMIN',
              is_multi_management: !!u.is_multi_management,
              restaurant_id: u.restaurant_id || '6701bc0c-e5ce-475a-8893-75e9d06e8012',
              restaurant_name: u.restaurant_name || 'Pupusería & Antojitos El Diamante',
              authorized_restaurants: u.authorized_restaurants || []
            };
            localStorage.setItem('pedidosnica_rest_session', JSON.stringify(restSession));
            localStorage.setItem('pedidosnica_rest_user', JSON.stringify(restSession));
            localStorage.setItem('active_restaurant_id', restSession.restaurant_id);
            window.location.href = '/restaurant';
          } else if (u.role === 'DRIVER') {
            localStorage.removeItem('pedidosnica_rest_session');
            localStorage.removeItem('pedidosnica_rest_user');
            const drvSession = {
              id: u.id,
              email: u.email,
              full_name: u.full_name,
              phone: u.phone,
              vehicle_type: (u.driver_profile && u.driver_profile.vehicle_type) || 'MOTORCYCLE',
              license_plate: (u.driver_profile && u.driver_profile.license_plate) || 'M-10293'
            };
            localStorage.setItem('pedidosnica_driver_session', JSON.stringify(drvSession));
            localStorage.setItem('pedidosnica_driver_id', u.id);
            window.location.href = '/driver';
          } else if (u.role === 'SUPER_ADMIN') {
            localStorage.setItem('pedidosnica_user', JSON.stringify(u));
            checkManagerAuth();
            showHubToast('Sesión activa como ' + u.full_name, '🛡️');
          }
        } catch (e) {
          alert('Error al cambiar de cuenta.');
        }
      };

      window.loginAsManager = async function(email, password) {
        try {
          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await resp.json();
          if (data.success && data.user) {
            if (data.user.role !== 'SUPER_ADMIN') {
              alert('Esta cuenta (' + data.user.full_name + ') tiene rol ' + data.user.role + '. No tiene permisos de App Manager (SUPER_ADMIN).');
              return;
            }
            localStorage.setItem('pedidosnica_user', JSON.stringify(data.user));
            checkManagerAuth();
          } else {
            alert(data.error || 'Credenciales incorrectas');
          }
        } catch(e) {
          alert('Error de conexión');
        }
      };

      window.logoutAppManager = function() {
        localStorage.removeItem('pedidosnica_user');
        localStorage.removeItem('pedidosnica_rest_user');
        localStorage.removeItem('pedidosnica_rest_session');
        checkManagerAuth();
      };

      window.quickDemoManagerLogin = function() {
        window.loginAsManager('manager@pedidosnica.com', 'Password123!');
      };

      window.updatePlatformCommission = async function(rate) {
        try {
          const res = await fetch('/api/admin/commission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commission_rate: rate })
          });
          const data = await res.json();
          if (data.success) {
            document.getElementById('hubCommissionDisplay').innerText = parseFloat(rate) + '%';
            showHubToast('Comisión global actualizada al ' + rate + '%', '💰');
          }
        } catch(e) {
          alert('Error al actualizar comisión');
        }
      };

      document.addEventListener('DOMContentLoaded', checkManagerAuth);
    })();
  </script>

  ${getFooter()}`;
}

module.exports = {
  renderHub
};
