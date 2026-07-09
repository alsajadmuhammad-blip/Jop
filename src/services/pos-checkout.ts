/**
 * pos-checkout — يستدعي Supabase Edge Function المنشورة
 * لإنشاء طلب POS وخصم المخزون ذرياً مع service_role
 */

import { supabase } from './supabase';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface POSItem {
  product_id:   string;
  product_name: string;
  qty:          number;
  unit_price:   number;
}

export interface POSCheckoutPayload {
  store_id:       string;
  store_name:     string;
  customer_name?: string;
  items:          POSItem[];
  total_amount:   number;
  payment_method: 'cash' | 'transfer';
  notes?:         string;
}

export interface POSCheckoutResult {
  order_id:       string;
  order_number:   number;
  stock_warnings?: string[];
}

export async function posCheckout(
  payload: POSCheckoutPayload
): Promise<POSCheckoutResult> {
  const url = `${SUPABASE_URL}/functions/v1/pos-checkout`;

  /* جهّز الهيدر مع JWT الحالي */
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey':       SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch { /* ignore */ }

  const res = await fetch(url, {
    method:  'POST',
    headers,
    body:    JSON.stringify(payload),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`خطأ غير متوقع (${res.status}) — تأكد من نشر الدالة السحابية`);
  }

  if (!res.ok || !data?.success) {
    throw new Error(data?.error ?? `فشل إتمام البيع (${res.status})`);
  }

  return {
    order_id:       data.order_id,
    order_number:   data.order_number,
    stock_warnings: data.stock_warnings,
  };
}
