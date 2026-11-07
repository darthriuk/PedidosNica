import axios from 'axios';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude] para GeoJSON
  };
}

export interface FareCalculationParams {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  surgeMultiplier: number;
  minFare?: number;
}

export class OSRMRoutingService {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string = process.env.OSRM_URL || 'http://localhost:5000', timeoutMs: number = 4000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Calcula la ruta óptima de conducción entre origen y destino usando OSRM.
   * Cero costo de Google Directions API.
   */
  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const coordsParam = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `${this.baseUrl}/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await axios.get(url, { timeout: this.timeoutMs });

      if (response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
        throw new Error(`OSRM routing failed with code: ${response.data.code}`);
      }

      const route = response.data.routes[0];
      const distanceMeters = route.distance;
      const durationSeconds = route.duration;

      return {
        distanceMeters,
        distanceKm: Number((distanceMeters / 1000).toFixed(2)),
        durationSeconds,
        durationMinutes: Math.ceil(durationSeconds / 60),
        geometry: route.geometry,
      };
    } catch (error: any) {
      console.warn(`[OSRM Engine] Fallback a cálculo Haversine debido a error: ${error.message}`);
      return this.fallbackHaversineCalculation(origin, destination);
    }
  }

  /**
   * Fallback de emergencia cuando el contenedor de OSRM está reiniciándose o saturado.
   * Aplica factor de sinuosidad urbana (1.3x) y velocidad promedio urbana (25 km/h).
   */
  private fallbackHaversineCalculation(origin: Coordinates, destination: Coordinates): RouteResult {
    const R = 6371e3; // Radio terrestre en metros
    const phi1 = (origin.latitude * Math.PI) / 180;
    const phi2 = (destination.latitude * Math.PI) / 180;
    const deltaPhi = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const deltaLambda = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Distancia geodésica multiplicada por el factor de desvío de calles urbanas (1.30)
    const straightDistance = R * c;
    const estimatedDistanceMeters = Math.round(straightDistance * 1.30);
    const distanceKm = Number((estimatedDistanceMeters / 1000).toFixed(2));
    
    // Velocidad promedio urbana estimada: 25 km/h (6.94 m/s)
    const durationSeconds = Math.round(estimatedDistanceMeters / 6.94);

    return {
      distanceMeters: estimatedDistanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes: Math.ceil(durationSeconds / 60),
      geometry: {
        type: 'LineString',
        coordinates: [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ],
      },
    };
  }

  /**
   * Cálculo determinístico de la tarifa de envío
   */
  calculateDeliveryFee(route: RouteResult, params: FareCalculationParams): number {
    const { baseFare, perKmRate, perMinuteRate, surgeMultiplier, minFare = 2.0 } = params;

    const rawFee =
      baseFare +
      route.distanceKm * perKmRate +
      route.durationMinutes * perMinuteRate;

    const finalFee = Math.max(minFare, rawFee * surgeMultiplier);
    return Number(finalFee.toFixed(2));
  }
}
