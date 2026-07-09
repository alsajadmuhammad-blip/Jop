/**
 * Supabase Database Operations
 * Centralized functions for all database queries
 */

import { supabase } from './supabase';
import type { Product, Store, Section, Category, User, CartItem, StorePackage } from '@/lib/types';

const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function buildSupabaseFunctionUrl(path: string): string | undefined {
  if (!SUPABASE_BASE_URL) return undefined;
  return `${SUPABASE_BASE_URL.replace(/\/$/, '')}/${path}`;
}

const SUPABASE_CREATE_PRODUCT_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CREATE_PRODUCT_FUNCTION_URL ??
  buildSupabaseFunctionUrl('functions/v1/create-product');

const SUPABASE_CREATE_SECTION_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CREATE_SECTION_FUNCTION_URL ??
  buildSupabaseFunctionUrl('functions/v1/create-section');

function getRowValue<T>(row: any, snakeCase: string, camelCase?: string): T | undefined {
  if (!row) return undefined;
  if (camelCase && row[camelCase] !== undefined) return row[camelCase] as T;
  if (row[snakeCase] !== undefined) return row[snakeCase] as T;
  return undefined;
}

function buildDualIdCondition(columnBase: string, value: string): string {
  const snake = `${columnBase}_id`;
  const camel = `"${columnBase[0].toUpperCase()}${columnBase.slice(1)}Id"`;
  return `${snake}.eq.${value},${camel}.eq.${value}`;
}

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
  if (!marketType) return [];
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .or(`market_type.eq.${marketType},marketType.eq.${marketType}`)
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
  if (!storeId) return [];
  
  // Try with snake_case first (most common)
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products for store:', error.message);
    return [];
  }

  return (data || []).map(mapProductRow);
}

export async function fetchStoreSections(storeId: string): Promise<Section[]> {
  if (!storeId) return [];
  
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
    storeId: getRowValue<string>(row, 'store_id', 'storeId') || storeId,
    imageUrl: row.image_url ?? undefined,
    createdAt: getRowValue<any>(row, 'created_at', 'createdAt'),
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
    .insert({ store_id: storeId, storeId: storeId, name })
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

export async function updateStoreSectionImage(sectionId: string, imageUrl: string): Promise<boolean> {
  const { error } = await supabase
    .from('store_sections')
    .update({ image_url: imageUrl })
    .eq('id', sectionId);
  if (error) {
    console.error('Error updating section image:', error.message);
    return false;
  }
  return true;
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
  if (!categoryId) return [];
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`category_id.eq.${categoryId},categoryId.eq.${categoryId}`)
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
  if (!repId) return [];
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .or(`registered_by_agent_id.eq.${repId},registeredByAgentId.eq.${repId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stores for representative:', error.message);
    return [];
  }

  return (data || []).map(mapStoreRow);
}

export async function updateRepresentative(
  userId: string,
  updates: Partial<User>
): Promise<User | null> {
  const payload: any = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.paymentSystem !== undefined) {
    payload.payment_system = updates.paymentSystem;
    payload.paymentSystem = updates.paymentSystem;
  }
  if (updates.monthlySalary !== undefined) {
    payload.monthly_salary = updates.monthlySalary;
    payload.monthlySalary = updates.monthlySalary;
  }
  if (updates.requiredStoresCount !== undefined) {
    payload.required_stores_count = updates.requiredStoresCount;
    payload.requiredStoresCount = updates.requiredStoresCount;
  }
  if (updates.monthlyActivations !== undefined) {
    payload.monthly_activations = updates.monthlyActivations;
    payload.monthlyActivations = updates.monthlyActivations;
  }
  if (updates.lastResetDate !== undefined) {
    payload.last_reset_date = updates.lastResetDate;
    payload.lastResetDate = updates.lastResetDate;
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating representative:', error.message);
    return null;
  }

  return {
    id: String(data.id),
    name: data.name,
    email: data.email,
    role: data.role,
    storeId: data.store_id || data.storeId || null,
    paymentSystem: data.payment_system || data.paymentSystem,
    totalEarnings: data.total_earnings || data.totalEarnings,
    monthlySalary: data.monthly_salary || data.monthlySalary,
    requiredStoresCount: data.required_stores_count || data.requiredStoresCount,
    monthlyActivations: data.monthly_activations || data.monthlyActivations,
    lastResetDate: data.last_reset_date || data.lastResetDate,
  } as User;
}

export async function deleteRepresentative(userId: string): Promise<boolean> {
  try {
    // First, update stores to remove the representative assignment
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        registered_by_agent_id: null,
        registeredByAgentId: null,
      })
      .eq('registered_by_agent_id', userId)
      .or(`registeredByAgentId.eq.${userId}`);

    if (updateError && updateError.code !== 'PGRST116') {
      console.error('Error updating stores before deleting representative:', updateError.message);
      return false;
    }

    // Delete the user from the users table (auth.users will be handled by Supabase's cascade delete)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting representative:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Error in deleteRepresentative:', error.message);
    return false;
  }
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

      if (!functionUrl) {
        return { data: null, error: new Error('Missing Supabase Edge Function URL for ' + functionName) };
      }

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
    discountPercent: product.discountPercent ?? 0,
    discount_percent: product.discountPercent ?? 0,
    sku: product.sku ?? null,
    stock: Number(product.stock ?? 0),
    imageUrl: product.imageUrl ?? null,
    image_url: product.imageUrl ?? null,
    images: product.images && product.images.length > 0 ? product.images : null,
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

  const createdProduct = mapProductRow(responseData.product);

  // إذا كان هناك خصم، نُطبّقه مباشرةً عبر Supabase Client بدلاً من الاعتماد على Edge Function
  // (Edge Function قد لا تقبل حقل discount_percent بعد)
  const discountPercent = Number(product.discountPercent ?? 0);
  if (discountPercent > 0 && createdProduct.id) {
    const { error: discountError } = await supabase
      .from('products')
      .update({ discount_percent: discountPercent })
      .eq('id', createdProduct.id);
    if (discountError) {
      console.error('Failed to apply discount after creation:', discountError.message);
    } else {
      createdProduct.discountPercent = discountPercent;
    }
  }

  return createdProduct;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  if (!productId) throw new Error('معرّف المنتج مطلوب');

  const payload: Record<string, unknown> = {};
  if (updates.name        !== undefined) {
    payload.name        = updates.name;
  }
  if (updates.description !== undefined) {
    payload.description = updates.description;
  }
  if (updates.price       !== undefined) {
    payload.price       = Number(updates.price);
  }
  if (updates.sectionId   !== undefined) {
    payload.section_id  = updates.sectionId || null;
    payload.sectionId   = updates.sectionId || null;
  }
  if (updates.sku         !== undefined) {
    payload.sku         = updates.sku || null;
  }
  if (updates.stock       !== undefined) {
    payload.stock       = Number(updates.stock ?? 0);
  }
  if (updates.imageUrl    !== undefined) {
    payload.image_url   = updates.imageUrl || null;
    payload.imageUrl    = updates.imageUrl || null;
  }
  if (updates.images !== undefined) {
    payload.images = updates.images && updates.images.length > 0 ? updates.images : null;
  }
  if (updates.discountPercent !== undefined) {
    payload.discount_percent = Number(updates.discountPercent ?? 0);
    // لا نُرسل discountPercent بالـ camelCase — العمود في DB هو discount_percent فقط
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select('*')
    .single();

  if (error) {
    console.error('updateProduct error:', error.message, error.details);
    throw new Error(`فشل تحديث المنتج: ${error.message}`);
  }

  return data ? mapProductRow(data) : null;
}

export async function deleteProduct(productId: string, storeId: string): Promise<boolean> {
  if (!productId || !storeId) return false;
  
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
  
  // Convert camelCase to snake_case and also update camelCase columns
  if (updates.name !== undefined) dbData.name = updates.name;
  if (updates.storeId !== undefined) {
    dbData.store_id = updates.storeId;
    dbData.storeId = updates.storeId;
  }
  if (updates.role !== undefined) dbData.role = updates.role;
  if (updates.paymentSystem !== undefined) {
    dbData.payment_system = updates.paymentSystem;
    dbData.paymentSystem = updates.paymentSystem;
  }
  if (updates.totalEarnings !== undefined) {
    dbData.total_earnings = updates.totalEarnings;
    dbData.totalEarnings = updates.totalEarnings;
  }
  if (updates.monthlySalary !== undefined) {
    dbData.monthly_salary = updates.monthlySalary;
    dbData.monthlySalary = updates.monthlySalary;
  }
  if (updates.requiredStoresCount !== undefined) {
    dbData.required_stores_count = updates.requiredStoresCount;
    dbData.requiredStoresCount = updates.requiredStoresCount;
  }
  if (updates.monthlyActivations !== undefined) {
    dbData.monthly_activations = updates.monthlyActivations;
    dbData.monthlyActivations = updates.monthlyActivations;
  }
  if (updates.lastResetDate !== undefined) {
    dbData.last_reset_date = updates.lastResetDate;
    dbData.lastResetDate = updates.lastResetDate;
  }

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
        storeId: user.storeId,
        payment_system: user.paymentSystem,
        paymentSystem: user.paymentSystem,
        total_earnings: user.totalEarnings,
        totalEarnings: user.totalEarnings,
        monthly_salary: user.monthlySalary,
        monthlySalary: user.monthlySalary,
        required_stores_count: user.requiredStoresCount,
        requiredStoresCount: user.requiredStoresCount,
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
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(`customer_id.eq.${userId},customerId.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error.message);
    return [];
  }

  return data || [];
}

export async function createOrder(order: any): Promise<string | null> {
  /* بناء الـ payload بشكل انتقائي — نُضيف فقط القيم الموجودة
     لتجنب إرسال undefined إلى Supabase مما قد يتعارض مع قيود NOT NULL */
  const storeId   = order.storeId   || order.store_id   || null;
  const storeName = order.storeName || order.store_name  || null;
  const custId    = order.customerId  || order.customer_id  || null;
  const custName  = order.customerName || order.customer_name || null;
  const custPhone = order.customerPhone || order.customer_phone || null;
  const pmMethod  = order.paymentMethod || order.payment_method || 'cash';

  const dbOrder: Record<string, unknown> = {
    store_id:     storeId,
    storeId:      storeId,
    store_name:   storeName,
    storeName:    storeName,
    items:        order.items,
    total_amount: order.totalAmount || order.total_amount || 0,
    totalAmount:  order.totalAmount || order.total_amount || 0,
    status:       order.status || 'pending',
    payment_method: pmMethod,
    paymentMethod:  pmMethod,
    source:       order.source || 'pos',
  };

  /* الحقول الاختيارية — لا نُضيفها إلا إذا كانت موجودة */
  if (custId)    { dbOrder.customer_id = custId;   dbOrder.customerId   = custId; }
  if (custName)  { dbOrder.customer_name = custName; dbOrder.customerName = custName; }
  if (custPhone) { dbOrder.customer_phone = custPhone; dbOrder.customerPhone = custPhone; }
  if (order.notes != null) { dbOrder.notes = order.notes; }

  const { data, error } = await supabase
    .from('orders')
    .insert([dbOrder])
    .select()
    .single();

  if (error) {
    console.error('createOrder error:', error.message, error.details, error.hint);
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
    logoUrl: getRowValue<string>(row, 'logo_url', 'logoUrl'),
    coverImageUrl: getRowValue<string>(row, 'cover_image_url', 'coverImageUrl'),
    rating: row.rating || 0,
    reviews: row.reviews || 0,
    location: row.location || '',
    latitude: getRowValue<number>(row, 'latitude', 'latitude'),
    longitude: getRowValue<number>(row, 'longitude', 'longitude'),
    type: row.type || 'إلكتروني',
    marketType: getRowValue<string>(row, 'market_type', 'marketType') || '',
    businessHours: getRowValue<any>(row, 'business_hours', 'businessHours'),
    products: [],
    whatsappNumber: getRowValue<string>(row, 'whatsapp_number', 'whatsappNumber'),
    hasDelivery: parseBoolean(getRowValue<any>(row, 'has_delivery', 'hasDelivery')),
    isActive: parseBoolean(getRowValue<any>(row, 'is_active', 'isActive')),
    productLimit:
      typeof getRowValue<number>(row, 'product_limit', 'productLimit') === 'number'
        ? getRowValue<number>(row, 'product_limit', 'productLimit')!
        : Number(getRowValue<number>(row, 'productLimit', 'productLimit') ?? Number.MAX_SAFE_INTEGER),
    subscriptionDuration:
      typeof getRowValue<number>(row, 'subscription_duration', 'subscriptionDuration') === 'number'
        ? getRowValue<number>(row, 'subscription_duration', 'subscriptionDuration')!
        : Number(getRowValue<number>(row, 'subscriptionDuration', 'subscriptionDuration') ?? 0),
    activationDate: getRowValue<any>(row, 'activation_date', 'activationDate') || null,
    ownerId: getRowValue<string>(row, 'owner_id', 'ownerId') || null,
    ownerEmail: getRowValue<string>(row, 'owner_email', 'ownerEmail'),
    slug: row.slug || undefined,
    packageId: getRowValue<string>(row, 'package_id', 'packageId') || undefined,
    packageName: getRowValue<string>(row, 'package_name', 'packageName'),
    paymentProofUrl: getRowValue<string>(row, 'payment_proof_url', 'paymentProofUrl'),
    createdAt: getRowValue<any>(row, 'created_at', 'createdAt') || null,
    registeredByAgentId: getRowValue<string>(row, 'registered_by_agent_id', 'registeredByAgentId') || null,
  };
}

export function mapProductRow(row: any): Product {
  const rawDiscount = getRowValue<number>(row, 'discount_percent', 'discountPercent');

  // دعم الصور المتعددة — عمود images (JSONB مصفوفة نصية)
  let extraImages: string[] = [];
  const rawImages = row.images;
  if (Array.isArray(rawImages)) {
    extraImages = rawImages.filter((u: unknown) => typeof u === 'string' && u.length > 0);
  } else if (typeof rawImages === 'string' && rawImages.startsWith('[')) {
    try { extraImages = JSON.parse(rawImages).filter((u: unknown) => typeof u === 'string'); } catch { /* ignore */ }
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price,
    discountPercent: rawDiscount != null && Number(rawDiscount) > 0 ? Number(rawDiscount) : undefined,
    imageUrl: getRowValue<string>(row, 'image_url', 'imageUrl'),
    images: extraImages.length > 0 ? extraImages : undefined,
    storeId: getRowValue<string>(row, 'store_id', 'storeId') || '',
    categoryId: getRowValue<string>(row, 'category_id', 'categoryId'),
    sectionId: getRowValue<string>(row, 'section_id', 'sectionId'),
    sectionName: getRowValue<string>(row, 'section_name', 'sectionName'),
    sku: row.sku || row.product_sku || undefined,
    stock: typeof row.stock === 'number' ? row.stock : Number(row.stock ?? 0),
    flashPrice: getRowValue<number>(row, 'flash_price', 'flashPrice') ?? undefined,
    flashEndsAt: getRowValue<string>(row, 'flash_ends_at', 'flashEndsAt') ?? undefined,
    isFeatured: getRowValue<boolean>(row, 'is_featured', 'isFeatured') ?? false,
    rating: typeof row.rating === 'number' ? row.rating : Number(row.rating ?? 0),
    reviews: typeof row.reviews === 'number' ? row.reviews : Number(row.reviews ?? 0),
  };
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    storeId: getRowValue<string>(row, 'store_id', 'storeId') || null,
    role: row.role,
    paymentSystem: getRowValue<string>(row, 'payment_system', 'paymentSystem') as 'salary' | 'commission' | undefined,
    totalEarnings: getRowValue<number>(row, 'total_earnings', 'totalEarnings'),
    monthlySalary: getRowValue<number>(row, 'monthly_salary', 'monthlySalary'),
    requiredStoresCount: getRowValue<number>(row, 'required_stores_count', 'requiredStoresCount'),
    monthlyActivations: getRowValue<number>(row, 'monthly_activations', 'monthlyActivations'),
    lastResetDate: getRowValue<any>(row, 'last_reset_date', 'lastResetDate'),
  };
}

// ============================================================================
// PACKAGES/SUBSCRIPTIONS
// ============================================================================

export async function fetchStorePackages(): Promise<StorePackage[]> {
  const { data, error } = await supabase
    .from('store_packages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching store packages:', error.message);
    return [];
  }

  return (data || []).map(mapStorePackageRow);
}

export async function createStorePackage(pkg: Omit<StorePackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorePackage | null> {
  const { data, error } = await supabase
    .from('store_packages')
    .insert([
      {
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description || null,
        price: Number(pkg.price),
        product_limit: Number(pkg.productLimit),
        subscription_duration: Number(pkg.subscriptionDuration),
        is_active: pkg.isActive,
        visibility: pkg.visibility ?? 'public',
        target_points: Math.max(1, Number(pkg.targetPoints ?? 1)),
        metadata: (pkg.metadata && Object.keys(pkg.metadata).length > 0) ? pkg.metadata : null,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating store package:', error.message);
    return null;
  }

  return mapStorePackageRow(data);
}

export async function updateStorePackage(packageId: string, updates: Partial<StorePackage>): Promise<StorePackage | null> {
  const payload: any = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.description !== undefined) {
    payload.description = updates.description || null;
  }
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.productLimit !== undefined) {
    payload.product_limit = Number(updates.productLimit);
  }
  if (updates.subscriptionDuration !== undefined) {
    payload.subscription_duration = Number(updates.subscriptionDuration);
  }
  if (updates.isActive !== undefined) {
    payload.is_active = updates.isActive;
  }
  if (updates.metadata !== undefined) {
    payload.metadata = updates.metadata && Object.keys(updates.metadata).length > 0 ? updates.metadata : null;
  }
  if (updates.visibility !== undefined) {
    payload.visibility = updates.visibility;
  }
  if (updates.targetPoints !== undefined) {
    payload.target_points = Math.max(1, Number(updates.targetPoints));
  }

  const { data, error } = await supabase
    .from('store_packages')
    .update(payload)
    .eq('id', packageId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating store package:', error.message);
    return null;
  }

  return mapStorePackageRow(data);
}

export async function deleteStorePackage(packageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('store_packages')
    .delete()
    .eq('id', packageId);

  if (error) {
    console.error('Error deleting store package:', error.message);
    return false;
  }

  return true;
}

export async function fetchSubscriptionPackages(): Promise<{
  name: string;
  price: number;
  limit: number;
  duration: number;
  description?: string;
}[]> {
  const packages = await fetchStorePackages();
  return packages.map((pkg) => ({
    name: pkg.name,
    price: pkg.price,
    limit: pkg.productLimit,
    duration: pkg.subscriptionDuration,
    description: pkg.description,
  }));
}

function mapStorePackageRow(row: any): StorePackage {
  const rawVisibility = row.visibility || row.packageVisibility || 'public';
  const visibility: import('@/lib/types').PackageVisibility =
    ['public', 'renewal', 'both'].includes(rawVisibility) ? rawVisibility : 'public';
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    price: typeof row.price === 'number' ? row.price : Number(row.price ?? 0),
    productLimit: typeof row.product_limit === 'number' ? row.product_limit : Number(row.product_limit ?? 50),
    subscriptionDuration: typeof row.subscription_duration === 'number' ? row.subscription_duration : Number(row.subscription_duration ?? 30),
    isActive: parseBoolean(row.is_active ?? true),
    visibility,
    // نقاط هدف المسوّق — افتراضي 1 إذا لم يكن العمود موجوداً بعد
    targetPoints: typeof row.target_points === 'number' ? row.target_points : Math.max(1, Number(row.target_points ?? 1)),
    metadata: (row.metadata && typeof row.metadata === 'object') ? row.metadata : null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
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
