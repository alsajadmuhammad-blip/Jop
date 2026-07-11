"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes, Plus, ArrowLeftRight, History, AlertTriangle,
  PackageCheck, Search, Loader2, X, Wrench, ShoppingCart,
  ChevronRight, Receipt, TrendingDown, TrendingUp, Package,
  RotateCcw, ArrowUpDown, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product, Order, OrderItem } from "@/lib/types";
import {
  fetchInventoryMovements,
  recordInventoryMovement,
  recordExchangeMovement,
  INVENTORY_REASON_LABELS,
  EXCHANGE_PREFIX,
  classifyMovement,
  parseExchangeReason,
  type InventoryMovement,
  type InventoryReasonKind,
  type MovementKind,
  type ExchangeData,
} from "@/services/inventory";
import { fetchOrdersByStore } from "@/services/supabase-db";

// ─── ثوابت ────────────────────────────────────────────────────────

const DAMAGE_REASONS = [
  "عيب صناعي",
  "كسر / تلف مادي",
  "انتهاء صلاحية",
  "فقدان / سرقة",
  "أخرى",
];

type StockFilter = "all" | "low" | "out";
type StockSort   = "name" | "asc" | "desc";

const KIND_META: Record<MovementKind, { label: string; color: string; icon: typeof Plus }> = {
  restock:    { label: "إضافة مخزون", color: "text-emerald-600 bg-emerald-50 border-emerald-200",     icon: Plus },
  return:     { label: "إرجاع",       color: "text-blue-600 bg-blue-50 border-blue-200",              icon: PackageCheck },
  exchange:   { label: "استبدال",     color: "text-violet-600 bg-violet-50 border-violet-200",        icon: ArrowLeftRight },
  damage:     { label: "تلف / فقدان", color: "text-orange-600 bg-orange-50 border-orange-200",        icon: AlertTriangle },
  correction: { label: "تصحيح",       color: "text-slate-600 bg-slate-100 border-slate-200",          icon: Wrench },
  pos_sale:   { label: "بيع كاشير",   color: "text-sky-600 bg-sky-50 border-sky-200",                 icon: ShoppingCart },
  other:      { label: "أخرى",        color: "text-slate-500 bg-slate-50 border-slate-200",           icon: History },
};

const FILTER_TABS: { kind: MovementKind | "all"; label: string }[] = [
  { kind: "all",        label: "الكل" },
  { kind: "restock",    label: "إضافة" },
  { kind: "return",     label: "إرجاع" },
  { kind: "exchange",   label: "استبدال" },
  { kind: "damage",     label: "تلف" },
  { kind: "correction", label: "تصحيح" },
  { kind: "pos_sale",   label: "كاشير" },
];

// ─── مساعدات ──────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-IQ", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-IQ", { month: "short", day: "numeric" });
  } catch { return iso; }
}

// ─── بطاقة حركة مخزون عادية ──────────────────────────────────────

function MovementCard({
  movement, productName,
}: { movement: InventoryMovement; productName: string }) {
  const kind  = classifyMovement(movement.reason);
  const meta  = KIND_META[kind];
  const Icon  = meta.icon;
  const isPos = movement.quantityChange > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
      <div className={cn("shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center", meta.color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{productName}</p>
        <p className="text-[11px] text-slate-400 truncate">
          {movement.reason.startsWith("EXCHANGE::") ? "" : movement.reason}
          {" · "}
          {formatDate(movement.createdAt)}
        </p>
      </div>
      <span className={cn(
        "shrink-0 text-sm font-black tabular-nums",
        isPos ? "text-emerald-600" : "text-rose-600"
      )}>
        {isPos ? "+" : ""}{movement.quantityChange}
      </span>
    </div>
  );
}

// ─── بطاقة حركة الاستبدال المركّبة ───────────────────────────────

function ExchangeCard({ movement }: { movement: InventoryMovement }) {
  const ex = parseExchangeReason(movement.reason);
  if (!ex) return null;

  return (
    <div className="px-4 py-3 hover:bg-slate-50/60 transition-colors">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl border border-violet-200 bg-violet-50 flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">
              استبدال
            </span>
            {ex.invRef && (
              <span className="mr-1.5 text-[11px] text-slate-400">فاتورة: #{ex.invRef}</span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-400">{formatDate(movement.createdAt)}</span>
      </div>

      {/* تفاصيل المنتجين */}
      <div className="mr-10 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[9px] shrink-0">↩</span>
          <span className="text-slate-600">
            مُرجَع: <span className="font-semibold text-slate-800">{ex.rName}</span>
            <span className="text-slate-400 mr-1">({ex.rQty} وحدة)</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[9px] shrink-0">↪</span>
          <span className="text-slate-600">
            بديل: <span className="font-semibold text-slate-800">{ex.iName}</span>
            <span className="text-slate-400 mr-1">({ex.iQty} وحدة)</span>
          </span>
        </div>
        {/* فرق السعر */}
        {ex.priceDiff !== 0 && (
          <div className="flex items-center gap-1 text-[11px] mt-1">
            <span className="text-slate-400">فرق السعر:</span>
            <span className={cn("font-bold", ex.priceDiff > 0 ? "text-emerald-600" : "text-rose-600")}>
              {ex.priceDiff > 0 ? "+" : ""}{ex.priceDiff.toLocaleString("ar-IQ")} ر.س
            </span>
          </div>
        )}
        {ex.note && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{ex.note}</p>
        )}
      </div>
    </div>
  );
}

// ─── نافذة: اختيار منتج ──────────────────────────────────────────

function ProductPicker({
  products, selected, onSelect, onClear, placeholder = "ابحث عن منتج...",
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  onClear: () => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div>
          <p className="text-sm font-bold text-slate-800">{selected.name}</p>
          <p className="text-xs text-slate-400">المخزون الحالي: {selected.stock}</p>
        </div>
        <button onClick={() => { onClear(); setSearch(""); }}
          className="text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
        {filtered.length === 0
          ? <p className="text-xs text-slate-400 text-center py-5">لا توجد منتجات</p>
          : filtered.map((p) => (
              <button key={p.id} onClick={() => { onSelect(p); setSearch(""); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                <span className="text-xs text-slate-400 shrink-0">مخزون: {p.stock}</span>
              </button>
            ))
        }
      </div>
    </div>
  );
}

// ─── نموذج: حركة عادية (إضافة / إرجاع / تصحيح) ──────────────────

type StandardKind = Extract<InventoryReasonKind, "restock" | "return" | "correction">;

function StandardForm({
  kind, products, storeId, onDone, onClose,
}: {
  kind: StandardKind;
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], movement: InventoryMovement) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty]         = useState("1");
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const sign = kind === "correction" ? 1 : kind === "restock" ? 1 : 1; // all +1 for these kinds
  const label = INVENTORY_REASON_LABELS[kind];

  const handleSubmit = async () => {
    const qtyNum = Math.abs(Number(qty));
    if (!product)      { toast({ variant: "destructive", title: "اختر منتجاً" }); return; }
    if (!qtyNum || isNaN(qtyNum)) { toast({ variant: "destructive", title: "أدخل كمية صحيحة" }); return; }

    const reasonLabel = note.trim() ? `${label} — ${note.trim()}` : label;
    setSaving(true);
    try {
      const newStock = await recordInventoryMovement({
        storeId, productId: product.id,
        currentStock: product.stock,
        quantityChange: qtyNum * sign,
        reasonLabel,
      });
      onDone(
        [{ productId: product.id, newStock }],
        { id: `local-${Date.now()}`, storeId, productId: product.id,
          quantityChange: qtyNum * sign, reason: reasonLabel,
          createdAt: new Date().toISOString() }
      );
      toast({ title: "تم تسجيل الحركة", description: `${product.name}: مخزون جديد ${newStock}` });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: err?.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">المنتج</p>
        <ProductPicker products={products} selected={product}
          onSelect={setProduct} onClear={() => setProduct(null)} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">الكمية (ستُضاف)</p>
        <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
        <input value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="تفاصيل إضافية..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-xl font-bold py-5">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحركة"}
      </Button>
    </div>
  );
}

// ─── نموذج: التلف ─────────────────────────────────────────────────

function DamageForm({
  products, storeId, onDone, onClose,
}: {
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], movement: InventoryMovement) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [product,      setProduct]      = useState<Product | null>(null);
  const [qty,          setQty]          = useState("1");
  const [damageReason, setDamageReason] = useState(DAMAGE_REASONS[0]);
  const [note,         setNote]         = useState("");
  const [saving,       setSaving]       = useState(false);

  const handleSubmit = async () => {
    const qtyNum = Math.abs(Number(qty));
    if (!product)  { toast({ variant: "destructive", title: "اختر منتجاً" }); return; }
    if (!qtyNum || isNaN(qtyNum)) { toast({ variant: "destructive", title: "أدخل كمية صحيحة" }); return; }

    const reasonLabel = note.trim()
      ? `${INVENTORY_REASON_LABELS.damage} — ${damageReason} (${note.trim()})`
      : `${INVENTORY_REASON_LABELS.damage} — ${damageReason}`;

    setSaving(true);
    try {
      const newStock = await recordInventoryMovement({
        storeId, productId: product.id,
        currentStock: product.stock,
        quantityChange: -qtyNum,
        reasonLabel,
      });
      onDone(
        [{ productId: product.id, newStock }],
        { id: `local-${Date.now()}`, storeId, productId: product.id,
          quantityChange: -qtyNum, reason: reasonLabel,
          createdAt: new Date().toISOString() }
      );
      toast({ title: "تم تسجيل التلف", description: `${product.name}: مخزون جديد ${newStock}` });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: err?.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">المنتج التالف</p>
        <ProductPicker products={products} selected={product}
          onSelect={setProduct} onClear={() => setProduct(null)} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">الكمية التالفة</p>
        <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">سبب التلف</p>
        <div className="grid grid-cols-2 gap-1.5">
          {DAMAGE_REASONS.map((r) => (
            <button key={r} onClick={() => setDamageReason(r)}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold text-right transition-colors",
                damageReason === r
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
        <input value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="تفاصيل إضافية..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      <Button onClick={handleSubmit} disabled={saving}
        className="w-full rounded-xl font-bold py-5 bg-orange-500 hover:bg-orange-600">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تسجيل التلف"}
      </Button>
    </div>
  );
}

// ─── نموذج: الاستبدال (خطوتان) ───────────────────────────────────

type ExchangeStep = "order" | "details";

function ExchangeForm({
  products, storeId, onDone, onClose,
}: {
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], movement: InventoryMovement) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [step,        setStep]        = useState<ExchangeStep>("order");
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");

  const [selOrder,       setSelOrder]       = useState<Order | null>(null);
  const [selOrderItem,   setSelOrderItem]   = useState<OrderItem | null>(null);
  const [returnProduct,  setReturnProduct]  = useState<Product | null>(null);
  const [issuedProduct,  setIssuedProduct]  = useState<Product | null>(null);
  const [returnedQty,    setReturnedQty]    = useState("1");
  const [issuedQty,      setIssuedQty]      = useState("1");
  const [priceDiff,      setPriceDiff]      = useState("0");
  const [note,           setNote]           = useState("");
  const [saving,         setSaving]         = useState(false);

  // تحميل الطلبات عند فتح النموذج
  useEffect(() => {
    let active = true;
    (async () => {
      setOrdersLoading(true);
      const data = await fetchOrdersByStore(storeId, 80);
      if (active) { setOrders(data); setOrdersLoading(false); }
    })();
    return () => { active = false; };
  }, [storeId]);

  // حساب فرق السعر تلقائياً عند اختيار المنتجين
  useEffect(() => {
    if (returnProduct && issuedProduct) {
      const diff = (issuedProduct.price ?? 0) - (returnProduct.price ?? 0);
      setPriceDiff(String(Math.round(diff)));
    }
  }, [returnProduct, issuedProduct]);

  // اختيار منتج من بنود الطلب
  const handleOrderItemSelect = (item: OrderItem) => {
    setSelOrderItem(item);
    const found = products.find((p) => p.id === item.productId || p.name === item.productName);
    setReturnProduct(found ?? null);
    setReturnedQty(String(item.quantity));
  };

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const q = orderSearch.toLowerCase();
    return orders.filter((o) =>
      (o.customerName ?? "").toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.items.some((it) => it.productName.toLowerCase().includes(q))
    );
  }, [orders, orderSearch]);

  const handleSubmit = async () => {
    if (!returnProduct)  { toast({ variant: "destructive", title: "اختر المنتج المُرجَع" }); return; }
    if (!issuedProduct)  { toast({ variant: "destructive", title: "اختر المنتج البديل" }); return; }
    if (returnProduct.id === issuedProduct.id) {
      toast({ variant: "destructive", title: "يجب أن يكون المنتج البديل مختلفاً عن المُرجَع" }); return;
    }
    const rQty = Math.abs(Number(returnedQty));
    const iQty = Math.abs(Number(issuedQty));
    if (!rQty || !iQty) { toast({ variant: "destructive", title: "أدخل الكميات بشكل صحيح" }); return; }

    setSaving(true);
    try {
      const result = await recordExchangeMovement({
        storeId,
        returnedProductId:   returnProduct.id,
        returnedProductName: returnProduct.name,
        returnedQty: rQty,
        issuedProductId:     issuedProduct.id,
        issuedProductName:   issuedProduct.name,
        issuedQty: iQty,
        priceDiff: Number(priceDiff) || 0,
        invoiceRef:  selOrder ? selOrder.id.slice(-8).toUpperCase() : undefined,
        invoiceDate: selOrder ? selOrder.createdAt : undefined,
        note: note.trim() || undefined,
      });
      onDone(
        [
          { productId: returnProduct.id,  newStock: result.returnedNewStock },
          { productId: issuedProduct.id,  newStock: result.issuedNewStock   },
        ],
        result.movement
      );
      toast({
        title: "تم تسجيل الاستبدال",
        description: `${returnProduct.name} ←→ ${issuedProduct.name}`,
      });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل تسجيل الاستبدال", description: err?.message });
    } finally { setSaving(false); }
  };

  // ── الخطوة 1: اختيار الفاتورة ─────────────────────────────────
  if (step === "order") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          اختر الفاتورة الأصلية للاستبدال، أو اضغط "تخطي" لإدخال البيانات يدوياً.
        </p>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="ابحث باسم العميل أو المنتج..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">جاري تحميل الطلبات...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">لا توجد طلبات</p>
        ) : (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
            {filteredOrders.map((o) => (
              <button key={o.id} onClick={() => { setSelOrder(o); setStep("details"); }}
                className="w-full text-right px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {o.customerName || "عميل غير معرّف"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {o.items.map((it) => it.productName).slice(0, 2).join("، ")}
                      {o.items.length > 2 ? ` و${o.items.length - 2} أخرى` : ""}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-xs font-bold text-slate-700">#{o.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[11px] text-slate-400">{shortDate(o.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={() => setStep("details")}
          className="w-full rounded-xl font-bold py-4 gap-2">
          <ChevronRight className="w-4 h-4" />
          تخطي — إدخال يدوي
        </Button>
      </div>
    );
  }

  // ── الخطوة 2: تفاصيل الاستبدال ───────────────────────────────
  return (
    <div className="space-y-4">
      {/* شارة الفاتورة إن وُجدت */}
      {selOrder && (
        <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-bold text-violet-700">
              فاتورة #{selOrder.id.slice(-6).toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-400">{shortDate(selOrder.createdAt)}</span>
          </div>
          <button onClick={() => { setSelOrder(null); setSelOrderItem(null); setStep("order"); setReturnProduct(null); }}
            className="text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* بنود الفاتورة للاختيار منها */}
      {selOrder && !selOrderItem && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">اختر المنتج المُرجَع من الفاتورة</p>
          <div className="rounded-xl border border-slate-100 divide-y divide-slate-50">
            {selOrder.items.map((item, idx) => (
              <button key={idx} onClick={() => handleOrderItemSelect(item)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-800 truncate">{item.productName}</span>
                <span className="text-xs text-slate-400 shrink-0">{item.quantity} وحدة</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* المنتج المُرجَع */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">
          <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black text-center leading-4 ml-1">↩</span>
          المنتج المُرجَع
        </p>
        <ProductPicker products={products} selected={returnProduct}
          onSelect={setReturnProduct} onClear={() => { setReturnProduct(null); setSelOrderItem(null); }}
          placeholder="ابحث عن المنتج المُرجَع..." />
        {returnProduct && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-500">الكمية:</span>
            <input type="number" min={1} value={returnedQty}
              onChange={(e) => setReturnedQty(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-center outline-none focus:border-primary" />
          </div>
        )}
      </div>

      {/* المنتج البديل */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">
          <span className="inline-block w-4 h-4 rounded-full bg-sky-100 text-sky-700 text-[9px] font-black text-center leading-4 ml-1">↪</span>
          المنتج البديل
        </p>
        <ProductPicker
          products={products.filter((p) => p.id !== returnProduct?.id)}
          selected={issuedProduct}
          onSelect={setIssuedProduct} onClear={() => setIssuedProduct(null)}
          placeholder="ابحث عن المنتج البديل..." />
        {issuedProduct && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-500">الكمية:</span>
            <input type="number" min={1} value={issuedQty}
              onChange={(e) => setIssuedQty(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-center outline-none focus:border-primary" />
          </div>
        )}
      </div>

      {/* فرق السعر */}
      {returnProduct && issuedProduct && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">فرق السعر (موجب = العميل يدفع إضافياً)</p>
          <div className="flex items-center gap-2">
            <input type="number" value={priceDiff} onChange={(e) => setPriceDiff(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
            <span className="text-xs text-slate-400 shrink-0">ر.س</span>
          </div>
          {returnProduct.price != null && issuedProduct.price != null && (
            <p className="text-[11px] text-slate-400 mt-1">
              {returnProduct.name}: {returnProduct.price} ← {issuedProduct.name}: {issuedProduct.price}
            </p>
          )}
        </div>
      )}

      {/* ملاحظة */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
        <input value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="سبب الاستبدال، ملاحظات..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("order")}
          className="rounded-xl px-4 py-5">
          رجوع
        </Button>
        <Button onClick={handleSubmit} disabled={saving}
          className="flex-1 rounded-xl font-bold py-5 bg-violet-600 hover:bg-violet-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الاستبدال"}
        </Button>
      </div>
    </div>
  );
}

// ─── نافذة الحركة الرئيسية ────────────────────────────────────────

type ActiveKind = InventoryReasonKind;

const KIND_BUTTONS: { kind: ActiveKind; label: string; color: string; icon: typeof Plus }[] = [
  { kind: "restock",    label: "إضافة",   color: "border-emerald-300 bg-emerald-50 text-emerald-700", icon: Plus },
  { kind: "return",     label: "إرجاع",   color: "border-blue-300 bg-blue-50 text-blue-700",          icon: PackageCheck },
  { kind: "exchange",   label: "استبدال", color: "border-violet-300 bg-violet-50 text-violet-700",    icon: ArrowLeftRight },
  { kind: "damage",     label: "تلف",     color: "border-orange-300 bg-orange-50 text-orange-700",    icon: AlertTriangle },
  { kind: "correction", label: "تصحيح",   color: "border-slate-300 bg-slate-100 text-slate-700",      icon: Wrench },
];

function MovementDialog({
  open, onOpenChange, products, storeId, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], movement: InventoryMovement) => void;
}) {
  const [kind, setKind] = useState<ActiveKind>("restock");

  useEffect(() => { if (open) setKind("restock"); }, [open]);

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تسجيل حركة مخزون</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-right">
          {/* اختيار نوع الحركة */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">نوع الحركة</p>
            <div className="grid grid-cols-5 gap-1.5">
              {KIND_BUTTONS.map((b) => {
                const Icon = b.icon;
                return (
                  <button key={b.kind} onClick={() => setKind(b.kind)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-bold transition-all",
                      kind === b.kind ? b.color : "border-slate-200 text-slate-400 hover:bg-slate-50"
                    )}>
                    <Icon className="w-3.5 h-3.5" />
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* النموذج المناسب */}
          {kind === "exchange" ? (
            <ExchangeForm products={products} storeId={storeId} onDone={onDone} onClose={handleClose} />
          ) : kind === "damage" ? (
            <DamageForm products={products} storeId={storeId} onDone={onDone} onClose={handleClose} />
          ) : (
            <StandardForm kind={kind as StandardKind} products={products}
              storeId={storeId} onDone={onDone} onClose={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── التبويب الرئيسي ──────────────────────────────────────────────

interface InventoryTabProps {
  storeId:    string;
  products:   Product[];
  onStockUpdate: (productId: string, newStock: number) => void;
  /** حركات جديدة من الكاشير — تُدمج فوراً بدون انتظار re-fetch */
  incomingMovements?: InventoryMovement[];
}

export function InventoryTab({
  storeId, products, onStockUpdate, incomingMovements,
}: InventoryTabProps) {
  const [movements,     setMovements]     = useState<InventoryMovement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [kindFilter,    setKindFilter]    = useState<MovementKind | "all">("all");
  const [movSearch,     setMovSearch]     = useState("");
  const [stockFilter,   setStockFilter]   = useState<StockFilter>("all");
  const [stockSort,     setStockSort]     = useState<StockSort>("name");
  const [stockSearch,   setStockSearch]   = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const data = await fetchInventoryMovements(storeId);
      if (active) { setMovements(data); setLoading(false); }
    })();
    return () => { active = false; };
  }, [storeId]);

  /* دمج حركات الكاشير الواردة فوراً */
  useEffect(() => {
    if (!incomingMovements?.length) return;
    setMovements((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const fresh = incomingMovements.filter((m) => !ids.has(m.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [incomingMovements]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  // ── إحصائيات ──────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    products.length,
    units:    products.reduce((s, p) => s + p.stock, 0),
    low:      products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5)).length,
    out:      products.filter((p) => p.stock === 0).length,
    todayMov: movements.filter((m) => {
      const d = new Date(m.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    }).length,
  }), [products, movements]);

  // ── مستويات المخزون (مرتّبة ومفلترة) ─────────────────────────
  const filteredStock = useMemo(() => {
    let list = [...products];
    if (stockSearch.trim()) {
      const q = stockSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (stockFilter === "low") list = list.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5));
    if (stockFilter === "out") list = list.filter((p) => p.stock === 0);
    if (stockSort === "asc")  list.sort((a, b) => a.stock - b.stock);
    if (stockSort === "desc") list.sort((a, b) => b.stock - a.stock);
    if (stockSort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    return list;
  }, [products, stockSearch, stockFilter, stockSort]);

  // ── سجل الحركات (مرتّب ومفلتر) ───────────────────────────────
  const filteredMovements = useMemo(() => {
    let list = movements;
    if (kindFilter !== "all")
      list = list.filter((m) => classifyMovement(m.reason) === kindFilter);
    if (movSearch.trim()) {
      const q = movSearch.toLowerCase();
      list = list.filter((m) => {
        const name = productMap.get(m.productId)?.name ?? "";
        const ex   = parseExchangeReason(m.reason);
        return name.toLowerCase().includes(q) ||
               (ex ? (ex.rName + ex.iName).toLowerCase().includes(q) : m.reason.toLowerCase().includes(q));
      });
    }
    return list;
  }, [movements, kindFilter, movSearch, productMap]);

  const handleMovementDone = useCallback((
    updates: { productId: string; newStock: number }[],
    movement: InventoryMovement
  ) => {
    updates.forEach(({ productId, newStock }) => onStockUpdate(productId, newStock));
    setMovements((prev) => [movement, ...prev]);
  }, [onStockUpdate]);

  return (
    <div className="space-y-5">

      {/* ── رأس الصفحة ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-slate-900">إدارة المخزون</h2>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="rounded-xl gap-1.5 font-bold">
          <Plus className="w-4 h-4" />
          تسجيل حركة
        </Button>
      </div>

      {/* ── بطاقات الإحصائيات ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: Package,      label: "المنتجات",    value: stats.total,    color: "text-slate-700 bg-slate-50 border-slate-200" },
          { icon: TrendingUp,   label: "إجمالي الوحدات", value: stats.units, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          { icon: TrendingDown, label: "مخزون منخفض",  value: stats.low,    color: "text-amber-700 bg-amber-50 border-amber-200" },
          { icon: AlertTriangle,label: "نافد المخزون", value: stats.out,     color: "text-rose-700 bg-rose-50 border-rose-200" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn("rounded-2xl border p-3.5 flex items-center gap-3", s.color)}>
              <Icon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-lg font-black tabular-nums leading-none">{s.value}</p>
                <p className="text-[11px] font-medium opacity-70 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── مستويات المخزون ── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">مستويات المخزون</p>
            {/* فلتر الحالة */}
            <div className="flex gap-1">
              {(["all", "low", "out"] as StockFilter[]).map((f) => (
                <button key={f} onClick={() => setStockFilter(f)}
                  className={cn("rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors",
                    stockFilter === f ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100")}>
                  {f === "all" ? "الكل" : f === "low" ? "منخفض" : "نافد"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {/* بحث */}
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)}
                placeholder="بحث..." className="w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-2 py-1.5 text-xs outline-none focus:border-primary focus:bg-white" />
            </div>
            {/* ترتيب */}
            <div className="flex gap-1">
              {([["name", "اسم"], ["asc", "↑"], ["desc", "↓"]] as [StockSort, string][]).map(([s, lbl]) => (
                <button key={s} onClick={() => setStockSort(s)}
                  className={cn("rounded-lg px-2 py-1.5 text-[11px] font-bold border transition-colors",
                    stockSort === s ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-400 hover:bg-slate-50")}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
          {filteredStock.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">لا توجد منتجات</p>
          ) : filteredStock.map((p) => {
            const low = p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5);
            const out = p.stock === 0;
            return (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {out  && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-full px-1.5 py-0.5">نافد</span>}
                  {low  && !out && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">منخفض</span>}
                  <span className={cn("text-sm font-black tabular-nums rounded-full px-2 py-0.5",
                    out ? "bg-rose-100 text-rose-700" : low ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                    {p.stock}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── سجل الحركات ── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-800">سجل الحركات</p>
            {movements.length > 0 && (
              <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                {movements.length}
              </span>
            )}
          </div>

          {/* فلاتر نوع الحركة */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map((t) => (
              <button key={t.kind} onClick={() => setKindFilter(t.kind)}
                className={cn("rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap",
                  kindFilter === t.kind ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100")}>
                {t.label}
              </button>
            ))}
          </div>

          {/* بحث بالمنتج */}
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={movSearch} onChange={(e) => setMovSearch(e.target.value)}
              placeholder="بحث باسم المنتج..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-2 py-1.5 text-xs outline-none focus:border-primary focus:bg-white" />
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            {movements.length === 0 ? "لا توجد حركات مخزون مسجّلة بعد" : "لا توجد حركات تطابق الفلتر المحدد"}
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
            {filteredMovements.map((m) => {
              const isExchange = m.reason.startsWith(EXCHANGE_PREFIX);
              const productName = productMap.get(m.productId)?.name ?? "منتج محذوف";
              return isExchange
                ? <ExchangeCard key={m.id} movement={m} />
                : <MovementCard key={m.id} movement={m} productName={productName} />;
            })}
          </div>
        )}
      </div>

      <MovementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        storeId={storeId}
        onDone={handleMovementDone}
      />
    </div>
  );
}
