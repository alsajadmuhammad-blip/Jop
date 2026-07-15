"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes, Plus, ArrowLeftRight, History, AlertTriangle,
  PackageCheck, Search, Loader2, X, Wrench, ShoppingCart,
  ChevronRight, Receipt, TrendingDown, TrendingUp, Package,
  ChevronLeft, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const MOVEMENT_KIND_OPTIONS: { value: MovementKind | "all"; label: string }[] = [
  { value: "all",        label: "جميع الحركات" },
  { value: "restock",    label: "إضافة مخزون" },
  { value: "return",     label: "إرجاع من عميل" },
  { value: "exchange",   label: "استبدال" },
  { value: "damage",     label: "تلف / فقدان" },
  { value: "correction", label: "تصحيح يدوي" },
  { value: "pos_sale",   label: "بيع كاشير" },
];

const KIND_META: Record<MovementKind, { label: string; dot: string; icon: typeof Plus }> = {
  restock:    { label: "إضافة مخزون", dot: "bg-emerald-500", icon: Plus },
  return:     { label: "إرجاع",       dot: "bg-blue-500",    icon: PackageCheck },
  exchange:   { label: "استبدال",     dot: "bg-violet-500",  icon: ArrowLeftRight },
  damage:     { label: "تلف",         dot: "bg-orange-500",  icon: AlertTriangle },
  correction: { label: "تصحيح",       dot: "bg-slate-400",   icon: Wrench },
  pos_sale:   { label: "كاشير",       dot: "bg-sky-500",     icon: ShoppingCart },
  other:      { label: "أخرى",        dot: "bg-slate-300",   icon: History },
};

const PAGE_SIZE = 25;

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

function splitReasonLabel(reason: string) {
  const clean = reason.trim();
  if (!clean) return { title: "إجراء غير محدد", detail: "" };

  const separatorIndex = clean.indexOf(" — ");
  if (separatorIndex > -1) {
    return {
      title: clean.slice(0, separatorIndex).trim(),
      detail: clean.slice(separatorIndex + 3).trim(),
    };
  }

  const firstParen = clean.indexOf("(");
  const lastParen = clean.lastIndexOf(")");
  if (firstParen > -1 && lastParen > firstParen) {
    return {
      title: clean.slice(0, firstParen).trim(),
      detail: clean.slice(firstParen + 1, lastParen).trim(),
    };
  }

  return { title: clean, detail: "" };
}

// ─── صف حركة عادية ───────────────────────────────────────────────

function MovementRow({ movement, productName }: { movement: InventoryMovement; productName: string }) {
  const kind  = classifyMovement(movement.reason);
  const meta  = KIND_META[kind];
  const Icon  = meta.icon;
  const isPositive = movement.quantityChange > 0;
  const label = movement.reason.startsWith(EXCHANGE_PREFIX) ? meta.label : movement.reason;
  const { title, detail } = splitReasonLabel(label);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", isPositive ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-rose-200 bg-rose-50 text-rose-600")}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-foreground">{productName}</p>
            <span className="rounded-full border border-border/70 bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {meta.label}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
          {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(movement.createdAt)}</p>
        </div>
        <div className={cn("min-w-[74px] rounded-xl border px-2.5 py-2 text-center", isPositive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>
          <p className="text-[10px] font-semibold">التغيير</p>
          <p className="text-base font-black tabular-nums">{isPositive ? "+" : ""}{movement.quantityChange}</p>
        </div>
      </div>
    </div>
  );
}

// ─── صف حركة الاستبدال ───────────────────────────────────────────

function ExchangeRow({ movement }: { movement: InventoryMovement }) {
  const ex = parseExchangeReason(movement.reason);
  if (!ex) return null;
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white">استبدال</span>
          {ex.invRef && <span className="text-[11px] text-violet-700">فاتورة #{ex.invRef}</span>}
        </div>
        <span className="text-[11px] text-muted-foreground">{formatDate(movement.createdAt)}</span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5">
          <p className="text-[10px] font-semibold text-emerald-700">المُرجَع</p>
          <p className="mt-1 text-sm font-bold text-emerald-800">{ex.rName}</p>
          <p className="text-xs text-emerald-700">الكمية: {ex.rQty}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-2.5">
          <p className="text-[10px] font-semibold text-sky-700">البديل</p>
          <p className="mt-1 text-sm font-bold text-sky-800">{ex.iName}</p>
          <p className="text-xs text-sky-700">الكمية: {ex.iQty}</p>
        </div>
      </div>

      {(ex.priceDiff !== 0 || ex.note) && (
        <div className="mt-2 rounded-xl border border-border/70 bg-background/70 p-2.5">
          {ex.priceDiff !== 0 && (
            <p className={cn("text-[11px] font-semibold", ex.priceDiff > 0 ? "text-emerald-700" : "text-rose-600")}>
              فرق السعر: {ex.priceDiff > 0 ? "+" : ""}{ex.priceDiff} ر.س
            </p>
          )}
          {ex.note && <p className="mt-1 text-xs text-muted-foreground">{ex.note}</p>}
        </div>
      )}
    </div>
  );
}

function DropdownSelect<T extends string>({
  value, onChange, options, className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-sm transition-colors whitespace-nowrap min-w-0",
          open ? "border-primary text-primary" : "border-slate-200 text-slate-700 hover:border-slate-300"
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-full w-max rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                "w-full text-right px-4 py-2.5 text-sm transition-colors",
                o.value === value
                  ? "bg-primary/5 text-primary font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── اختيار منتج (مكوّن مشترك) ───────────────────────────────────

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
        <button onClick={() => { onClear(); setSearch(""); }} className="text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      {search.trim() && (
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-50">
          {filtered.length === 0
            ? <p className="text-xs text-slate-400 text-center py-4">لا توجد نتائج</p>
            : filtered.slice(0, 6).map((p) => (
                <button key={p.id} onClick={() => { onSelect(p); setSearch(""); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">مخزون: {p.stock}</span>
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ─── نموذج: إضافة / إرجاع / تصحيح ───────────────────────────────

function StandardForm({
  kind, products, storeId, onDone, onClose,
}: {
  kind: Extract<InventoryReasonKind, "restock" | "return" | "correction">;
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], m: InventoryMovement) => void;
  onClose: () => void;
}) {
  const { toast }             = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty]         = useState("1");
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    const q = Math.abs(Number(qty));
    if (!product)        { toast({ variant: "destructive", title: "اختر منتجاً" }); return; }
    if (!q || isNaN(q))  { toast({ variant: "destructive", title: "أدخل كمية صحيحة" }); return; }
    const label = note.trim() ? `${INVENTORY_REASON_LABELS[kind]} — ${note.trim()}` : INVENTORY_REASON_LABELS[kind];
    setSaving(true);
    try {
      const newStock = await recordInventoryMovement({ storeId, productId: product.id, currentStock: product.stock, quantityChange: q, reasonLabel: label });
      onDone([{ productId: product.id, newStock }], { id: `local-${Date.now()}`, storeId, productId: product.id, quantityChange: q, reason: label, createdAt: new Date().toISOString() });
      toast({ title: "تم تسجيل الحركة", description: `${product.name} → مخزون جديد: ${newStock}` });
      onClose();
    } catch (err: any) { toast({ variant: "destructive", title: "فشل التسجيل", description: err?.message }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">المنتج</p>
        <ProductPicker products={products} selected={product} onSelect={setProduct} onClear={() => setProduct(null)} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">الكمية</p>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-center outline-none focus:border-primary focus:bg-white" />
        </div>
        <div className="flex-[2]">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="تفاصيل..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-xl font-bold py-5">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد"}
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
  onDone: (updates: { productId: string; newStock: number }[], m: InventoryMovement) => void;
  onClose: () => void;
}) {
  const { toast }                     = useToast();
  const [product, setProduct]         = useState<Product | null>(null);
  const [qty, setQty]                 = useState("1");
  const [damageReason, setDamageReason] = useState(DAMAGE_REASONS[0]);
  const [note, setNote]               = useState("");
  const [saving, setSaving]           = useState(false);

  const handleSubmit = async () => {
    const q = Math.abs(Number(qty));
    if (!product)        { toast({ variant: "destructive", title: "اختر منتجاً" }); return; }
    if (!q || isNaN(q))  { toast({ variant: "destructive", title: "أدخل كمية صحيحة" }); return; }
    const label = note.trim()
      ? `${INVENTORY_REASON_LABELS.damage} — ${damageReason} (${note.trim()})`
      : `${INVENTORY_REASON_LABELS.damage} — ${damageReason}`;
    setSaving(true);
    try {
      const newStock = await recordInventoryMovement({ storeId, productId: product.id, currentStock: product.stock, quantityChange: -q, reasonLabel: label });
      onDone([{ productId: product.id, newStock }], { id: `local-${Date.now()}`, storeId, productId: product.id, quantityChange: -q, reason: label, createdAt: new Date().toISOString() });
      toast({ title: "تم تسجيل التلف", description: `${product.name} → مخزون جديد: ${newStock}` });
      onClose();
    } catch (err: any) { toast({ variant: "destructive", title: "فشل التسجيل", description: err?.message }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">المنتج التالف</p>
        <ProductPicker products={products} selected={product} onSelect={setProduct} onClear={() => setProduct(null)} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">الكمية</p>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-center outline-none focus:border-primary focus:bg-white" />
        </div>
        <div className="flex-[2]">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">سبب التلف</p>
          <select value={damageReason} onChange={(e) => setDamageReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white">
            {DAMAGE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="تفاصيل إضافية..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
      </div>
      <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-xl font-bold py-5 bg-orange-500 hover:bg-orange-600">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تسجيل التلف"}
      </Button>
    </div>
  );
}

// ─── نموذج: الاستبدال ─────────────────────────────────────────────

function ExchangeForm({
  products, storeId, onDone, onClose,
}: {
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], m: InventoryMovement) => void;
  onClose: () => void;
}) {
  const { toast }                         = useToast();
  const [step, setStep]                   = useState<"order" | "details">("order");
  const [orders, setOrders]               = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch]     = useState("");
  const [selOrder, setSelOrder]           = useState<Order | null>(null);
  const [returnProduct, setReturnProduct] = useState<Product | null>(null);
  const [issuedProduct, setIssuedProduct] = useState<Product | null>(null);
  const [returnedQty, setReturnedQty]     = useState("1");
  const [issuedQty, setIssuedQty]         = useState("1");
  const [priceDiff, setPriceDiff]         = useState("0");
  const [note, setNote]                   = useState("");
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    let active = true;
    fetchOrdersByStore(storeId, 80).then((d) => { if (active) { setOrders(d); setOrdersLoading(false); } });
    return () => { active = false; };
  }, [storeId]);

  useEffect(() => {
    if (returnProduct && issuedProduct)
      setPriceDiff(String(Math.round((issuedProduct.price ?? 0) - (returnProduct.price ?? 0))));
  }, [returnProduct, issuedProduct]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const q = orderSearch.toLowerCase();
    return orders.filter((o) =>
      (o.customerName ?? "").toLowerCase().includes(q) ||
      o.items.some((it) => it.productName.toLowerCase().includes(q))
    );
  }, [orders, orderSearch]);

  const handleSubmit = async () => {
    if (!returnProduct) { toast({ variant: "destructive", title: "اختر المنتج المُرجَع" }); return; }
    if (!issuedProduct) { toast({ variant: "destructive", title: "اختر المنتج البديل"  }); return; }
    if (returnProduct.id === issuedProduct.id) { toast({ variant: "destructive", title: "المنتجان يجب أن يكونا مختلفَين" }); return; }
    const rQty = Math.abs(Number(returnedQty));
    const iQty = Math.abs(Number(issuedQty));
    if (!rQty || !iQty) { toast({ variant: "destructive", title: "أدخل الكميات" }); return; }
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
        invoiceDate: selOrder?.createdAt,
        note: note.trim() || undefined,
      });
      onDone(
        [{ productId: returnProduct.id, newStock: result.returnedNewStock },
         { productId: issuedProduct.id,  newStock: result.issuedNewStock  }],
        result.movement
      );
      toast({ title: "تم تسجيل الاستبدال", description: `${returnProduct.name} ←→ ${issuedProduct.name}` });
      onClose();
    } catch (err: any) { toast({ variant: "destructive", title: "فشل الاستبدال", description: err?.message }); }
    finally { setSaving(false); }
  };

  if (step === "order") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">اختر الفاتورة الأصلية أو اضغط «تخطي» للإدخال اليدوي.</p>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="ابحث باسم العميل أو المنتج..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
        </div>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {filteredOrders.slice(0, 8).map((o) => (
              <button key={o.id} onClick={() => { setSelOrder(o); setStep("details"); }}
                className="w-full text-right px-3 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{o.customerName || "عميل غير معرّف"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{o.items.slice(0, 2).map((it) => it.productName).join("، ")}{o.items.length > 2 ? ` +${o.items.length - 2}` : ""}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-xs font-bold text-slate-600">#{o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[11px] text-slate-400">{shortDate(o.createdAt)}</p>
                </div>
              </button>
            ))}
            {filteredOrders.length === 0 && <p className="text-xs text-slate-400 text-center py-5">لا توجد نتائج</p>}
          </div>
        )}
        <Button variant="outline" onClick={() => setStep("details")} className="w-full rounded-xl py-4 gap-2">
          <ChevronRight className="w-4 h-4" /> تخطي — إدخال يدوي
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selOrder && (
        <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-bold text-violet-700">فاتورة #{selOrder.id.slice(-6).toUpperCase()}</span>
            <span className="text-[11px] text-slate-400">{shortDate(selOrder.createdAt)}</span>
          </div>
          <button onClick={() => { setSelOrder(null); setStep("order"); setReturnProduct(null); }} className="text-slate-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {selOrder && !returnProduct && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">اختر المنتج المُرجَع</p>
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden">
            {selOrder.items.map((item, i) => (
              <button key={i} onClick={() => { const p = products.find((x) => x.id === item.productId || x.name === item.productName); setReturnProduct(p ?? null); setReturnedQty(String(item.quantity)); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-800 truncate">{item.productName}</span>
                <span className="text-xs text-slate-400 shrink-0">{item.quantity} وحدة</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">
          <span className="text-emerald-600 ml-1">↩</span>المنتج المُرجَع
        </p>
        <ProductPicker products={products} selected={returnProduct} onSelect={setReturnProduct}
          onClear={() => { setReturnProduct(null); }} placeholder="ابحث عن المنتج المُرجَع..." />
        {returnProduct && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-500">الكمية:</span>
            <input type="number" min={1} value={returnedQty} onChange={(e) => setReturnedQty(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-center outline-none focus:border-primary" />
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">
          <span className="text-sky-600 ml-1">↪</span>المنتج البديل
        </p>
        <ProductPicker products={products.filter((p) => p.id !== returnProduct?.id)} selected={issuedProduct}
          onSelect={setIssuedProduct} onClear={() => setIssuedProduct(null)} placeholder="ابحث عن المنتج البديل..." />
        {issuedProduct && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-500">الكمية:</span>
            <input type="number" min={1} value={issuedQty} onChange={(e) => setIssuedQty(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-center outline-none focus:border-primary" />
          </div>
        )}
      </div>

      {returnProduct && issuedProduct && (
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">فرق السعر (ر.س)</p>
            <input type="number" value={priceDiff} onChange={(e) => setPriceDiff(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
          </div>
          <div className="flex-[2]">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب الاستبدال..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("order")} className="rounded-xl px-4 py-5">رجوع</Button>
        <Button onClick={handleSubmit} disabled={saving} className="flex-1 rounded-xl font-bold py-5 bg-violet-600 hover:bg-violet-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الاستبدال"}
        </Button>
      </div>
    </div>
  );
}

// ─── نافذة الحركة الرئيسية ────────────────────────────────────────

const KIND_BUTTONS: { kind: InventoryReasonKind; label: string; activeColor: string; icon: typeof Plus }[] = [
  { kind: "restock",    label: "إضافة",   activeColor: "border-emerald-400 bg-emerald-50 text-emerald-700", icon: Plus },
  { kind: "return",     label: "إرجاع",   activeColor: "border-blue-400 bg-blue-50 text-blue-700",          icon: PackageCheck },
  { kind: "exchange",   label: "استبدال", activeColor: "border-violet-400 bg-violet-50 text-violet-700",    icon: ArrowLeftRight },
  { kind: "damage",     label: "تلف",     activeColor: "border-orange-400 bg-orange-50 text-orange-700",    icon: AlertTriangle },
  { kind: "correction", label: "تصحيح",   activeColor: "border-slate-400 bg-slate-100 text-slate-700",      icon: Wrench },
];

function MovementDialog({
  open, onOpenChange, products, storeId, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  storeId: string;
  onDone: (updates: { productId: string; newStock: number }[], m: InventoryMovement) => void;
}) {
  const [kind, setKind] = useState<InventoryReasonKind>("restock");
  useEffect(() => { if (open) setKind("restock"); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تسجيل حركة مخزون</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-right">
          <div className="grid grid-cols-5 gap-1.5">
            {KIND_BUTTONS.map((b) => {
              const Icon = b.icon;
              return (
                <button key={b.kind} onClick={() => setKind(b.kind)}
                  className={cn("flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[10px] font-bold transition-all",
                    kind === b.kind ? b.activeColor : "border-slate-200 text-slate-400 hover:bg-slate-50")}>
                  <Icon className="w-4 h-4" />
                  {b.label}
                </button>
              );
            })}
          </div>
          {kind === "exchange"   ? <ExchangeForm products={products} storeId={storeId} onDone={onDone} onClose={() => onOpenChange(false)} /> :
           kind === "damage"     ? <DamageForm   products={products} storeId={storeId} onDone={onDone} onClose={() => onOpenChange(false)} /> :
           <StandardForm kind={kind as "restock" | "return" | "correction"} products={products} storeId={storeId} onDone={onDone} onClose={() => onOpenChange(false)} />}
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
  incomingMovements?: InventoryMovement[];
}

export function InventoryTab({ storeId, products, onStockUpdate, incomingMovements }: InventoryTabProps) {
  const [movements,   setMovements]   = useState<InventoryMovement[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [dialogOpen,  setDialogOpen]  = useState(false);

  // فلترة المخزون
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [stockSort,   setStockSort]   = useState<StockSort>("name");
  const [stockSearch, setStockSearch] = useState("");

  // فلترة الحركات
  const [kindFilter,  setKindFilter]  = useState<MovementKind | "all">("all");
  const [movSearch,   setMovSearch]   = useState("");
  const [page,        setPage]        = useState(1);

  useEffect(() => {
    let active = true;
    fetchInventoryMovements(storeId).then((d) => { if (active) { setMovements(d); setLoading(false); } });
    return () => { active = false; };
  }, [storeId]);

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

  const stats = useMemo(() => ({
    total: products.length,
    units: products.reduce((s, p) => s + p.stock, 0),
    low:   products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5)).length,
    out:   products.filter((p) => p.stock === 0).length,
  }), [products]);

  // ── مخزون مرتّب ──────────────────────────────────────────────
  const filteredStock = useMemo(() => {
    let list = [...products];
    if (stockSearch.trim()) { const q = stockSearch.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(q)); }
    if (stockFilter === "low") list = list.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5));
    if (stockFilter === "out") list = list.filter((p) => p.stock === 0);
    if (stockSort === "asc")  list.sort((a, b) => a.stock - b.stock);
    if (stockSort === "desc") list.sort((a, b) => b.stock - a.stock);
    if (stockSort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    return list;
  }, [products, stockSearch, stockFilter, stockSort]);

  // ── حركات مرتّبة ─────────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    let list = movements;
    if (kindFilter !== "all") list = list.filter((m) => classifyMovement(m.reason) === kindFilter);
    if (movSearch.trim()) {
      const q = movSearch.toLowerCase();
      list = list.filter((m) => {
        const name = productMap.get(m.productId)?.name ?? "";
        const ex   = parseExchangeReason(m.reason);
        return name.toLowerCase().includes(q) ||
               (ex ? `${ex.rName} ${ex.iName}`.toLowerCase().includes(q) : m.reason.toLowerCase().includes(q));
      });
    }
    return list;
  }, [movements, kindFilter, movSearch, productMap]);

  const totalPages   = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const pagedMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => { setPage(1); }, [kindFilter, movSearch]);

  const handleMovementDone = useCallback((
    updates: { productId: string; newStock: number }[], movement: InventoryMovement
  ) => {
    updates.forEach(({ productId, newStock }) => onStockUpdate(productId, newStock));
    setMovements((prev) => [movement, ...prev]);
  }, [onStockUpdate]);

  return (
    <div className="space-y-8 pb-10">

      {/* ── رأس الصفحة ── */}
      <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">إدارة المخزون</h2>
              <p className="text-sm text-muted-foreground">تابع الحالة، سجّل التعديلات، وراجع الحركات بوضوح</p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="rounded-xl gap-1.5 font-bold">
            <Plus className="w-4 h-4" />
            تسجيل حركة
          </Button>
        </div>
      </div>

      {/* ── إحصائيات ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package,       label: "المنتجات",       value: stats.total, cls: "text-slate-700 bg-slate-50 border-slate-200" },
          { icon: TrendingUp,    label: "إجمالي الوحدات", value: stats.units, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          { icon: TrendingDown,  label: "مخزون منخفض",    value: stats.low,   cls: "text-amber-700 bg-amber-50 border-amber-200" },
          { icon: AlertTriangle, label: "نافد المخزون",   value: stats.out,   cls: "text-rose-700 bg-rose-50 border-rose-200" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn("rounded-2xl border border-border/70 bg-card p-4 flex items-center gap-3 shadow-sm", s.cls)}>
              <Icon className="w-5 h-5 shrink-0 opacity-70" />
              <div>
                <p className="text-2xl font-black tabular-nums leading-none">{s.value}</p>
                <p className="text-xs font-medium opacity-60 mt-1">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── مستويات المخزون ── */}
      <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">مستويات المخزون</h3>
          <span className="text-xs text-muted-foreground">{filteredStock.length} منتج</span>
        </div>

        {/* شريط تحكم */}
        <div className="space-y-2 mb-4">
          {/* بحث — عرض كامل */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="بحث عن منتج..."
              className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          {/* الفلاتر في صف واحد */}
          <div className="flex gap-2">
            <DropdownSelect<StockFilter>
              value={stockFilter}
              onChange={setStockFilter}
              className="flex-1"
              options={[
                { value: "all", label: "الكل" },
                { value: "low", label: "منخفض" },
                { value: "out", label: "نافد" },
              ]}
            />
            <DropdownSelect<StockSort>
              value={stockSort}
              onChange={setStockSort}
              className="flex-1"
              options={[
                { value: "name", label: "ترتيب: اسم" },
                { value: "asc",  label: "ترتيب: الأقل" },
                { value: "desc", label: "ترتيب: الأعلى" },
              ]}
            />
          </div>
        </div>

        {filteredStock.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">لا توجد منتجات تطابق البحث</p>
        ) : (
          <div className="space-y-2">
            {filteredStock.map((p) => {
              const low = p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5);
              const out = p.stock === 0;
              return (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {low && !out ? "يحتاج إلى إعادة تعبئة" : out ? "غير متوفر حالياً" : "مخزون مناسب"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {out && <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">نافد</span>}
                    {low && !out && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">منخفض</span>}
                    <span className={cn("w-10 text-left text-sm font-black tabular-nums",
                      out ? "text-rose-600" : low ? "text-amber-700" : "text-emerald-700")}>
                      {p.stock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── سجل الحركات ── */}
      <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">سجل الحركات</h3>
          {movements.length > 0 && <span className="text-xs text-muted-foreground">{filteredMovements.length} حركة</span>}
        </div>

        {/* شريط فلترة */}
        <div className="mb-4 rounded-2xl border border-border/70 bg-background/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">تصفية السجل</p>
            <span className="text-[11px] text-muted-foreground">ابحث عن منتج أو نوع الحركة</span>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={movSearch} onChange={(e) => setMovSearch(e.target.value)} placeholder="بحث باسم المنتج أو سبب الحركة..."
                className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <DropdownSelect<MovementKind | "all">
              value={kindFilter}
              onChange={setKindFilter}
              className="w-full"
              options={MOVEMENT_KIND_OPTIONS}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : filteredMovements.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            {movements.length === 0 ? "لا توجد حركات مخزون مسجّلة بعد" : "لا توجد حركات تطابق الفلتر"}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {pagedMovements.map((m) =>
                m.reason.startsWith(EXCHANGE_PREFIX)
                  ? <ExchangeRow key={m.id} movement={m} />
                  : <MovementRow  key={m.id} movement={m} productName={productMap.get(m.productId)?.name ?? "منتج محذوف"} />
              )}
            </div>

            {/* ترقيم الصفحات */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1} className="rounded-xl gap-1.5 text-xs">
                  <ChevronRight className="w-3.5 h-3.5" />
                  السابق
                </Button>
                <span className="text-xs text-slate-500">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages} className="rounded-xl gap-1.5 text-xs">
                  التالي
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <MovementDialog open={dialogOpen} onOpenChange={setDialogOpen} products={products} storeId={storeId} onDone={handleMovementDone} />
    </div>
  );
}
