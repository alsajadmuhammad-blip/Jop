/**
 * Inventory Service — سجل حركات المخزون
 * إضافة / إرجاع / استبدال / تلف / تصحيح / بيع — كل حركة تُسجَّل في inventory_movements
 * وتُحدَّث كمية المخزون في نفس الوقت.
 * logInventoryMovementsBulk: لتسجيل الحركات فقط بدون تعديل المخزون (مبيعات الكاشير).
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

/**
 * يسجّل حركات مخزون متعددة دفعةً واحدة بدون تعديل المخزون.
 * يُستخدم بعد مبيعات الكاشير حيث يكون المخزون قد خُصم فعلاً بواسطة
 * Edge Function، ونحن نريد فقط توثيق الحركة في السجل.
 */
export async function logInventoryMovementsBulk(
  movements: Array<{
    storeId: string;
    productId: string;
    quantityChange: number;
    reason: string;
  }>
): Promise<InventoryMovement[]> {
  if (!movements.length) return [];
  const rows = movements.map((m) => ({
    store_id:        m.storeId,
    product_id:      m.productId,
    quantity_change: m.quantityChange,
    reason:          m.reason,
  }));
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(rows)
    .select();
  if (error) {
    console.error('logInventoryMovementsBulk error:', error.message);
    throw new Error(`فشل تسجيل حركات المخزون: ${error.message}`);
  }
  return (data || []).map(mapMovementRow);
}

// ─── الاستبدال المركّب وتصنيف الحركات ────────────────────────────

export const EXCHANGE_PREFIX = 'EXCHANGE::';

export interface ExchangeData {
  rName:     string;   // اسم المُرجَع
  iName:     string;   // اسم البديل
  rQty:      number;
  iQty:      number;
  priceDiff: number;   // موجب = عميل يدفع فرق | سالب = استرداد
  invRef?:   string;
  invDate?:  string;
  note?:     string;
}

export type MovementKind =
  | 'restock' | 'return' | 'exchange'
  | 'damage'  | 'correction' | 'pos_sale' | 'other';

export function parseExchangeReason(reason: string): ExchangeData | null {
  if (!reason.startsWith(EXCHANGE_PREFIX)) return null;
  try { return JSON.parse(reason.slice(EXCHANGE_PREFIX.length)) as ExchangeData; } catch { return null; }
}

export function classifyMovement(reason: string): MovementKind {
  if (reason.startsWith(EXCHANGE_PREFIX)) return 'exchange';
  if (reason.includes('بيع كاشير'))       return 'pos_sale';
  if (reason.startsWith('إضافة مخزون'))   return 'restock';
  if (reason.startsWith('إرجاع'))         return 'return';
  if (reason.startsWith('تلف'))           return 'damage';
  if (reason.startsWith('تصحيح'))         return 'correction';
  return 'other';
}

/**
 * استبدال مركّب — يزيد مخزون المُرجَع، يخصم البديل،
 * وينشئ سجلاً واحداً يحتوي كل التفاصيل.
 */
export async function recordExchangeMovement(params: {
  storeId:             string;
  returnedProductId:   string;
  returnedProductName: string;
  returnedQty:         number;
  issuedProductId:     string;
  issuedProductName:   string;
  issuedQty:           number;
  priceDiff:           number;
  invoiceRef?:  string;
  invoiceDate?: string;
  note?:        string;
}): Promise<{ returnedNewStock: number; issuedNewStock: number; movement: InventoryMovement }> {
  const { storeId, returnedProductId, issuedProductId } = params;

  const { data: rows, error: readErr } = await supabase
    .from('products').select('id, stock')
    .in('id', [returnedProductId, issuedProductId])
    .eq('store_id', storeId);

  if (readErr || !rows?.length)
    throw new Error(`فشل قراءة المخزون: ${readErr?.message ?? 'منتجات غير موجودة'}`);

  const retRow = rows.find((r: any) => r.id === returnedProductId);
  const issRow = rows.find((r: any) => r.id === issuedProductId);
  if (!retRow) throw new Error('المنتج المُرجَع غير موجود');
  if (!issRow) throw new Error('المنتج البديل غير موجود');

  const returnedNewStock = Number(retRow.stock) + params.returnedQty;
  const issuedNewStock   = Math.max(0, Number(issRow.stock) - params.issuedQty);

  const { error: e1 } = await supabase.from('products')
    .update({ stock: returnedNewStock })
    .eq('id', returnedProductId).eq('store_id', storeId);
  if (e1) throw new Error(`فشل تحديث مخزون المُرجَع: ${e1.message}`);

  const { error: e2 } = await supabase.from('products')
    .update({ stock: issuedNewStock })
    .eq('id', issuedProductId).eq('store_id', storeId);
  if (e2) {
    await supabase.from('products').update({ stock: retRow.stock })
      .eq('id', returnedProductId).eq('store_id', storeId);
    throw new Error(`فشل تحديث مخزون البديل: ${e2.message}`);
  }

  const payload: ExchangeData = {
    rName: params.returnedProductName, iName: params.issuedProductName,
    rQty: params.returnedQty,          iQty: params.issuedQty,
    priceDiff: params.priceDiff,
    ...(params.invoiceRef  ? { invRef:  params.invoiceRef  } : {}),
    ...(params.invoiceDate ? { invDate: params.invoiceDate } : {}),
    ...(params.note        ? { note:    params.note        } : {}),
  };

  const { data: logData, error: e3 } = await supabase
    .from('inventory_movements')
    .insert([{ store_id: storeId, product_id: returnedProductId,
               quantity_change: params.returnedQty,
               reason: `${EXCHANGE_PREFIX}${JSON.stringify(payload)}` }])
    .select().single();

  if (e3 || !logData) {
    await supabase.from('products').update({ stock: retRow.stock })
      .eq('id', returnedProductId).eq('store_id', storeId);
    await supabase.from('products').update({ stock: issRow.stock })
      .eq('id', issuedProductId).eq('store_id', storeId);
    throw new Error(`فشل تسجيل حركة الاستبدال: ${e3?.message ?? 'خطأ'}`);
  }

  return { returnedNewStock, issuedNewStock, movement: mapMovementRow(logData) };
}
