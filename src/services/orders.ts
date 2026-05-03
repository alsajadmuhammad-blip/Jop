/**
 * Orders Service
 * Handles all order-related operations with Supabase
 */

import { supabase } from './supabase';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';

/**
 * Create a new order in Supabase
 */
export async function createOrder(
  storeId: string,
  storeName: string,
  customerId: string,
  customerName: string | undefined,
  customerPhone: string | undefined,
  items: OrderItem[],
  totalAmount: number,
  notes?: string
): Promise<Order | null> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          store_id: storeId,
          store_name: storeName,
          customer_id: customerId,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          items: items,
          total_amount: totalAmount,
          status: 'pending',
          notes: notes || null,
          payment_method: 'whatsapp',
          created_at: now,
          updated_at: now,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return mapOrderFromDB(data);
  } catch (error) {
    console.error('Unexpected error creating order:', error);
    return null;
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
      .eq('store_id', storeId)
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
      .eq('customer_id', customerId)
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
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: now })
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
 */
function mapOrderFromDB(data: any): Order {
  return {
    id: data.id,
    storeId: data.store_id,
    storeName: data.store_name,
    customerId: data.customer_id,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    items: data.items || [],
    totalAmount: data.total_amount,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    paymentMethod: data.payment_method,
  };
}
