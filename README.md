# 🚀 PedidosNica — Ecosistema de Delivery (Cliente, Repartidor, Restaurante & Central Hub)

Plataforma integral de delivery para Nicaragua con 3 aplicaciones móviles Android independientes (`.apk`) y consola web centralizada.

## 📱 Descarga Directa de Aplicaciones Android (Última Versión)

Cada vez que se publica un cambio en la rama `main`, **GitHub Actions** compila automáticamente las 3 aplicaciones firmadas y las adjunta en **[GitHub Releases](https://github.com/darthriuk/PedidosNica/releases/latest)**:

| Aplicación | Paquete Android | Enlace de Descarga Directa (.APK) |
| :--- | :--- | :--- |
| **🍔 PedidosNica Cliente** | `com.pedidosnica.client` | [Descargar `PedidosNica-Cliente.apk`](https://github.com/darthriuk/PedidosNica/releases/latest/download/PedidosNica-Cliente.apk) |
| **🛵 PedidosNica Repartidor** | `com.pedidosnica.driver` | [Descargar `PedidosNica-Repartidor.apk`](https://github.com/darthriuk/PedidosNica/releases/latest/download/PedidosNica-Repartidor.apk) |
| **🏪 PedidosNica Restaurante** | `com.pedidosnica.restaurant` | [Descargar `PedidosNica-Restaurante.apk`](https://github.com/darthriuk/PedidosNica/releases/latest/download/PedidosNica-Restaurante.apk) |

---

## 🔄 Sistema de Auto-Actualización (OTA + APK Release Detector)

1. Todas las aplicaciones (**Cliente**, **Repartidor** y **Restaurante**) consultan automáticamente:
   - `https://api.github.com/repos/darthriuk/PedidosNica/releases/latest`
   - `https://raw.githubusercontent.com/darthriuk/PedidosNica/main/version.json`
2. Cuando se detecta una versión superior a la instalada (ej. `v1.0.1` > `v1.0.0`), la aplicación muestra una notificación automática con las notas de la versión y un botón de **1 toque para descargar e instalar la actualización** sin perder la sesión activa.
