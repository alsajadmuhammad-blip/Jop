"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRatingDialog } from "@/components/product-rating-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { submitProductRating } from "@/services/product-ratings";

interface ProductRatingWrapperProps {
  productId: string;
  productName: string;
  storeOwnerId: string | null;
  /** استدعاء اختياري بعد نجاح التقييم لتحديث الـ UI */
  onRated?: (newRating: number, newReviews: number) => void;
}

export function ProductRatingWrapper({
  productId,
  productName,
  storeOwnerId,
  onRated,
}: ProductRatingWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const isOwner = !!user?.id && user.id === storeOwnerId;
  const isAdmin = userRole === "admin";

  // صاحب المتجر لا يرى الزر أصلاً
  if (isOwner) return null;

  const handleOpen = () => {
    if (isAdmin) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا يمكن للمشرفين تقييم المنتجات.",
      });
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async (rating: number) => {
    const result = await submitProductRating(productId, rating);

    toast({
      title: "شكراً لتقييمك! ⭐",
      description: `تم إرسال تقييمك لـ "${productName}" بنجاح.`,
    });

    setIsOpen(false);
    onRated?.(result.newRating, result.newReviews);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        size="sm"
        variant={isAdmin ? "secondary" : "outline"}
        className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-amber-200 text-amber-700 hover:bg-amber-50"
        aria-label="تقييم المنتج"
      >
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        تقييم
      </Button>

      <ProductRatingDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        productName={productName}
      />
    </>
  );
}
