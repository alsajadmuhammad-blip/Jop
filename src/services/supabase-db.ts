/**
 * Supabase Database Operations
 * Centralized functions for all database queries
 */

import { supabase } from './supabase';
import type { Product, Store, Category, User, CartItem } from '@/lib/types';

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
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }

  return (data || []).map(mapProductRow);
}

export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
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

const SUPABASE_CREATE_PRODUCT_FUNCTION_URL = "https://tjfogjumpyygftwwbmxb.supabase.co/functions/v1/create-product";

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  const payload: any = {
    storeId: product.storeId,
    categoryId: product.categoryId ?? null,
    name: product.name,
    description: product.description ?? null,
    price: Number(product.price),
    imageUrl: product.imageUrl ?? null,
    isFeatured: false,
  };

  try {
    const response = await fetch(SUPABASE_CREATE_PRODUCT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Create product function error:', result);
      return null;
    }

    if (!result?.product) {
      console.error('Create product function returned invalid payload:', result);
      return null;
    }

    return mapProductRow(result.product);
  } catch (error: any) {
    console.error('Failed to call create product function:', error?.message || error);
    return null;
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
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
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
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
    imageUrl: row.image_url,
    storeId: row.store_id,
    categoryId: row.category_id,
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
