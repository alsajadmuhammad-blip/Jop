"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Search, Plus, Minus, X, ShoppingCart, CheckCircle2,
  Banknote, CreditCard, Package, ReceiptText, ImageIcon,
  Zap, ChevronRight,
} from "lucide-react";
import {
  Product, Section, OrderItem,
  getEffectivePrice, hasActiveFlashSale,
} from "@/lib/types";
import { createOrder, updateProductStock } from "@/services/supabase-db";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── أنواع ─── */
interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
}

type PaymentMethod = "cash" | "transfer";
type PosView = "pos" | "receipt";

export interface PosTabProps {
  storeId: string;
  storeName: string;
  products: Product[];
  sections: Section[];
  onStockUpdate: (productId: string, newStock: number) => void;
}

/* ══════════════════════════════════════════════
   مكوّن الكاشير — نقطة البيع الفوري
══════════════════════════════════════════════ */
export function PosTab({
  storeId,
  storeName,
  products,
  sections,
  onStockUpdate,
}: PosTabProps) {
  const { toast } = useToast();

  /* ── حالة ── */
  const [search, setSearch]           = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes]             = useState("");
  const [payment, setPayment]         = useState<PaymentMethod>("cash");
  const [completing, setCompleting]   = useState(false);
  const [posView, setPosView]         = useState<PosView>("pos");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [lastCart, setLastCart]       = useState<CartItem[]>([]);
  const [mobileSide, setMobileSide]   = useState<"products" | "cart">("products");

  /* ── منتجات مصفاة ── */
  const filteredProducts = useMemo(() => {
    let pool = products.filter((p) => p.stock > 0);
    if (sectionFilter !== "all")
      pool = pool.filter(
        (p) => p.sectionId === sectionFilter || p.sectionName === sectionFilter
      );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      pool = pool.filter((p) => p.name.toLowerCase().includes(q));
    }
    return pool;
  }, [products, sectionFilter, search]);

  /* ── إجماليات ── */
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.unitPrice * i.qty, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.qty, 0),
    [cart]
  );

  /* ── عمليات السلة ── */
  const addToCart = useCallback((product: Product) => {
    const price = getEffectivePrice(product);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1, unitPrice: price }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product.id !== productId) return [i];
        const newQty = i.qty + delta;
        if (newQty <= 0) return [];
        if (newQty > i.product.stock) return [i];
        return [{ ...i, qty: newQty }];
      })
    );
  }, []);

  /* ── إتمام البيع ── */
  const completeSale = async () => {
    if (cart.length === 0) return;
    setCompleting(true);

    /* ① إنشاء الطلب في قاعدة البيانات */
    let orderId: string | null = null;
    try {
      const items: OrderItem[] = cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.qty,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * i.qty,
      }));

      orderId = await createOrder({
        storeId,
        storeName,
        customerName: customerName.trim() || "عميل نقدي",
        items,
        totalAmount: cartTotal,
        status: "delivered",
        paymentMethod: payment,
        notes: notes.trim() || null,
      });
    } catch (err) {
      console.error("createOrder threw:", err);
    }

    if (!orderId) {
      toast({
        title: "فشل تسجيل الطلب",
        description: "تحقق من الاتصال بالإنترنت وحاول مرة أخرى",
        variant: "destructive",
      });
      setCompleting(false);
      return;
    }

    /* ② الطلب نجح — انتقل لشاشة الفاتورة فوراً */
    const saleCart = [...cart];
    setLastCart(saleCart);
    setLastOrderId(orderId);
    setCompleting(false);
    setPosView("receipt");

    /* ③ تحديث المخزون في الخلفية — منفصل عن نجاح البيع */
    const stockResults = await Promise.allSettled(
      saleCart.map(async (item) => {
        const newStock = Math.max(0, item.product.stock - item.qty);
        const ok = await updateProductStock(item.product.id, newStock);
        if (ok) onStockUpdate(item.product.id, newStock);
        return { ok, item, newStock };
      })
    );

    const failures = stockResults.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
    );
    if (failures.length > 0) {
      console.warn("بعض تحديثات المخزون لم تكتمل:", failures.length, "منتج");
      toast({
        title: "تنبيه: المخزون",
        description: "تمّت عملية البيع لكن تعذّر تحديث مخزون بعض المنتجات. راجعه يدوياً.",
        variant: "destructive",
      });
    }
  };

  const resetPos = () => {
    setCart([]);
    setCustomerName("");
    setNotes("");
    setPayment("cash");
    setPosView("pos");
    setLastOrderId(null);
    setMobileSide("products");
  };

  /* ══ شاشة الفاتورة ══ */
  if (posView === "receipt") {
    const total = lastCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-1">تمت عملية البيع!</h2>
        <p className="text-sm text-slate-500 mb-6">
          رقم الطلب:{" "}
          <span className="font-mono font-bold text-slate-700">
            #{lastOrderId?.slice(-8).toUpperCase()}
          </span>
        </p>

        {/* فاتورة */}
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 text-right">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">ملخص الفاتورة</span>
          </div>
          <div className="divide-y divide-slate-50">
            {lastCart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between px-5 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.product.name}</p>
                  <p className="text-xs text-slate-400">
                    {item.qty} × {item.unitPrice.toLocaleString()} د.ع
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {(item.qty * item.unitPrice).toLocaleString()} د.ع
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
            <span className="text-sm font-bold text-slate-600">المجموع الكلي</span>
            <span className="text-xl font-black text-primary">
              {total.toLocaleString()} د.ع
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={resetPos} className="rounded-xl gap-2 font-bold px-8 py-5">
            <Plus className="w-4 h-4" />
            بيع جديد
          </Button>
        </div>
      </div>
    );
  }

  /* ══ شاشة الكاشير الرئيسية ══ */
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[520px]">

      {/* ── مبدّل الجوال ── */}
      <div className="flex sm:hidden mb-3 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setMobileSide("products")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold transition-colors",
            mobileSide === "products" ? "bg-primary text-white" : "text-slate-500"
          )}
        >
          المنتجات
        </button>
        <button
          onClick={() => setMobileSide("cart")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold transition-colors relative",
            mobileSide === "cart" ? "bg-primary text-white" : "text-slate-500"
          )}
        >
          السلة
          {cartCount > 0 && (
            <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-[10px] text-white font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* ════════════════ لوحة المنتجات ════════════════ */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0 min-h-0",
            mobileSide === "cart" ? "hidden sm:flex" : "flex"
          )}
        >
          {/* بحث */}
          <div className="relative mb-2.5">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* فلتر الأقسام */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2.5"
            style={{ scrollbarWidth: "none" }}
          >
            <button
              onClick={() => setSectionFilter("all")}
              className={cn(
                "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                sectionFilter === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              الكل
            </button>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectionFilter(s.id)}
                className={cn(
                  "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                  sectionFilter === s.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* شبكة المنتجات */}
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40">
                <Package className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">لا توجد منتجات متاحة</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-4">
                {filteredProducts.map((product) => {
                  const price = getEffectivePrice(product);
                  const isFlash = hasActiveFlashSale(product);
                  const inCart = cart.find((i) => i.product.id === product.id);
                  const maxed = inCart ? inCart.qty >= product.stock : false;

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={maxed}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-xl border bg-white text-right shadow-sm transition-all duration-150",
                        "hover:shadow-md active:scale-[0.98]",
                        inCart
                          ? "border-primary/50 ring-1 ring-primary/20"
                          : "border-slate-200 hover:border-primary/30",
                        maxed && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {/* صورة المنتج */}
                      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-7 h-7 text-slate-200" />
                          </div>
                        )}
                        {/* عدد في السلة */}
                        {inCart && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black shadow-md">
                              {inCart.qty}
                            </span>
                          </div>
                        )}
                        {/* شارة فلاش */}
                        {isFlash && (
                          <span className="absolute top-1.5 right-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-white" />
                            <span className="text-[9px] font-bold text-white">فلاش</span>
                          </span>
                        )}
                        {/* المخزون */}
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white font-semibold">
                          {product.stock} قطعة
                        </span>
                      </div>

                      {/* معلومات */}
                      <div className="p-2">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">
                          {product.name}
                        </p>
                        <p className="text-sm font-black text-primary leading-none">
                          {price.toLocaleString()}{" "}
                          <span className="text-[10px] font-medium">د.ع</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════ لوحة السلة ════════════════ */}
        <div
          className={cn(
            "flex flex-col w-full sm:w-72 lg:w-80 shrink-0 min-h-0",
            mobileSide === "products" ? "hidden sm:flex" : "flex"
          )}
        >
          <div className="flex flex-col flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* رأس السلة */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-slate-900">السلة</span>
                {cartCount > 0 && (
                  <span className="rounded-full bg-primary/10 text-primary text-xs font-black px-2 py-0.5">
                    {cartCount}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-600 font-semibold transition-colors"
                >
                  مسح الكل
                </button>
              )}
            </div>

            {/* عناصر السلة */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <ShoppingCart className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">اضغط على أي منتج لإضافته</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.unitPrice.toLocaleString()} × {item.qty}
                      </p>
                    </div>
                    {/* أزرار الكمية */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-800">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQty(item.product.id, 1)}
                        disabled={item.qty >= item.product.stock}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-black text-slate-900 w-16 text-left shrink-0 tabular-nums">
                      {(item.unitPrice * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* تذييل السلة */}
            <div className="border-t border-slate-100 p-4 space-y-3 shrink-0">
              {/* اسم العميل */}
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل (اختياري)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />

              {/* ملاحظات */}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات (اختياري)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />

              {/* طريقة الدفع */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPayment("cash")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all",
                    payment === "cash"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  كاش
                </button>
                <button
                  onClick={() => setPayment("transfer")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all",
                    payment === "transfer"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  تحويل
                </button>
              </div>

              {/* المجموع */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-sm text-slate-500 font-medium">المجموع</span>
                <span className="text-xl font-black text-primary tabular-nums">
                  {cartTotal.toLocaleString()}{" "}
                  <span className="text-xs font-medium">د.ع</span>
                </span>
              </div>

              {/* زر إتمام البيع */}
              <Button
                onClick={completeSale}
                disabled={cart.length === 0 || completing}
                className="w-full rounded-xl font-black text-sm py-5 gap-2 shadow-sm shadow-primary/20 transition-all"
              >
                {completing ? (
                  <span>جاري المعالجة...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    إتمام البيع — {cartTotal.toLocaleString()} د.ع
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
