"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { StoreCard } from "@/components/store-card";
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
import { uploadStoreLogo } from "@/services/supabase-storage";
import { Card, CardContent } from "../ui/card";

interface LogoUploaderProps {
  store: Store;
  onSave: (newLogoUrl: string) => Promise<void>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } },
};

export function LogoUploader({ store, onSave }: LogoUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(store.logoUrl || null);
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
      
      // التحقق من الحجم (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً. الحد الأقصى 5MB');
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
      // رفع الشعار إلى Supabase Storage
      const result = await uploadStoreLogo(selectedFile, store.id);
      
      if (!result.success) {
        setError(result.error || 'فشل رفع الشعار. حاول مرة أخرى.');
        return;
      }

      if (!result.url) {
        setError('لم يتم الحصول على رابط الشعار');
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
      console.error('Failed to save logo:', error);
      setError(error?.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsSaving(false);
    }
  };

  const storeWithPreview: Store = {
    ...store,
    logoUrl: imagePreview || store.logoUrl,
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="space-y-1">
          <Label className="text-sm">شعار المتجر</Label>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center text-xs rounded-md"
          >
            <Upload className="ml-2 h-4 w-4" />
            تغيير الشعار
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xs w-full bg-white rounded-xl shadow-md p-3 border">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">تحديث شعار المتجر</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            ارفع صورة جديدة لشعار متجرك. هكذا سيظهر للزبائن.
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
            <AlertDescription className="text-xs">تم حفظ الشعار بنجاح!</AlertDescription>
          </Alert>
        )}

        <motion.div
          className="grid grid-cols-1 gap-3 py-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* رفع صورة */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <Card className="shadow-sm bg-white rounded-lg border">
              <CardContent className="p-3 space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm">رفع صورة</h3>
                <div className="grid w-full max-w-[150px] items-center gap-1">
                  <Label htmlFor="logo-upload-dialog" className="w-full inline-block cursor-pointer">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center justify-center rounded-md border h-8 px-2 text-xs font-medium transition-colors bg-gray-50 hover:bg-gray-100 w-full"
                    >
                      <Upload className="ml-1 h-3.5 w-3.5" />
                      <span>اختر صورة</span>
                    </motion.div>
                  </Label>
                  <Input
                    id="logo-upload-dialog"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSaving}
                  />
                </div>

                {imagePreview && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="relative aspect-square w-24 mx-auto rounded-lg overflow-hidden border border-gray-300"
                    >
                      {imagePreview.startsWith('data:') ? (
                        <img
                          src={imagePreview}
                          alt="معاينة الشعار"
                          className="object-contain rounded-md w-full h-full"
                        />
                      ) : (
                        <Image
                          src={imagePreview}
                          alt="معاينة الشعار"
                          fill
                          className="object-contain rounded-md"
                          sizes="(max-width: 768px) 70vw, 160px"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* المعاينة */}
          <motion.div className="space-y-2" variants={itemVariants}>
            <h3 className="font-semibold text-gray-800 text-sm">معاينة حية</h3>
            <motion.div
              className="mx-auto w-full max-w-[120px]"
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <StoreCard store={storeWithPreview} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* الأزرار */}
        <DialogFooter className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1 rounded-md"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            إلغاء
          </Button>
          <Button
            size="sm"
            className="text-xs px-3 py-1 rounded-md"
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
