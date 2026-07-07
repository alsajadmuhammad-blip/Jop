/**
 * Orders Service
 * Handles all order-related operations with Supabase
 */

import { supabase } from './supabase';
import { updateProduct } from './supabase-db';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';

/**
 * Helper function to safely extract a value from either snake_case or camelCase column
 */
function getRowValue(row: any, snakeCase: string, camelCase: string, defaultValue: any = null): any {
  return row[snakeCase] !== undefined && row[snakeCase] !== null 
    ? row[snakeCase] 
    : row[camelCase] !== undefined && row[camelCase] !== null
      ? row[camelCase]
      : defaultValue;
}

function buildDualIdCondition(snakeCase: string, camelCase: string, value: string): string {
  return `${snakeCase}.eq.${value},${camelCase}.eq.${value}`;
}

function shouldDeductInventory(oldStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const deductStatuses: OrderStatus[] = ['preparing', 'ready_for_pickup', 'delivering', 'delivered'];
  return deductStatuses.includes(newStatus) && !deductStatuses.includes(oldStatus) && oldStatus !== 'cancelled';
}

async function deductInventoryStock(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    if (!item.productId) continue;

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('id,stock')
        .eq('id', item.productId)
        .single();

      if (error) {
        console.error('Failed to fetch product stock for order deduction:', item.productId, error);
        continue;
      }

      if (!product || typeof product.stock !== 'number') {
        continue;
      }

      const newStock = Math.max(0, product.stock - item.quantity);
      await updateProduct(item.productId, { stock: newStock });
    } catch (error) {
      console.error('Unexpected error deducting inventory for item:', item.productId, error);
    }
  }
}

/**
 * Create a new order in Supabase
 */
export async function createOrder(
  storeId: string,
  storeName: string,
  customerId: string | null,
  customerName: string | undefined,
  customerPhone: string | undefined,
  items: OrderItem[],
  totalAmount: number,
  notes?: string,
  paymentMethod: 'whatsapp' | 'cash' | 'transfer' = 'whatsapp',
  customerPhoneBackup?: string,
  customerGovernorate?: string,
  customerAddress?: string,
): Promise<Order | null> {
  try {
    // Basic validation
    if (!storeId) throw new Error('storeId is required.');
    if (!Array.isArray(items) || items.length === 0) throw new Error('items must be a non-empty array.');
    if (typeof totalAmount !== 'number' || Number.isNaN(totalAmount) || totalAmount <= 0) throw new Error('totalAmount must be a positive number.');

    const now = new Date().toISOString();

    // Ensure items are plain JSON-serializable objects with expected fields
    const safeItems = items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unitPrice) || 0,
      totalPrice: Number(it.totalPrice) || 0,
    }));

    // Dual-write pattern: save to both snake_case and camelCase columns
    const orderData: any = {
      store_id: storeId,
      storeId: storeId,
      store_name: storeName,
      storeName: storeName,
      customer_name: customerName?.trim() || null,
      customerName: customerName?.trim() || null,
      customer_phone: customerPhone?.trim() || null,
      customerPhone: customerPhone?.trim() || null,
      customer_phone_backup: customerPhoneBackup?.trim() || null,
      customerPhoneBackup: customerPhoneBackup?.trim() || null,
      customer_governorate: customerGovernorate?.trim() || null,
      customerGovernorate: customerGovernorate?.trim() || null,
      customer_address: customerAddress?.trim() || null,
      customerAddress: customerAddress?.trim() || null,
      items: safeItems,
      total_amount: totalAmount,
      totalAmount: totalAmount,
      status: 'pending',
      notes: notes?.trim() || null,
      payment_method: paymentMethod,
      paymentMethod: paymentMethod,
      created_at: now,
      createdAt: now,
      updated_at: now,
      updatedAt: now,
    };

    if (customerId) {
      orderData.customer_id = customerId.trim();
      orderData.customerId = customerId.trim();
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      const msg = error?.message || JSON.stringify(error);
      console.error('Error creating order:', msg, error);
      throw new Error(`فشل إنشاء الطلب: ${msg}`);
    }

    return mapOrderFromDB(data);
  } catch (error) {
    console.error('Unexpected error creating order:', error instanceof Error ? error.message : error);
    throw error instanceof Error ? error : new Error('Unexpected error creating order.');
  }
}

/**
 * Fetch orders for a specific store (for store owner)
 */
export async function fetchStoreOrders(storeId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(buildDualIdCondition('store_id', 'storeId', storeId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store orders:', error);
      return [];
    }

    return (data || []).map(mapOrderFromDB);
  } catch (error) {
    console.error('Unexpected error fetching store orders:', error);
    return [];
  }
}

/**
 * Fetch orders for a specific customer
 */
export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(buildDualIdCondition('customer_id', 'customerId', customerId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }

    return (data || []).map(mapOrderFromDB);
  } catch (error) {
    console.error('Unexpected error fetching customer orders:', error);
    return [];
  }
}

/**
 * Update order status (by store owner)
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  try {
    const existingOrder = await fetchOrderById(orderId);
    if (!existingOrder) {
      console.error('Order not found for status update:', orderId);
      return null;
    }

    if (shouldDeductInventory(existingOrder.status, status)) {
      await deductInventoryStock(existingOrder.items);
    }

    const now = new Date().toISOString();
    
    // Dual-write pattern for timestamps
    const updateData = {
      status: status,
      updated_at: now,
      updatedAt: now,
    };
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return null;
    }

    return mapOrderFromDB(data);
  } catch (error) {
    console.error('Unexpected error updating order status:', error);
    return null;
  }
}

/**
 * Get the sequential order number for a specific order within a store.
 * Order #1 is the oldest by (created_at, id), #2 is the second oldest, etc.
 * Fetches only id + created_at columns and sorts client-side for determinism
 * — same tie-breaker logic used by the dashboard so numbers always match.
 */
export async function getOrderSequentialNumber(
  storeId: string,
  orderId: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, created_at')
      .or(`store_id.eq.${storeId},storeId.eq.${storeId}`);

    if (error || !data) return 0;

    // Sort deterministically by (created_at ASC, id ASC) — same as dashboard
    const sorted = [...data].sort((a, b) => {
      const tDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (tDiff !== 0) return tDiff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    const idx = sorted.findIndex((o) => o.id === orderId);
    return idx >= 0 ? idx + 1 : 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return mapOrderFromDB(data);
  } catch (error) {
    console.error('Unexpected error fetching order:', error);
    return null;
  }
}

/**
 * Helper function to map database record to Order type
 * Handles both snake_case and camelCase column naming conventions
 */
function mapOrderFromDB(data: any): Order {
  const rawItems = data?.items;
  let items: OrderItem[] = [];

  if (Array.isArray(rawItems)) {
    items = rawItems;
  } else if (typeof rawItems === 'string') {
    try {
      items = JSON.parse(rawItems);
    } catch (_error) {
      items = [];
    }
  }

  const totalAmount = getRowValue(data, 'total_amount', 'totalAmount', 0);

  return {
    id: data.id,
    storeId: getRowValue(data, 'store_id', 'storeId'),
    storeName: getRowValue(data, 'store_name', 'storeName'),
    customerId: getRowValue(data, 'customer_id', 'customerId'),
    customerName: getRowValue(data, 'customer_name', 'customerName'),
    customerPhone: getRowValue(data, 'customer_phone', 'customerPhone'),
    customerPhoneBackup: getRowValue(data, 'customer_phone_backup', 'customerPhoneBackup'),
    customerGovernorate: getRowValue(data, 'customer_governorate', 'customerGovernorate'),
    customerAddress: getRowValue(data, 'customer_address', 'customerAddress'),
    items,
    totalAmount: typeof totalAmount === 'string' ? Number(totalAmount) : totalAmount,
    status: data.status ?? 'pending',
    notes: data.notes ?? null,
    createdAt: getRowValue(data, 'created_at', 'createdAt'),
    updatedAt: getRowValue(data, 'updated_at', 'updatedAt'),
    paymentMethod: getRowValue(data, 'payment_method', 'paymentMethod') || 'whatsapp',
  };
}
