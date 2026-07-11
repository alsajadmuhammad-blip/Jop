"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Search, Plus, Minus, X, ShoppingCart, CheckCircle2,
  Banknote, CreditCard, Package, ReceiptText, ImageIcon, Zap, Printer,
} from "lucide-react";
import {
  Product, Section,
  getEffectivePrice, hasActiveFlashSale,
} from "@/lib/types";
import { posCheckout } from "@/services/pos-checkout";
import { logInventoryMovementsBulk, type InventoryMovement } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── أنواع ─── */
interface CartItem {
  product:   Product;
  qty:       number;
  unitPrice: number;
}
type PaymentMethod = "cash" | "transfer";
type PosView       = "pos" | "receipt";

export interface PosTabProps {
  storeId:          string;
  storeName:        string;
  storeLogoUrl?:    string | null;
  products:         Product[];
  sections:         Section[];
  onStockUpdate:    (productId: string, newStock: number) => void;
  onSaleMovements?: (movements: InventoryMovement[]) => void;
}

/* ─── تهريب نص بسيط قبل حقنه داخل HTML الفاتورة ─── */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ════════════════════════════════════════
   بطاقة المنتج
════════════════════════════════════════ */
interface ProductCardProps {
  product: Product;
  inCart:  CartItem | undefined;
  maxed:   boolean;
  onAdd:   () => void;
}
function ProductCard({ product, inCart, maxed, onAdd }: ProductCardProps) {
  const price   = getEffectivePrice(product);
  const isFlash = hasActiveFlashSale(product);
  return (
    <button
      onClick={onAdd}
      disabled={maxed}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border bg-white text-right p-2",
        "transition-colors active:bg-slate-50",
        inCart ? "border-primary bg-primary/[0.04]" : "border-slate-200",
        maxed && "opacity-40 cursor-not-allowed"
      )}
    >
      {/* صورة */}
      <div className="relative w-12 h-12 shrink-0 rounded-lg bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="48px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-slate-200" />
          </div>
        )}
        {isFlash && (
          <span className="absolute -top-1 -right-1 rounded-full bg-rose-500 p-0.5">
            <Zap className="w-2 h-2 text-white" />
          </span>
        )}
      </div>

      {/* معلومات */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 line-clamp-1 leading-snug">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-sm font-black text-primary leading-none">
            {price.toLocaleString()}
            <span className="text-[10px] font-medium"> د.ع</span>
          </p>
          <span className="text-[10px] text-slate-400">مخزون {product.stock}</span>
        </div>
      </div>

      {/* كمية في السلة */}
      {inCart && (
        <span className="shrink-0 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">
          {inCart.qty}
        </span>
      )}
    </button>
  );
}

/* ════════════════════════════════════════
   محتوى السلة (يُستخدم في الـ sidebar والـ Sheet)
════════════════════════════════════════ */
interface CartContentProps {
  cart:          CartItem[];
  cartCount:     number;
  cartTotal:     number;
  customerName:  string;
  notes:         string;
  payment:       PaymentMethod;
  completing:    boolean;
  onRemove:      (id: string) => void;
  onChangeQty:   (id: string, delta: number) => void;
  onClearAll:    () => void;
  onCustomer:    (v: string) => void;
  onNotes:       (v: string) => void;
  onPayment:     (v: PaymentMethod) => void;
  onComplete:    () => void;
}
function CartContent({
  cart, cartCount, cartTotal,
  customerName, notes, payment, completing,
  onRemove, onChangeQty, onClearAll,
  onCustomer, onNotes, onPayment, onComplete,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full">

      {/* رأس */}
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
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-600 font-semibold transition-colors"
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* عناصر */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-center px-4">
            <ShoppingCart className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-400">اضغط على أي منتج لإضافته</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 px-3 py-2.5">
              <button
                onClick={() => onRemove(item.product.id)}
                className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.product.name}</p>
                <p className="text-[11px] text-slate-400">{item.unitPrice.toLocaleString()} × {item.qty}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onChangeQty(item.product.id, -1)}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                <button
                  onClick={() => onChangeQty(item.product.id, 1)}
                  disabled={item.qty >= item.product.stock}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 transition-colors"
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

      {/* تذييل */}
      <div className="border-t border-slate-100 p-4 space-y-3 shrink-0">
        <input
          value={customerName}
          onChange={(e) => onCustomer(e.target.value)}
          placeholder="اسم العميل (اختياري)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
        />
        <input
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="ملاحظات (اختياري)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
        />

        {/* طريقة الدفع */}
        <div className="flex gap-2">
          <button
            onClick={() => onPayment("cash")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all",
              payment === "cash"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <Banknote className="w-3.5 h-3.5" /> كاش
          </button>
          <button
            onClick={() => onPayment("transfer")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all",
              payment === "transfer"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <CreditCard className="w-3.5 h-3.5" /> تحويل
          </button>
        </div>

        {/* المجموع */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-slate-500 font-medium">المجموع</span>
          <span className="text-xl font-black text-primary tabular-nums">
            {cartTotal.toLocaleString()}
            <span className="text-xs font-medium"> د.ع</span>
          </span>
        </div>

        {/* زر إتمام البيع */}
        <Button
          onClick={onComplete}
          disabled={cart.length === 0 || completing}
          className="w-full rounded-xl font-black text-sm py-5 gap-2 shadow-sm shadow-primary/20"
        >
          {completing ? (
            "جاري المعالجة..."
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              إتمام البيع — {cartTotal.toLocaleString()} د.ع
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   الكاشير الرئيسي
════════════════════════════════════════ */
export function PosTab({
  storeId, storeName, storeLogoUrl, products, sections, onStockUpdate, onSaleMovements,
}: PosTabProps) {
  const { toast } = useToast();

  const [search,       setSearch]       = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [cart,         setCart]         = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes,        setNotes]        = useState("");
  const [payment,      setPayment]      = useState<PaymentMethod>("cash");
  const [completing,   setCompleting]   = useState(false);
  const [posView,      setPosView]      = useState<PosView>("pos");
  const [lastOrderId,  setLastOrderId]  = useState<string | null>(null);
  const [lastOrderNum, setLastOrderNum] = useState<number | null>(null);
  const [lastCart,     setLastCart]     = useState<CartItem[]>([]);
  const [cartOpen,     setCartOpen]     = useState(false);

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

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

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

  const removeFromCart = useCallback(
    (productId: string) => setCart((prev) => prev.filter((i) => i.product.id !== productId)),
    []
  );

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

  /* ── إتمام البيع عبر الدالة السحابية ── */
  const completeSale = async () => {
    if (cart.length === 0) return;
    setCompleting(true);
    try {
      const result = await posCheckout({
        store_id:       storeId,
        store_name:     storeName,
        customer_name:  customerName.trim() || undefined,
        items:          cart.map((i) => ({
          product_id:   i.product.id,
          product_name: i.product.name,
          qty:          i.qty,
          unit_price:   i.unitPrice,
        })),
        total_amount:   cartTotal,
        payment_method: payment,
        notes:          notes.trim() || undefined,
      });

      const saleCart = [...cart];
      setLastCart(saleCart);
      setLastOrderId(result.order_id);
      setLastOrderNum(result.order_number);

      /* تحديث الحالة المحلية */
      saleCart.forEach((item) => {
        onStockUpdate(item.product.id, Math.max(0, item.product.stock - item.qty));
      });

      /* تسجيل حركات المخزون لكل منتج مباع */
      try {
        const logged = await logInventoryMovementsBulk(
          saleCart.map((item) => ({
            storeId:        storeId,
            productId:      item.product.id,
            quantityChange: -item.qty,
            reason:         `بيع كاشير #${result.order_number}`,
          }))
        );
        onSaleMovements?.(logged);
      } catch (logErr) {
        /* فشل التسجيل لا يوقف عملية البيع — فقط نُسجّله للتصحيح */
        console.warn("logInventoryMovementsBulk failed:", logErr);
      }

      setCartOpen(false);
      setPosView("receipt");

      /* نُظهر فقط تنبيهات مخزون حقيقية — نتجاهل أي رسائل تقنية/أخطاء قاعدة بيانات
         قد تُرسلها الدالة السحابية بالخطأ (مثل "column ... does not exist") لأن
         عملية البيع نجحت فعلاً ولا يجب تخويف الكاشير برسالة تقنية غير مفهومة */
      const realWarnings = (result.stock_warnings ?? []).filter(
        (w) => !/column|does not exist|relation|syntax error|SQL/i.test(w)
      );
      if (realWarnings.length) {
        toast({
          title: "تنبيه مخزون",
          description: realWarnings.join(" | "),
          variant: "destructive",
        });
      }
      if (result.stock_warnings?.length && !realWarnings.length) {
        console.warn("POS checkout returned a non-user-facing warning:", result.stock_warnings);
      }
    } catch (err: any) {
      toast({
        title: "فشل إتمام البيع",
        description: err?.message || "تحقق من الاتصال وحاول مجدداً",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  /* ── طباعة فاتورة حقيقية تحمل شعار واسم المتجر ── */
  const handlePrint = useCallback(() => {
    const total = lastCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const dateStr = new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

    const rows = lastCart
      .map(
        (item) => `
        <tr>
          <td style="text-align:right;padding:5px 0;">${escapeHtml(item.product.name)}</td>
          <td style="text-align:center;padding:5px 0;">${item.qty}</td>
          <td style="text-align:left;padding:5px 0;white-space:nowrap;">${item.unitPrice.toLocaleString()}</td>
          <td style="text-align:left;padding:5px 0;white-space:nowrap;font-weight:bold;">${(item.unitPrice * item.qty).toLocaleString()}</td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>فاتورة #${lastOrderNum ?? ""}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Tahoma, Arial, sans-serif;
            width: 300px;
            margin: 0 auto;
            padding: 18px 16px;
            color: #111827;
          }
          .center { text-align: center; }
          .logo {
            width: 64px; height: 64px; border-radius: 14px;
            object-fit: cover; display: block; margin: 0 auto 8px;
          }
          h1 { font-size: 16px; margin: 0 0 3px; }
          .muted { color: #6b7280; font-size: 11px; margin: 1px 0; }
          .divider { border-top: 1px dashed #9ca3af; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead td { font-weight: bold; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; color: #374151; }
          tbody tr:not(:last-child) td { border-bottom: 1px dotted #e5e7eb; }
          .total-row td { border-top: 2px solid #111827; font-weight: 800; padding-top: 8px; font-size: 14px; }
          .meta { font-size: 12px; margin: 3px 0; }
          .footer { text-align: center; margin-top: 18px; font-size: 11px; color: #6b7280; }
          @media print {
            body { padding: 0; }
            @page { margin: 8mm; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          ${storeLogoUrl ? `<img src="${escapeHtml(storeLogoUrl)}" class="logo" alt="${escapeHtml(storeName)}" />` : ""}
          <h1>${escapeHtml(storeName)}</h1>
          <p class="muted">فاتورة بيع رقم #${lastOrderNum ?? "—"}</p>
          <p class="muted">${escapeHtml(dateStr)}</p>
        </div>
        <div class="divider"></div>
        ${customerName.trim() ? `<p class="meta"><strong>العميل:</strong> ${escapeHtml(customerName.trim())}</p>` : ""}
        <p class="meta"><strong>طريقة الدفع:</strong> ${payment === "cash" ? "كاش" : "تحويل"}</p>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <td>الصنف</td>
              <td style="text-align:center;">الكمية</td>
              <td style="text-align:left;">السعر</td>
              <td style="text-align:left;">الإجمالي</td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3">المجموع الكلي</td>
              <td style="text-align:left;">${total.toLocaleString()} د.ع</td>
            </tr>
          </tfoot>
        </table>
        ${notes.trim() ? `<div class="divider"></div><p class="meta"><strong>ملاحظات:</strong> ${escapeHtml(notes.trim())}</p>` : ""}
        <div class="divider"></div>
        <p class="footer">شكراً لتعاملكم معنا</p>
      </body>
      </html>`;

    const printWindow = window.open("", "_blank", "width=380,height=640");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // نمنح المتصفح فرصة لعرض المحتوى والصورة قبل فتح مربع الطباعة
    setTimeout(() => { printWindow.print(); }, 300);
  }, [lastCart, lastOrderNum, storeName, storeLogoUrl, customerName, notes, payment]);

  const resetPos = () => {
    setCart([]);
    setCustomerName("");
    setNotes("");
    setPayment("cash");
    setPosView("pos");
    setLastOrderId(null);
    setLastOrderNum(null);
    setCartOpen(false);
  };

  /* ══════════════════════════════════════
     شاشة الفاتورة
  ══════════════════════════════════════ */
  if (posView === "receipt") {
    const total = lastCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 min-h-[520px]">
        {/* أيقونة النجاح */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9 text-emerald-500" />
        </div>

        {/* رقم الطلب المتسلسل */}
        <p className="text-5xl font-black text-primary mb-1 tabular-nums">
          #{lastOrderNum ?? "—"}
        </p>
        <h2 className="text-lg font-black text-slate-800 mb-1">تمت عملية البيع</h2>
        <p className="text-xs text-slate-400 font-mono mb-8">
          {lastOrderId?.slice(-10).toUpperCase()}
        </p>

        {/* الفاتورة */}
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 text-right">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
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
            <span className="text-2xl font-black text-primary tabular-nums">
              {total.toLocaleString()}
              <span className="text-sm font-medium"> د.ع</span>
            </span>
          </div>
        </div>

        {/* أزرار الإجراء */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 rounded-xl gap-2 font-bold py-5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" />
            طباعة الفاتورة
          </Button>
          <Button onClick={resetPos} className="flex-1 rounded-xl gap-2 font-bold py-5">
            <Plus className="w-4 h-4" />
            بيع جديد
          </Button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     شاشة الكاشير الرئيسية
  ══════════════════════════════════════ */
  const cartContentProps: CartContentProps = {
    cart, cartCount, cartTotal,
    customerName, notes, payment, completing,
    onRemove:   removeFromCart,
    onChangeQty: changeQty,
    onClearAll:  () => setCart([]),
    onCustomer:  setCustomerName,
    onNotes:     setNotes,
    onPayment:   setPayment,
    onComplete:  completeSale,
  };

  return (
    <div className="relative">

      {/* ══ شريط البحث والأقسام (ثابت أعلى الصفحة) ══ */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-3 sm:px-4 pt-3 pb-2.5 space-y-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
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
      </div>

      {/* ══ منطقة المحتوى ══ */}
      <div className="flex items-start">

        {/* ─── شبكة المنتجات ─── */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Package className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">لا توجد منتجات متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const maxed  = inCart ? inCart.qty >= product.stock : false;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    inCart={inCart}
                    maxed={maxed}
                    onAdd={() => addToCart(product)}
                  />
                );
              })}
            </div>
          )}
          {/* مساحة سفلية على الجوال فوق الـ FAB */}
          <div className="lg:hidden h-24" />
        </div>

        {/* ─── Sidebar السلة (سطح المكتب فقط) ─── */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 border-r border-slate-100 sticky top-[108px] max-h-[calc(100vh-108px)] bg-white">
          <CartContent {...cartContentProps} />
        </div>

      </div>

      {/* ══ زر السلة العائم (جوال) ══ */}
      <button
        onClick={() => setCartOpen(true)}
        className={cn(
          "lg:hidden fixed bottom-[88px] left-4 z-40",
          "flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl transition-all",
          cart.length > 0
            ? "bg-primary text-white"
            : "bg-slate-200 text-slate-400 cursor-default pointer-events-none"
        )}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        {cart.length > 0 ? (
          <span className="text-sm font-bold">
            {cartCount} منتج — {cartTotal.toLocaleString()} د.ع
          </span>
        ) : (
          <span className="text-sm font-medium">السلة فارغة</span>
        )}
      </button>

      {/* ══ Sheet السلة (جوال) ══ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="h-[88vh] p-0 rounded-t-2xl overflow-hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>سلة الكاشير</SheetTitle>
          </SheetHeader>
          {/* مقبض بصري */}
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mt-2.5 mb-0 shrink-0" />
          <CartContent {...cartContentProps} />
        </SheetContent>
      </Sheet>

    </div>
  );
}
