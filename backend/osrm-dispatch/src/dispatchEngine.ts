import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OSRMRoutingService, Coordinates } from './osrmClient';

export interface DispatchCandidate {
  driver_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  distance_meters: number;
  battery_level: number;
  rating: number;
}

export interface DispatchOrderRequest {
  orderId: string;
  restaurantId: string;
  restaurantLocation: Coordinates;
  deliveryLocation: Coordinates;
  deliveryFee: number;
}

export class AutomatedDispatchEngine {
  private supabase: SupabaseClient;
  private routingService: OSRMRoutingService;
  private readonly OFFER_TIMEOUT_SECONDS = 20;

  constructor(supabaseUrl: string, supabaseServiceKey: string, routingService?: OSRMRoutingService) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.routingService = routingService || new OSRMRoutingService();
  }

  /**
   * Ejecuta el ciclo de despacho en cascada para un pedido listo
   */
  async dispatchOrder(request: DispatchOrderRequest): Promise<{ success: boolean; assignedDriverId?: string; message: string }> {
    const { orderId, restaurantLocation, deliveryLocation, deliveryFee } = request;

    console.log(`[Dispatch] Iniciando búsqueda de repartidores para el Pedido: ${orderId}`);

    // 1. Invocar RPC PostGIS para obtener los 5 repartidores disponibles más cercanos en un radio de 5km
    const { data: candidates, error } = await this.supabase.rpc('find_nearest_available_drivers', {
      pickup_lat: restaurantLocation.latitude,
      pickup_lng: restaurantLocation.longitude,
      max_distance_meters: 5000.0,
      max_candidates: 5,
    });

    if (error || !candidates || candidates.length === 0) {
      console.warn(`[Dispatch] No se encontraron repartidores cercanos disponibles para el Pedido: ${orderId}`);
      return { success: false, message: 'NO_DRIVERS_AVAILABLE_IN_RADIUS' };
    }

    const driverList: DispatchCandidate[] = candidates;
    console.log(`[Dispatch] ${driverList.length} repartidores elegibles encontrados.`);

    // 2. Cascada de ofertas con ventana de decisión de 20 segundos por repartidor
    for (const driver of driverList) {
      console.log(`[Dispatch] Ofreciendo Pedido ${orderId} al repartidor ${driver.full_name} (${driver.driver_id})`);

      const offerAccepted = await this.sendOfferWithTimeout(driver, orderId, restaurantLocation, deliveryLocation, deliveryFee);

      if (offerAccepted) {
        // 3. Asignar pedido formalmente en la BD
        const { error: assignError } = await this.supabase
          .from('orders')
          .update({
            driver_id: driver.driver_id,
            status: 'DRIVER_ASSIGNED',
          })
          .eq('id', orderId)
          .in('status', ['READY_FOR_PICKUP', 'DRIVER_ASSIGNED']);

        if (!assignError) {
          console.log(`[Dispatch] Pedido ${orderId} asignado exitosamente a ${driver.driver_id}`);
          return { success: true, assignedDriverId: driver.driver_id, message: 'DRIVER_ASSIGNED_SUCCESSFULLY' };
        }
      }

      console.log(`[Dispatch] Oferta rechazada o expirada para driver ${driver.driver_id}. Escalando al siguiente...`);
    }

    return { success: false, message: 'ALL_CANDIDATES_REJECTED_OR_EXPIRED' };
  }

  /**
   * Notifica al driver por canal WebSockets de Supabase Realtime y espera la respuesta durante 20s
   */
  private async sendOfferWithTimeout(
    driver: DispatchCandidate,
    orderId: string,
    pickup: Coordinates,
    delivery: Coordinates,
    fee: number
  ): Promise<boolean> {
    const channelName = `driver-dispatch:${driver.driver_id}`;
    const channel = this.supabase.channel(channelName);

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      // Timer de expiración de 20 segundos estricto
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          channel.unsubscribe();
          resolve(false);
        }
      }, this.OFFER_TIMEOUT_SECONDS * 1000);

      // Suscribirse a la respuesta del driver
      channel
        .on('broadcast', { event: 'offer_response' }, (payload: any) => {
          if (payload.order_id === orderId && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            channel.unsubscribe();
            resolve(payload.accepted === true);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Emitir la oferta de alta prioridad
            await channel.send({
              type: 'broadcast',
              event: 'new_order_offer',
              payload: {
                order_id: orderId,
                pickup_location: pickup,
                delivery_location: delivery,
                payout_amount: fee * 0.80, // 80% de tarifa para el driver
                expires_in_seconds: this.OFFER_TIMEOUT_SECONDS,
                timestamp: Date.now(),
              },
            });
          }
        });
    });
  }
}
