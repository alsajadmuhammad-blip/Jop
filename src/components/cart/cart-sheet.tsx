
"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ShoppingCart, Minus, Plus, Image as ImageIcon, Loader2, MapPin, Phone, User, Wallet, ChevronRight, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, OrderItem } from "@/lib/types";
import { createOrder } from "@/services/orders";
import { fetchStoreById } from "@/services/supabase-db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const IRAQI_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "الأنبار",
  "كركوك", "النجف", "كربلاء", "ذي قار", "بابل",
  "صلاح الدين", "ديالى", "واسط", "القادسية", "المثنى",
  "السليمانية", "دهوك", "ميسان",
];

interface CheckoutForm {
  name: string;
  phone: string;
  phoneBackup: string;
  governorate: string;
  address: string;
  notes: string;
}

const emptyForm: CheckoutForm = {
  name: "",
  phone: "",
  phoneBackup: "",
  governorate: "",
  address: "",
  notes: "",
};

export function CartSheet({ children }: { children: ReactNode }) {
  const {
    items,
    totalPrice,
    removeItem,
    updateItemQuantity,
    clearCart,
    itemsByStore,
  } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    storeId: string;
    storeName: string;
    whatsappNumber: string;
    storeItems: CartItem[];
  } | null>(null);

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) setForm((f) => ({ ...f, name: f.name || user.name || "" }));
  }, [user?.name]);

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};
    if (!form.name.trim()) newErrors.name = "مطلوب";
    if (!form.phone.trim()) newErrors.phone = "مطلوب";
    if (!form.governorate) newErrors.governorate = "مطلوب";
    if (!form.address.trim()) newErrors.address = "مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckoutClick = (storeId: string, storeName: string, whatsappNumber: string, storeItems: CartItem[]) => {
    if (storeItems.length === 0) return;
    setCheckoutData({ storeId, storeName, whatsappNumber, storeItems });
    setForm({ ...emptyForm, name: user?.name || "" });
    setErrors({});
    setIsCheckoutOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!checkoutData || !validate()) return;

    let whatsappNumber = checkoutData.whatsappNumber?.trim() || "";
    if (!whatsappNumber) {
      try {
        const store = await fetchStoreById(checkoutData.storeId);
        whatsappNumber = store?.whatsappNumber?.trim() || "";
      } catch { /* silent */ }
    }

    if (!whatsappNumber) {
      toast({ variant: "destructive", title: "خطأ", description: "رقم واتساب المتجر غير متوفر." });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = checkoutData.storeItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      }));

      const storeTotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);

      const order = await createOrder(
        checkoutData.storeId,
        checkoutData.storeName,
        user?.id ?? null,
        form.name.trim() || user?.name || "عميل",
        form.phone.trim(),
        orderItems,
        storeTotal,
        form.notes.trim() || undefined,
        "whatsapp",
        form.phoneBackup.trim() || undefined,
        form.governorate || undefined,
        form.address.trim() || undefined,
      );

      if (!order) throw new Error("فشل إنشاء الطلب.");

      // Build WhatsApp message
      let msg = `*طلب جديد — منصة مركزي*\n`;
      msg += `────────────────────\n`;
      msg += `*رقم الطلب:* ${order.id.slice(0, 8).toUpperCase()}\n\n`;

      msg += `*معلومات العميل:*\n`;
      msg += `• الاسم: ${form.name.trim()}\n`;
      msg += `• الهاتف: ${form.phone.trim()}\n`;
      if (form.phoneBackup.trim()) msg += `• هاتف احتياطي: ${form.phoneBackup.trim()}\n`;
      msg += `\n*عنوان التوصيل:*\n`;
      msg += `• المحافظة: ${form.governorate}\n`;
      msg += `• العنوان: ${form.address.trim()}\n`;

      msg += `\n*المنتجات:*\n`;
      checkoutData.storeItems.forEach((item) => {
        msg += `• ${item.product.name} × ${item.quantity} = ${(item.product.price * item.quantity).toLocaleString()} د.ع\n`;
      });
      msg += `────────────────────\n`;
      msg += `*الإجمالي:* ${storeTotal.toLocaleString()} د.ع\n`;
      msg += `*الدفع:* عند الاستلام (أو حسب الاتفاق)\n`;
      if (form.notes.trim()) msg += `\n*ملاحظات:* ${form.notes.trim()}\n`;
      msg += `\n📱 منصة مركزي`;

      window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");

      checkoutData.storeItems.forEach((item) => removeItem(item.product.id));
      setIsCheckoutOpen(false);

      toast({
        title: "تم إرسال الطلب",
        description: `جاري فتح واتساب ${checkoutData.storeName} لإتمام التأكيد.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الطلب.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
          <SheetHeader className="px-6">
            <SheetTitle>سلة التسوق ({items.length})</SheetTitle>
            <SheetDescription>المنتجات التي أضفتها.</SheetDescription>
          </SheetHeader>
          <Separator />
          {items.length > 0 ? (
            <>
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-5 p-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                        {item.product.imageUrl ? (
                          <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" sizes="80px" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{item.product.name}</h4>
                          <p className="text-sm font-bold text-primary mt-0.5">{item.product.price.toLocaleString()} د.ع</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <SheetFooter className="p-6">
                <div className="w-full space-y-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span>{totalPrice.toLocaleString()} د.ع</span>
                  </div>
                  <div className="space-y-2">
                    {itemsByStore.map(([storeId, { storeName, whatsappNumber, items: storeItems }]) => (
                      <Button key={storeId} className="w-full gap-2" size="lg" onClick={() => handleCheckoutClick(storeId, storeName, whatsappNumber, storeItems)}>
                        إتمام الطلب من {storeName}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={clearCart}>إفراغ السلة</Button>
                </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
              <ShoppingCart className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
              <h3 className="font-semibold text-xl">السلة فارغة</h3>
              <p className="text-muted-foreground text-sm">لم تقم بإضافة أي منتجات بعد.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-bold">إتمام الطلب</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {checkoutData?.storeName && `الطلب من: ${checkoutData.storeName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-5">

            {/* Order Summary */}
            {checkoutData && (
              <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">ملخص الطلب</span>
                </div>
                {checkoutData.storeItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">{(item.product.price * item.quantity).toLocaleString()} د.ع</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold text-sm">
                  <span>الإجمالي</span>
                  <span className="text-primary">
                    {checkoutData.storeItems.reduce((s, i) => s + i.product.price * i.quantity, 0).toLocaleString()} د.ع
                  </span>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">معلومات التواصل</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="co-name" className="text-xs font-medium">
                  الاسم الكامل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="co-name"
                  placeholder="مثال: أحمد محمد"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="co-phone" className="text-xs font-medium">
                    رقم الهاتف <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="co-phone"
                    placeholder="07xxxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    dir="ltr"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="co-phone2" className="text-xs font-medium text-muted-foreground">
                    هاتف احتياطي <span className="text-[10px]">(اختياري)</span>
                  </Label>
                  <Input
                    id="co-phone2"
                    placeholder="07xxxxxxxxx"
                    value={form.phoneBackup}
                    onChange={(e) => setField("phoneBackup", e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">عنوان التوصيل</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="co-gov" className="text-xs font-medium">
                  المحافظة <span className="text-destructive">*</span>
                </Label>
                <Select value={form.governorate} onValueChange={(v) => setField("governorate", v)}>
                  <SelectTrigger id="co-gov" className={errors.governorate ? "border-destructive" : ""}>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {IRAQI_GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.governorate && <p className="text-xs text-destructive">{errors.governorate}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="co-address" className="text-xs font-medium">
                  العنوان التفصيلي <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="co-address"
                  placeholder="مثال: الكرخ، شارع المتنبي، بناية رقم 12، الطابق الثاني"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={`resize-none text-sm ${errors.address ? "border-destructive" : ""}`}
                  rows={2}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="co-notes" className="text-xs font-medium text-muted-foreground">
                ملاحظات إضافية <span className="text-[10px]">(اختياري)</span>
              </Label>
              <Textarea
                id="co-notes"
                placeholder="أي تعليمات خاصة بالطلب..."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
            </div>

            {/* Payment Notice */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
              <Wallet className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">طريقة الدفع</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  الدفع عند الاستلام — سيتم التنسيق النهائي بين الزبون والمتجر عبر واتساب بعد إرسال الطلب.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3 border-t pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button className="flex-1 gap-2" onClick={handleSubmitOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> جاري الإرسال...</>
              ) : (
                <><Phone className="h-4 w-4" /> إرسال عبر واتساب</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
