
"use client";

import Image from "next/image";
import { ReactNode, useState } from "react";
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
import { Trash2, ShoppingCart, Minus, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, OrderItem } from "@/lib/types";
import { createOrder } from "@/services/orders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    storeId: string;
    storeName: string;
    whatsappNumber: string;
    storeItems: CartItem[];
  } | null>(null);
  
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckoutClick = (storeId: string, storeName: string, whatsappNumber: string, storeItems: CartItem[]) => {
    if (storeItems.length === 0) {
      toast({
        variant: "destructive",
        title: "السلة فارغة",
        description: "الرجاء إضافة منتجات إلى السلة أولاً.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "يجب تسجيل الدخول",
        description: "الرجاء تسجيل الدخول أولاً للمتابعة.",
      });
      return;
    }

    setCheckoutData({ storeId, storeName, whatsappNumber, storeItems });
    setIsCheckoutDialogOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!checkoutData || !user) return;

    if (!customerPhone.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال رقم الهاتف.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert CartItems to OrderItems
      const orderItems: OrderItem[] = checkoutData.storeItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      }));

      // Calculate store total
      const storeTotalPrice = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // Create order in Supabase
      const order = await createOrder(
        checkoutData.storeId,
        checkoutData.storeName,
        user.id,
        user.name,
        customerPhone,
        orderItems,
        storeTotalPrice,
        orderNotes
      );

      if (!order) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في إنشاء الطلب. الرجاء المحاولة مرة أخرى.",
        });
        setIsSubmitting(false);
        return;
      }

      // Build WhatsApp message
      let message = `*طلب جديد من منصة مركزي*\n\n`;
      message += `*رقم الطلب:* ${order.id}\n`;
      message += `*اسم العميل:* ${user.name || "عميل"}\n`;
      message += `*رقم الهاتف:* ${customerPhone}\n`;
      message += `*التاريخ:* ${new Date(order.createdAt).toLocaleString("ar-EG")}\n\n`;
      
      message += `*المنتجات:*\n`;
      checkoutData.storeItems.forEach((item) => {
        message += `• ${item.product.name}\n`;
        message += `  الكمية: ${item.quantity} × ${item.product.price.toLocaleString()} د.ع = ${(item.product.price * item.quantity).toLocaleString()} د.ع\n`;
      });
      
      message += `\n*الإجمالي:* ${storeTotalPrice.toLocaleString()} د.ع\n`;
      
      if (orderNotes) {
        message += `\n*ملاحظات:* ${orderNotes}\n`;
      }
      
      message += `\n📱 تابع الطلب عبر التطبيق: مركزي`;

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${checkoutData.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      // Remove items from cart
      checkoutData.storeItems.forEach((item) => removeItem(item.product.id));

      // Reset form
      setIsCheckoutDialogOpen(false);
      setCustomerPhone("");
      setOrderNotes("");

      toast({
        title: "تم إنشاء الطلب بنجاح ✓",
        description: `سيتم توجيهك إلى واتساب ${checkoutData.storeName}. يمكنك تتبع الطلب من صفحة "طلباتي".`,
      });
    } catch (error) {
        console.error("Error submitting order:", error);
        const message = error instanceof Error ? error.message : 'حدث خطأ في معالجة الطلب.';
        toast({
          variant: "destructive",
          title: "خطأ",
          description: message,
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
            <SheetDescription>
              المنتجات التي أضفتها مؤخراً.
            </SheetDescription>
          </SheetHeader>
          <Separator />
          {items.length > 0 ? (
            <>
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">
                  {items.map((item) => (
                      <div key={item.product.id} className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                            {item.product.imageUrl ? (
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-muted-foreground"/>
                            )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <h4 className="font-semibold">{item.product.name}</h4>
                            <p className="text-sm font-bold">
                              {item.product.price.toLocaleString()} د.ع
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-1">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}>
                                      <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                      type="number"
                                      value={item.quantity}
                                      min={1}
                                      max={item.product.stock}
                                      onChange={(e) => updateItemQuantity(item.product.id, Math.max(1, Math.min(item.product.stock, parseInt(e.target.value) || 1)))}
                                      className="h-7 w-12 text-center"
                                  />
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
                                      <Plus className="h-3 w-3" />
                                  </Button>
                               </div>
                               <p className="text-[11px] text-muted-foreground">
                                 {item.product.stock > 0 ? `المتبقي: ${item.product.stock} قطعة` : 'نفد المخزون'}
                               </p>
                             </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.product.id)}
                            >
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
                          <span>الإجمالي العام</span>
                          <span>{totalPrice.toLocaleString()} د.ع</span>
                      </div>

                      <div className="space-y-2">
                          {itemsByStore.map(([storeId, { storeName, whatsappNumber, items: storeItems }]) => (
                               <Button 
                                 key={storeId} 
                                 className="w-full" 
                                 size="lg" 
                                 onClick={() => handleCheckoutClick(storeId, storeName, whatsappNumber, storeItems)}
                               >
                                  إتمام الطلب من {storeName}
                              </Button>
                          ))}
                      </div>

                      <Button variant="outline" className="w-full" onClick={clearCart}>
                          إفراغ السلة بالكامل
                      </Button>
                  </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <ShoppingCart className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
              <h3 className="font-semibold text-xl">سلة التسوق فارغة</h3>
              <p className="text-muted-foreground">
                يبدو أنك لم تقم بإضافة أي منتجات حتى الآن.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>استكمال الطلب</DialogTitle>
            <DialogDescription>
              الرجاء إدخال بياناتك لاستكمال الطلب
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {checkoutData && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">{checkoutData.storeName}</h3>
                  <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                    {checkoutData.storeItems.map((item) => (
                      <div key={item.product.id} className="flex justify-between">
                        <span>{item.product.name} × {item.quantity}</span>
                        <span>{(item.product.price * item.quantity).toLocaleString()} د.ع</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 mt-2 flex justify-between font-semibold">
                      <span>الإجمالي:</span>
                      <span>
                        {checkoutData.storeItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toLocaleString()} د.ع
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    placeholder="مثال: 09xxxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    dir="ltr"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات (اختيارية)</Label>
                  <Textarea
                    id="notes"
                    placeholder="أضف أي ملاحظات على الطلب..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCheckoutDialogOpen(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                "إرسال الطلب"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

