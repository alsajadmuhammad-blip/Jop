/**
 * Discount Codes Service
 * Manages coupon codes for store owners
 */

import { supabase } from './supabase';

export type DiscountCode = {
  id: string;
  storeId: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;   // null = unlimited
  usedCount: number;
  expiresAt: string | null; // null = no expiry
  isActive: boolean;
  createdAt: string;
};

function mapRow(row: any): DiscountCode {
  return {
    id: row.id,
    storeId: row.store_id,
    code: row.code,
    discountPercent: Number(row.discount_percent),
    maxUses: row.max_uses ?? null,
    usedCount: Number(row.used_count ?? 0),
    expiresAt: row.expires_at ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** جلب كل الكودات لمتجر (داشبورد المالك) */
export async function fetchDiscountCodesByStore(storeId: string): Promise<DiscountCode[]> {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchDiscountCodesByStore:', error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** التحقق من صلاحية الكود عند إتمام الطلب */
export async function validateDiscountCode(
  storeId: string,
  code: string
): Promise<{ valid: boolean; discountCode?: DiscountCode; error?: string }> {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('store_id', storeId)
    .ilike('code', code.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: 'الكود غير صحيح أو غير موجود' };
  }

  const dc = mapRow(data);

  if (dc.expiresAt && new Date(dc.expiresAt) < new Date()) {
    return { valid: false, error: 'انتهت صلاحية هذا الكود' };
  }

  if (dc.maxUses !== null && dc.usedCount >= dc.maxUses) {
    return { valid: false, error: 'وصل الكود إلى الحد الأقصى من الاستخدامات' };
  }

  return { valid: true, discountCode: dc };
}

/** زيادة عداد الاستخدام بعد تأكيد الطلب */
export async function incrementDiscountUsage(code: DiscountCode): Promise<void> {
  await supabase
    .from('discount_codes')
    .update({ used_count: code.usedCount + 1 })
    .eq('id', code.id);
}

/** إنشاء كود خصم جديد */
export async function createDiscountCode(params: {
  storeId: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  expiresAt: string | null;
}): Promise<DiscountCode | null> {
  const { data, error } = await supabase
    .from('discount_codes')
    .insert({
      store_id: params.storeId,
      code: params.code.toUpperCase().trim(),
      discount_percent: params.discountPercent,
      max_uses: params.maxUses,
      expires_at: params.expiresAt,
      is_active: true,
      used_count: 0,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('هذا الكود موجود مسبقاً في متجرك');
    throw new Error(`فشل إنشاء الكود: ${error.message}`);
  }
  return data ? mapRow(data) : null;
}

/** تفعيل/تعطيل كود */
export async function toggleDiscountCode(codeId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('discount_codes')
    .update({ is_active: isActive })
    .eq('id', codeId);

  if (error) { console.error('toggleDiscountCode:', error.message); return false; }
  return true;
}

/** حذف كود */
export async function deleteDiscountCode(codeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', codeId);

  if (error) { console.error('deleteDiscountCode:', error.message); return false; }
  return true;
}
