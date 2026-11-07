-- ============================================================================
-- ECOSYSTEM DELIVERY (ESTILO PEDIDOSYA) - SUPABASE POSTGRESQL + POSTGIS SCHEMA
-- ============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CLIENT', 'DRIVER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'CREATED', 
    'ACCEPTED', 
    'IN_PREPARATION', 
    'READY_FOR_PICKUP', 
    'DRIVER_ASSIGNED', 
    'PICKED_UP', 
    'DELIVERED', 
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('OFFLINE', 'AVAILABLE', 'BUSY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'CLIENT',
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PERFIL EXTENDIDO PARA DRIVERS (Telemetría y Estado de Flota)
CREATE TABLE IF NOT EXISTS driver_profiles (
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  vehicle_type TEXT NOT NULL DEFAULT 'MOTORCYCLE', -- 'MOTORCYCLE', 'BICYCLE', 'CAR'
  license_plate TEXT,
  current_status driver_status NOT NULL DEFAULT 'OFFLINE',
  battery_level INT DEFAULT 100,
  last_location GEOGRAPHY(POINT, 4326),
  last_location_updated_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PARÁMETROS GLOBALES DE LA PLATAFORMA (Gestionados por SUPER_ADMIN)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed de configuración inicial de comisión (ej. 15.0%)
INSERT INTO platform_settings (key, value) VALUES
  ('commission', '{"percentage": 15.00, "note": "Comisión estándar retenida por la plataforma por cada pedido completado"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. RESTAURANTES (Afiliación, Perfil, Horarios, Logo y Comisión)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  opening_hours TEXT DEFAULT 'Lun - Dom: 11:00 - 23:00',
  logo_url TEXT,
  commission_rate NUMERIC(5, 2) DEFAULT 15.00, -- Comisión específica o hereda la global
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  delivery_radius_km NUMERIC NOT NULL DEFAULT 5.0,
  estimated_prep_time_minutes INT DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migraciones seguras si la tabla ya existe
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT 'Lun - Dom: 11:00 - 23:00';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 15.00;

-- 7. PRODUCTOS Y MENÚ (Extras, Tamaños, Tipos, Modificables y Combos)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2), -- Precio promocional si está en oferta
  is_combo BOOLEAN NOT NULL DEFAULT false, -- Es un combo / paquete
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  customization_groups JSONB DEFAULT '[]'::jsonb, -- Tamaños, Extras con cargo, Tipos y Modificables
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migraciones seguras para productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_combo BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_groups JSONB DEFAULT '[]'::jsonb;

-- 8. REVIEWS Y CALIFICACIONES DE CLIENTES (Solo pedidos DELIVERED)
CREATE TABLE IF NOT EXISTS restaurant_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT 'Cliente Verificado',
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. REGLAS DE TARIFA DINÁMICA Y GEOFENCING (PostGIS Polygon)
CREATE TABLE IF NOT EXISTS fare_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  base_fare NUMERIC(10, 2) NOT NULL DEFAULT 1.50,
  per_km_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.60,
  per_minute_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.15,
  surge_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  geofence GEOGRAPHY(POLYGON, 4326) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PEDIDOS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  driver_id UUID REFERENCES profiles(id),
  status order_status NOT NULL DEFAULT 'CREATED',
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  delivery_location GEOGRAPHY(POINT, 4326) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  estimated_prep_time_minutes INT DEFAULT 20,
  accepted_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ÍTEMS DEL PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  customizations JSONB DEFAULT '{}'::jsonb
);

-- 10. HISTORIAL DE AUDITORÍA DE ESTADOS DE PEDIDO
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  previous_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ÍNDICES ESPACIALES POSTGIS (GIST) Y DE CONSULTA FRECUENTE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders USING GIST (delivery_location);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_location ON driver_profiles USING GIST (last_location);
CREATE INDEX IF NOT EXISTS idx_fare_rules_geofence ON fare_rules USING GIST (geofence);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders (driver_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON driver_profiles (current_status);

-- ============================================================================
-- FUNCIONES RPC GEOESPACIALES DE ALTO RENDIMIENTO
-- ============================================================================

-- 1. Buscar restaurantes dentro del radio de entrega del cliente
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
  client_lat DOUBLE PRECISION,
  client_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  distance_meters DOUBLE PRECISION,
  delivery_radius_km NUMERIC,
  estimated_prep_time_minutes INT,
  is_active BOOLEAN
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    r.id,
    r.name,
    r.address,
    ST_Distance(r.location, ST_SetSRID(ST_MakePoint(client_lng, client_lat), 4326)::geography) AS distance_meters,
    r.delivery_radius_km,
    r.estimated_prep_time_minutes,
    r.is_active
  FROM restaurants r
  WHERE r.is_active = true
    AND ST_DWithin(
      r.location, 
      ST_SetSRID(ST_MakePoint(client_lng, client_lat), 4326)::geography, 
      r.delivery_radius_km * 1000
    )
  ORDER BY distance_meters ASC;
$$;

-- 2. Dispatch Engine: Encontrar drivers disponibles más cercanos a un punto (Restaurante)
CREATE OR REPLACE FUNCTION find_nearest_available_drivers(
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  max_distance_meters DOUBLE PRECISION DEFAULT 5000.0,
  max_candidates INT DEFAULT 5
)
RETURNS TABLE (
  driver_id UUID,
  full_name TEXT,
  phone TEXT,
  vehicle_type TEXT,
  distance_meters DOUBLE PRECISION,
  battery_level INT,
  rating NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    d.driver_id,
    p.full_name,
    p.phone,
    d.vehicle_type,
    ST_Distance(d.last_location, ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography) AS distance_meters,
    d.battery_level,
    d.rating
  FROM driver_profiles d
  JOIN profiles p ON p.id = d.driver_id
  WHERE d.current_status = 'AVAILABLE'
    AND d.is_verified = true
    AND d.last_location IS NOT NULL
    AND ST_DWithin(
      d.last_location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
      max_distance_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_candidates;
$$;

-- ============================================================================
-- TRIGGERS Y AUDITORÍA
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_order_status_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Actualizar timestamps automáticos
    IF NEW.status = 'ACCEPTED' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at := NOW();
    ELSIF NEW.status = 'READY_FOR_PICKUP' AND NEW.ready_at IS NULL THEN
      NEW.ready_at := NOW();
    ELSIF NEW.status = 'PICKED_UP' AND NEW.picked_up_at IS NULL THEN
      NEW.picked_up_at := NOW();
    ELSIF NEW.status = 'DELIVERED' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := NOW();
      -- Liberar al driver a estado AVAILABLE
      IF NEW.driver_id IS NOT NULL THEN
        UPDATE driver_profiles SET current_status = 'AVAILABLE' WHERE driver_id = NEW.driver_id;
      END IF;
    ELSIF NEW.status = 'CANCELLED' AND NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := NOW();
      IF NEW.driver_id IS NOT NULL THEN
        UPDATE driver_profiles SET current_status = 'AVAILABLE' WHERE driver_id = NEW.driver_id;
      END IF;
    ELSIF NEW.status = 'DRIVER_ASSIGNED' THEN
      IF NEW.driver_id IS NOT NULL THEN
        UPDATE driver_profiles SET current_status = 'BUSY' WHERE driver_id = NEW.driver_id;
      END IF;
    END IF;

    -- Registrar evento en la tabla de auditoría
    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_history ON orders;
CREATE TRIGGER trg_order_status_history
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_status_update();

-- Recalcular rating promedio del restaurante ante nuevos reviews
CREATE OR REPLACE FUNCTION handle_restaurant_review_inserted()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE restaurants
  SET rating = (
    SELECT ROUND(COALESCE(AVG(rating), 5.0)::numeric, 2)
    FROM restaurant_reviews
    WHERE restaurant_id = NEW.restaurant_id
  ),
  updated_at = NOW()
  WHERE id = NEW.restaurant_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restaurant_reviews ON restaurant_reviews;
CREATE TRIGGER trg_restaurant_reviews
AFTER INSERT OR UPDATE OR DELETE ON restaurant_reviews
FOR EACH ROW
EXECUTE FUNCTION handle_restaurant_review_inserted();

-- RPC: Enviar Review con validación de pedido ENTREGADO (DELIVERED)
CREATE OR REPLACE FUNCTION submit_order_review(
  target_order_id UUID,
  review_rating INT,
  review_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_client_name TEXT;
  v_new_review_id UUID;
BEGIN
  -- 1. Validar rating entre 1 y 5
  IF review_rating < 1 OR review_rating > 5 THEN
    RAISE EXCEPTION 'La calificación debe ser entre 1 y 5 estrellas.';
  END IF;

  -- 2. Obtener el pedido y verificar estado
  SELECT id, client_id, restaurant_id, status
  INTO v_order
  FROM orders
  WHERE id = target_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pedido especificado no existe.';
  END IF;

  -- 3. REGLA ESTRICTA: Solo pedidos DELIVERED pueden recibir review
  IF v_order.status != 'DELIVERED' THEN
    RAISE EXCEPTION 'Solo puedes calificar un pedido una vez que haya sido entregado (Estado actual: %).', v_order.status;
  END IF;

  -- 4. Verificar si ya fue calificado
  IF EXISTS (SELECT 1 FROM restaurant_reviews WHERE order_id = target_order_id) THEN
    RAISE EXCEPTION 'Este pedido ya ha sido calificado previamente.';
  END IF;

  -- 5. Obtener nombre del cliente
  SELECT COALESCE(full_name, 'Cliente Verificado')
  INTO v_client_name
  FROM profiles
  WHERE id = v_order.client_id;

  -- 6. Insertar Review
  INSERT INTO restaurant_reviews (restaurant_id, client_id, client_name, order_id, rating, comment)
  VALUES (v_order.restaurant_id, v_order.client_id, COALESCE(v_client_name, 'Cliente Verificado'), target_order_id, review_rating, review_comment)
  RETURNING id INTO v_new_review_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_new_review_id,
    'message', '¡Gracias por calificar tu pedido!'
  );
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_reviews ENABLE ROW LEVEL SECURITY;

-- Helper para consultar el rol del usuario autenticado
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role 
LANGUAGE sql 
STABLE 
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Políticas de Profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Políticas de Restaurantes y Productos (Acceso público para clientes y visitantes)
CREATE POLICY "Active restaurants are viewable by everyone" 
ON restaurants FOR SELECT TO anon, authenticated USING (is_active = true OR owner_id = auth.uid() OR get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Owners and SuperAdmins can manage restaurant" 
ON restaurants FOR ALL TO authenticated 
USING (owner_id = auth.uid() OR get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Available products viewable by everyone" 
ON products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Restaurant owners can modify their products" 
ON products FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = products.restaurant_id 
      AND (r.owner_id = auth.uid() OR get_current_user_role() = 'SUPER_ADMIN')
  )
);

-- Políticas de Pedidos (Orders)
CREATE POLICY "Clients can view their own orders" 
ON orders FOR SELECT TO authenticated 
USING (
  client_id = auth.uid() 
  OR driver_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
  OR get_current_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "Clients can create orders" 
ON orders FOR INSERT TO authenticated 
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Authorized parties can update order status" 
ON orders FOR UPDATE TO authenticated 
USING (
  client_id = auth.uid() 
  OR driver_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
  OR get_current_user_role() = 'SUPER_ADMIN'
);

-- Políticas de Platform Settings
CREATE POLICY "Platform settings are readable by all"
ON platform_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only SuperAdmins can update platform settings"
ON platform_settings FOR ALL TO authenticated
USING (get_current_user_role() = 'SUPER_ADMIN');

-- Políticas de Reviews
CREATE POLICY "Reviews are viewable by everyone"
ON restaurant_reviews FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Verified clients can create reviews"
ON restaurant_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = client_id);

