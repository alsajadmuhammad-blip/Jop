/**
 * Flash Sales Service
 * Manages time-limited price offers with live countdown
 */

import { supabase } from './supabase';

export type FlashSale = {
  id: string;
  storeId: string;
  productId: string;
  flashPrice: number;
  endsAt: string;   // ISO string
  isActive: boolean;
  createdAt: string;
};

function mapRow(row: any): FlashSale {
  return {
    id: row.id,
    storeId: row.store_id,
    productId: row.product_id,
    flashPrice: Number(row.flash_price),
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** جلب الفلاش سيل النشطة لمتجر معين (يُستخدم في صفحة المتجر) */
export async function fetchActiveFlashSalesByStore(storeId: string): Promise<FlashSale[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .gt('ends_at', now);

  if (error) {
    console.error('fetchActiveFlashSalesByStore:', error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** جلب كل الفلاش سيل لمتجر (داشبورد المالك) */
export async function fetchAllFlashSalesByStore(storeId: string): Promise<FlashSale[]> {
  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAllFlashSalesByStore:', error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** إنشاء فلاش سيل جديد — يُلغي أي فلاش سيل نشط لنفس المنتج */
export async function createFlashSale(
  storeId: string,
  productId: string,
  flashPrice: number,
  durationHours: number
): Promise<FlashSale | null> {
  // إلغاء الفلاش سيل السابق لهذا المنتج إن وُجد
  await supabase
    .from('flash_sales')
    .update({ is_active: false })
    .eq('store_id', storeId)
    .eq('product_id', productId)
    .eq('is_active', true);

  const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('flash_sales')
    .insert({
      store_id: storeId,
      product_id: productId,
      flash_price: flashPrice,
      ends_at: endsAt,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createFlashSale:', error.message);
    throw new Error(`فشل إنشاء العرض: ${error.message}`);
  }
  return data ? mapRow(data) : null;
}

/** إيقاف فلاش سيل */
export async function deactivateFlashSale(flashSaleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('flash_sales')
    .update({ is_active: false })
    .eq('id', flashSaleId);

  if (error) {
    console.error('deactivateFlashSale:', error.message);
    return false;
  }
  return true;
}
