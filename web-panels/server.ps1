# Servidor Web Autónomo para Pruebas en Vivo (Cero dependencias requeridas)
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Output "Servidor web activo en http://localhost:$port/"

$supabaseUrl = "https://zciujeihkvleehhqbeat.supabase.co"
$supabaseAnon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w"

function Get-HtmlHeader($title) {
    return @"
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
    <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
    <style>
        body { background-color: #020617; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
"@
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $rawPath = $request.Url.AbsolutePath

        $html = ""

        # ROUTE: / (Hub)
        if ($rawPath -eq "/" -or $rawPath -eq "/index.html") {
            $html = (Get-HtmlHeader "Delivery Ecosystem - Hub") + @"
    <div class="max-w-5xl mx-auto p-8">
        <header class="text-center my-10">
            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Ecosistema Delivery Conectado a Supabase
            </span>
            <h1 class="text-4xl font-extrabold text-white mt-4 tracking-tight">Paneles de Control y Operaciones</h1>
            <p class="text-slate-400 text-sm mt-2">Haz clic en cualquiera de los links para probar la sincronización en vivo.</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/restaurant/orders" class="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all shadow-xl block group">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-3xl">👨‍🍳</span>
                    <span class="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold">Alarma Sonora Activa</span>
                </div>
                <h2 class="text-xl font-bold text-white group-hover:text-amber-400">Gestor de Pedidos de Cocina</h2>
                <p class="text-xs text-slate-400 mt-2">Tablero Kanban con alerta acústica en vivo cuando entra un pedido y botón para marcar listo.</p>
            </a>

            <a href="/restaurant/menu" class="p-6 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all shadow-xl block group">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-3xl">📋</span>
                    <span class="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-semibold">Tiempo Real</span>
                </div>
                <h2 class="text-xl font-bold text-white group-hover:text-emerald-400">Control de Menú y Stock Instantáneo</h2>
                <p class="text-xs text-slate-400 mt-2">Switch instantáneo para habilitar o pausar productos sin recargar la pantalla.</p>
            </a>

            <a href="/admin/control-tower" class="p-6 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-xl block group">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-3xl">📡</span>
                    <span class="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-semibold">MapLibre GL</span>
                </div>
                <h2 class="text-xl font-bold text-white group-hover:text-indigo-400">Torre de Control (Live Map)</h2>
                <p class="text-xs text-slate-400 mt-2">Mapa global de repartidores en tiempo real con estados (Disponible, Ocupado, Offline) y telemetría de batería.</p>
            </a>

            <a href="/admin/fares" class="p-6 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all shadow-xl block group">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-3xl">⚙️</span>
                    <span class="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-semibold">OSRM $0 Cost</span>
                </div>
                <h2 class="text-xl font-bold text-white group-hover:text-blue-400">Tarifación Dinámica y Geocercas</h2>
                <p class="text-xs text-slate-400 mt-2">Simulador interactivo del costo de envío según distancia de OSRM y editor de tarifas.</p>
            </a>
        </div>
    </div>
</body>
</html>
"@
        }
        # ROUTE: /restaurant/orders
        elseif ($rawPath -eq "/restaurant/orders") {
            $html = (Get-HtmlHeader "Cocina - Gestor de Pedidos") + @"
    <div class="p-6 max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
            <div>
                <a href="/" class="text-xs text-indigo-400 hover:underline">← Volver al Hub</a>
                <h1 class="text-2xl font-bold text-white mt-1">Gestor de Pedidos de Cocina</h1>
                <p class="text-xs text-slate-400">Conectado por WebSockets a Supabase ($supabaseUrl)</p>
            </div>
            <div class="flex items-center gap-3">
                <button id="btnToggleAudio" onclick="toggleMute()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    🔔 Alarma Sonora Activa
                </button>
                <button onclick="insertTestOrder()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                    + Simular Nuevo Pedido Entrante
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <h2 class="font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    Nuevos Pedidos (<span id="count-created">0</span>)
                </h2>
                <div id="list-created" class="space-y-4"></div>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <h2 class="font-bold text-blue-400 mb-4">👨‍🍳 En Preparación (<span id="count-prep">0</span>)</h2>
                <div id="list-prep" class="space-y-4"></div>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <h2 class="font-bold text-emerald-400 mb-4">🛵 Listos para Recoger (<span id="count-ready">0</span>)</h2>
                <div id="list-ready" class="space-y-4"></div>
            </div>
        </div>
    </div>

    <script>
        const supabase = window.supabase.createClient('$supabaseUrl', '$supabaseAnon');
        const restaurantId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
        let orders = [];
        let isMuted = false;
        let audioCtx = null;
        let soundInterval = null;

        function playBeep() {
            if (isMuted) return;
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
                osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);
            } catch(e) {}
        }

        function toggleMute() {
            isMuted = !isMuted;
            const btn = document.getElementById('btnToggleAudio');
            if (isMuted) {
                btn.innerText = '🔇 Alarma Silenciada';
                btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30';
            } else {
                btn.innerText = '🔔 Alarma Sonora Activa';
                btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            }
        }

        function renderOrders() {
            const created = orders.filter(o => o.status === 'CREATED');
            const prep = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_PREPARATION');
            const ready = orders.filter(o => o.status === 'READY_FOR_PICKUP');

            document.getElementById('count-created').innerText = created.length;
            document.getElementById('count-prep').innerText = prep.length;
            document.getElementById('count-ready').innerText = ready.length;

            document.getElementById('list-created').innerHTML = created.map(o => `
                <div class="bg-slate-800 border-2 border-amber-500/50 rounded-xl p-4 shadow-lg">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-400">#${o.id.slice(0,8)}</span>
                        <span class="text-lg font-bold text-emerald-400">$${Number(o.total).toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">${o.delivery_address || 'Sin dirección'}</p>
                    <button onclick="updateOrderStatus('${o.id}', 'ACCEPTED')" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs">
                        Aceptar Pedido (25 min)
                    </button>
                </div>
            `).join('');

            document.getElementById('list-prep').innerHTML = prep.map(o => `
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-400">#${o.id.slice(0,8)}</span>
                        <span class="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">${o.status}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">Total: $${Number(o.total).toFixed(2)}</p>
                    <button onclick="updateOrderStatus('${o.id}', 'READY_FOR_PICKUP')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs">
                        Marcar Listo para Recoger 🛵
                    </button>
                </div>
            `).join('');

            document.getElementById('list-ready').innerHTML = ready.map(o => `
                <div class="bg-slate-800 border border-emerald-500/30 rounded-xl p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-400">#${o.id.slice(0,8)}</span>
                        <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Buscando Driver</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-2">Localizando al repartidor más cercano con PostGIS...</p>
                </div>
            `).join('');

            // Alarma sonora continua si hay pedidos CREATED
            if (created.length > 0 && !soundInterval) {
                playBeep();
                soundInterval = setInterval(playBeep, 3000);
            } else if (created.length === 0 && soundInterval) {
                clearInterval(soundInterval);
                soundInterval = null;
            }
        }

        async function updateOrderStatus(orderId, status) {
            const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
            if (!error) {
                orders = orders.map(o => o.id === orderId ? { ...o, status } : o);
                renderOrders();
            }
        }

        async function insertTestOrder() {
            const testId = 'ord-' + Date.now().toString(36);
            orders.unshift({
                id: testId,
                status: 'CREATED',
                total: 24.50,
                delivery_address: 'Av. Corrientes 1500, CABA',
                restaurant_id: restaurantId
            });
            renderOrders();
        }

        async function loadOrders() {
            const { data } = await supabase.from('orders').select('*').limit(20);
            if (data) orders = data;
            renderOrders();
        }

        loadOrders();

        // Suscripción Realtime
        supabase.channel('kitchen-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                if (payload.eventType === 'INSERT') orders.unshift(payload.new);
                if (payload.eventType === 'UPDATE') orders = orders.map(o => o.id === payload.new.id ? payload.new : o);
                renderOrders();
            })
            .subscribe();
    </script>
</body>
</html>
"@
        }
        # ROUTE: /restaurant/menu
        elseif ($rawPath -eq "/restaurant/menu") {
            $html = (Get-HtmlHeader "Control de Menú y Stock") + @"
    <div class="p-6 max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
            <div>
                <a href="/" class="text-xs text-indigo-400 hover:underline">← Volver al Hub</a>
                <h1 class="text-2xl font-bold text-white mt-1">Control Instantáneo de Menú y Stock</h1>
                <p class="text-xs text-slate-400">Pausa o activa platillos en tiempo real con Optimistic UI</p>
            </div>
            <button onclick="insertSampleProduct()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
                + Agregar Platillo de Prueba
            </button>
        </div>

        <div id="products-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
    </div>

    <script>
        const supabase = window.supabase.createClient('$supabaseUrl', '$supabaseAnon');
        let products = [
            { id: 'prod-1', name: 'Pizza Napolitana Especial', category: 'Pizzas', price: 12.50, is_available: true, description: 'Muzzarella, tomate fresco, albahaca y orégano' },
            { id: 'prod-2', name: 'Burger Doble Cheddar Bacon', category: 'Hamburguesas', price: 9.80, is_available: true, description: 'Doble carne 120g, queso cheddar fundido y panceta' },
            { id: 'prod-3', name: 'Empanadas Criollas x6', category: 'Entradas', price: 8.00, is_available: false, description: 'Carne cortada a cuchillo, cebolla de verdeo y huevo' }
        ];

        function renderProducts() {
            document.getElementById('products-grid').innerHTML = products.map(p => `
                <div class="p-5 rounded-2xl border transition-all ${p.is_available ? 'bg-slate-900 border-slate-800' : 'bg-slate-900/40 border-red-900/40 opacity-70'}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-xs uppercase font-bold text-slate-500">${p.category}</span>
                            <h3 class="font-bold text-base text-white">${p.name}</h3>
                        </div>
                        <span class="font-mono font-bold text-emerald-400">$${p.price.toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-4">${p.description}</p>
                    <div class="flex justify-between items-center pt-3 border-t border-slate-800">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${p.is_available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">
                            ${p.is_available ? 'Disponible' : 'Agotado (Pausado)'}
                        </span>
                        <button onclick="toggleProduct('${p.id}')" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.is_available ? 'bg-emerald-600' : 'bg-slate-700'}">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.is_available ? 'translate-x-6' : 'translate-x-1'}"></span>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        async function toggleProduct(id) {
            products = products.map(p => p.id === id ? { ...p, is_available: !p.is_available } : p);
            renderProducts();
            await supabase.from('products').update({ is_available: products.find(p=>p.id===id).is_available }).eq('id', id);
        }

        function insertSampleProduct() {
            const id = 'prod-' + Date.now().toString(36);
            products.push({ id, name: 'Papas Fritas Cheddar', category: 'Acompañamientos', price: 5.50, is_available: true, description: 'Papas bastón crocantes con lluvia de panceta' });
            renderProducts();
        }

        renderProducts();
    </script>
</body>
</html>
"@
        }
        # ROUTE: /admin/control-tower
        elseif ($rawPath -eq "/admin/control-tower") {
            $html = (Get-HtmlHeader "Torre de Control de Flota") + @"
    <div class="flex h-screen overflow-hidden">
        <div class="w-80 border-r border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
                <a href="/" class="text-xs text-indigo-400 hover:underline">← Volver al Hub</a>
                <h1 class="text-xl font-bold text-white mt-2 mb-6">Torre de Control</h1>

                <div class="space-y-3 mb-6">
                    <div class="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex justify-between items-center">
                        <div>
                            <p class="text-xs text-emerald-400 font-semibold uppercase">Disponibles</p>
                            <p class="text-2xl font-bold text-white" id="count-avail">2</p>
                        </div>
                        <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                    </div>

                    <div class="p-4 rounded-xl bg-slate-950 border border-blue-500/30 flex justify-between items-center">
                        <div>
                            <p class="text-xs text-blue-400 font-semibold uppercase">En Reparto Activo</p>
                            <p class="text-2xl font-bold text-white" id="count-busy">1</p>
                        </div>
                        <span class="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
                    </div>
                </div>

                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Conductores en línea</h3>
                <div class="space-y-2" id="driver-list"></div>
            </div>
            <div class="text-xs text-slate-500 pt-4 border-t border-slate-800">
                MapLibre GL con Tiles Vectoriales OpenStreetMap ($0 API Cost)
            </div>
        </div>

        <div class="flex-1 relative bg-slate-950" id="map" style="height: 100vh;"></div>
    </div>

    <script>
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [-58.3816, -34.6037],
            zoom: 13
        });

        const drivers = [
            { id: 'd1', name: 'Carlos Gomez', vehicle: 'Moto Honda 150', status: 'AVAILABLE', lat: -34.6037, lng: -58.3816, bat: 92, speed: '24 km/h' },
            { id: 'd2', name: 'Matias Perez', vehicle: 'Bicicleta MTB', status: 'AVAILABLE', lat: -34.5980, lng: -58.3910, bat: 78, speed: '12 km/h' },
            { id: 'd3', name: 'Lucas Rossi', vehicle: 'Moto Yamaha', status: 'BUSY', lat: -34.6110, lng: -58.3750, bat: 64, speed: '35 km/h' }
        ];

        map.on('load', () => {
            drivers.forEach(d => {
                const el = document.createElement('div');
                el.className = 'w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 border-white shadow-xl cursor-pointer';
                el.style.backgroundColor = d.status === 'AVAILABLE' ? '#10b981' : '#3b82f6';
                el.innerText = '🛵';

                const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
                    <div class="text-slate-900 font-sans p-2">
                        <strong class="text-sm font-bold">\${d.name}</strong><br/>
                        <span class="text-xs text-slate-600">\${d.vehicle}</span><br/>
                        <span class="text-xs font-semibold">\${d.status === 'AVAILABLE' ? '🟢 Disponible' : '🔵 En Reparto'}</span><br/>
                        <span class="text-xs text-slate-500">Batería: \${d.bat}% • Vel: \${d.speed}</span>
                    </div>
                `);

                new maplibregl.Marker(el)
                    .setLngLat([d.lng, d.lat])
                    .setPopup(popup)
                    .addTo(map);
            });
        });

        document.getElementById('driver-list').innerHTML = drivers.map(d => `
            <div class="p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs flex justify-between items-center cursor-pointer hover:border-slate-700" onclick="map.flyTo({center: [\${d.lng}, \${d.lat}], zoom: 15})">
                <div>
                    <p class="font-semibold text-slate-200">\${d.name}</p>
                    <p class="text-slate-500">\${d.vehicle} • Bat: \${d.bat}%</p>
                </div>
                <span class="w-2.5 h-2.5 rounded-full \${d.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-blue-400'}"></span>
            </div>
        `).join('');
    </script>
</body>
</html>
"@
        }
        # ROUTE: /admin/fares
        elseif ($rawPath -eq "/admin/fares") {
            $html = (Get-HtmlHeader "Tarifas Dinámicas") + @"
    <div class="p-8 max-w-5xl mx-auto">
        <a href="/" class="text-xs text-indigo-400 hover:underline">← Volver al Hub</a>
        <h1 class="text-2xl font-bold text-white mt-2 mb-8">Tarificación Dinámica y Geocercas Operativas</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 class="text-lg font-bold text-white">Parámetros del Motor de Despacho</h2>
                <div>
                    <label class="block text-xs text-slate-400 uppercase font-semibold mb-1">Tarifa Base ($)</label>
                    <input type="number" id="baseFare" value="1.50" step="0.10" oninput="calculate()" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs text-slate-400 uppercase font-semibold mb-1">Por Km ($)</label>
                        <input type="number" id="perKm" value="0.65" step="0.05" oninput="calculate()" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 uppercase font-semibold mb-1">Por Minuto ($)</label>
                        <input type="number" id="perMin" value="0.15" step="0.05" oninput="calculate()" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm" />
                    </div>
                </div>
                <div>
                    <label class="block text-xs text-amber-400 uppercase font-semibold mb-1">Surge Multiplier (Demanda)</label>
                    <input type="number" id="surge" value="1.25" step="0.05" oninput="calculate()" class="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-amber-400 font-bold text-sm" />
                </div>
                <button class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm">
                    Guardar Parámetros en Supabase
                </button>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                    <h2 class="text-lg font-bold text-white mb-2">Simulador de Cotización OSRM</h2>
                    <p class="text-xs text-slate-400 mb-6">Prueba en tiempo real cómo responderá el motor de cálculo según distancia y minutos calculados por OSRM.</p>
                    
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-xs text-slate-300 mb-1">
                                <span>Distancia OSRM:</span>
                                <span class="font-mono text-indigo-400 font-bold" id="lblKm">4.5 km</span>
                            </div>
                            <input type="range" id="sliderKm" min="0.5" max="15.0" step="0.1" value="4.5" oninput="calculate()" class="w-full accent-indigo-500" />
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-slate-300 mb-1">
                                <span>Tiempo de Viaje:</span>
                                <span class="font-mono text-indigo-400 font-bold" id="lblMin">18 mins</span>
                            </div>
                            <input type="range" id="sliderMin" min="3" max="60" step="1" value="18" oninput="calculate()" class="w-full accent-indigo-500" />
                        </div>
                    </div>
                </div>

                <div class="mt-8 p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                    <p class="text-xs uppercase font-semibold text-slate-400 tracking-wider">Costo Final Calculado al Cliente</p>
                    <p class="text-4xl font-extrabold text-emerald-400 font-mono my-2" id="totalFee">$8.90</p>
                    <p class="text-xs text-slate-500">Costo de API de Mapas para este cálculo: <strong class="text-emerald-400">$0.00</strong></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function calculate() {
            const base = parseFloat(document.getElementById('baseFare').value) || 0;
            const perKm = parseFloat(document.getElementById('perKm').value) || 0;
            const perMin = parseFloat(document.getElementById('perMin').value) || 0;
            const surge = parseFloat(document.getElementById('surge').value) || 1;

            const km = parseFloat(document.getElementById('sliderKm').value);
            const min = parseFloat(document.getElementById('sliderMin').value);

            document.getElementById('lblKm').innerText = km.toFixed(1) + ' km';
            document.getElementById('lblMin').innerText = min + ' mins';

            const raw = base + (km * perKm) + (min * perMin);
            const total = (raw * surge).toFixed(2);

            document.getElementById('totalFee').innerText = '$' + total;
        }
        calculate();
    </script>
</body>
</html>
"@
        } else {
            $html = "<h1>404 Not Found</h1>"
            $response.StatusCode = 404
        }

        $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
        $response.ContentLength64 = $buffer.Length
        $response.ContentType = "text/html; charset=utf-8"
        $output = $response.OutputStream
        $output.Write($buffer, 0, $buffer.Length)
        $output.Close()
    } catch {
        # Listener closed or aborted
    }
}
