
"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Store } from "@/lib/types";
import { uploadStoreAsset } from "@/services/supabase-db";

interface CoverImageUploaderProps {
  store: Store;
  onSave: (newCoverUrl: string) => Promise<void>;
}

export function CoverImageUploader({ store, onSave }: CoverImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(store.coverImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!imagePreview) return;
    setIsSaving(true);
    let finalUrl = imagePreview;

    try {
      if (selectedFile) {
        const uploadedUrl = await uploadStoreAsset(selectedFile, 'store-assets');
        if (uploadedUrl) {
          finalUrl = uploadedUrl;
        }
      }

      await onSave(finalUrl);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to save cover image:', error);
      alert(error?.message || 'فشل حفظ صورة الغلاف. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center text-xs rounded-md"
        >
          <ImageIcon className="ml-2 h-4 w-4" />
          تغيير صورة الغلاف
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>تحديث صورة الغلاف</DialogTitle>
          <DialogDescription>
            ارفع صورة جديدة كغلاف لصفحة متجرك الرئيسية.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Label>معاينة الغلاف</Label>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  {imagePreview.startsWith('data:') ? (
                    <img
                      src={imagePreview}
                      alt="معاينة الغلاف"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Image
                      src={imagePreview}
                      alt="معاينة الغلاف"
                      fill
                      className="object-cover"
                      sizes="50vw"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
             {!imagePreview && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-10 h-10"/>
                </div>
             )}
          </div>
          <Input
            id="cover-image-upload-dialog"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={!imagePreview || isSaving}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
