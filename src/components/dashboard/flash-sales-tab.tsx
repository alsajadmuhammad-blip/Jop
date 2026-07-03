"use client";

import { useState, useEffect, useMemo } from "react";
import { Zap, Plus, StopCircle, Clock, Tag, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCountdown } from "@/hooks/use-countdown";
import type { Product } from "@/lib/types";
import {
  fetchAllFlashSalesByStore,
  createFlashSale,
  deactivateFlashSale,
  type FlashSale,
} from "@/services/flash-sales";

// ── Countdown badge (live) ─────────────────────────────────
function CountdownBadge({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400">
        انتهى
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700 tabular-nums">
      <Clock className="h-3 w-3" />
      {formatted}
    </span>
  );
}

// ── Single flash sale card ──────────────────────────────────
function FlashSaleCard({
  sale,
  productName,
  originalPrice,
  onStop,
}: {
  sale: FlashSale;
  productName: string;
  originalPrice: number;
  onStop: (id: string) => void;
}) {
  const { isExpired } = useCountdown(sale.endsAt);
  const saving = Math.round(((originalPrice - sale.flashPrice) / originalPrice) * 100);

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-opacity ${isExpired ? "opacity-50" : "border-amber-200 bg-amber-50/40"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{productName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-400 line-through">{originalPrice.toLocaleString()} د.ع</span>
            <span className="text-sm font-extrabold text-amber-600">{sale.flashPrice.toLocaleString()} د.ع</span>
            {saving > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">-{saving}%</span>
            )}
          </div>
        </div>
        <CountdownBadge endsAt={sale.endsAt} />
      </div>

      {!isExpired && (
        <Button
          variant="outline"
          size="sm"
          className="self-start rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5 text-xs font-semibold"
          onClick={() => onStop(sale.id)}
        >
          <StopCircle className="h-3.5 w-3.5" />
          إيقاف العرض
        </Button>
      )}
    </div>
  );
}

// ── Create form ─────────────────────────────────────────────
function CreateFlashSaleForm({
  products,
  storeId,
  onCreated,
}: {
  products: Product[];
  storeId: string;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [flashPrice, setFlashPrice] = useState("");
  const [durationHours, setDurationHours] = useState("4");
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async () => {
    if (!productId) { toast({ variant: "destructive", title: "اختر منتجاً" }); return; }
    const price = Number(flashPrice);
    if (!price || price <= 0) { toast({ variant: "destructive", title: "أدخل سعر العرض" }); return; }
    if (selectedProduct && price >= selectedProduct.price) {
      toast({ variant: "destructive", title: "سعر العرض يجب أن يكون أقل من السعر الأصلي" });
      return;
    }
    setSaving(true);
    try {
      await createFlashSale(storeId, productId, price, Number(durationHours));
      toast({ title: "تم إطلاق العرض! 🔥", description: "سيظهر العرض للزبائن فوراً مع عداد تنازلي." });
      setProductId(""); setFlashPrice(""); setDurationHours("4");
      onCreated();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-slate-800">عرض فلاش جديد</span>
      </div>

      {/* Product selector */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">المنتج</label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger className="h-10 rounded-lg text-sm bg-white">
            <SelectValue placeholder="اختر منتجاً من متجرك…" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {p.price.toLocaleString()} د.ع
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Flash price */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          سعر العرض
          {selectedProduct && (
            <span className="mr-2 font-normal text-slate-400">
              (الأصلي: {selectedProduct.price.toLocaleString()} د.ع)
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            value={flashPrice}
            onChange={(e) => setFlashPrice(e.target.value)}
            placeholder="مثال: 15000"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pl-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            dir="ltr"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
            د.ع
          </span>
        </div>
        {selectedProduct && flashPrice && Number(flashPrice) > 0 && Number(flashPrice) < selectedProduct.price && (
          <p className="text-xs text-emerald-600 font-semibold">
            خصم {Math.round(((selectedProduct.price - Number(flashPrice)) / selectedProduct.price) * 100)}% عن السعر الأصلي
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">مدة العرض</label>
        <Select value={durationHours} onValueChange={setDurationHours}>
          <SelectTrigger className="h-10 rounded-lg text-sm bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">ساعة واحدة</SelectItem>
            <SelectItem value="2">ساعتان</SelectItem>
            <SelectItem value="4">4 ساعات</SelectItem>
            <SelectItem value="8">8 ساعات</SelectItem>
            <SelectItem value="12">12 ساعة</SelectItem>
            <SelectItem value="24">24 ساعة (يوم كامل)</SelectItem>
            <SelectItem value="48">48 ساعة (يومان)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-lg gap-2 font-bold"
      >
        <Zap className="h-4 w-4" />
        {saving ? "جاري الإطلاق…" : "إطلاق العرض 🔥"}
      </Button>
    </div>
  );
}

// ── Main tab ────────────────────────────────────────────────
export function FlashSalesTab({
  storeId,
  products,
}: {
  storeId: string;
  products: Product[];
}) {
  const { toast } = useToast();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchAllFlashSalesByStore(storeId);
    setFlashSales(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [storeId]);

  const handleStop = async (id: string) => {
    const ok = await deactivateFlashSale(id);
    if (ok) {
      toast({ title: "تم إيقاف العرض" });
      load();
    }
  };

  // product map for name + price lookup
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const active = flashSales.filter(
    (s) => s.isActive && new Date(s.endsAt) > new Date()
  );
  const past = flashSales.filter(
    (s) => !s.isActive || new Date(s.endsAt) <= new Date()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              عروض الفلاش
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد منتجاً بسعر خاص ومدة محدودة — يظهر للزبون مع عداد تنازلي حي
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg gap-1.5 font-semibold"
            variant={showForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4" />
            {showForm ? "إلغاء" : "عرض جديد"}
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Form */}
          {showForm && (
            <CreateFlashSaleForm
              products={products}
              storeId={storeId}
              onCreated={() => { setShowForm(false); load(); }}
            />
          )}

          {/* Active sales */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : active.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                نشطة الآن ({active.length})
              </p>
              {active.map((sale) => {
                const product = productMap.get(sale.productId);
                return (
                  <FlashSaleCard
                    key={sale.id}
                    sale={sale}
                    productName={product?.name ?? "منتج محذوف"}
                    originalPrice={product?.price ?? 0}
                    onStop={handleStop}
                  />
                );
              })}
            </div>
          ) : !showForm ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 mb-3">
                <Zap className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-slate-700">لا توجد عروض نشطة</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">أطلق عرضاً الآن وارفع مبيعاتك</p>
              <Button size="sm" onClick={() => setShowForm(true)} className="rounded-lg gap-1.5 font-semibold">
                <Zap className="h-4 w-4" />
                إطلاق أول عرض
              </Button>
            </div>
          ) : null}

          {/* Past sales */}
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                منتهية ({past.length})
              </p>
              {past.slice(0, 5).map((sale) => {
                const product = productMap.get(sale.productId);
                return (
                  <FlashSaleCard
                    key={sale.id}
                    sale={sale}
                    productName={product?.name ?? "منتج محذوف"}
                    originalPrice={product?.price ?? 0}
                    onStop={handleStop}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
