"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes, Plus, Minus, ArrowLeftRight, History,
  AlertTriangle, PackageCheck, Search, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import {
  fetchInventoryMovements, recordInventoryMovement,
  INVENTORY_REASON_LABELS, type InventoryMovement, type InventoryReasonKind,
} from "@/services/inventory";

interface InventoryTabProps {
  storeId: string;
  products: Product[];
  onStockUpdate: (productId: string, newStock: number) => void;
}

/* أنواع الحركة وإشارتها الافتراضية (+/-) */
const MOVEMENT_TYPES: { kind: InventoryReasonKind; sign: 1 | -1; icon: typeof Plus }[] = [
  { kind: "restock",    sign: 1,  icon: Plus },
  { kind: "return",     sign: 1,  icon: PackageCheck },
  { kind: "exchange",   sign: -1, icon: ArrowLeftRight },
  { kind: "damage",     sign: -1, icon: AlertTriangle },
  { kind: "correction", sign: 1,  icon: History },
];

/* ════════ نافذة تسجيل حركة مخزون ════════ */
function MovementDialog({
  open, onOpenChange, products, storeId, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  storeId: string;
  onDone: (productId: string, newStock: number, movement: InventoryMovement) => void;
}) {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [kind, setKind] = useState<InventoryReasonKind>("restock");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setProductId("");
      setKind("restock");
      setQty("1");
      setNote("");
      setSearch("");
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const selectedProduct = products.find((p) => p.id === productId);
  const activeType = MOVEMENT_TYPES.find((t) => t.kind === kind)!;

  const handleSubmit = async () => {
    const qtyNum = Math.abs(Number(qty));
    if (!selectedProduct) {
      toast({ variant: "destructive", title: "اختر منتجاً أولاً" });
      return;
    }
    if (!qtyNum || Number.isNaN(qtyNum)) {
      toast({ variant: "destructive", title: "أدخل كمية صحيحة" });
      return;
    }

    const quantityChange = qtyNum * activeType.sign;
    const reasonLabel = note.trim()
      ? `${INVENTORY_REASON_LABELS[kind]} — ${note.trim()}`
      : INVENTORY_REASON_LABELS[kind];

    setSaving(true);
    try {
      const newStock = await recordInventoryMovement({
        storeId,
        productId: selectedProduct.id,
        currentStock: selectedProduct.stock,
        quantityChange,
        reasonLabel,
      });
      onDone(selectedProduct.id, newStock, {
        id: `local-${Date.now()}`,
        storeId,
        productId: selectedProduct.id,
        quantityChange,
        reason: reasonLabel,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "تم تسجيل الحركة", description: `${selectedProduct.name}: مخزون جديد ${newStock}` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل تسجيل الحركة", description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">تسجيل حركة مخزون</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-right">
          {/* اختيار المنتج */}
          {!selectedProduct ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white"
                />
              </div>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">لا توجد منتجات</p>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProductId(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">مخزون: {p.stock}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-bold text-slate-800">{selectedProduct.name}</p>
                <p className="text-xs text-slate-400">المخزون الحالي: {selectedProduct.stock}</p>
              </div>
              <button
                onClick={() => setProductId("")}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* نوع الحركة */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">نوع الحركة</p>
            <div className="grid grid-cols-3 gap-1.5">
              {MOVEMENT_TYPES.map((t) => (
                <button
                  key={t.kind}
                  onClick={() => setKind(t.kind)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-colors",
                    kind === t.kind
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-500"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {INVENTORY_REASON_LABELS[t.kind]}
                </button>
              ))}
            </div>
          </div>

          {/* الكمية */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">
              الكمية ({activeType.sign > 0 ? "ستُضاف" : "ستُخصم"})
            </p>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </div>

          {/* ملاحظة */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">ملاحظة (اختياري)</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: استبدال بسبب عيب صناعة"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-xl font-bold py-5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحركة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ════════ التبويب الرئيسي ════════ */
export function InventoryTab({ storeId, products, onStockUpdate }: InventoryTabProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const data = await fetchInventoryMovements(storeId);
      if (active) {
        setMovements(data);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [storeId]);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [products]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= (p.lowStockThreshold ?? 5)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const handleMovementDone = (productId: string, newStock: number, movement: InventoryMovement) => {
    onStockUpdate(productId, newStock);
    setMovements((prev) => [movement, ...prev]);
  };

  return (
    <div className="space-y-5">

      {/* رأس */}
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

      {/* تنبيه انخفاض المخزون */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-bold text-amber-800">
              {lowStockProducts.length} منتج بمخزون منخفض
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lowStockProducts.slice(0, 12).map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-white border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700"
              >
                {p.name} · {p.stock}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* نظرة عامة على المخزون */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-800">مستويات المخزون</p>
          <div className="relative w-40">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-2 py-1.5 text-xs outline-none focus:border-primary focus:bg-white"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
          {filteredProducts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">لا توجد منتجات</p>
          ) : (
            filteredProducts.map((p) => {
              const low = p.stock <= (p.lowStockThreshold ?? 5);
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                  <span
                    className={cn(
                      "text-xs font-bold rounded-full px-2 py-0.5 shrink-0",
                      p.stock === 0
                        ? "bg-rose-100 text-rose-700"
                        : low
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {p.stock}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* سجل الحركات */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <History className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-bold text-slate-800">سجل الحركات</p>
        </div>
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">جاري التحميل...</div>
        ) : movements.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">لا توجد حركات مخزون مسجّلة بعد</div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {productNameById.get(m.productId) ?? "منتج محذوف"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {m.reason} · {new Date(m.createdAt).toLocaleString("ar-IQ")}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-black tabular-nums",
                    m.quantityChange > 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                </span>
              </div>
            ))}
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
