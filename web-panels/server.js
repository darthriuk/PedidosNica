const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { renderRestaurantApp } = require('./restaurantApp');
const { renderClientApp } = require('./clientApp');
const { handleClientApi } = require('./clientApi');
const { renderDriverApp } = require('./driverApp');
const { handleDriverApi, parseLocation } = require('./driverApi');

const PORT = 3000;
const PUBLIC_TUNNEL_URL = process.env.PUBLIC_TUNNEL_URL || 'https://1de3b77b254e8b.lhr.life';

function getLocalLanIp() {
  try {
    const interfaces = os.networkInterfaces();
    const candidates = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          candidates.push({ name, address: iface.address });
        }
      }
    }
    const preferred = candidates.find(c => /wi-?fi|wlan|eth/i.test(c.name) && /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(c.address));
    if (preferred) return preferred.address;
    if (candidates.length > 0) return candidates[0].address;
  } catch (_) {}
  return '192.168.1.20';
}
const SUPABASE_URL = 'https://zciujeihkvleehhqbeat.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDEyODIzMywiZXhwIjoyMTA1NzA0MjMzfQ.JohwsGaIH0JTkjEI7SSkFeWxibbpAQTvH4gHLMNSeTY';
const { handleRestaurantApi } = require('./restaurantApi');
const { handleAuthApi } = require('./authApi');
const localStore = require('./localStore');
const { GITHUB_REPO, readVersionInfo, syncProjectAndTriggerBuild } = require('./githubReleaseManager');

// Configuración en memoria para simulación y respaldo con Supabase
let currentCommissionRate = 15.0; // Porcentaje de comisión fijado por el dueño de la app

function getHeader(title) {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${title} | PedidosNica</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            uber: {
              green: '#06C167',
              greenHover: '#05A357',
              greenLight: 'rgba(6, 193, 103, 0.12)',
              black: '#000000',
              dark: '#121212',
              card: '#1C1C1C',
              surface: '#242424',
              border: '#2E2E2E',
              subtext: '#A6A6A6',
              light: '#F6F6F6'
            }
          },
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace']
          }
        }
      }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <meta name="theme-color" content="#06C167">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="PedidosNica">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function() {});
      });
    }
    let deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = document.getElementById('floatingInstallBtn');
      if (btn) btn.classList.remove('hidden');
    });
    window.triggerPWAInstall = function() {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => {
          deferredInstallPrompt = null;
          const btn = document.getElementById('floatingInstallBtn');
          if (btn) btn.classList.add('hidden');
        });
      } else {
        alert("Para instalar en tu teléfono:\nToca el menú de 3 puntos (⋮) en la esquina superior de Chrome y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
      }
    };
  </script>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #000000;
      color: #FFFFFF;
      -webkit-tap-highlight-color: transparent;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    /* Estilos de scrollbar suave */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #121212;
    }
    ::-webkit-scrollbar-thumb {
      background: #2E2E2E;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #06C167;
    }
    /* Estilos de Impresión para Ticket Térmico de Cocina (80mm) */
    @media print {
      body * {
        visibility: hidden !important;
      }
      #printableThermalTicket, #printableThermalTicket * {
        visibility: visible !important;
      }
      #printableThermalTicket {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 78mm !important;
        max-width: 80mm !important;
        margin: 0 !important;
        padding: 3mm !important;
        background: white !important;
        color: black !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
        box-shadow: none !important;
        border: none !important;
      }
      #printableThermalTicket .no-print {
        display: none !important;
      }
    }

    /* ===================================================================== */
    /* SISTEMA GLOBAL DE ICONOGRAFÍA MONOCROMÁTICA UNIFORME (#06C167)        */
    /* ===================================================================== */
    .pn-uni-icon {
      display: inline-block;
      width: 1.1em;
      height: 1.1em;
      vertical-align: -0.18em;
      color: #06C167 !important;
      stroke: currentColor;
      fill: none;
      stroke-width: 2.1;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
    }
    /* Contraste uniforme cuando el icono está dentro de un botón verde activo */
    .bg-\[\#06C167\] .pn-uni-icon,
    button.bg-\[\#06C167\] .pn-uni-icon,
    a.bg-\[\#06C167\] .pn-uni-icon,
    .text-black > .pn-uni-icon,
    .text-black .pn-uni-icon {
      color: #000000 !important;
    }
  </style>
</head>
<body class="min-h-screen bg-black text-white antialiased selection:bg-[#06C167] selection:text-black">`;
}

function getFooter() {
  return `
  <script>
    (function() {
      // Catálogo de vectores monocromáticos uniformes (Estilo Lucide / Uber Eats)
      const SVG_PATHS = {
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        building: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
        store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
        user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
        bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
        box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
        receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>',
        phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
        mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
        key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
        shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
        search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
        refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        check: '<polyline points="20 6 9 17 4 12"/>',
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
        grad: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
        bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
        car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
        zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
        card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
        bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
        print: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
        utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
        pause: '<circle cx="12" cy="12" r="10"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/>',
        alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
        dot: '<circle cx="12" cy="12" r="6"/>'
      };

      const EMOJI_TO_KEY = {
        '📍': 'pin', '🗺️': 'pin',
        '🎯': 'target',
        '🌐': 'globe',
        '🏠': 'home',
        '🏢': 'building', '🏨': 'building', '💼': 'building',
        '🏪': 'store',
        '👤': 'user', '👨‍🍳': 'user',
        '👥': 'users',
        '👑': 'shield', '🛡️': 'shield',
        '🛒': 'cart',
        '🛍️': 'bag',
        '📦': 'box',
        '🧾': 'receipt', '📋': 'receipt', '📝': 'receipt', '📚': 'receipt',
        '📞': 'phone',
        '📲': 'smartphone', '📱': 'smartphone',
        '📧': 'mail',
        '💬': 'chat',
        '🔐': 'lock', '🔒': 'lock',
        '🔓': 'unlock',
        '🔑': 'key',
        '🔍': 'search',
        '✏️': 'edit',
        '🗑️': 'trash',
        '🔄': 'refresh',
        '💾': 'save',
        '➕': 'plus',
        '✓': 'check', '✅': 'check', '🎉': 'check',
        '⭐': 'star', '★': 'star', '✨': 'star',
        '❤️': 'heart',
        '🎓': 'grad',
        '🛵': 'bike', '🚲': 'bike', '🏋️': 'zap',
        '🚗': 'car',
        '⚡': 'zap', '🔋': 'zap',
        '💵': 'cash',
        '💳': 'card',
        '🚪': 'logout',
        '🔔': 'bell', '🛎️': 'bell',
        '🖨️': 'print',
        '🍔': 'utensils', '🍕': 'utensils', '🍽️': 'utensils',
        '⏸️': 'pause',
        '🚫': 'alert', '⚠️': 'alert', 'ℹ️': 'alert',
        '🟢': 'dot', '🟡': 'dot', '🔴': 'dot', '🏷️': 'pin'
      };

      const EMOJI_KEYS = Object.keys(EMOJI_TO_KEY).sort((a, b) => b.length - a.length);
      const EMOJI_REGEX = new RegExp('(' + EMOJI_KEYS.map(k => k.replace(/[.*+?^$\{}()|[\\]\\\\]/g, '\\\\$&')).join('|') + ')', 'g');

      function makeSvgHtml(key) {
        const path = SVG_PATHS[key] || SVG_PATHS.dot;
        return '<svg class="pn-uni-icon" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
      }

      function normalizeIconsInRoot(root) {
        if (!root) return;

        // 1. En <option> de <select>, reemplazar emojis multicolores por viñeta monocromática limpia
        const options = root.querySelectorAll ? root.querySelectorAll('option') : [];
        options.forEach(opt => {
          if (opt.text && EMOJI_REGEX.test(opt.text)) {
            opt.text = opt.text.replace(EMOJI_REGEX, '▸ ').replace(/\\s+/g, ' ').trim();
          }
        });

        // 2. Recorrer nodos de texto para reemplazar emojis por iconos SVG uniformes (#06C167)
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node) {
            const p = node.parentNode;
            if (!p) return NodeFilter.FILTER_REJECT;
            const tag = p.nodeName.toUpperCase();
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'OPTION' || tag === 'TITLE') {
              return NodeFilter.FILTER_REJECT;
            }
            if (node.nodeValue && EMOJI_REGEX.test(node.nodeValue)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        });

        const textNodes = [];
        let current;
        while ((current = walker.nextNode())) {
          textNodes.push(current);
        }

        textNodes.forEach(tNode => {
          const val = tNode.nodeValue;
          if (!val || !EMOJI_REGEX.test(val)) return;
          const span = document.createElement('span');
          span.className = 'inline-flex items-center gap-1';
          span.innerHTML = val.replace(EMOJI_REGEX, function(match) {
            const key = EMOJI_TO_KEY[match] || 'dot';
            return makeSvgHtml(key);
          });
          if (tNode.parentNode) {
            tNode.parentNode.replaceChild(span, tNode);
          }
        });
      }

      document.addEventListener('DOMContentLoaded', function() {
        normalizeIconsInRoot(document.body);
        const obs = new MutationObserver(function(mutations) {
          mutations.forEach(function(m) {
            m.addedNodes.forEach(function(n) {
              if (n.nodeType === 1) {
                normalizeIconsInRoot(n);
              } else if (n.nodeType === 3 && n.parentNode) {
                normalizeIconsInRoot(n.parentNode);
              }
            });
          });
        });
        obs.observe(document.body, { childList: true, subtree: true });
      });
    })();
  </script>

  <!-- MODAL GLOBAL DE ACCESO MÓVIL (LAN + TÚNEL QR) -->
  <div id="pnMobileAccessModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-[#121212] border-2 border-[#06C167]/40 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
      <div class="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div class="flex items-center gap-2.5">
          <span class="p-2.5 rounded-2xl bg-[#06C167]/15 text-[#06C167] text-lg">📲</span>
          <div>
            <h3 class="text-base font-black text-white">Acceso desde tu Teléfono a Todas las Apps</h3>
            <p class="text-[11px] text-[#A6A6A6]">Escanea el código QR con la cámara de tu teléfono o abre el enlace directo</p>
          </div>
        </div>
        <button onclick="window.closeMobileAccessModal()" class="text-[#A6A6A6] hover:text-white text-base p-1.5">✕</button>
      </div>

      <!-- Explicación de por qué 'localhost' no abre en el teléfono -->
      <div class="p-3.5 rounded-2xl bg-[#191919] border border-[#2E2E2E] space-y-1.5">
        <p class="font-bold text-[#06C167] flex items-center gap-1.5">
          <span>ℹ️</span> ¿Por qué <code class="bg-black px-1.5 py-0.5 rounded text-white font-mono">localhost:3000</code> no abre en el teléfono?
        </p>
        <p class="text-[11px] text-[#A6A6A6] leading-relaxed">
          En cualquier teléfono, la palabra <code class="text-white font-mono">localhost</code> apunta al propio teléfono y no a tu computadora. Para entrar desde tu celular tienes <strong>2 opciones activas ahora mismo</strong>:
        </p>
      </div>

      <!-- Selector de Modo de Conexión -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button id="btnModeLan" onclick="window.setMobileQrMode('lan')" class="p-3.5 rounded-2xl border-2 border-[#06C167] bg-[#06C167]/10 text-left transition-all">
          <div class="flex items-center justify-between">
            <span class="font-black text-white text-xs flex items-center gap-1.5"><span>🌐</span> Opción 1: Red Wi-Fi Local (LAN)</span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#06C167] text-black uppercase">Misma Red</span>
          </div>
          <p class="font-mono text-[#06C167] text-xs font-bold mt-1" id="lblLanBaseUrl">http://${getLocalLanIp()}:${PORT}</p>
          <p class="text-[10px] text-[#A6A6A6] mt-0.5">Conexión directa por tu Wi-Fi local sin consumir internet.</p>
        </button>

        <button id="btnModeTunnel" onclick="window.setMobileQrMode('tunnel')" class="p-3.5 rounded-2xl border-2 border-[#2E2E2E] bg-[#191919] text-left transition-all">
          <div class="flex items-center justify-between">
            <span class="font-black text-white text-xs flex items-center gap-1.5"><span>⚡</span> Opción 2: Túnel HTTPS Universal</span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#06C167]/20 text-[#06C167] border border-[#06C167]/40 uppercase">Anti-Bloqueo + GPS</span>
          </div>
          <p class="font-mono text-[#06C167] text-xs font-bold mt-1 truncate" id="lblTunnelBaseUrl">${PUBLIC_TUNNEL_URL}</p>
          <p class="text-[10px] text-[#A6A6A6] mt-0.5">Úsalo si tu router Wi-Fi aísla dispositivos (AP Isolation) o si usas Datos 4G.</p>
        </button>
      </div>

      <!-- Cuadrícula de las 4 Apps con QR y Descarga de APK -->
      <div id="mobileAppsQrGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1"></div>

      <!-- Sección de Auto-Actualización y Publicación en GitHub Releases -->
      <div class="p-4 rounded-2xl bg-[#181C24] border border-[#06C167]/30 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="text-xs font-black text-white flex items-center gap-1.5">
              <span>🔄</span>
              <span>Motor de Auto-Actualización & GitHub Releases</span>
              <span id="lblCurrentAppVersion" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#06C167] text-black">v${readVersionInfo().version}</span>
            </div>
            <p class="text-[11px] text-[#A6A6A6] mt-0.5">
              Repositorio conectado: <a href="https://github.com/${GITHUB_REPO}/releases" target="_blank" class="text-[#06C167] font-mono underline">github.com/${GITHUB_REPO}</a>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.checkGitHubReleaseUpdate(true)" class="px-3 py-1.5 rounded-xl bg-[#242C3A] hover:bg-[#2E384A] text-white font-bold text-[11px] border border-[#3A465E] transition-colors flex items-center gap-1">
              <span>🔍</span> Buscar Actualización
            </button>
            <a href="https://github.com/${GITHUB_REPO}/releases/latest" target="_blank" class="px-3 py-1.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-[11px] transition-colors">
              Ver Releases ↗
            </a>
          </div>
        </div>
        <div id="githubReleaseStatusBox" class="text-[11px] text-[#A6A6A6] font-mono bg-black/50 p-2.5 rounded-xl border border-[#262626]">
          Verificando estado de compilación y última versión en GitHub...
        </div>

        <!-- Publicador de Nueva Versión en 1 Clic -->
        <div class="pt-2 border-t border-[#262E3D] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input type="text" id="inpNewReleaseVersion" placeholder="Nueva versión (ej: 1.0.1)" class="bg-black border border-[#2E384A] focus:border-[#06C167] rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none sm:w-44" />
          <input type="text" id="inpNewReleaseNotes" placeholder="Notas del cambio (ej: Mejoras en catálogo y despacho)" class="bg-black border border-[#2E384A] focus:border-[#06C167] rounded-xl px-3 py-1.5 text-xs text-white outline-none flex-1" />
          <button id="btnPublishGitHubUpdate" onclick="window.publishNewGitHubUpdate()" class="px-3.5 py-1.5 rounded-xl bg-[#06C167] hover:bg-[#05A357] text-black font-black text-xs transition-all shrink-0">
            🚀 Subir y Compilar Release
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- BANNER SUPERIOR DE AUTO-ACTUALIZACIÓN EN TIEMPO REAL -->
  <div id="pnAutoUpdateBanner" class="hidden fixed top-3 inset-x-4 max-w-xl mx-auto z-50 p-3.5 rounded-2xl bg-[#12161F]/95 border-2 border-[#06C167] shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
    <div class="flex items-center gap-2.5">
      <span class="p-2 rounded-xl bg-[#06C167]/20 text-[#06C167] text-base">🚀</span>
      <div>
        <p class="font-black text-white" id="pnUpdateBannerTitle">¡Nueva versión disponible!</p>
        <p class="text-[11px] text-[#A6A6A6] line-clamp-1" id="pnUpdateBannerDesc">Se ha detectado una nueva actualización en GitHub Releases.</p>
      </div>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <a id="pnUpdateBannerApkBtn" href="https://github.com/${GITHUB_REPO}/releases/latest" target="_blank" class="px-3 py-1.5 rounded-xl bg-[#06C167] text-black font-black text-[11px]">
        Actualizar APK
      </a>
      <button onclick="window.location.reload(true)" class="px-2.5 py-1.5 rounded-xl bg-[#242C3A] text-white font-bold text-[11px]">
        Recargar
      </button>
      <button onclick="document.getElementById('pnAutoUpdateBanner').classList.add('hidden')" class="text-[#A6A6A6] hover:text-white p-1">✕</button>
    </div>
  </div>

  <script>
    (function() {
      const GITHUB_REPO = '${GITHUB_REPO}';
      const INSTALLED_VERSION = '${readVersionInfo().version}';
      const NET_INFO = {
        lanBaseUrl: 'http://${getLocalLanIp()}:${PORT}',
        tunnelBaseUrl: '${PUBLIC_TUNNEL_URL}'
      };
      let currentQrMode = 'lan';

      const APPS = [
        { id: 'client', title: 'App Clientes', subtitle: 'Catálogo, Carrito y Tracking', path: '/client', icon: '🍔', apkName: 'PedidosNica-Cliente.apk' },
        { id: 'driver', title: 'App Repartidor', subtitle: 'Radar GPS y Bolsa de Pedidos', path: '/driver', icon: '🛵', apkName: 'PedidosNica-Repartidor.apk' },
        { id: 'restaurant', title: 'Suite Restaurante', subtitle: 'Comandas KDS y Menú', path: '/restaurant', icon: '🏪', apkName: 'PedidosNica-Restaurante.apk' },
        { id: 'hub', title: 'Central Hub', subtitle: 'App Manager & Usuarios IAM', path: '/', icon: '🛡️', apkName: null }
      ];

      function getCurrentPortalApkUrl() {
        const p = window.location.pathname;
        if (p.startsWith('/driver')) return 'https://github.com/' + GITHUB_REPO + '/releases/latest/download/PedidosNica-Repartidor.apk';
        if (p.startsWith('/restaurant')) return 'https://github.com/' + GITHUB_REPO + '/releases/latest/download/PedidosNica-Restaurante.apk';
        return 'https://github.com/' + GITHUB_REPO + '/releases/latest/download/PedidosNica-Cliente.apk';
      }

      function renderMobileQrCards() {
        const grid = document.getElementById('mobileAppsQrGrid');
        if (!grid) return;
        const base = currentQrMode === 'lan' ? NET_INFO.lanBaseUrl : NET_INFO.tunnelBaseUrl;

        const btnLan = document.getElementById('btnModeLan');
        const btnTunnel = document.getElementById('btnModeTunnel');
        if (btnLan && btnTunnel) {
          if (currentQrMode === 'lan') {
            btnLan.className = 'p-3.5 rounded-2xl border-2 border-[#06C167] bg-[#06C167]/10 text-left transition-all';
            btnTunnel.className = 'p-3.5 rounded-2xl border-2 border-[#2E2E2E] bg-[#191919] text-left transition-all';
          } else {
            btnTunnel.className = 'p-3.5 rounded-2xl border-2 border-[#06C167] bg-[#06C167]/10 text-left transition-all';
            btnLan.className = 'p-3.5 rounded-2xl border-2 border-[#2E2E2E] bg-[#191919] text-left transition-all';
          }
        }

        grid.innerHTML = APPS.map(function(app) {
          const fullUrl = base + app.path;
          const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=' + encodeURIComponent(fullUrl);
          const apkDownloadUrl = app.apkName ? ('https://github.com/' + GITHUB_REPO + '/releases/latest/download/' + app.apkName) : null;
          return '<div class="p-3.5 rounded-2xl bg-[#191919] border border-[#2E2E2E] flex flex-col items-center text-center justify-between gap-2.5">' +
            '<div class="w-full">' +
              '<div class="text-sm font-black text-white flex items-center justify-center gap-1.5"><span>' + app.icon + '</span> <span>' + app.title + '</span></div>' +
              '<p class="text-[10px] text-[#A6A6A6] mt-0.5">' + app.subtitle + '</p>' +
            '</div>' +
            '<div class="bg-white p-2 rounded-xl shadow-md">' +
              '<img src="' + qrSrc + '" alt="QR ' + app.title + '" class="w-32 h-32 object-contain" loading="lazy" />' +
            '</div>' +
            '<div class="w-full space-y-1.5">' +
              '<input type="text" readonly value="' + fullUrl + '" onclick="this.select()" class="w-full bg-black border border-[#2E2E2E] rounded-lg px-2 py-1 text-[10px] font-mono text-[#06C167] text-center outline-none" />' +
              '<div class="flex gap-1.5">' +
                '<button onclick="navigator.clipboard.writeText(\\'' + fullUrl + '\\'); this.textContent=\\'¡Copiado!\\'; setTimeout(()=>this.textContent=\\'Copiar Link\\', 1500)" class="flex-1 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2E2E2E] text-white font-bold text-[10px] transition-colors">Copiar Link</button>' +
                '<a href="' + fullUrl + '" target="_blank" class="py-1.5 px-2.5 rounded-lg bg-[#06C167] text-black font-black text-[10px]">Abrir ↗</a>' +
              '</div>' +
              (apkDownloadUrl ? (
                '<a href="' + apkDownloadUrl + '" target="_blank" class="block w-full py-1.5 rounded-lg bg-[#06C167]/15 hover:bg-[#06C167]/25 border border-[#06C167]/40 text-[#06C167] font-black text-[10px] transition-colors">📲 Descargar ' + app.apkName + '</a>'
              ) : '') +
            '</div>' +
          '</div>';
        }).join('');
      }

      window.checkGitHubReleaseUpdate = async function(manual) {
        const statusBox = document.getElementById('githubReleaseStatusBox');
        if (manual && statusBox) {
          statusBox.textContent = 'Consultando GitHub Releases (' + GITHUB_REPO + ')...';
        }
        try {
          // 1. Consultar endpoint local y GitHub Releases
          const res = await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/releases/latest', {
            headers: { 'Accept': 'application/vnd.github+json' }
          });
          if (res.ok) {
            const release = await res.json();
            const latestTag = (release.tag_name || '').replace(/^v/i, '');
            const assetsCount = Array.isArray(release.assets) ? release.assets.length : 0;
            if (statusBox) {
              statusBox.innerHTML = '✅ Último Release en GitHub: <strong class="text-[#06C167]">v' + latestTag + '</strong> (' + assetsCount + ' paquetes compilados listos) • Publicado: ' + new Date(release.published_at).toLocaleString();
            }
            const seenTag = localStorage.getItem('pn_seen_release_version') || INSTALLED_VERSION;
            if (latestTag && latestTag !== INSTALLED_VERSION && latestTag !== seenTag) {
              const banner = document.getElementById('pnAutoUpdateBanner');
              const titleEl = document.getElementById('pnUpdateBannerTitle');
              const descEl = document.getElementById('pnUpdateBannerDesc');
              const apkBtn = document.getElementById('pnUpdateBannerApkBtn');
              if (banner && titleEl && descEl && apkBtn) {
                titleEl.textContent = '🚀 Nueva Actualización Disponible (v' + latestTag + ')';
                descEl.textContent = release.name || 'Nueva versión compilada en GitHub Releases lista para instalar.';
                apkBtn.href = getCurrentPortalApkUrl();
                banner.classList.remove('hidden');
              }
            } else if (manual) {
              alert('✅ Estás en la versión más reciente (v' + (latestTag || INSTALLED_VERSION) + ').\\n\\nPuedes descargar los 3 archivos .APK directamente desde las tarjetas de abajo.');
            }
          } else {
            if (statusBox) {
              statusBox.innerHTML = '⚙️ GitHub Actions compilando versión inicial <strong class="text-[#06C167]">v' + INSTALLED_VERSION + '</strong> en <a href="https://github.com/' + GITHUB_REPO + '/actions" target="_blank" class="underline text-white">github.com/' + GITHUB_REPO + '/actions</a>...';
            }
          }
        } catch (_) {
          if (statusBox) {
            statusBox.textContent = 'Versión activa local: v' + INSTALLED_VERSION + ' • Sincronizado con ' + GITHUB_REPO;
          }
        }
      };

      window.publishNewGitHubUpdate = async function() {
        const verInput = document.getElementById('inpNewReleaseVersion');
        const notesInput = document.getElementById('inpNewReleaseNotes');
        const btn = document.getElementById('btnPublishGitHubUpdate');
        const statusBox = document.getElementById('githubReleaseStatusBox');
        const newVersion = verInput && verInput.value.trim() ? verInput.value.trim() : '';
        const changelog = notesInput && notesInput.value.trim() ? notesInput.value.trim() : 'Actualización de plataforma PedidosNica';

        if (!newVersion) {
          alert('Ingresa el número de la nueva versión (por ejemplo: 1.0.1)');
          return;
        }

        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Subiendo a GitHub...';
        }
        if (statusBox) {
          statusBox.innerHTML = '⏳ Subiendo cambios al repositorio <strong class="text-[#06C167]">' + GITHUB_REPO + '</strong> y disparando compilación de APKs (v' + newVersion + ')...';
        }

        try {
          const res = await fetch('/api/github/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newVersion: newVersion, changelog: changelog })
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Error al publicar en GitHub');
          }
          if (statusBox) {
            statusBox.innerHTML = '✅ Versión <strong class="text-[#06C167]">v' + data.versionInfo.version + '</strong> subida (' + data.filesUploaded + ' archivos). GitHub Actions está compilando los 3 APKs ahora mismo en <a href="' + data.actionsUrl + '" target="_blank" class="underline text-white">Ver Progreso ↗</a>';
          }
          const lblVer = document.getElementById('lblCurrentAppVersion');
          if (lblVer) lblVer.textContent = 'v' + data.versionInfo.version;
          if (verInput) verInput.value = '';
          if (notesInput) notesInput.value = '';
        } catch (err) {
          if (statusBox) {
            statusBox.innerHTML = '❌ Error: ' + err.message;
          }
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🚀 Subir y Compilar Release';
          }
        }
      };

      window.setMobileQrMode = function(mode) {
        currentQrMode = mode;
        renderMobileQrCards();
      };

      window.openMobileAccessModal = function(defaultMode) {
        if (defaultMode) currentQrMode = defaultMode;
        const modal = document.getElementById('pnMobileAccessModal');
        if (modal) {
          modal.classList.remove('hidden');
          renderMobileQrCards();
          window.checkGitHubReleaseUpdate(false);
        }
      };

      window.closeMobileAccessModal = function() {
        const modal = document.getElementById('pnMobileAccessModal');
        if (modal) modal.classList.add('hidden');
      };

      // Verificar automáticamente al abrir cualquier aplicación y cada 60 segundos
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() { window.checkGitHubReleaseUpdate(false); }, 1500);
        setInterval(function() { window.checkGitHubReleaseUpdate(false); }, 60000);
      });
    })();
  </script>
</body></html>`;
}

// 1. Selector de Portales / Hub Principal (PedidosNica) - Consola de App Manager
const { renderHub } = require('./hubApp');

// 2. Afiliación de Comercio (Onboarding con Nota de Comisión Transparente)
function renderOnboarding() {
  return `${getHeader('Afiliar Mi Comercio | PedidosNica')}
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
    <div class="flex items-center justify-between pb-6 mb-8 border-b border-[#262626]">
      <div>
        <a href="/restaurant" class="text-xs font-semibold text-[#06C167] hover:underline flex items-center gap-1 mb-2">
          <span>←</span> Volver a PedidosNica Orders
        </a>
        <h1 class="text-2xl sm:text-3xl font-black text-white">Afiliación de Nuevo Comercio</h1>
        <p class="text-xs text-[#A6A6A6] mt-1">Registra tu restaurante en PedidosNica para recibir pedidos, gestionar tu cocina y catálogo.</p>
      </div>
      <span class="text-3xl sm:text-4xl p-3 bg-[#06C167]/10 border border-[#06C167]/30 rounded-2xl shrink-0">🏪</span>
    </div>

    <!-- NOTA TRANSPARENTE DE COMISIÓN -->
    <div class="mb-8 p-5 rounded-2xl bg-[#121212] border-2 border-[#06C167]/40 text-white shadow-xl relative overflow-hidden">
      <div class="flex items-start gap-3">
        <span class="text-2xl text-[#06C167] mt-0.5">ℹ️</span>
        <div>
          <h3 class="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <span>Comisión de Plataforma PedidosNica</span>
            <span class="bg-[#06C167]/20 text-[#06C167] text-xs px-2 py-0.5 rounded-full border border-[#06C167]/30 font-mono">${currentCommissionRate}%</span>
          </h3>
          <p class="text-xs text-[#A6A6A6] mt-1.5 leading-relaxed">
            La plataforma retiene una comisión por servicio del <strong class="text-[#06C167] font-mono">${currentCommissionRate}%</strong> por cada comanda completada. Esto cubre la logística de motorizados, tecnología de ruteo y pasarela de cobro.
          </p>
        </div>
      </div>
    </div>

    <!-- Caja de Error si ocurre algún fallo -->
    <div id="errorMsg" class="hidden mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2">
    </div>

    <!-- Formulario de Registro -->
    <form id="onboardingForm" onsubmit="handleOnboard(event)" class="space-y-5 bg-[#121212] border border-[#262626] p-6 sm:p-8 rounded-3xl shadow-2xl">
      <div>
        <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">Nombre del Comercio / Restaurante *</label>
        <input type="text" id="restName" required placeholder="Ej: Asados Doña Tania, Pupusería El Centro, Tip-Top Express" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">Correo Electrónico *</label>
          <input type="email" id="restEmail" required placeholder="gerencia@mirestaurante.ni" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors" />
        </div>
        <div>
          <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">Teléfono / WhatsApp *</label>
          <input type="tel" id="restPhone" required placeholder="+505 8888 1234" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors" />
        </div>
      </div>

      <div>
        <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">Dirección Física del Local (Nicaragua) *</label>
        <input type="text" id="restAddress" required placeholder="Colonia Los Robles, de la Rotonda 2c al lago, Managua" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">Horarios de Atención *</label>
          <input type="text" id="restHours" required value="Lun - Dom: 11:00 a 23:00" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors" />
        </div>
        <div>
          <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">Radio de Entrega (km)</label>
          <select id="restRadius" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors">
            <option value="5.0">5.0 km (Radio urbano estándar)</option>
            <option value="7.0" selected>7.0 km (Zona metropolitana)</option>
            <option value="10.0">10.0 km (Radio extendido)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs uppercase font-bold text-[#A6A6A6] mb-2">URL del Logo (Opcional)</label>
        <input type="url" id="restLogo" placeholder="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150" class="w-full bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#06C167] rounded-xl p-3.5 text-white text-sm focus:outline-none transition-colors" />
      </div>

      <div class="pt-4 border-t border-[#262626]">
        <button type="submit" id="btnSubmit" class="w-full bg-[#06C167] hover:bg-[#05A357] text-black font-black py-4 rounded-xl text-sm shadow-xl shadow-[#06C167]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
          <span>✓</span> Completar Afiliación y Abrir Catálogo
        </button>
      </div>
    </form>

    <div id="successMsg" class="hidden mt-6 p-6 sm:p-8 rounded-3xl bg-[#06C167]/15 border border-[#06C167]/40 text-center animate-fade-in shadow-2xl">
      <span class="text-4xl sm:text-5xl">🎉</span>
      <h3 class="text-xl sm:text-2xl font-black text-white mt-3">¡Restaurante Afiliado con Éxito!</h3>
      <p id="successRestText" class="text-xs sm:text-sm text-[#A6A6A6] mt-2">
        <strong id="successRestName" class="text-white"></strong> ha sido registrado en PedidosNica con su menú inicial. Redirigiendo al gestor de comandas y menú...
      </p>
      <div class="mt-4 flex items-center justify-center gap-2 text-xs text-[#06C167] font-bold">
        <span class="w-2 h-2 rounded-full bg-[#06C167] animate-ping"></span>
        <span>Entrando a tu panel...</span>
      </div>
    </div>
  </div>

  <script>
    async function handleOnboard(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSubmit');
      const errEl = document.getElementById('errorMsg');
      errEl.classList.add('hidden');
      btn.innerText = 'Registrando en PedidosNica...';
      btn.disabled = true;

      const name = document.getElementById('restName').value.trim();
      const email = document.getElementById('restEmail').value.trim();
      const phone = document.getElementById('restPhone').value.trim();
      const address = document.getElementById('restAddress').value.trim();
      const opening_hours = document.getElementById('restHours').value.trim();
      const delivery_radius_km = document.getElementById('restRadius').value;
      const logo_url = document.getElementById('restLogo').value.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150';

      const payload = {
        name,
        email,
        phone,
        address,
        opening_hours,
        delivery_radius_km,
        logo_url
      };

      try {
        const response = await fetch('/api/restaurant/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Error al procesar la solicitud.');
        }

        const newRest = result.restaurant;
        if (newRest && newRest.id) {
          localStorage.setItem('active_restaurant_id', newRest.id);
        }

        document.getElementById('onboardingForm').classList.add('hidden');
        document.getElementById('successRestName').innerText = newRest.name || name;
        document.getElementById('successMsg').classList.remove('hidden');

        setTimeout(() => {
          const targetUrl = newRest && newRest.id 
            ? '/restaurant/menu?restaurant_id=' + encodeURIComponent(newRest.id)
            : '/restaurant/menu';
          window.location.href = targetUrl;
        }, 1500);

      } catch (err) {
        console.error('Error al registrar comercio:', err);
        errEl.innerText = '❌ ' + (err.message || 'Error al conectar con el servidor.');
        errEl.classList.remove('hidden');
        btn.innerText = '✓ Intentar nuevamente';
        btn.disabled = false;
      }
    }
  </script>
  ${getFooter()}`;
}

// 3. Suite Completa del Restaurante (PedidosYa Partner)
// KDS con timbre, comanda térmica 80mm, modificadores, rechazos, finanzas y configuración
function getRestaurantView(tab = 'kds') {
  return renderRestaurantApp(tab, {
    currentCommissionRate,
    SUPABASE_URL,
    SUPABASE_ANON,
    getHeader,
    getFooter
  });
}

// 7. Consola de la Plataforma (Hub Super Admin)
function renderAdminPortal() {
  return `${getHeader('Consola de la Plataforma - Super Admin')}
  <div class="max-w-5xl mx-auto px-6 py-12">
    <div class="flex items-center justify-between pb-6 mb-8 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <span class="text-3xl p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">🛡️</span>
        <div>
          <span class="text-xs uppercase font-bold tracking-wider text-indigo-400">Dueños de la Aplicación</span>
          <h1 class="text-2xl font-black text-white">Consola Central de Operaciones</h1>
        </div>
      </div>
      <a href="/" class="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors">
        ← Cambiar de Portal
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <a href="/admin/control-tower" class="p-8 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl transition-all shadow-xl block group">
        <div class="flex justify-between items-center mb-4">
          <span class="text-4xl p-3 bg-indigo-500/10 rounded-2xl">📡</span>
          <span class="text-xs bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full font-bold">MapLibre GL</span>
        </div>
        <h2 class="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Torre de Control de Flota</h2>
        <p class="text-sm text-slate-400 mt-2">Supervisión en vivo de repartidores motorizados, niveles de batería, velocidad y asignaciones de pedidos.</p>
        <span class="inline-block mt-4 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">Ver Mapa de Flota en Vivo →</span>
      </a>

      <a href="/admin/fares" class="p-8 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl transition-all shadow-xl block group">
        <div class="flex justify-between items-center mb-4">
          <span class="text-4xl p-3 bg-indigo-500/10 rounded-2xl">⚙️</span>
          <span class="text-xs bg-amber-500/15 text-amber-300 px-3 py-1 rounded-full font-bold font-mono">${currentCommissionRate}% Comisión</span>
        </div>
        <h2 class="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Tarifas, Geocercas y % de Comisión</h2>
        <p class="text-sm text-slate-400 mt-2">Configura la comisión porcentual retenida a cada comercio, la tarifa base, km, minuto y surge multiplier.</p>
        <span class="inline-block mt-4 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">Configurar Parámetros →</span>
      </a>
    </div>
  </div>
  ${getFooter()}`;
}

// 8. Torre de Control de Flota (MapLibre GL Conectada a Supabase Realtime)
function renderControlTower() {
  return `${getHeader('Torre de Control de Flota - PedidosNica')}
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>

  <div class="flex h-screen overflow-hidden bg-[#0A0D14] text-white">
    <!-- BARRA LATERAL IZQUIERDA -->
    <div class="w-88 sm:w-[410px] border-r border-[#1E2533] bg-[#10141D] flex flex-col justify-between z-10 shadow-2xl shrink-0">
      <div class="p-5 flex flex-col h-full overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-[#06C167]/15 text-[#06C167] border border-[#06C167]/30 text-[10px] font-bold uppercase tracking-wider">
              Super Admin
            </span>
            <span class="text-xs text-[#8A94A6] font-mono">Managua, NI</span>
          </div>
          <a href="/admin/fares" class="text-xs font-semibold text-[#8A94A6] hover:text-white transition-colors">
            Tarifas →
          </a>
        </div>

        <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Torre de Control</span>
          <span class="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-pulse"></span>
        </h1>
        <p class="text-xs text-[#8A94A6] mt-0.5 mb-4">Monitoreo en vivo de motorizados y pedidos en calle.</p>

        <!-- Contadores de Estado -->
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="p-3 rounded-xl bg-[#161B26] border border-emerald-500/30">
            <p class="text-[10px] text-emerald-400 font-bold uppercase">Disponibles</p>
            <p class="text-xl font-black text-white mt-0.5 font-mono" id="count-avail">0</p>
          </div>
          <div class="p-3 rounded-xl bg-[#161B26] border border-blue-500/30">
            <p class="text-[10px] text-blue-400 font-bold uppercase">En Reparto</p>
            <p class="text-xl font-black text-white mt-0.5 font-mono" id="count-busy">0</p>
          </div>
          <div class="p-3 rounded-xl bg-[#161B26] border border-purple-500/30">
            <p class="text-[10px] text-purple-400 font-bold uppercase">Pedidos</p>
            <p class="text-xl font-black text-white mt-0.5 font-mono" id="count-orders">0</p>
          </div>
        </div>

        <!-- Selector de Pestañas: Flota vs Pedidos -->
        <div class="flex bg-[#161B26] p-1 rounded-xl border border-[#232B3C] mb-3 shrink-0">
          <button id="tabDriversBtn" onclick="switchTowerTab('drivers')" class="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#06C167] text-black transition-all">
            🛵 Repartidores (<span id="tabCountDrivers">0</span>)
          </button>
          <button id="tabOrdersBtn" onclick="switchTowerTab('orders')" class="flex-1 py-1.5 text-xs font-bold rounded-lg text-[#8A94A6] hover:text-white transition-all">
            📦 Pedidos (<span id="tabCountOrders">0</span>)
          </button>
        </div>

        <!-- Contenido de Listas Desplazable -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1" id="listContainer">
          <div id="driver-list" class="space-y-2">
            <p class="text-xs text-[#8A94A6] text-center py-6">Cargando flota desde Supabase...</p>
          </div>
          <div id="orders-list" class="space-y-2 hidden"></div>
        </div>

      </div>

      <!-- Footer Lateral -->
      <div class="p-4 bg-[#0D1017] border-t border-[#1E2533] flex items-center justify-between text-xs text-[#8A94A6]">
        <a href="/" class="text-xs text-indigo-400 hover:underline">← Volver al Hub</a>
        <span class="text-[#06C167] font-mono font-semibold flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-[#06C167]"></span>
          Supabase Realtime
        </span>
      </div>
    </div>

    <!-- MAPA PRINCIPAL EN VIVO -->
    <div class="flex-1 relative bg-[#07090E]" id="map" style="height: 100vh;">
      
      <!-- Controles Superiores Flotantes sobre el Mapa -->
      <div class="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#121620]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#232B3C] shadow-2xl">
        <button onclick="setTowerMapStyle('bright')" class="px-3 py-1 rounded-xl text-xs font-bold text-white hover:bg-[#202737] transition-all">
          🗺️ Calles
        </button>
        <button onclick="setTowerMapStyle('dark')" class="px-3 py-1 rounded-xl text-xs font-bold text-[#8A94A6] hover:text-white hover:bg-[#202737] transition-all">
          🌙 Noche
        </button>
        <button onclick="fitAllFleet()" class="px-3 py-1 rounded-xl text-xs font-bold bg-[#06C167] text-black hover:bg-[#05A357] transition-all">
          🎯 Ver Toda la Flota
        </button>
      </div>

      <!-- Leyenda Flotante -->
      <div class="absolute bottom-6 right-6 z-20 bg-[#121620]/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-[#232B3C] shadow-2xl text-[11px] space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#06C167]"></span>
          <span class="text-slate-200">Disponible (Listo)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span class="text-slate-200">En Reparto (Con Pedido)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          <span class="text-slate-400">Desconectado</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    const SUPABASE_URL = '${SUPABASE_URL}';
    const SUPABASE_ANON = '${SUPABASE_ANON}';

    let map = null;
    let driversMap = new Map();
    let driverMarkers = new Map();
    let activeTab = 'drivers';

    // 1. Inicializar Mapa MapLibre
    map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [-86.2650, 12.1260], // Managua, Nicaragua
      zoom: 13.5
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', async () => {
      await loadFleetData();
      initSupabaseSubscriptions();
      setInterval(loadFleetData, 4000);
    });

    // 2. Cargar Flota y Pedidos desde Backend
    async function loadFleetData() {
      try {
        const resp = await fetch('/api/admin/fleet');
        const data = await resp.json();
        if (!data.success) return;

        renderDrivers(data.drivers || []);
        renderActiveOrders(data.orders || []);
      } catch (err) {
        console.warn('[Torre de Control] Error cargando flota:', err);
      }
    }

    // 3. Renderizar Drivers y Marcadores
    function renderDrivers(drivers) {
      let availCount = 0;
      let busyCount = 0;

      drivers.forEach(d => {
        driversMap.set(d.id, d);
        if (d.status === 'AVAILABLE') availCount++;
        else if (d.status === 'BUSY') busyCount++;

        updateDriverMarker(d);
      });

      document.getElementById('count-avail').innerText = availCount;
      document.getElementById('count-busy').innerText = busyCount;
      document.getElementById('tabCountDrivers').innerText = drivers.length;

      const listEl = document.getElementById('driver-list');
      listEl.innerHTML = drivers.map(d => {
        const isAvail = d.status === 'AVAILABLE';
        const isBusy = d.status === 'BUSY';
        const statusLabel = isAvail ? '🟢 Disponible' : (isBusy ? '🔵 En Reparto' : '⚪ Desconectado');
        const badgeColor = isAvail ? 'text-[#06C167] bg-[#06C167]/10 border-[#06C167]/30' : (isBusy ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-slate-400 bg-slate-800/50 border-slate-700');

        return \`
          <div class="p-3 rounded-2xl border border-[#222938] bg-[#141822] hover:border-[#06C167]/60 hover:bg-[#181D29] transition-all cursor-pointer group" onclick="flyToDriver('\${d.id}')">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="text-base">🛵</span>
                <strong class="text-white text-xs sm:text-sm font-bold group-hover:text-[#06C167] transition-colors">\${d.name}</strong>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border \${badgeColor}">
                \${statusLabel}
              </span>
            </div>
            <div class="text-[11px] text-[#8A94A6] flex items-center justify-between">
              <span>\${d.vehicle}</span>
              <span>⭐ \${d.rating} • 🔋 \${d.bat}%</span>
            </div>
            <div class="mt-2 pt-2 border-t border-[#1F2533] flex items-center justify-between text-[10px] text-[#6C768A]">
              <span>Vel: \${d.speed || '0 km/h'}</span>
              <span class="text-[#06C167] group-hover:underline">Enfocar en mapa →</span>
            </div>
          </div>
        \`;
      }).join('');
    }

    function updateDriverMarker(d) {
      if (!map) return;

      const isAvail = d.status === 'AVAILABLE';
      const isBusy = d.status === 'BUSY';
      const bgColor = isAvail ? '#06C167' : (isBusy ? '#3b82f6' : '#64748b');

      if (driverMarkers.has(d.id)) {
        const marker = driverMarkers.get(d.id);
        marker.setLngLat([d.lng, d.lat]);
        const el = marker.getElement();
        el.style.backgroundColor = bgColor;
      } else {
        const el = document.createElement('div');
        el.className = 'w-10 h-10 rounded-2xl flex items-center justify-center text-lg border-2 border-white shadow-2xl cursor-pointer hover:scale-110 transition-transform';
        el.style.backgroundColor = bgColor;
        el.innerText = '🛵';

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(\`
          <div class="text-slate-900 font-sans p-2 min-w-[170px]">
            <strong class="text-sm font-black text-slate-900 block">\${d.name}</strong>
            <span class="text-xs text-slate-600 block">\${d.vehicle}</span>
            <div class="mt-1 pt-1 border-t border-slate-200 text-xs">
              <span class="font-bold \${isAvail ? 'text-emerald-600' : 'text-blue-600'}">\${isAvail ? '🟢 Disponible' : (isBusy ? '🔵 En Reparto' : '⚪ Desconectado')}</span><br/>
              <span class="text-slate-500">Batería: \${d.bat}% • \${d.speed || '0 km/h'}</span>
            </div>
          </div>
        \`);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([d.lng, d.lat])
          .setPopup(popup)
          .addTo(map);

        driverMarkers.set(d.id, marker);
      }
    }

    function renderActiveOrders(orders) {
      document.getElementById('count-orders').innerText = orders.length;
      document.getElementById('tabCountOrders').innerText = orders.length;

      const listEl = document.getElementById('orders-list');
      if (orders.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-[#8A94A6] text-center py-6">No hay pedidos en curso en este momento.</p>';
        return;
      }

      listEl.innerHTML = orders.map(o => \`
        <div class="p-3 rounded-2xl border border-[#222938] bg-[#141822] hover:border-[#06C167]/60 hover:bg-[#181D29] transition-all cursor-pointer group" onclick="flyToOrder('\${o.id}')">
          <div class="flex items-center justify-between mb-1.5">
            <span class="font-mono font-bold text-xs text-[#06C167]">#\${o.id.slice(0, 8).toUpperCase()}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1C2230] text-amber-300 border border-[#2B3548]">
              \${o.status}
            </span>
          </div>
          <p class="text-xs font-bold text-white truncate">🏪 \${o.restaurant_name}</p>
          <p class="text-[11px] text-[#8A94A6] truncate mt-0.5">📍 \${o.delivery_address}</p>
          <div class="mt-2 pt-2 border-t border-[#1F2533] flex items-center justify-between text-[11px]">
            <span class="font-mono font-bold text-white">C$ \${o.total || 0}</span>
            <span class="text-[#06C167] group-hover:underline">Ver Ruta →</span>
          </div>
        </div>
      \`).join('');
    }

    function initSupabaseSubscriptions() {
      if (typeof window.supabase === 'undefined') return;

      const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

      sb.channel('admin-control-tower-drivers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_profiles' }, () => {
          loadFleetData();
        })
        .subscribe();

      sb.channel('admin-telemetry-broadcast')
        .on('broadcast', { event: 'driver_location' }, ({ payload }) => {
          if (payload && payload.latitude && payload.longitude) {
            const targetId = payload.driverId || '6c5c143c-e567-4e1d-85b7-d4f984628816';
            const targetMarker = driverMarkers.get(targetId);
            if (targetMarker) {
              targetMarker.setLngLat([payload.longitude, payload.latitude]);
            }
          }
        })
        .subscribe();

      sb.channel('admin-control-tower-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadFleetData();
        })
        .subscribe();
    }

    window.flyToDriver = function(driverId) {
      const d = driversMap.get(driverId);
      if (d && map) {
        map.flyTo({ center: [d.lng, d.lat], zoom: 16, essential: true });
        const marker = driverMarkers.get(driverId);
        if (marker) marker.togglePopup();
      }
    };

    window.flyToOrder = function(orderId) {
      if (map) {
        map.flyTo({ center: [-86.2550, 12.1180], zoom: 14.5, essential: true });
      }
    };

    window.fitAllFleet = function() {
      if (!map || driversMap.size === 0) return;
      const bounds = new maplibregl.LngLatBounds();
      driversMap.forEach(d => bounds.extend([d.lng, d.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    };

    window.setTowerMapStyle = function(style) {
      if (!map) return;
      const url = style === 'dark'
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://tiles.openfreemap.org/styles/bright';
      map.setStyle(url);
      map.once('style.load', () => {
        driverMarkers.clear();
        loadFleetData();
      });
    };

    window.switchTowerTab = function(tab) {
      activeTab = tab;
      const btnDrivers = document.getElementById('tabDriversBtn');
      const btnOrders = document.getElementById('tabOrdersBtn');
      const listDrivers = document.getElementById('driver-list');
      const listOrders = document.getElementById('orders-list');

      if (tab === 'drivers') {
        btnDrivers.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#06C167] text-black transition-all';
        btnOrders.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg text-[#8A94A6] hover:text-white transition-all';
        listDrivers.classList.remove('hidden');
        listOrders.classList.add('hidden');
      } else {
        btnOrders.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#06C167] text-black transition-all';
        btnDrivers.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg text-[#8A94A6] hover:text-white transition-all';
        listOrders.classList.remove('hidden');
        listDrivers.classList.add('hidden');
      }
    };
  </script>
  ${getFooter()}`;
}

// 9. Tarifas, Geocercas Y Modificación de Comisión del Negocio
function renderFares() {
  return `${getHeader('Tarifas y Comisión de la Plataforma - Super Admin')}
  <div class="p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between pb-6 mb-8 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
            Super Admin
          </span>
          <a href="/admin/control-tower" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            ← Ir a Torre de Control
          </a>
        </div>
        <h1 class="text-3xl font-black text-white tracking-tight">Reglas Económicas, Geocercas y Comisión</h1>
        <p class="text-xs text-slate-400 mt-1">Configuración central del modelo de negocio para los comercios y clientes</p>
      </div>
      <a href="/" class="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
        Salir
      </a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 class="text-lg font-bold text-white mb-2">Parámetros Económicos Globales</h2>
        
        <!-- CAMPO EXCLUSIVO: MODIFICAR PORCENTAJE DE COMISIÓN DE LA PLATAFORMA -->
        <div class="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl">
          <label class="block text-xs uppercase font-extrabold text-amber-300 mb-1 flex items-center justify-between">
            <span>% Comisión por Pedido a Comercios</span>
            <span class="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Exclusivo Plataforma</span>
          </label>
          <div class="flex items-center gap-3">
            <input type="number" id="commissionRate" value="${currentCommissionRate}" step="0.5" min="1.0" max="40.0" oninput="updateCommissionState(this.value)" class="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-amber-300 font-mono font-bold text-base focus:outline-none" />
            <span class="text-amber-300 font-black text-lg">%</span>
          </div>
          <p class="text-[11px] text-amber-200/70 mt-1.5">
            Este porcentaje se aplicará y mostrará inmediatamente a los comercios al afiliarse y en cada liquidación.
          </p>
        </div>

        <div>
          <label class="block text-xs text-slate-400 uppercase font-semibold mb-1.5">Tarifa Base ($)</label>
          <input type="number" id="baseFare" value="1.50" step="0.10" oninput="calculate()" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-400 uppercase font-semibold mb-1.5">Por Km ($)</label>
            <input type="number" id="perKm" value="0.65" step="0.05" oninput="calculate()" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-400 uppercase font-semibold mb-1.5">Por Minuto ($)</label>
            <input type="number" id="perMin" value="0.15" step="0.05" oninput="calculate()" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs text-indigo-400 uppercase font-semibold mb-1.5">Surge Multiplier (Demanda / Lluvia)</label>
          <input type="number" id="surge" value="1.25" step="0.05" oninput="calculate()" class="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-3 text-indigo-300 font-bold text-sm" />
        </div>
        <button onclick="savePlatformSettings()" id="btnSaveParams" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition-all shadow-lg text-sm mt-4">
          Guardar Parámetros y Comisión en Supabase
        </button>
        <p id="saveNotice" class="text-xs text-emerald-400 font-bold text-center hidden">
          ✓ ¡Parámetros de comisión y tarifas actualizados exitosamente!
        </p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
        <div>
          <h2 class="text-lg font-bold text-white mb-1">Simulador de Cotización al Cliente</h2>
          <p class="text-xs text-slate-400 mb-6 leading-relaxed">
            Respuesta del motor según distancia vial OSRM, tiempo y recargo de demanda.
          </p>

          <div class="space-y-5">
            <div>
              <div class="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Distancia OSRM:</span>
                <span class="font-mono text-indigo-400 font-bold text-sm" id="lblKm">4.5 km</span>
              </div>
              <input type="range" id="sliderKm" min="0.5" max="15.0" step="0.1" value="4.5" oninput="calculate()" class="w-full accent-indigo-500 cursor-pointer" />
            </div>
            <div>
              <div class="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Tiempo de Viaje:</span>
                <span class="font-mono text-indigo-400 font-bold text-sm" id="lblMin">18 mins</span>
              </div>
              <input type="range" id="sliderMin" min="3" max="60" step="1" value="18" oninput="calculate()" class="w-full accent-indigo-500 cursor-pointer" />
            </div>
          </div>
        </div>

        <div class="mt-8 p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center">
          <p class="text-xs uppercase font-semibold text-slate-400 tracking-wider">Costo Final Cobrado al Cliente</p>
          <p class="text-4xl font-extrabold text-emerald-400 font-mono my-2 tracking-tight" id="totalFee">$8.90</p>
          <p class="text-xs text-slate-500">Costo de API de Mapas para este cálculo: <strong class="text-emerald-400 font-semibold">$0.00</strong></p>
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

    async function updateCommissionState(val) {
      try {
        await fetch('/api/admin/commission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commission_rate: parseFloat(val) })
        });
      } catch(e) {}
    }

    function savePlatformSettings() {
      const val = document.getElementById('commissionRate').value;
      updateCommissionState(val);
      const notice = document.getElementById('saveNotice');
      notice.classList.remove('hidden');
      setTimeout(() => notice.classList.add('hidden'), 3000);
    }

    calculate();
  </script>
  ${getFooter()}`;
}

// Sistema de Difusión en Tiempo Real (Server-Sent Events para Sincronización Inmediata)
const sseClients = new Set();
function broadcastEvent(typeOrObj, payload) {
  if (localStore && typeof localStore.pushToSupabase === 'function') {
    localStore.pushToSupabase().catch(() => {});
  }
  let eventData;
  if (typeof typeOrObj === 'object' && typeOrObj !== null) {
    eventData = { ...typeOrObj, timestamp: Date.now() };
  } else {
    eventData = { type: typeOrObj, payload, timestamp: Date.now() };
  }
  const data = JSON.stringify(eventData);
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // Canal de eventos en vivo SSE para sincronización instantánea
  if (url === '/api/live-stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('data: {"type":"CONNECTED"}\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // API Backend de Autenticación, Perfiles y Roles (RBAC)
  if (url.startsWith('/api/auth/')) {
    await handleAuthApi(req, res, req.url, {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      broadcastEvent
    });
    return;
  }

  // API Backend de Configuración del Restaurante (RBAC: Solo RESTAURANT_ADMIN)
  if (url === '/api/restaurant/settings') {
    await handleAuthApi(req, res, req.url, {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      broadcastEvent
    });
    return;
  }

  // API Backend de Cliente (Comensal)
  if (url.startsWith('/api/client/')) {
    await handleClientApi(req, res, req.url, {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      broadcastEvent
    });
    return;
  }

  // API Backend de Restaurante conectada directamente a Supabase
  if (url.startsWith('/api/restaurant/')) {
    await handleRestaurantApi(req, res, req.url, {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      currentCommissionRate,
      broadcastEvent
    });
    return;
  }

  // API Backend de Repartidor (Driver)
  if (url.startsWith('/api/driver/')) {
    await handleDriverApi(req, res, req.url, {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      broadcastEvent
    });
    return;
  }

  // API endpoint para actualizar comisión desde el admin
  if (req.method === 'POST' && url === '/api/admin/commission') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.commission_rate) {
          currentCommissionRate = parseFloat(data.commission_rate);
          console.log(`[SuperAdmin] Comisión de plataforma actualizada a: ${currentCommissionRate}%`);
        }
      } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, commission_rate: currentCommissionRate }));
    });
    return;
  }

  // API endpoint para obtener la flota y pedidos en vivo para la Torre de Control
  if (req.method === 'GET' && url === '/api/admin/fleet') {
    try {
      const driverUsers = localStore.users.filter(u => u.role === 'DRIVER');
      const drivers = driverUsers.map(u => {
        const dp = u.driver_profile || {};
        const loc = parseLocation(dp.last_location) || { lng: -86.2650, lat: 12.1260 };
        const vLabel = dp.vehicle_type === 'BICYCLE'
          ? 'Bicicleta'
          : (dp.vehicle_type === 'CAR' ? 'Automóvil' : 'Motocicleta');
        return {
          id: u.id,
          name: u.full_name,
          phone: u.phone || '+505 8877-6655',
          vehicle: `${vLabel} (${dp.license_plate || 'A482XYZ'})`,
          status: dp.current_status || 'AVAILABLE',
          lat: loc.lat,
          lng: loc.lng,
          bat: dp.battery_level || 95,
          rating: dp.rating || 4.95,
          speed: dp.current_status === 'BUSY' ? '28 km/h' : '0 km/h'
        };
      });

      const activeStatuses = ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP'];
      const orders = localStore.orders
        .filter(o => activeStatuses.includes(o.status))
        .slice(0, 15)
        .map(o => {
          const rest = localStore.restaurants.find(r => r.id === o.restaurant_id);
          return {
            id: o.id,
            status: o.status,
            restaurant_name: rest?.name || 'Local Asociado',
            restaurant_coords: parseLocation(rest?.location) || { lng: -86.2650, lat: 12.1260 },
            delivery_address: o.delivery_address,
            delivery_coords: parseLocation(o.delivery_location) || { lng: -86.2480, lat: 12.1060 },
            driver_id: o.driver_id,
            total: o.total
          };
        });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, drivers, orders }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Manifest PWA para instalación en Android / iOS
  if (url === '/manifest.json') {
    const manifest = {
      name: "PedidosNica Delivery",
      short_name: "PedidosNica",
      description: "Plataforma de delivery y pedidos a domicilio en Nicaragua",
      start_url: "/client",
      scope: "/",
      display: "standalone",
      background_color: "#000000",
      theme_color: "#06C167",
      orientation: "portrait",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };
    res.writeHead(200, {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(manifest, null, 2));
    return;
  }

  // Service Worker para soporte PWA y modo pantalla completa
  if (url === '/sw.js') {
    const swScript = `
      self.addEventListener('install', (e) => {
        self.skipWaiting();
      });
      self.addEventListener('activate', (e) => {
        e.waitUntil(clients.claim());
      });
      self.addEventListener('fetch', (e) => {
        e.respondWith(
          fetch(e.request).catch(() => caches.match(e.request))
        );
      });
    `;
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(swScript);
    return;
  }

  // Iconos PNG para la PWA
  if (url === '/icon-192.png') {
    const iconPath = path.join(__dirname, 'icon-192.png');
    if (fs.existsSync(iconPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      res.end(fs.readFileSync(iconPath));
      return;
    }
  }

  if (url === '/icon-512.png') {
    const iconPath = path.join(__dirname, 'icon-512.png');
    if (fs.existsSync(iconPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      res.end(fs.readFileSync(iconPath));
      return;
    }
  }

  // Descarga directa del APK
  if (url === '/download/UberEats.apk' || url === '/download/app.apk' || url === '/app.apk') {
    const apkPath = path.join(__dirname, 'UberEats.apk');
    if (fs.existsSync(apkPath)) {
      const stat = fs.statSync(apkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="UberEats.apk"',
        'Content-Length': stat.size
      });
      fs.createReadStream(apkPath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('APK aún en compilación o no disponible.');
      return;
    }
  }

  // Icono SVG para respaldo
  if (url === '/icon-192.svg') {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" rx="115" fill="#0C0E12"/>
      <circle cx="256" cy="256" r="185" fill="#14181E" stroke="#06C167" stroke-width="14"/>
      <text x="256" y="210" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="130" fill="#06C167" text-anchor="middle" dominant-baseline="middle">PN</text>
      <text x="256" y="310" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="44" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="4">PEDIDOS</text>
      <text x="256" y="365" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#06C167" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">NICA</text>
    </svg>`;
    res.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(svgIcon);
    return;
  }

  // Archivo estático cliente para la suite de cliente comensal
  if (url === '/client/script.js') {
    const clientScriptPath = path.join(__dirname, 'clientFront.js');
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(fs.readFileSync(clientScriptPath, 'utf8'));
    return;
  }

  // Archivo estático cliente para la suite de restaurante
  if (url === '/restaurant/client.js') {
    const clientPath = path.join(__dirname, 'restaurantClient.js');
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(fs.readFileSync(clientPath, 'utf8'));
    return;
  }

  // Archivo estático cliente para la suite de repartidor
  if (url === '/driver/script.js') {
    const driverScriptPath = path.join(__dirname, 'driverFront.js');
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(fs.readFileSync(driverScriptPath, 'utf8'));
    return;
  }

  // Endpoint con información de Red Local (LAN IP) y Túnel Móvil
  if (url === '/api/network-info') {
    const lanIp = getLocalLanIp();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify({
      lanIp,
      port: PORT,
      lanBaseUrl: `http://${lanIp}:${PORT}`,
      tunnelBaseUrl: PUBLIC_TUNNEL_URL,
      apps: {
        client: '/client',
        driver: '/driver',
        restaurant: '/restaurant',
        hub: '/'
      }
    }));
    return;
  }

  // Endpoint de versión de aplicación y estado de auto-actualización
  if (url === '/api/app-version' && req.method === 'GET') {
    const info = readVersionInfo();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify(info));
    return;
  }

  // Endpoint para publicar una nueva versión en GitHub y disparar compilación de APKs
  if (url === '/api/github/publish' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const token = parsed.token || process.env.GITHUB_TOKEN;
        const result = await syncProjectAndTriggerBuild({
          token,
          newVersion: parsed.newVersion,
          changelog: parsed.changelog,
          lanUrl: `http://${getLocalLanIp()}:${PORT}`,
          tunnelUrl: PUBLIC_TUNNEL_URL
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  let html = '';
  let status = 200;

  if (url === '/' || url === '/index.html') {
    html = renderHub({ currentCommissionRate, SUPABASE_URL, getHeader, getFooter, lanIp: getLocalLanIp(), port: PORT, tunnelBaseUrl: PUBLIC_TUNNEL_URL });
  } else if (url === '/driver' || url === '/driver/app') {
    html = renderDriverApp({ SUPABASE_URL, SUPABASE_ANON, getHeader, getFooter });
  } else if (url === '/client' || url === '/order') {
    html = renderClientApp('catalog', { SUPABASE_URL, SUPABASE_ANON, getHeader, getFooter });
  } else if (url === '/client/tracking') {
    html = renderClientApp('tracking', { SUPABASE_URL, SUPABASE_ANON, getHeader, getFooter });
  } else if (url === '/restaurant/onboard') {
    html = renderOnboarding();
  } else if (url === '/restaurant' || url === '/restaurant/orders' || url === '/restaurant/kds') {
    html = getRestaurantView('kds');
  } else if (url === '/restaurant/menu') {
    html = getRestaurantView('menu');
  } else if (url === '/restaurant/finances') {
    html = getRestaurantView('finances');
  } else if (url === '/restaurant/reviews') {
    html = getRestaurantView('reviews');
  } else if (url === '/restaurant/settings') {
    html = getRestaurantView('settings');
  } else if (url === '/admin/control-tower') {
    html = renderControlTower();
  } else if (url === '/admin/fares') {
    html = renderFares();
  } else if (url === '/admin') {
    html = renderHub({ currentCommissionRate, SUPABASE_URL, getHeader, getFooter, lanIp: getLocalLanIp(), port: PORT, tunnelBaseUrl: PUBLIC_TUNNEL_URL });
  } else {
    status = 404;
    html = `${getHeader('404 No Encontrado')}<div class="p-12 text-center"><h1 class="text-3xl font-bold">404 No Encontrado</h1><a href="/" class="text-indigo-400 mt-4 inline-block">Volver al Hub</a></div>${getFooter()}`;
  }

  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(Buffer.from(html, 'utf8'));
});

server.listen(PORT, () => {
  const lanIp = getLocalLanIp();
  console.log(`Servidor Web Node.js activo en:`);
  console.log(`  - Local (PC):         http://localhost:${PORT}`);
  console.log(`  - Red Wi-Fi (Móvil):  http://${lanIp}:${PORT}`);
  console.log(`  - Túnel Móvil HTTPS:  ${PUBLIC_TUNNEL_URL}`);
});
