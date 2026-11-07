import { column, Schema, Table } from '@powersync/react-native';

/**
 * ESQUEMA DE POWERSYNC - SINCRONIZACIÓN OFFLINE-FIRST
 * 
 * REGLA ARQUITECTÓNICA ESTRICTA:
 * PowerSync se encarga EXCLUSIVAMENTE de los datos transaccionales y catálogos que
 * requieren persistencia local y soporte offline (SQLite local).
 * 
 * BAJO NINGUNA CIRCUNSTANCIA se agregan las coordenadas del driver en vivo aquí,
 * ya que saturarían el WAL de SQLite y provocarían sincronizaciones continuas de 
 * miles de filas por minuto innecesariamente.
 */

export const restaurantsTable = new Table({
  name: column.text,
  address: column.text,
  delivery_radius_km: column.real,
  estimated_prep_time_minutes: column.integer,
  is_active: column.integer,
  rating: column.real,
  created_at: column.text,
});

export const productsTable = new Table({
  restaurant_id: column.text,
  category: column.text,
  name: column.text,
  description: column.text,
  price: column.real,
  is_available: column.integer,
  image_url: column.text,
});

export const ordersTable = new Table({
  client_id: column.text,
  restaurant_id: column.text,
  driver_id: column.text,
  status: column.text,
  subtotal: column.real,
  delivery_fee: column.real,
  total: column.real,
  delivery_address: column.text,
  created_at: column.text,
});

export const orderItemsTable = new Table({
  order_id: column.text,
  product_id: column.text,
  quantity: column.integer,
  unit_price: column.real,
  customizations: column.text,
});

export const AppSchema = new Schema({
  restaurants: restaurantsTable,
  products: productsTable,
  orders: ordersTable,
  order_items: orderItemsTable,
});

export type Database = (typeof AppSchema)['types'];
