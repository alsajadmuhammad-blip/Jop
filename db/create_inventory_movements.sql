-- ============================================================
-- سكربت إنشاء نظام إدارة المخزون (سجل حركات المخزون)
-- نفّذه في Supabase SQL Editor مرة واحدة — آمن للتنفيذ عدة مرات (IF NOT EXISTS)
-- ============================================================

-- 1) عمود حد التنبيه لانخفاض المخزون على جدول المنتجات (لو غير موجود أصلاً)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- 2) قيد فريد على (id, store_id) في المنتجات لضمان تطابق المنتج مع متجره
--    عند الإحالة من inventory_movements (يمنع تسجيل حركة لمنتج لا ينتمي للمتجر المحدد)
--    (Postgres لا يدعم ADD CONSTRAINT IF NOT EXISTS مباشرة، لذلك نتحقق أولاً)
DO $BODY$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_id_store_id_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_id_store_id_unique UNIQUE (id, store_id);
  END IF;
END
$BODY$;

-- 3) جدول حركات المخزون (إضافة / إرجاع / استبدال / تلف / تصحيح)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL,
  quantity_change  integer NOT NULL,          -- موجب = زيادة، سالب = نقصان
  reason           text NOT NULL,             -- وصف الحركة (إضافة مخزون / إرجاع من عميل / استبدال ...)
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- قيد مركّب يضمن أن المنتج ينتمي فعلاً لهذا المتجر (لا يمكن تسجيل حركة لمنتج من متجر آخر)
  CONSTRAINT inventory_movements_product_store_fk
    FOREIGN KEY (product_id, store_id) REFERENCES products (id, store_id) ON DELETE CASCADE
);

-- فهارس لتسريع الاستعلامات المتكررة (سجل الحركات لكل متجر / لكل منتج)
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_id
  ON inventory_movements (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id
  ON inventory_movements (product_id, created_at DESC);

-- 4) تفعيل RLS وربط الصلاحيات بحسب ملكية المتجر
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- ملاحظة مهمة: جدول stores في هذه القاعدة يحتوي عمودين لمالك المتجر
-- (owner_id بصيغة snake_case و "ownerId" بصيغة camelCase) والعمود المعبّى فعلياً
-- حالياً هو "ownerId" فقط (owner_id = NULL لكل المتاجر). لذلك السياسة تتحقق من كليهما
-- لتعمل بشكل صحيح بغض النظر عن أي عمود مُعبّى.

-- صاحب المتجر يقرأ حركات متجره فقط
DROP POLICY IF EXISTS "store owners read own inventory movements" ON inventory_movements;
CREATE POLICY "store owners read own inventory movements"
  ON inventory_movements FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid() OR "ownerId" = auth.uid()
    )
  );

-- صاحب المتجر يضيف حركات لمتجره فقط
DROP POLICY IF EXISTS "store owners insert own inventory movements" ON inventory_movements;
CREATE POLICY "store owners insert own inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid() OR "ownerId" = auth.uid()
    )
  );

-- ملاحظة: إذا كان لديك دور "admin" يحتاج صلاحية شاملة، أضف سياسة مشابهة
-- تتحقق من role المستخدم في جدول users بدلاً من owner_id.
