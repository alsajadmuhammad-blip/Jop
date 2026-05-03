"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "@/components/cart/cart-sheet";

export default function CartPage() {
  const { items, totalPrice } = useCart();

  // show cart sheet trigger with summary
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">سلة الشراء</h1>
      <div className="mb-4">
        {!items.length ? (
          <p className="text-muted-foreground mb-8">سلة مشترياتك فارغة حالياً.</p>
        ) : (
          <p className="mb-4">عدد العناصر: {items.length} — الإجمالي: {totalPrice.toLocaleString()} د.ع</p>
        )}
        <CartSheet>
          <Button size="lg">فتح السلة</Button>
        </CartSheet>
      </div>
      {!items.length && (
        <Button asChild>
          <Link href="/search">تسوق الآن</Link>
        </Button>
      )}
    </div>
  );
}
