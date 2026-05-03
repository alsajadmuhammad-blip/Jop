
"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "./cart-sheet";

export function CartSheetButton() {
  const { items } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartSheet>
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {totalCartItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs"
          >
            {totalCartItems}
          </Badge>
        )}
        <span className="sr-only">Shopping Cart</span>
      </Button>
    </CartSheet>
  );
}

