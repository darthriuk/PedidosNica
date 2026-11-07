package com.delivery.driver.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.math.sqrt

/**
 * Servicio en primer plano para rastreo GPS continuo y de alta eficiencia energética.
 * Optimizado para conductores: 5s / 10m en movimiento, 30s al estar detenido.
 */
class DriverLocationTrackingService : Service(), SensorEventListener {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null

    private var webSocket: WebSocket? = null
    private val okHttpClient = OkHttpClient.Builder()
        .readTimeout(10, TimeUnit.SECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    private var driverId: String = ""
    private var activeOrderId: String? = null
    private var isVehicleMoving: Boolean = true
    private var lastMovementTimestamp: Long = System.currentTimeMillis()

    // Parámetros de frecuencia adaptativa
    private var currentIntervalMs: Long = 5000L
    private var currentMinDistanceM: Float = 10f

    companion object {
        private const val TAG = "DriverTrackingService"
        private const val NOTIFICATION_ID = 8841
        private const val CHANNEL_ID = "driver_live_tracking_channel"
        
        const val ACTION_START = "ACTION_START_TRACKING"
        const val ACTION_STOP = "ACTION_STOP_TRACKING"
        const val EXTRA_DRIVER_ID = "EXTRA_DRIVER_ID"
        const val EXTRA_ORDER_ID = "EXTRA_ORDER_ID"
        const val SUPABASE_REF = "zciujeihkvleehhqbeat"
        const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w"
        const val WS_URL = "wss://$SUPABASE_REF.supabase.co/realtime/v1/websocket?apikey=$SUPABASE_ANON_KEY&vsn=1.0.0"
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        createNotificationChannel()
        setupLocationCallback()
        setupSensors()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                driverId = intent.getStringExtra(EXTRA_DRIVER_ID) ?: ""
                activeOrderId = intent.getStringExtra(EXTRA_ORDER_ID)
                startForeground(NOTIFICATION_ID, buildForegroundNotification("Turno activo: Conectado y recibiendo pedidos"))
                connectWebSocket()
                startAdaptiveLocationUpdates(intervalMs = 5000L, minDistanceM = 10f)
            }
            ACTION_STOP -> {
                stopLocationUpdates()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    /**
     * Configuración del callback de FusedLocationProvider
     */
    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location: Location = result.lastLocation ?: return
                
                // Determinar si la velocidad reportada por GPS indica movimiento (< 0.5 m/s = detenido)
                if (location.speed < 0.5f) {
                    val idleDuration = System.currentTimeMillis() - lastMovementTimestamp
                    if (idleDuration > 30_000L && isVehicleMoving) {
                        Log.d(TAG, "Vehículo detenido por más de 30s. Ajustando intervalo a 30 segundos.")
                        isVehicleMoving = false
                        startAdaptiveLocationUpdates(intervalMs = 30_000L, minDistanceM = 25f)
                    }
                } else {
                    lastMovementTimestamp = System.currentTimeMillis()
                    if (!isVehicleMoving) {
                        Log.d(TAG, "Vehículo en marcha nuevamente (>0.5 m/s). Restaurando intervalo de 5s / 10m.")
                        isVehicleMoving = true
                        startAdaptiveLocationUpdates(intervalMs = 5000L, minDistanceM = 10f)
                    }
                }

                transmitTelemetry(location)
            }
        }
    }

    /**
     * Inicia o actualiza la petición de ubicación con parámetros dinámicos
     */
    private fun startAdaptiveLocationUpdates(intervalMs: Long, minDistanceM: Float) {
        if (currentIntervalMs == intervalMs && currentMinDistanceM == minDistanceM) return
        currentIntervalMs = intervalMs
        currentMinDistanceM = minDistanceM

        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)

            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, intervalMs)
                .setMinUpdateDistanceMeters(minDistanceM)
                .setMinUpdateIntervalMillis(intervalMs / 2)
                .setWaitForAccurateLocation(false)
                .build()

            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
            Log.d(TAG, "LocationRequest actualizado: Intervalo=$intervalMs ms, Distancia=$minDistanceM m")
        } catch (e: SecurityException) {
            Log.e(TAG, "Permiso de ubicación denegado: ${e.message}")
        }
    }
    private var msgRef = 1

    /**
     * Transmite telemetría en tiempo real sin escribir en la BD persistente
     * Compatible con el protocolo de Phoenix Channels / Supabase Realtime
     */
    private fun transmitTelemetry(location: Location) {
        val batteryPct = getBatteryPercentage()

        // 1. Mensaje para la Torre de Control (Admin)
        val telemetryData = JSONObject().apply {
            put("driver_id", driverId)
            put("order_id", activeOrderId ?: JSONObject.NULL)
            put("latitude", location.latitude)
            put("longitude", location.longitude)
            put("bearing", location.bearing)
            put("speed", location.speed)
            put("accuracy", location.accuracy)
            put("battery_level", batteryPct)
            put("is_moving", isVehicleMoving)
            put("timestamp", System.currentTimeMillis())
        }

        val fleetBroadcast = JSONObject().apply {
            put("topic", "realtime:fleet-telemetry")
            put("event", "broadcast")
            put("payload", JSONObject().apply {
                put("type", "broadcast")
                put("event", "driver_telemetry")
                put("payload", telemetryData)
            })
            put("ref", (msgRef++).toString())
        }

        serviceScope.launch {
            webSocket?.send(fleetBroadcast.toString())

            // 2. Si tiene pedido activo, emitir al canal privado del cliente
            activeOrderId?.let { orderId ->
                val clientTelemetry = JSONObject().apply {
                    put("latitude", location.latitude)
                    put("longitude", location.longitude)
                    put("bearing", location.bearing)
                    put("speed", location.speed)
                    put("timestamp", System.currentTimeMillis())
                }

                val orderBroadcast = JSONObject().apply {
                    put("topic", "realtime:orders:$orderId:tracking")
                    put("event", "broadcast")
                    put("payload", JSONObject().apply {
                        put("type", "broadcast")
                        put("event", "driver_location")
                        put("payload", clientTelemetry)
                    })
                    put("ref", (msgRef++).toString())
                }
                webSocket?.send(orderBroadcast.toString())
            }
        }
    }

    /**
     * Monitoreo con Acelerómetro para despertar la frecuencia inmediatamente ante aceleración brusca
     */
    private fun setupSensors() {
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]
            val gForce = sqrt((x * x + y * y + z * z).toDouble()) / SensorManager.GRAVITY_EARTH

            // Si detecta aceleración brusca y estaba en modo reposo (30s), reactiva modo dinámico
            if (gForce > 1.25 && !isVehicleMoving) {
                lastMovementTimestamp = System.currentTimeMillis()
                isVehicleMoving = true
                Log.d(TAG, "Acelerómetro detectó movimiento del vehículo. Despertando GPS a 5s.")
                startAdaptiveLocationUpdates(intervalMs = 5000L, minDistanceM = 10f)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun connectWebSocket() {
        val request = Request.Builder().url(WS_URL).build()
        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i(TAG, "WebSocket conectado a Supabase Realtime.")

                // Unirse al canal global de flota
                val joinFleet = JSONObject().apply {
                    put("topic", "realtime:fleet-telemetry")
                    put("event", "phx_join")
                    put("payload", JSONObject().apply {
                        put("config", JSONObject().apply {
                            put("broadcast", JSONObject().apply {
                                put("ack", false)
                                put("self", false)
                            })
                        })
                    })
                    put("ref", (msgRef++).toString())
                }
                webSocket.send(joinFleet.toString())

                // Unirse al canal del pedido si existe
                activeOrderId?.let { orderId ->
                    val joinOrder = JSONObject().apply {
                        put("topic", "realtime:orders:$orderId:tracking")
                        put("event", "phx_join")
                        put("payload", JSONObject().apply {
                            put("config", JSONObject().apply {
                                put("broadcast", JSONObject().apply {
                                    put("ack", false)
                                    put("self", false)
                                })
                            })
                        })
                        put("ref", (msgRef++).toString())
                    }
                    webSocket.send(joinOrder.toString())
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Error en Supabase Realtime WebSocket: ${t.message}. Reintentando en 5s...")
                serviceScope.launch {
                    kotlinx.coroutines.delay(5000)
                    connectWebSocket()
                }
            }
        })
    }

    private fun getBatteryPercentage(): Int {
        val batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Rastreo en Vivo del Repartidor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Transmisión eficiente de posición GPS y estado de entrega"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Modo Driver Activo")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        sensorManager.unregisterListener(this)
        webSocket?.close(1000, "Turno finalizado")
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
