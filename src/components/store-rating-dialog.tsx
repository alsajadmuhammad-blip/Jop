
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoreRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  storeName: string;
}

export function StoreRatingDialog({ isOpen, onClose, onSubmit, storeName }: StoreRatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating);
      // Reset state after submission
      setRating(0);
      setHoverRating(0);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setRating(0);
    setHoverRating(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تقييم متجر "{storeName}"</DialogTitle>
          <DialogDescription>
            شاركنا رأيك لمساعدة الآخرين. اختر تقييمك من 1 إلى 5 نجوم.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-center gap-2 mb-4" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-8 w-8 cursor-pointer transition-colors",
                  (hoverRating >= star || rating >= star)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0}>
            إرسال التقييم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
