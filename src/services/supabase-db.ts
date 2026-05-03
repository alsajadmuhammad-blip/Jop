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
  const { error } = await supabase
    .from('users')
    .update({
      name: updates.name,
      store_id: updates.storeId,
      role: updates.role,
      payment_system: updates.paymentSystem,
      total_earnings: updates.totalEarnings,
      monthly_salary: updates.monthlySalary,
      required_stores_count: updates.requiredStoresCount,
      monthly_activations: updates.monthlyActivations,
      last_reset_date: updates.lastResetDate,
    })
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
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
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

function mapProductRow(row: any): Product {
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
