import { supabase } from './supabase';

export interface UploadFileOptions {
  bucket: 'product-images' | 'store-logos' | 'store-covers' | 'hero-carousel' | 'payment-proofs';
  file: File;
  path: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * التحقق من صحة الملف
 */
function validateFile(file: File, bucket: string): { valid: boolean; error?: string } {
  // التحقق من نوع الملف
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. يجب أن يكون الملف صورة (JPG, PNG, GIF, WEBP)' };
  }

  // التحقق من حجم الملف
  const maxSize = bucket === 'store-covers' || bucket === 'hero-carousel' 
    ? 10 * 1024 * 1024  // 10MB للأغلفة والشريط المتحرك
    : 5 * 1024 * 1024;   // 5MB للصور الأخرى

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `حجم الملف يتجاوز الحد المسموح (${maxSize / 1024 / 1024}MB)` 
    };
  }

  return { valid: true };
}

/**
 * توليد اسم فريد للملف
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${random}.${ext}`;
}

/**
 * رفع ملف إلى Supabase Storage
 * @param options خيارات الرفع
 * @returns النتيجة (نجاح/فشل + الرابط في حالة النجاح)
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  try {
    const { bucket, file, path } = options;

    // التحقق من الملف
    const validation = validateFile(file, bucket);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // التحقق من وجود متغيرات البيئة
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return { 
        success: false, 
        error: 'متغيرات البيئة غير مكتملة: NEXT_PUBLIC_SUPABASE_URL' 
      };
    }

    // رفع الملف
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // استبدال الملف إذا كان موجوداً
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      return { 
        success: false, 
        error: `خطأ في رفع الملف: ${error.message}` 
      };
    }

    // الحصول على رابط الملف العام
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    if (!urlData?.publicUrl) {
      return { 
        success: false, 
        error: 'فشل في الحصول على رابط الملف' 
      };
    }

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
    return { 
      success: false, 
      error: `خطأ في رفع الملف: ${errorMessage}` 
    };
  }
}

/**
 * حذف ملف من Supabase Storage
 */
export async function deleteFile(
  bucket: 'product-images' | 'store-logos' | 'store-covers' | 'hero-carousel' | 'payment-proofs',
  path: string
): Promise<UploadResult> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    
    if (error) {
      console.error('Supabase Delete Error:', error);
      return { 
        success: false, 
        error: `خطأ في حذف الملف: ${error.message}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
    return { 
      success: false, 
      error: `خطأ في حذف الملف: ${errorMessage}` 
    };
  }
}

/**
 * الحصول على رابط عام لملف
 */
export function getPublicUrl(
  bucket: 'product-images' | 'store-logos' | 'store-covers' | 'hero-carousel' | 'payment-proofs',
  path: string
): string {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  } catch (error) {
    console.error('Get URL error:', error);
    return '';
  }
}

/**
 * رفع صورة المنتج
 */
export async function uploadProductImage(file: File, productId: string): Promise<UploadResult> {
  const fileName = generateFileName(file.name);
  return uploadFile({
    bucket: 'product-images',
    file,
    path: `products/${productId}/${fileName}`,
  });
}

export async function uploadProductImageForStore(file: File, storeId: string): Promise<UploadResult> {
  const fileName = generateFileName(file.name);
  return uploadFile({
    bucket: 'product-images',
    file,
    path: `stores/${storeId}/${fileName}`,
  });
}

/**
 * رفع شعار المتجر
 */
export async function uploadStoreLogo(file: File, storeId: string): Promise<UploadResult> {
  const fileName = generateFileName(file.name);
  return uploadFile({
    bucket: 'store-logos',
    file,
    path: `stores/${storeId}/${fileName}`,
  });
}

/**
 * رفع صورة غلاف المتجر
 */
export async function uploadStoreCover(file: File, storeId: string): Promise<UploadResult> {
  const fileName = generateFileName(file.name);
  return uploadFile({
    bucket: 'store-covers',
    file,
    path: `stores/${storeId}/${fileName}`,
  });
}

/**
 * رفع صورة الشريط المتحرك
 */
export async function uploadHeroCarouselImage(file: File): Promise<UploadResult> {
  const fileName = generateFileName(file.name);
  return uploadFile({
    bucket: 'hero-carousel',
    file,
    path: `carousel/${fileName}`,
  });
}

/**
 * رفع إثبات الدفع
 */
export async function uploadPaymentProof(file: File, storeId: string): Promise<UploadResult> {
  const fileName = generateFileName(file.name);
  return uploadFile({
    bucket: 'payment-proofs',
    file,
    path: `payment-proofs/${storeId}/${fileName}`,
  });
}

/**
 * حذف صورة المنتج
 */
export async function deleteProductImage(path: string): Promise<UploadResult> {
  return deleteFile('product-images', path);
}

/**
 * حذف شعار المتجر
 */
export async function deleteStoreLogo(path: string): Promise<UploadResult> {
  return deleteFile('store-logos', path);
}

/**
 * حذف صورة غلاف المتجر
 */
export async function deleteStoreCover(path: string): Promise<UploadResult> {
  return deleteFile('store-covers', path);
}

/**
 * حذف صورة الشريط المتحرك
 */
export async function deleteHeroCarouselImage(path: string): Promise<UploadResult> {
  return deleteFile('hero-carousel', path);
}

/**
 * حذف إثبات الدفع
 */
export async function deletePaymentProof(path: string): Promise<UploadResult> {
  return deleteFile('payment-proofs', path);
}
