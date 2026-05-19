/**
 * Supabase Database Operations
 * Centralized functions for all database queries
 */

import { supabase } from './supabase';
import type { Product, Store, Section, Category, User, CartItem } from '@/lib/types';

const SUPABASE_CREATE_PRODUCT_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CREATE_PRODUCT_FUNCTION_URL ||
  'https://tjfogjumpyygftwwbmxb.supabase.co/functions/v1/create-product';

const SUPABASE_CREATE_SECTION_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CREATE_SECTION_FUNCTION_URL ||
  'https://tjfogjumpyygftwwbmxb.supabase.co/functions/v1/create-section';

// ============================================================================
// STORES
// ============================================================================

export async function fetchAllStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stores:', error.message);
    return [];
  }

  return (data || []).map(mapStoreRow).filter((store: Store) => store.isActive);
}

export async function fetchStoreById(storeId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error) {
    console.error('Error fetching store:', error.message);
    return null;
  }

  return data ? mapStoreRow(data) : null;
}

export async function fetchStoresByMarketType(marketType: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('market_type', marketType)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching stores by market type:', error.message);
    return [];
  }

  return (data || []).map(mapStoreRow).filter((store: Store) => store.isActive);
}

export async function fetchStoresByLocation(latitude: number, longitude: number, radiusKm: number = 5): Promise<Store[]> {
  // Note: Supabase PostGIS extension required for this. Fallback to all stores if not available.
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching nearby stores:', error.message);
    return [];
  }

  // Simple distance calculation (can be moved to PostGIS in DB if needed)
  return (data || [])
    .map(mapStoreRow)
    .filter((store: Store) => store.isActive && !!store.latitude && !!store.longitude)
    .filter((store: Store) => {
      const dist = calculateDistance(latitude, longitude, store.latitude!, store.longitude!);
      return dist <= radiusKm;
    })
    .sort((a: Store, b: Store) => {
      const distA = calculateDistance(latitude, longitude, a.latitude || 0, a.longitude || 0);
      const distB = calculateDistance(latitude, longitude, b.latitude || 0, b.longitude || 0);
      return distA - distB;
    });
}

// ============================================================================
// PRODUCTS
// ============================================================================

export async function fetchProductsByStore(storeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, store_sections(id, name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }

  return (data || []).map((row: any) => {
    const relation = row.store_sections || row.store_section;
    if (Array.isArray(relation) && relation.length > 0) {
      row.section_id = row.section_id || relation[0]?.id || row.sectionId;
      row.section_name = row.section_name || relation[0]?.name || row.sectionName;
    } else if (relation && typeof relation === 'object') {
      row.section_id = row.section_id || relation.id || row.sectionId;
      row.section_name = row.section_name || relation.name || row.sectionName;
    }
    return mapProductRow(row);
  });
}

export async function fetchStoreSections(storeId: string): Promise<Section[]> {
  const { data, error } = await supabase
    .from('store_sections')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching store sections:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    storeId: row.store_id,
    createdAt: row.created_at || row.createdAt,
  }));
}

export async function createStoreSection(storeId: string, name: string): Promise<Section | null> {
  const payload = {
    storeId,
    store_id: storeId,
    name,
  };

  const { data: functionData, error: functionError } = await invokeSupabaseFunction('create-section', payload);

  let sectionPayload: any = null;

  if (!functionError && functionData) {
    if (typeof functionData === 'string') {
      try {
        sectionPayload = JSON.parse(functionData);
      } catch (parseError) {
        console.error('Failed to parse create section function response:', parseError);
      }
    } else {
      sectionPayload = functionData;
    }

    if (sectionPayload) {
      const section = sectionPayload.section || sectionPayload;
      if (section && section.id && section.name) {
        return {
          id: section.id,
          name: section.name,
          storeId: section.store_id || section.storeId || storeId,
          createdAt: section.created_at || section.createdAt,
        };
      }
    }
  }

  if (functionError) {
    console.warn('Create section function failed, falling back to direct insert:', functionError?.message || functionError);
  } else {
    console.warn('Create section function returned invalid payload, falling back to direct insert:', sectionPayload);
  }

  const { data, error } = await supabase
    .from('store_sections')
    .insert({ store_id: storeId, name })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating store section directly:', error.message, 'storeId:', storeId, 'name:', name);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    storeId: data.store_id,
    createdAt: data.created_at || data.createdAt,
  };
}

export async function updateStoreSection(sectionId: string, name: string): Promise<Section | null> {
  const { data, error } = await supabase
    .from('store_sections')
    .update({ name })
    .eq('id', sectionId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating store section:', error.message);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    storeId: data.store_id,
    createdAt: data.created_at || data.createdAt,
  };
}

export async function deleteStoreSection(sectionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('store_sections')
    .delete()
    .eq('id', sectionId);

  if (error) {
    console.error('Error deleting store section:', error.message);
    return false;
  }

  return true;
}

export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
  // Some schemas use camelCase quoted column names (e.g. "categoryId").
  // Query both common variants to be tolerant and align with the authoritative schema.
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`category_id.eq.${categoryId},\"categoryId\".eq.${categoryId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by category:', error.message);
    return [];
  }

  return (data || []).map(mapProductRow);
}

// ---------------------------------------------------------------------------
// REPRESENTATIVES
// ---------------------------------------------------------------------------

export async function fetchStoresByRepresentative(repId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('registered_by_agent_id', repId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stores for representative:', error.message);
    return [];
  }

  return (data || []).map(mapStoreRow);
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }

  return data ? mapProductRow(data) : null;
}

async function invokeSupabaseFunction(functionName: string, payload: any) {
  const body = JSON.stringify(payload);

  if (functionName === 'create-product' || functionName === 'create-section') {
    try {
      const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (anonymousKey) {
        headers.apikey = anonymousKey;
        headers.Authorization = `Bearer ${anonymousKey}`;
      }

      const functionUrl =
        functionName === 'create-product'
          ? SUPABASE_CREATE_PRODUCT_FUNCTION_URL
          : SUPABASE_CREATE_SECTION_FUNCTION_URL;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body,
      });

      const text = await response.text();
      let parsed: any = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        // keep raw text if JSON parsing fails
      }

      if (!response.ok) {
        return {
          data: parsed,
          error: new Error(parsed?.error || `Function request failed with status ${response.status}`),
        };
      }

      return { data: parsed, error: null };
    } catch (fetchError) {
      console.error('Create product direct function fetch failed:', fetchError);
      return { data: null, error: fetchError };
    }
  }

  const bodyString = JSON.stringify(payload);
  let data: any = null;
  let error: any = null;

  try {
    const result = await supabase.functions.invoke(functionName, {
      body: bodyString,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    data = result.data;
    error = result.error;
  } catch (invokeError) {
    error = invokeError;
  }

  if (!error) {
    return { data, error: null };
  }

  const message = String(error?.message || error);
  console.warn('Supabase Edge Function invoke failed:', message);

  if (!message.includes('Failed to send a request to the Edge Function')) {
    return { data, error };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { data: null, error: new Error('Supabase environment not configured for direct function fallback.') };
  }

  try {
    const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: bodyString,
    });

    const text = await response.text();
    let parsed: any = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // ignore parse failure, keep raw text
    }

    if (!response.ok) {
      return {
        data: parsed,
        error: new Error(parsed?.error || `Function request failed with status ${response.status}`),
      };
    }

    return { data: parsed, error: null };
  } catch (fetchError) {
    console.error('Direct Supabase function fetch failed:', fetchError);
    return { data: null, error: fetchError };
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const payload: any = {
    storeId: product.storeId,
    store_id: product.storeId,
    sectionId: product.sectionId ?? null,
    section_id: product.sectionId ?? null,
    name: product.name,
    description: product.description ?? null,
    price: Number(product.price),
    sku: product.sku ?? null,
    stock: Number(product.stock ?? 0),
    imageUrl: product.imageUrl ?? null,
    image_url: product.imageUrl ?? null,
    isFeatured: false,
    is_featured: false,
  };

  const { data, error } = await invokeSupabaseFunction('create-product', payload);
  if (error) {
    console.error('Create product function error:', error?.message || error);
    throw new Error(error?.message || 'فشل في استدعاء دالة إنشاء المنتج.');
  }

  let responseData = data;
  if (typeof responseData === 'string') {
    try {
      responseData = JSON.parse(responseData);
    } catch (parseError) {
      console.error('Failed to parse create product function response:', parseError);
    }
  }

  if (!responseData || typeof responseData !== 'object' || !('product' in responseData)) {
    console.error('Create product function returned invalid payload:', responseData);
    throw new Error('استجابة دالة إنشاء المنتج غير صحيحة.');
  }

  return mapProductRow(responseData.product);
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.sectionId !== undefined) payload.section_id = updates.sectionId;
  if (updates.sku !== undefined) payload.sku = updates.sku;
  if (updates.stock !== undefined) payload.stock = updates.stock;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating product:', error.message);
    return null;
  }

  return data ? mapProductRow(data) : null;
}

export async function deleteProduct(productId: string, storeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId);

  if (error) {
    console.error('Error deleting product:', error.message);
    return false;
  }

  return true;
}

export async function uploadStoreAsset(file: File, folder: string = 'avatars'): Promise<string | null> {
  try {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.warn('Storage upload failed, falling back to data URL:', error.message);
      return null;
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from(folder)
      .getPublicUrl(filePath);

    if (urlError) {
      console.warn('Failed to get public URL:', urlError.message);
      return null;
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Unexpected storage upload error:', error.message || error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  // Full-text search using Supabase's built-in search
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching products:', error.message);
    return [];
  }

  return (data || []).map(mapProductRow);
}

// ============================================================================
// USERS
// ============================================================================

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }

  return data ? mapUserRow(data) : null;
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
  const dbData: any = {};
  
  // Convert camelCase to snake_case
  if (updates.name !== undefined) dbData.name = updates.name;
  if (updates.storeId !== undefined) dbData.store_id = updates.storeId;
  if (updates.role !== undefined) dbData.role = updates.role;
  if (updates.paymentSystem !== undefined) dbData.payment_system = updates.paymentSystem;
  if (updates.totalEarnings !== undefined) dbData.total_earnings = updates.totalEarnings;
  if (updates.monthlySalary !== undefined) dbData.monthly_salary = updates.monthlySalary;
  if (updates.requiredStoresCount !== undefined) dbData.required_stores_count = updates.requiredStoresCount;
  if (updates.monthlyActivations !== undefined) dbData.monthly_activations = updates.monthlyActivations;
  if (updates.lastResetDate !== undefined) dbData.last_reset_date = updates.lastResetDate;

  const { error } = await supabase
    .from('users')
    .update(dbData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error.message);
    return false;
  }

  return true;
}

export async function createUser(user: User): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .insert([
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        store_id: user.storeId,
        payment_system: user.paymentSystem,
        total_earnings: user.totalEarnings,
        monthly_salary: user.monthlySalary,
        required_stores_count: user.requiredStoresCount,
      }
    ]);

  if (error) {
    console.error('Error creating user:', error.message);
    return false;
  }

  return true;
}

// ============================================================================
// ORDERS (Future use)
// ============================================================================

export async function fetchUserOrders(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error.message);
    return [];
  }

  return data || [];
}

export async function createOrder(order: any): Promise<string | null> {
  // Ensure all fields use snake_case for database
  const dbOrder: any = {
    store_id: order.storeId || order.store_id,
    store_name: order.storeName || order.store_name,
    customer_id: order.customerId || order.customer_id,
    customer_name: order.customerName || order.customer_name,
    customer_phone: order.customerPhone || order.customer_phone,
    items: order.items,
    total_amount: order.totalAmount || order.total_amount,
    status: order.status || 'pending',
    notes: order.notes,
    payment_method: order.paymentMethod || order.payment_method || 'whatsapp',
  };

  const { data, error } = await supabase
    .from('orders')
    .insert([dbOrder])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error.message);
    return null;
  }

  return data?.id || null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 't', 'yes', 'y'].includes(normalized);
  }
  return false;
}

export function mapStoreRow(row: any): Store {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url || row.logoUrl,
    coverImageUrl: row.cover_image_url || row.coverImageUrl,
    rating: row.rating || 0,
    reviews: row.reviews || 0,
    location: row.location || '',
    latitude: row.latitude,
    longitude: row.longitude,
    type: row.type || 'إلكتروني',
    marketType: row.market_type || row.marketType || '',
    businessHours: row.business_hours || row.businessHours,
    products: [],
    whatsappNumber: row.whatsapp_number || row.whatsappNumber,
    hasDelivery: parseBoolean(row.has_delivery ?? row.hasDelivery),
    isActive: parseBoolean(row.is_active ?? row.isActive),
    productLimit: typeof row.product_limit === 'number' ? row.product_limit : row.productLimit ?? Number.MAX_SAFE_INTEGER,
    subscriptionDuration: typeof row.subscription_duration === 'number' ? row.subscription_duration : row.subscriptionDuration ?? 0,
    activationDate: row.activation_date || row.activationDate || null,
    ownerId: row.owner_id || row.ownerId || null,
    ownerEmail: row.owner_email || row.ownerEmail,
    packageName: row.package_name || row.packageName,
    paymentProofUrl: row.payment_proof_url || row.paymentProofUrl,
    createdAt: row.created_at || row.createdAt || null,
    registeredByAgentId: row.registered_by_agent_id || row.registeredByAgentId || null,
  };
}

export function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price,
    imageUrl: row.image_url || row.imageUrl,
    storeId: row.store_id || row.storeId,
    categoryId: row.category_id || row.categoryId,
    sectionId: row.section_id || row.sectionId,
    sectionName: row.section_name || row.sectionName,
    sku: row.sku || row.product_sku || undefined,
    stock: typeof row.stock === 'number' ? row.stock : Number(row.stock ?? 0),
  };
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    storeId: row.store_id,
    role: row.role,
    paymentSystem: row.payment_system,
    totalEarnings: row.total_earnings,
    monthlySalary: row.monthly_salary,
    requiredStoresCount: row.required_stores_count,
    monthlyActivations: row.monthly_activations,
    lastResetDate: row.last_reset_date,
  };
}

// ============================================================================
// PACKAGES/SUBSCRIPTIONS
// ============================================================================

export async function fetchSubscriptionPackages(): Promise<{
  name: string;
  price: number;
  limit: number;
  duration: number;
  description?: string;
}[]> {
  // Get all stores and extract unique packages based on their configuration
  const { data, error } = await supabase
    .from('stores')
    .select('package_name, product_limit, subscription_duration')
    .not('package_name', 'is', null);

  if (error) {
    console.error('Error fetching packages:', error.message);
    // Return default packages as fallback
    return [
      { name: 'الباقة الأساسية', price: 0, limit: 50, duration: 30 },
      { name: 'باقة متقدمة', price: 10000, limit: 150, duration: 90 },
      { name: 'باقة غير محدودة', price: 25000, limit: 999999, duration: 365 },
    ];
  }

  // Create a map of unique packages
  const packageMap = new Map<string, { price: number; limit: number; duration: number }>();
  
  const packageNames: { [key: string]: { price: number; description: string } } = {
    'basic': { price: 0, description: 'الباقة الأساسية' },
    'advanced': { price: 10000, description: 'باقة متقدمة' },
    'unlimited': { price: 25000, description: 'باقة غير محدودة' },
  };

  (data || []).forEach((row: any) => {
    const packageName = row.package_name || 'basic';
    if (!packageMap.has(packageName)) {
      const packageConfig = packageNames[packageName] || { price: 0, description: packageName };
      packageMap.set(packageName, {
        price: packageConfig.price,
        limit: row.product_limit || 50,
        duration: row.subscription_duration || 30,
      });
    }
  });

  // Convert to array
  const packages = Array.from(packageMap.entries()).map(([key, value]) => ({
    name: packageNames[key]?.description || key,
    price: value.price,
    limit: value.limit,
    duration: value.duration,
  }));

  // If no packages found, return defaults
  return packages.length > 0 ? packages : [
    { name: 'الباقة الأساسية', price: 0, limit: 50, duration: 30 },
    { name: 'باقة متقدمة', price: 10000, limit: 150, duration: 90 },
    { name: 'باقة غير محدودة', price: 25000, limit: 999999, duration: 365 },
  ];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
