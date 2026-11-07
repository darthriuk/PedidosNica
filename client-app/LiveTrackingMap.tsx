import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, Animated } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { createClient } from '@supabase/supabase-js';

// Inicialización de MapLibre con tiles vectoriales abiertos (Costo = $0)
MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

interface DriverTelemetry {
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  timestamp: number;
}

interface LiveTrackingProps {
  orderId: string;
  restaurantLocation: { latitude: number; longitude: number; name: string };
  deliveryLocation: { latitude: number; longitude: number; address: string };
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const LiveTrackingScreen: React.FC<LiveTrackingProps> = ({
  orderId,
  restaurantLocation,
  deliveryLocation,
  supabaseUrl,
  supabaseAnonKey,
}) => {
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const [driverPos, setDriverPos] = useState<[number, number]>([
    restaurantLocation.longitude,
    restaurantLocation.latitude,
  ]);
  const [driverBearing, setDriverBearing] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<string>('En camino al restaurante');
  const [etaMinutes, setEtaMinutes] = useState<number>(14);

  // Valores animados para interpolación suave de posición
  const animatedLng = useRef(new Animated.Value(restaurantLocation.longitude)).current;
  const animatedLat = useRef(new Animated.Value(restaurantLocation.latitude)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Canal privado de WebSockets (Supabase Realtime Broadcast) - NO escribe en base de datos
    const trackingChannel = supabase.channel(`orders:${orderId}:tracking`, {
      config: { broadcast: { self: false } },
    });

    trackingChannel
      .on('broadcast', { event: 'driver_location' }, ({ payload }: { payload: DriverTelemetry }) => {
        const targetLng = payload.longitude;
        const targetLat = payload.latitude;
        const targetBearing = payload.bearing;

        // Interpolación fluida de coordenadas durante 4.5 segundos (coincide con el intervalo de 5s del driver)
        Animated.parallel([
          Animated.timing(animatedLng, {
            toValue: targetLng,
            duration: 4500,
            useNativeDriver: false,
          }),
          Animated.timing(animatedLat, {
            toValue: targetLat,
            duration: 4500,
            useNativeDriver: false,
          }),
          Animated.timing(animatedRotation, {
            toValue: targetBearing,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]).start();

        setDriverPos([targetLng, targetLat]);
        setDriverBearing(targetBearing);
      })
      .subscribe((status) => {
        console.log(`[Realtime Client] Estado de suscripción: ${status}`);
      });

    // Listener para actualización de estados de la orden
    const statusChannel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: any) => {
          const newStatus = payload.new.status;
          if (newStatus === 'DRIVER_ASSIGNED') setOrderStatus('Repartidor asignado');
          if (newStatus === 'PICKED_UP') setOrderStatus('¡Pedido en camino a tu domicilio!');
          if (newStatus === 'DELIVERED') setOrderStatus('¡Pedido entregado con éxito!');
        }
      )
      .subscribe();

    return () => {
      trackingChannel.unsubscribe();
      statusChannel.unsubscribe();
    };
  }, [orderId]);

  return (
    <View style={styles.container}>
      {/* Mapa MapLibre con OSM Tiles (Zero Cost) */}
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://tiles.openfreemap.org/styles/bright" // Open-source vector tiles
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={14.5}
          centerCoordinate={driverPos}
          animationMode="easeTo"
          animationDuration={1500}
        />

        {/* Marcador del Restaurante */}
        <MapLibreGL.PointAnnotation
          id="restaurant-marker"
          coordinate={[restaurantLocation.longitude, restaurantLocation.latitude]}
        >
          <View style={[styles.markerContainer, { backgroundColor: '#FF5722' }]}>
            <Text style={styles.markerText}>🏪</Text>
          </View>
        </MapLibreGL.PointAnnotation>

        {/* Marcador del Domicilio del Cliente */}
        <MapLibreGL.PointAnnotation
          id="client-marker"
          coordinate={[deliveryLocation.longitude, deliveryLocation.latitude]}
        >
          <View style={[styles.markerContainer, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.markerText}>📍</Text>
          </View>
        </MapLibreGL.PointAnnotation>

        {/* Marcador Animado del Driver con Orientación / Bearing */}
        <MapLibreGL.PointAnnotation id="driver-marker" coordinate={driverPos}>
          <View
            style={[
              styles.driverMarker,
              { transform: [{ rotate: `${driverBearing}deg` }] },
            ]}
          >
            <Text style={styles.driverIcon}>🛵</Text>
          </View>
        </MapLibreGL.PointAnnotation>
      </MapLibreGL.MapView>

      {/* Floating Bottom Card con Estado y ETA */}
      <View style={styles.bottomCard}>
        <View style={styles.dragIndicator} />
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusTitle}>{orderStatus}</Text>
            <Text style={styles.statusSubtitle}>Entrega estimada en {etaMinutes} minutos</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>En Vivo</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.deliveryDetails}>
          <Text style={styles.addressLabel}>Destino:</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {deliveryLocation.address}
          </Text>
        </View>

        <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
          <Text style={styles.contactButtonText}>Contactar al Repartidor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  map: { flex: 1 },
  markerContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 5,
  },
  markerText: { fontSize: 18 },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  driverIcon: { fontSize: 22 },
  bottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#64748b',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  deliveryDetails: {
    marginBottom: 14,
  },
  addressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 2,
  },
  contactButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
