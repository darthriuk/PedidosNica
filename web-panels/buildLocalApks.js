const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_PANELS_DIR = __dirname;
const ASSETS_DIR = path.join(ROOT_DIR, 'android-apps', 'app', 'src', 'main', 'assets');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TOOLCHAIN_DIR = path.join(ROOT_DIR, '.android-toolchain');

function buildEmbeddedBackendJs(lanBaseUrl = 'http://192.168.1.20:3000') {
  const localStoreSrc = fs.readFileSync(path.join(WEB_PANELS_DIR, 'localStore.js'), 'utf8');
  const authApiSrc = fs.readFileSync(path.join(WEB_PANELS_DIR, 'authApi.js'), 'utf8');
  const clientApiSrc = fs.readFileSync(path.join(WEB_PANELS_DIR, 'clientApi.js'), 'utf8');
  const driverApiSrc = fs.readFileSync(path.join(WEB_PANELS_DIR, 'driverApi.js'), 'utf8');
  const restaurantApiSrc = fs.readFileSync(path.join(WEB_PANELS_DIR, 'restaurantApi.js'), 'utf8');

  return `(function() {
  // ============================================================================
  // PEDIDOSNICA EMBEDDED LOCAL BUILD ENGINE (100% STANDALONE + LAN SYNC)
  // ============================================================================
  const nativeFetch = window.fetch.bind(window);
  globalThis._nativeFetch = nativeFetch;
  const LAN_SERVER = ${JSON.stringify(lanBaseUrl)};
  let lanServerOnline = false;

  // Verificar en segundo plano si la PC en red local Wi-Fi está accesible para sincronizar
  function checkLanServer() {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 1200) : null;
    nativeFetch(LAN_SERVER + '/api/network-info', controller ? { signal: controller.signal } : {})
      .then(r => {
        if (timer) clearTimeout(timer);
        lanServerOnline = r && r.ok;
      })
      .catch(() => {
        if (timer) clearTimeout(timer);
        lanServerOnline = false;
      });
  }
  checkLanServer();
  setInterval(checkLanServer, 15000);

  // Shim de módulos CommonJS para ejecutar localStore, authApi, clientApi, driverApi, restaurantApi en el teléfono
  const __modules = {};
  const __cache = {};

  __modules['crypto'] = function(module, exports) {
    module.exports = {
      randomUUID: function() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
          return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
  };

  function __require(id) {
    const cleanId = id.replace(/^\\.\\//, '');
    if (__cache[cleanId]) return __cache[cleanId].exports;
    const mod = { exports: {} };
    __cache[cleanId] = mod;
    if (!__modules[cleanId]) {
      throw new Error('Module not found in embedded build: ' + id);
    }
    __modules[cleanId](mod, mod.exports, __require);
    return mod.exports;
  }

  __modules['localStore'] = function(module, exports, require) {
${localStoreSrc}
  };

  __modules['authApi'] = function(module, exports, require) {
${authApiSrc}
  };

  __modules['clientApi'] = function(module, exports, require) {
${clientApiSrc}
  };

  __modules['driverApi'] = function(module, exports, require) {
${driverApiSrc}
  };

  __modules['restaurantApi'] = function(module, exports, require) {
${restaurantApiSrc}
  };

  const localStore = __require('./localStore');
  const { handleAuthApi } = __require('./authApi');
  const { handleClientApi } = __require('./clientApi');
  const { handleDriverApi } = __require('./driverApi');
  const { handleRestaurantApi } = __require('./restaurantApi');

  // Persistencia automática en localStorage del teléfono
  const STORAGE_KEY = 'pn_embedded_store_v2';
  try {
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    if (savedRaw) {
      const saved = JSON.parse(savedRaw);
      ['restaurants', 'users', 'products', 'orders', 'reviews'].forEach(k => {
        if (Array.isArray(saved[k]) && saved[k].length > 0 && Array.isArray(localStore[k])) {
          localStore[k].splice(0, localStore[k].length, ...saved[k]);
        }
      });
    }
  } catch (_) {}

  function persistLocalStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        restaurants: localStore.restaurants,
        users: localStore.users,
        products: localStore.products,
        orders: localStore.orders,
        reviews: localStore.reviews
      }));
    } catch (_) {}
  }

  // EventBus local para simular Server-Sent Events (/api/live-stream)
  const sseListeners = new Set();
  function broadcastEvent(typeOrObj, payload) {
    persistLocalStore();
    if (localStore && typeof localStore.pushToSupabase === 'function') {
      localStore.pushToSupabase();
    }
    let eventData;
    if (typeof typeOrObj === 'object' && typeOrObj !== null) {
      eventData = Object.assign({}, typeOrObj, { timestamp: Date.now() });
    } else {
      eventData = { type: typeOrObj, payload: payload, timestamp: Date.now() };
    }
    const str = JSON.stringify(eventData);
    sseListeners.forEach(fn => {
      try { fn({ data: str }); } catch (_) {}
    });
  }

  let initialCloudPullPromise = (localStore && typeof localStore.pullFromSupabase === 'function')
    ? localStore.pullFromSupabase().catch(() => false)
    : Promise.resolve(false);

  // Mock de EventSource para /api/live-stream cuando corre en modo local
  const NativeEventSource = window.EventSource;
  window.EventSource = function(url) {
    if (typeof url === 'string' && url.includes('/api/live-stream')) {
      if (lanServerOnline && NativeEventSource) {
        try {
          return new NativeEventSource(LAN_SERVER + '/api/live-stream');
        } catch (_) {}
      }
      const instance = {
        onmessage: null,
        onerror: null,
        addEventListener: function(type, handler) {
          if (type === 'message') sseListeners.add(handler);
        },
        close: function() {
          if (instance._wrapped) sseListeners.delete(instance._wrapped);
        }
      };
      instance._wrapped = function(ev) {
        if (typeof instance.onmessage === 'function') instance.onmessage(ev);
      };
      sseListeners.add(instance._wrapped);
      return instance;
    }
    return NativeEventSource ? new NativeEventSource(url) : {};
  };

  // Interceptor inteligente de window.fetch
  let inEmbeddedHandler = false;
  window.fetch = async function(input, init) {
    const rawUrl = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));

    // Si estamos dentro del handler local y éste intenta llamar a localhost:4000, rechazar en 0ms
    if (inEmbeddedHandler && rawUrl.includes('localhost:4000')) {
      throw new Error('Embedded local mode bypass');
    }

    // Detectar si es una llamada a /api/...
    let apiPath = null;
    if (rawUrl.startsWith('/api/')) {
      apiPath = rawUrl;
    } else if (rawUrl.startsWith('file:///api/')) {
      apiPath = rawUrl.replace('file://', '');
    }

    if (!apiPath) {
      return nativeFetch(input, init);
    }

    // Asegurar sincronización inicial con Supabase Cloud (https://zciujeihkvleehhqbeat.supabase.co)
    if (initialCloudPullPromise) {
      try { await initialCloudPullPromise; } catch (_) {}
      initialCloudPullPromise = null;
    }

    // 1. Si el servidor LAN de la PC está alcanzable en la misma red Wi-Fi, sincronizar con él
    if (lanServerOnline) {
      try {
        const lanRes = await nativeFetch(LAN_SERVER + apiPath, init);
        if (lanRes && lanRes.ok) {
          return lanRes;
        }
      } catch (_) {
        lanServerOnline = false;
      }
    }

    // 2. Ejecutar el endpoint /api/... localmente sincronizado con Supabase Cloud
    const method = (init && init.method ? init.method : 'GET').toUpperCase();
    const bodyText = init && init.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : '';
    const cleanUrl = apiPath.split('?')[0];

    return new Promise(async (resolve) => {
      let statusCode = 200;
      let resHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
      const dataListeners = [];
      const endListeners = [];

      const reqMock = {
        method: method,
        url: apiPath,
        headers: (init && init.headers) || {},
        on: function(event, cb) {
          if (event === 'data') dataListeners.push(cb);
          if (event === 'end') endListeners.push(cb);
          return reqMock;
        }
      };

      let finished = false;
      const resMock = {
        writeHead: function(code, headers) {
          statusCode = code || 200;
          if (headers) Object.assign(resHeaders, headers);
        },
        setHeader: function(k, v) {
          resHeaders[k] = v;
        },
        end: function(payload) {
          if (finished) return;
          finished = true;
          persistLocalStore();
          if (method !== 'GET' && localStore && typeof localStore.pushToSupabase === 'function') {
            localStore.pushToSupabase();
          }
          const outStr = typeof payload === 'string' ? payload : (payload ? String(payload) : '{}');
          resolve(new Response(outStr, { status: statusCode, headers: resHeaders }));
        }
      };

      setTimeout(() => {
        if (bodyText) {
          dataListeners.forEach(fn => fn(bodyText));
        }
        endListeners.forEach(fn => fn());
      }, 0);

      const opts = {
        SUPABASE_URL: 'https://zciujeihkvleehhqbeat.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: '',
        currentCommissionRate: 15.0,
        broadcastEvent: broadcastEvent
      };

      inEmbeddedHandler = true;
      try {
        if (cleanUrl.startsWith('/api/auth/') || cleanUrl === '/api/restaurant/settings') {
          await handleAuthApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl.startsWith('/api/client/')) {
          await handleClientApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl.startsWith('/api/driver/')) {
          await handleDriverApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl.startsWith('/api/restaurant/')) {
          await handleRestaurantApi(reqMock, resMock, apiPath, opts);
        } else if (cleanUrl === '/api/admin/commission' && method === 'POST') {
          resMock.end(JSON.stringify({ success: true, commission_rate: 15.0 }));
        } else if (cleanUrl === '/api/admin/fleet' && method === 'GET') {
          const driverUsers = (localStore.users || []).filter(u => u.role === 'DRIVER');
          const drivers = driverUsers.map(u => {
            const dp = u.driver_profile || {};
            return {
              driver_id: u.id,
              full_name: u.full_name,
              phone: u.phone,
              vehicle_type: dp.vehicle_type || 'MOTORCYCLE',
              vehicle_label: dp.vehicle_type === 'BICYCLE' ? 'Bicicleta' : (dp.vehicle_type === 'CAR' ? 'Auto' : 'Motocicleta'),
              license_plate: dp.license_plate || 'M 000-000',
              current_status: dp.current_status || 'AVAILABLE',
              battery_level: dp.battery_level || 95,
              rating: dp.rating || 4.9,
              lat: 12.1260,
              lng: -86.2650
            };
          });
          resMock.end(JSON.stringify({ drivers, activeOrders: localStore.orders || [] }));
        } else if (cleanUrl === '/api/network-info') {
          resMock.end(JSON.stringify({ lanIp: '192.168.1.20', port: 3000, lanBaseUrl: LAN_SERVER }));
        } else {
          resMock.end(JSON.stringify({ ok: true }));
        }
      } catch (err) {
        if (!finished) {
          resMock.writeHead(500);
          resMock.end(JSON.stringify({ error: err.message || 'Internal Embedded Error' }));
        }
      } finally {
        inEmbeddedHandler = false;
      }
    });
  };

  // Interceptor de navegación para que enlaces internos funcionen entre archivos .html del APK y GitHub Pages
  const ROUTE_MAP = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/admin': 'index.html',
    '/admin/control-tower': 'control-tower.html',
    '/admin/fares': 'fares.html',
    '/client': 'client.html',
    '/order': 'client.html',
    '/client/tracking': 'client-tracking.html',
    '/driver': 'driver.html',
    '/driver/app': 'driver.html',
    '/restaurant': 'restaurant.html',
    '/restaurant/orders': 'restaurant.html',
    '/restaurant/kds': 'restaurant.html',
    '/restaurant/menu': 'restaurant-menu.html',
    '/restaurant/finances': 'restaurant-finances.html',
    '/restaurant/reviews': 'restaurant-reviews.html',
    '/restaurant/settings': 'restaurant-settings.html',
    '/restaurant/onboard': 'restaurant-onboard.html'
  };

  document.addEventListener('click', function(e) {
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    const cleanHref = href.split('?')[0];
    if (ROUTE_MAP[cleanHref]) {
      e.preventDefault();
      const query = href.includes('?') ? ('?' + href.split('?')[1]) : '';
      window.location.href = ROUTE_MAP[cleanHref] + query;
    }
  }, true);
})();\n`;
}

function transformHtmlForEmbeddedAsset(html, clientJsMap) {
  let out = html;

  // 1. Inyectar embeddedBackend.js al inicio de <head>
  out = out.replace('<head>', '<head>\n  <script src="embeddedBackend.js"></script>');

  // 2. Incrustar scripts locales (/client/script.js, /driver/script.js, /restaurant/client.js)
  out = out.replace('<script src="/client/script.js"></script>', () => `<script>\n${clientJsMap.clientFront}\n</script>`);
  out = out.replace('<script src="/driver/script.js"></script>', () => `<script>\n${clientJsMap.driverFront}\n</script>`);
  out = out.replace('<script src="/restaurant/client.js"></script>', () => `<script>\n${clientJsMap.restaurantClient}\n</script>`);

  // 3. Reemplazar redirecciones JS explícitas a rutas locales .html
  out = out
    .replace(/window\.location\.href\s*=\s*['"]\/client\/tracking['"]/g, "window.location.href = 'client-tracking.html'")
    .replace(/window\.location\.href\s*=\s*['"]\/client['"]/g, "window.location.href = 'client.html'")
    .replace(/window\.location\.href\s*=\s*['"]\/driver['"]/g, "window.location.href = 'driver.html'")
    .replace(/window\.location\.href\s*=\s*['"]\/restaurant['"]/g, "window.location.href = 'restaurant.html'");

  // 4. Desactivar registro de ServiceWorker en file:// para evitar warnings
  out = out.replace("navigator.serviceWorker.register('/sw.js')", "Promise.resolve()");

  return out;
}

async function generateApkAssets(baseUrl = 'http://127.0.0.1:3000', lanBaseUrl = 'http://192.168.1.20:3000') {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  const clientJsMap = {
    clientFront: fs.readFileSync(path.join(WEB_PANELS_DIR, 'clientFront.js'), 'utf8')
      .replace(/window\.location\.href\s*=\s*['"]\/client\/tracking['"]/g, "window.location.href = 'client-tracking.html'")
      .replace(/window\.location\.href\s*=\s*['"]\/client['"]/g, "window.location.href = 'client.html'"),
    driverFront: fs.readFileSync(path.join(WEB_PANELS_DIR, 'driverFront.js'), 'utf8')
      .replace(/window\.location\.href\s*=\s*['"]\/driver['"]/g, "window.location.href = 'driver.html'"),
    restaurantClient: fs.readFileSync(path.join(WEB_PANELS_DIR, 'restaurantClient.js'), 'utf8')
      .replace(/window\.location\.href\s*=\s*['"]\/restaurant['"]/g, "window.location.href = 'restaurant.html'")
  };

  // Escribir motor backend embebido en assets/ (Android APK) y docs/ (GitHub Pages Web Global)
  const embeddedBackendCode = buildEmbeddedBackendJs(lanBaseUrl);
  fs.writeFileSync(path.join(ASSETS_DIR, 'embeddedBackend.js'), embeddedBackendCode, 'utf8');
  fs.writeFileSync(path.join(DOCS_DIR, 'embeddedBackend.js'), embeddedBackendCode, 'utf8');
  fs.writeFileSync(path.join(DOCS_DIR, '.nojekyll'), '', 'utf8');

  const pagesToBundle = [
    { route: '/', file: 'index.html' },
    { route: '/admin/control-tower', file: 'control-tower.html' },
    { route: '/admin/fares', file: 'fares.html' },
    { route: '/client', file: 'client.html' },
    { route: '/client/tracking', file: 'client-tracking.html' },
    { route: '/driver', file: 'driver.html' },
    { route: '/restaurant', file: 'restaurant.html' },
    { route: '/restaurant/menu', file: 'restaurant-menu.html' },
    { route: '/restaurant/finances', file: 'restaurant-finances.html' },
    { route: '/restaurant/reviews', file: 'restaurant-reviews.html' },
    { route: '/restaurant/settings', file: 'restaurant-settings.html' },
    { route: '/restaurant/onboard', file: 'restaurant-onboard.html' }
  ];

  for (const page of pagesToBundle) {
    const res = await fetch(baseUrl + page.route);
    const rawHtml = await res.text();
    const compiledHtml = transformHtmlForEmbeddedAsset(rawHtml, clientJsMap);
    fs.writeFileSync(path.join(ASSETS_DIR, page.file), compiledHtml, 'utf8');
    fs.writeFileSync(path.join(DOCS_DIR, page.file), compiledHtml, 'utf8');
  }

  return pagesToBundle.map(p => p.file).concat(['embeddedBackend.js']);
}

function compileApksLocally() {
  const jdkHome = path.join(TOOLCHAIN_DIR, 'jdk17');
  const androidSdk = path.join(TOOLCHAIN_DIR, 'android-sdk');
  const gradleBat = path.join(TOOLCHAIN_DIR, 'gradle-8.5', 'bin', 'gradle.bat');

  if (!fs.existsSync(gradleBat)) {
    throw new Error('No se encontró Gradle local en ' + gradleBat);
  }

  const env = Object.assign({}, process.env, {
    JAVA_HOME: jdkHome,
    ANDROID_HOME: androidSdk,
    ANDROID_SDK_ROOT: androidSdk,
    PATH: `${path.join(jdkHome, 'bin')};${path.join(TOOLCHAIN_DIR, 'gradle-8.5', 'bin')};${process.env.PATH || ''}`
  });

  console.log('[LocalBuild] Compilando los 3 APKs localmente con Gradle 8.5 + JDK 17...');
  execSync(`"${gradleBat}" assembleRelease --no-daemon`, {
    cwd: path.join(ROOT_DIR, 'android-apps'),
    env,
    stdio: 'inherit'
  });

  fs.mkdirSync(DIST_DIR, { recursive: true });

  const outputs = [
    {
      src: path.join(ROOT_DIR, 'android-apps', 'app', 'build', 'outputs', 'apk', 'client', 'release', 'app-client-release.apk'),
      destName: 'PedidosNica-Cliente.apk'
    },
    {
      src: path.join(ROOT_DIR, 'android-apps', 'app', 'build', 'outputs', 'apk', 'driver', 'release', 'app-driver-release.apk'),
      destName: 'PedidosNica-Repartidor.apk'
    },
    {
      src: path.join(ROOT_DIR, 'android-apps', 'app', 'build', 'outputs', 'apk', 'restaurant', 'release', 'app-restaurant-release.apk'),
      destName: 'PedidosNica-Restaurante.apk'
    }
  ];

  const compiledFiles = [];
  for (const item of outputs) {
    if (!fs.existsSync(item.src)) {
      throw new Error('No se encontró el APK compilado esperado: ' + item.src);
    }
    const distPath = path.join(DIST_DIR, item.destName);
    const webPanelPath = path.join(WEB_PANELS_DIR, item.destName);
    fs.copyFileSync(item.src, distPath);
    fs.copyFileSync(item.src, webPanelPath);
    compiledFiles.push({ name: item.destName, path: distPath, size: fs.statSync(distPath).size });
  }

  // Mantener alias UberEats.apk apuntando al cliente compilado
  fs.copyFileSync(path.join(DIST_DIR, 'PedidosNica-Cliente.apk'), path.join(WEB_PANELS_DIR, 'UberEats.apk'));

  return compiledFiles;
}

module.exports = {
  generateApkAssets,
  compileApksLocally
};
