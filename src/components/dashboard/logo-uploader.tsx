"use client";

import { useState } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Store } from "@/lib/types";
import { uploadStoreLogo } from "@/services/supabase-storage";

interface LogoUploaderProps {
  store: Store;
  onSave: (newLogoUrl: string) => Promise<void>;
}



export function LogoUploader({ store, onSave }: LogoUploaderProps) {
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
      setSelectedFile(file);
      handleSave(file);
    }
  };

  const handleSave = async (file: File) => {
    if (!file) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // رفع الشعار إلى Supabase Storage
      const result = await uploadStoreLogo(file, store.id);
      
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
      
      // إعادة تعيين بعد ثانية
      setTimeout(() => {
        setSelectedFile(null);
        setError(null);
        setSuccess(false);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to save logo:', error);
      setError(error?.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold">شعار المتجر</Label>
      <label htmlFor="logo-upload" className="w-full block">
        <div
          className="inline-flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 px-4 py-3 text-sm font-semibold transition-all cursor-pointer w-full gap-2"
        >
          <Upload className="h-4 w-4" />
          تحديث الشعار
        </div>
      </label>
      <Input
        id="logo-upload"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        disabled={isSaving}
      />
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs">
            تم حفظ الشعار بنجاح!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
