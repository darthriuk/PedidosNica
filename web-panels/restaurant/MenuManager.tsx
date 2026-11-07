'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export interface CustomizationOption {
  name: string;
  price_delta: number;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  type: 'SINGLE' | 'MULTIPLE' | 'REMOVAL';
  options: CustomizationOption[];
}

export interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number | null;
  is_combo?: boolean;
  is_available: boolean;
  pause_info?: string | null;
  image_url?: string;
  customization_groups?: CustomizationGroup[];
}

export default function RestaurantMenuManager({
  restaurantId,
  supabaseUrl,
  supabaseAnonKey,
}: {
  restaurantId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'prod-1',
      name: 'Pizza Napolitana Especial',
      category: 'Pizzas',
      price: 14.00,
      discount_price: 11.50,
      is_combo: false,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      description: 'Muzzarella fundida, rodajas de tomate natural, albahaca fresca y olivas negras.'
    },
    {
      id: 'prod-2',
      name: 'Super Combo Doble Cheddar + Papas + Bebida',
      category: 'Combos',
      price: 16.50,
      discount_price: 12.90,
      is_combo: true,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      description: 'Doble hamburguesa 150g, bacon crujiente, cheddar doble, papas rústicas y gaseosa 500ml.'
    },
    {
      id: 'prod-3',
      name: 'Burger Bacon Crispy',
      category: 'Hamburguesas',
      price: 10.50,
      discount_price: null,
      is_combo: false,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
      description: 'Medallón 180g a la parrilla, cebolla caramelizada, panceta crocante y barbacoa casera.'
    },
    {
      id: 'prod-4',
      name: 'Empanadas Criollas de Carne x6',
      category: 'Entradas',
      price: 9.00,
      discount_price: null,
      is_combo: false,
      is_available: false,
      pause_info: 'Agotado manual',
      image_url: 'https://images.unsplash.com/photo-1628106235973-f69324d08f32?w=400',
      description: 'Carne cortada a cuchillo, huevo duro, cebolla de verdeo y especias norteñas.'
    },
    {
      id: 'prod-5',
      name: 'Postre Tiramisú Clásico Italiano',
      category: 'Postres',
      price: 4.50,
      discount_price: null,
      is_combo: false,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
      description: 'Vainillas embebidas en café espresso y licor amaretto con crema de mascarpone.'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'PAUSED'>('ALL');
  const [productToPause, setProductToPause] = useState<Product | null>(null);
  const [pauseDuration, setPauseDuration] = useState<'1h' | 'today' | 'permanent'>('1h');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pizzas',
    description: '',
    price: 12.00,
    discount_price: '',
    is_combo: false,
    image_url: ''
  });

  // Modal Customizer preview
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewSizeCost, setPreviewSizeCost] = useState(0);
  const [previewExtrasCost, setPreviewExtrasCost] = useState(0);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    fetchProducts();
  }, [restaurantId]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true });

    if (data && data.length > 0) {
      setProducts(data as Product[]);
    }
  };

  // Toggle de disponibilidad
  const handleToggleStock = (product: Product) => {
    if (product.is_available) {
      setProductToPause(product);
    } else {
      // Reactivar inmediatamente
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: true, pause_info: null } : p))
      );
      supabase.from('products').update({ is_available: true }).eq('id', product.id).then();
    }
  };

  const handleConfirmPause = () => {
    if (!productToPause) return;
    let label = 'Agotado';
    if (pauseDuration === '1h') label = 'Pausado 1h';
    if (pauseDuration === 'today') label = 'Pausado por hoy';
    if (pauseDuration === 'permanent') label = 'Agotado permanente';

    setProducts((prev) =>
      prev.map((p) => (p.id === productToPause.id ? { ...p, is_available: false, pause_info: label } : p))
    );
    supabase.from('products').update({ is_available: false }).eq('id', productToPause.id).then();
    setProductToPause(null);
  };

  // Abrir modal creación
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Pizzas',
      description: '',
      price: 12.00,
      discount_price: '',
      is_combo: false,
      image_url: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal edición
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      discount_price: p.discount_price ? String(p.discount_price) : '',
      is_combo: !!p.is_combo,
      image_url: p.image_url || ''
    });
    setIsModalOpen(true);
  };

  // Guardar platillo
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Product> = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: Number(formData.price),
      discount_price: formData.discount_price ? Number(formData.discount_price) : null,
      is_combo: formData.is_combo,
      image_url: formData.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      is_available: true
    };

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
      );
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      const newId = 'prod-' + Date.now().toString(36);
      const newProduct = { ...payload, id: newId } as Product;
      setProducts((prev) => [newProduct, ...prev]);
      await supabase.from('products').insert([{ ...payload, restaurant_id: restaurantId }]);
    }

    setIsModalOpen(false);
  };

  // Duplicar platillo
  const handleDuplicate = (p: Product) => {
    const clone: Product = {
      ...p,
      id: 'prod-' + Date.now().toString(36),
      name: p.name + ' (Copia)',
      is_available: true,
      pause_info: null
    };
    setProducts((prev) => [clone, ...prev]);
  };

  // Eliminar platillo
  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este platillo del menú?')) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  // Filtrado de productos
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (availabilityFilter === 'AVAILABLE' && !p.is_available) return false;
    if (availabilityFilter === 'PAUSED' && p.is_available) return false;
    if (searchTerm) {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDesc = p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchDesc;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Carta, Combos & Modificadores de Stock</h1>
          <p className="text-xs text-slate-400 mt-1">
            Pausa temporal con temporizador (1h, hoy, permanente) y constructor de personalizaciones.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
        >
          <span>+</span> Crear Platillo o Combo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'Pizzas', 'Hamburguesas', 'Combos', 'Entradas', 'Bebidas', 'Postres'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar en la carta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-44"
          />
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Todo el Stock</option>
            <option value="AVAILABLE">Solo Disponibles</option>
            <option value="PAUSED">Solo Pausados</option>
          </select>
        </div>
      </div>

      {/* Grid de Platillos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`p-5 rounded-3xl border transition-all duration-300 shadow-xl flex flex-col justify-between ${
              product.is_available
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                : 'bg-slate-900/40 border-rose-950/60 opacity-60'
            }`}
          >
            <div>
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                <img
                  src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                  className="w-full h-full object-cover"
                  alt={product.name}
                />
                {product.is_combo && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    COMBO 🔥
                  </span>
                )}
                {product.discount_price && (
                  <span className="absolute top-3 right-3 bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    OFERTA
                  </span>
                )}
                {!product.is_available && (
                  <span className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center font-bold text-rose-400 text-xs uppercase tracking-wider">
                    {product.pause_info || 'Agotado'}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  <h3 className="font-extrabold text-base text-white mt-1">{product.name}</h3>
                </div>
                <div className="text-right">
                  {product.discount_price ? (
                    <>
                      <span className="text-xs line-through text-slate-500 font-mono">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <br />
                      <span className="font-mono font-black text-amber-400 text-lg">
                        ${Number(product.discount_price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono font-black text-emerald-400 text-lg">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">{product.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPreviewProduct(product);
                    setPreviewSizeCost(0);
                    setPreviewExtrasCost(0);
                  }}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>🔍</span> Opciones
                </button>
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>✏️</span> Editar
                </button>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    product.is_available
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {product.is_available ? '🟢 En Stock' : '🔴 ' + (product.pause_info || 'Agotado')}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(product)}
                    title="Duplicar"
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    title="Eliminar"
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-slate-800"
                  >
                    🗑️
                  </button>
                  {/* Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleStock(product)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      product.is_available ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        product.is_available ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: PAUSA DE STOCK CON TEMPORIZADOR */}
      {productToPause && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="text-xl">⏸️</span>
                <h3 className="font-black text-white text-base">Pausar Stock de Platillo</h3>
              </div>
              <button onClick={() => setProductToPause(null)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Selecciona por cuánto tiempo deseas pausar <strong className="text-white">{productToPause.name}</strong>:
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="pause"
                    checked={pauseDuration === '1h'}
                    onChange={() => setPauseDuration('1h')}
                    className="accent-amber-500"
                  />
                  <div>
                    <p className="font-bold text-white">Pausar por 1 hora</p>
                    <p className="text-[10px] text-slate-400">Para reposición rápida de ingredientes</p>
                  </div>
                </div>
                <span className="font-mono text-amber-400">1h</span>
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="pause"
                    checked={pauseDuration === 'today'}
                    onChange={() => setPauseDuration('today')}
                    className="accent-amber-500"
                  />
                  <div>
                    <p className="font-bold text-white">Pausar por hoy (hasta mañana)</p>
                    <p className="text-[10px] text-slate-400">Se reactivará automáticamente el próximo turno</p>
                  </div>
                </div>
                <span className="font-mono text-amber-400">24h</span>
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="pause"
                    checked={pauseDuration === 'permanent'}
                    onChange={() => setPauseDuration('permanent')}
                    className="accent-rose-500"
                  />
                  <div>
                    <p className="font-bold text-rose-300">Agotado permanente</p>
                    <p className="text-[10px] text-slate-400">Pausado hasta reactivación manual</p>
                  </div>
                </div>
                <span className="font-mono text-rose-400">Manual</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setProductToPause(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPause}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
              >
                Aplicar Pausa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR PLATILLO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-white text-lg">
                {editingProduct ? 'Editar Platillo / Combo' : 'Nuevo Platillo / Combo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-300 mb-1">Nombre del Platillo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Pizza Napolitana Especial"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-300 mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="Pizzas">Pizzas</option>
                    <option value="Hamburguesas">Hamburguesas</option>
                    <option value="Combos">Combos & Promos</option>
                    <option value="Entradas">Entradas</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Postres">Postres</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-300 mb-1">Descripción *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles de ingredientes, cocción y presentación..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-300 mb-1">Precio Normal ($) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-amber-400 mb-1">Precio Oferta ($)</label>
                  <input
                    type="number"
                    step="0.10"
                    placeholder="Ej: 9.90"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-amber-300 font-mono font-bold"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.is_combo}
                      onChange={(e) => setFormData({ ...formData, is_combo: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="font-bold">Es un Combo 🔥</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-300 mb-1">URL de la Foto</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Constructor de modificadores */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <span>🛠️</span> Personalizaciones Configuradas (Tamaños, Extras y Modificadores)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="font-bold text-white mb-1">1. Tamaños</p>
                    <p className="text-slate-400">Individual ($0)<br />Mediana (+$3.50)<br />Familiar (+$6.50)</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="font-bold text-white mb-1">2. Extras con Costo</p>
                    <p className="text-slate-400">Extra Queso (+$1.50)<br />Doble Carne (+$2.50)<br />Bacon (+$1.20)</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="font-bold text-white mb-1">3. Remociones</p>
                    <p className="text-slate-400">Sin Cebolla ($0)<br />Sin Mayonesa ($0)<br />Salsa aparte ($0)</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  Guardar en Carta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROBAR OPCIONES DEL CLIENTE */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>🛒</span>
                <h3 className="font-bold text-white text-base">Personalizar {previewProduct.name}</h3>
              </div>
              <button onClick={() => setPreviewProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5 uppercase text-[10px]">1. Selecciona Tamaño</label>
                <div className="space-y-1.5">
                  <label className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-white font-semibold">
                      <input
                        type="radio"
                        name="prevSize"
                        defaultChecked
                        onChange={() => setPreviewSizeCost(0)}
                        className="accent-amber-500"
                      />
                      Individual
                    </span>
                    <span className="text-slate-400 font-mono">$0.00</span>
                  </label>
                  <label className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-white font-semibold">
                      <input
                        type="radio"
                        name="prevSize"
                        onChange={() => setPreviewSizeCost(3.50)}
                        className="accent-amber-500"
                      />
                      Mediana
                    </span>
                    <span className="text-emerald-400 font-mono">+$3.50</span>
                  </label>
                  <label className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-white font-semibold">
                      <input
                        type="radio"
                        name="prevSize"
                        onChange={() => setPreviewSizeCost(6.50)}
                        className="accent-amber-500"
                      />
                      Familiar
                    </span>
                    <span className="text-emerald-400 font-mono">+$6.50</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5 uppercase text-[10px]">2. Adicionales con Costo</label>
                <div className="space-y-1.5">
                  <label className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-white">
                      <input
                        type="checkbox"
                        onChange={(e) => setPreviewExtrasCost((prev) => prev + (e.target.checked ? 1.50 : -1.50))}
                        className="accent-amber-500"
                      />
                      Extra Queso Fundido
                    </span>
                    <span className="text-emerald-400 font-mono">+$1.50</span>
                  </label>
                  <label className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-white">
                      <input
                        type="checkbox"
                        onChange={(e) => setPreviewExtrasCost((prev) => prev + (e.target.checked ? 2.50 : -2.50))}
                        className="accent-amber-500"
                      />
                      Doble Carne / Panceta
                    </span>
                    <span className="text-emerald-400 font-mono">+$2.50</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Calculado:</span>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  ${((previewProduct.discount_price || previewProduct.price) + previewSizeCost + previewExtrasCost).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
