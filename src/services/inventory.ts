/**
 * Inventory Service — سجل حركات المخزون
 * إضافة / إرجاع / استبدال / تلف / تصحيح — كل حركة تُسجَّل في inventory_movements
 * وتُحدَّث كمية المخزون في نفس الوقت.
 */

import { supabase } from './supabase';

export type InventoryReasonKind =
  | 'restock'      // إضافة مخزون جديد
  | 'return'       // إرجاع من عميل
  | 'exchange'     // استبدال
  | 'damage'       // تلف / فقدان
  | 'correction';  // تصحيح يدوي

export const INVENTORY_REASON_LABELS: Record<InventoryReasonKind, string> = {
  restock:    'إضافة مخزون',
  return:     'إرجاع من عميل',
  exchange:   'استبدال',
  damage:     'تلف / فقدان',
  correction: 'تصحيح يدوي',
};

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  quantityChange: number;
  reason: string;
  createdAt: string;
}

function mapMovementRow(row: any): InventoryMovement {
  return {
    id: row.id,
    storeId: row.store_id,
    productId: row.product_id,
    quantityChange: Number(row.quantity_change ?? 0),
    reason: row.reason || '',
    createdAt: row.created_at,
  };
}

/** يجلب آخر حركات المخزون لمتجر معيّن */
export async function fetchInventoryMovements(
  storeId: string,
  limit: number = 100
): Promise<InventoryMovement[]> {
  if (!storeId) return [];
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchInventoryMovements error:', error.message);
    return [];
  }
  return (data || []).map(mapMovementRow);
}

/**
 * يسجّل حركة مخزون ويُحدّث كمية المنتج معاً.
 * quantityChange: موجب = زيادة، سالب = نقصان.
 * يُعيد الكمية الجديدة عند النجاح، أو يرمي خطأ عند الفشل.
 */
export async function recordInventoryMovement(params: {
  storeId: string;
  productId: string;
  currentStock: number;
  quantityChange: number;
  reasonLabel: string;
}): Promise<number> {
  const { storeId, productId, currentStock, quantityChange, reasonLabel } = params;
  if (!storeId || !productId) throw new Error('بيانات المنتج غير مكتملة');
  if (!quantityChange) throw new Error('الكمية يجب أن تكون مختلفة عن صفر');

  const newStock = Math.max(0, currentStock + quantityChange);

  // نقرأ المخزون الفعلي من القاعدة مباشرة قبل الكتابة لتقليل فرص التعارض
  // مع عمليات كاشير/طلبات أخرى تعمل بالتوازي (لا يوجد RPC ذري متاح هنا).
  const { data: freshRow, error: readError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .eq('store_id', storeId)
    .single();

  if (readError || !freshRow) {
    throw new Error(`فشل قراءة المخزون الحالي: ${readError?.message ?? 'المنتج غير موجود'}`);
  }

  const freshStock = typeof freshRow.stock === 'number' ? freshRow.stock : Number(freshRow.stock ?? 0);
  const resolvedNewStock = Math.max(0, freshStock + quantityChange);

  const { error: stockError } = await supabase
    .from('products')
    .update({ stock: resolvedNewStock })
    .eq('id', productId)
    .eq('store_id', storeId);

  if (stockError) {
    throw new Error(`فشل تحديث المخزون: ${stockError.message}`);
  }

  const { error: logError } = await supabase.from('inventory_movements').insert([
    {
      store_id: storeId,
      product_id: productId,
      quantity_change: quantityChange,
      reason: reasonLabel,
    },
  ]);

  if (logError) {
    // المخزون تحدّث فعلاً؛ لكن بدون سجل الحركة تفقد إمكانية التتبع، لذا نحاول
    // التراجع عن تحديث المخزون حتى تبقى البيانات متسقة، ثم نُبلغ المستخدم بالفشل.
    await supabase.from('products').update({ stock: freshStock }).eq('id', productId).eq('store_id', storeId);
    throw new Error(`فشل تسجيل حركة المخزون: ${logError.message}`);
  }

  return resolvedNewStock;
}
