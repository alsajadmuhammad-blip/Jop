
"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Store } from "@/lib/types";
import { uploadStoreCover } from "@/services/supabase-storage";

interface CoverImageUploaderProps {
  store: Store;
  onSave: (newCoverUrl: string) => Promise<void>;
}

export function CoverImageUploader({ store, onSave }: CoverImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(store.coverImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        setError('يجب اختيار ملف صورة');
        return;
      }
      
      // التحقق من الحجم (10MB للأغلفة)
      if (file.size > 10 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً. الحد الأقصى 10MB');
        return;
      }

      setError(null);
      setSuccess(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!imagePreview || !selectedFile) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // رفع صورة الغلاف إلى Supabase Storage
      const result = await uploadStoreCover(selectedFile, store.id);
      
      if (!result.success) {
        setError(result.error || 'فشل رفع صورة الغلاف. حاول مرة أخرى.');
        return;
      }

      if (!result.url) {
        setError('لم يتم الحصول على رابط صورة الغلاف');
        return;
      }

      // حفظ الرابط في قاعدة البيانات
      await onSave(result.url);
      setSuccess(true);
      
      // إغلاق الحوار بعد ثانية
      setTimeout(() => {
        setIsOpen(false);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to save cover image:', error);
      setError(error?.message || 'حدث خطأ غير متوقع');
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

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="py-2 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">تم حفظ صورة الغلاف بنجاح!</AlertDescription>
          </Alert>
        )}

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
          <div className="grid w-full items-center gap-1">
            <Label htmlFor="cover-image-upload-dialog">اختر الصورة</Label>
            <Input
              id="cover-image-upload-dialog"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
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
