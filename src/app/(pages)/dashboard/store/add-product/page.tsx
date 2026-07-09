"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, Loader2, Tag } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Product, Section } from "@/lib/types";
import { productFormSchema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { fetchStoreSections, createProduct, updateProduct } from "@/services/supabase-db";
import { uploadMultipleProductImagesForStore } from "@/services/supabase-storage";
import { supabase } from "@/services/supabase";
import {
  ProductImageUploader,
  buildImageItems,
  type ImageItem,
} from "@/components/product-image-uploader";

type ProductFormValues = z.infer<typeof productFormSchema>;

function AddProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const productId = searchParams.get("id");
  const [sections, setSections] = useState<Section[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // إذا انتهى تحميل المصادقة ولا يوجد storeId، أوقف شاشة التحميل
  useEffect(() => {
    if (!authLoading && !user?.storeId) {
      setPageLoading(false);
    }
  }, [authLoading, user?.storeId]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPercent: 0,
      sku: "",
      stock: 0,
      imageUrl: "",
      sectionId: "",
    },
  });

  // Load sections and product data
  useEffect(() => {
    if (authLoading || !user) return;

    const loadData = async () => {
      try {
        // 1. أولاً: sessionStorage — لوحة التحكم تحفظ المتجر هناك
        let storeId: string | null = null;
        try {
          const cached = sessionStorage.getItem(`store_${user.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            storeId = parsed?.id ?? null;
          }
        } catch { /* تجاهل */ }

        // 2. ثانياً: user.storeId من الـ auth hook
        if (!storeId) storeId = user.storeId ?? null;

        if (productId) {
          // جلب المنتج مباشرةً من قاعدة البيانات بمعرّفه
          const { data: productRow, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (productError || !productRow) {
            toast({ title: "خطأ", description: "لم يتم العثور على المنتج", variant: "destructive" });
            setPageLoading(false);
            return;
          }

          // 3. استخراج storeId من المنتج مباشرةً إن لم يكن متوفراً
          if (!storeId) {
            storeId = productRow.store_id || productRow.storeId || null;
          }

          // التحقق أن المنتج ينتمي لمتجر المستخدم
          const productStoreId = productRow.store_id || productRow.storeId;
          if (storeId && productStoreId && productStoreId !== storeId) {
            toast({ title: "خطأ", description: "لا تملك صلاحية تعديل هذا المنتج", variant: "destructive" });
            setPageLoading(false);
            return;
          }

          const rawDiscount = productRow.discount_percent ?? productRow.discountPercent ?? 0;
          const discount = Number(rawDiscount) > 0 ? Number(rawDiscount) : 0;

          // استخراج الصور الإضافية
          let extraImages: string[] = [];
          const rawImages = productRow.images;
          if (Array.isArray(rawImages)) {
            extraImages = rawImages.filter((u: unknown) => typeof u === 'string' && u.length > 0);
          } else if (typeof rawImages === 'string' && rawImages.startsWith('[')) {
            try { extraImages = JSON.parse(rawImages).filter((u: unknown) => typeof u === 'string'); } catch { /* ignore */ }
          }

          const product = {
            id: productRow.id,
            name: productRow.name,
            description: productRow.description || '',
            price: productRow.price,
            discountPercent: discount || undefined,
            imageUrl: productRow.image_url || productRow.imageUrl || '',
            images: extraImages.length > 0 ? extraImages : undefined,
            storeId: productRow.store_id || productRow.storeId || '',
            sectionId: productRow.section_id || productRow.sectionId || '',
            sku: productRow.sku || '',
            stock: typeof productRow.stock === 'number' ? productRow.stock : Number(productRow.stock ?? 0),
          };

          setEditingProduct(product);
          if (discount > 0) setDiscountEnabled(true);
          form.reset({
            name: product.name,
            description: product.description,
            price: product.price,
            discountPercent: discount,
            sku: product.sku || "",
            stock: product.stock || 0,
            imageUrl: product.imageUrl,
            sectionId: product.sectionId || "",
          });
          // بناء قائمة الصور للمحرر
          setImageItems(buildImageItems(product.imageUrl || undefined, product.images));
        }

        if (!storeId) {
          // 4. أخيراً: البحث في جدول المتاجر عبر المستخدم
          const { data: storeRows } = await supabase
            .from('stores')
            .select('id')
            .or(
              [
                user.id ? `owner_id.eq.${user.id}` : null,
                user.id ? `"ownerId".eq.${user.id}` : null,
                user.email ? `owner_email.eq.${user.email}` : null,
              ]
                .filter(Boolean)
                .join(',')
            )
            .limit(1);
          if (storeRows && storeRows[0]) storeId = storeRows[0].id;
        }

        if (!storeId) {
          toast({ title: "خطأ", description: "لم يتم العثور على متجر مرتبط بحسابك", variant: "destructive" });
          setPageLoading(false);
          return;
        }

        const sectionsData = await fetchStoreSections(storeId);
        setSections(sectionsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({ title: "خطأ", description: "فشل تحميل البيانات", variant: "destructive" });
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [authLoading, user, productId, form, toast]);

  const resolveStoreId = async (): Promise<string | null> => {
    // 1. من المنتج المحمّل — المصدر الأكثر موثوقية عند التعديل
    if (editingProduct?.storeId) return editingProduct.storeId;

    // 2. sessionStorage
    try {
      const cached = sessionStorage.getItem(`store_${user?.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id) return parsed.id;
      }
    } catch { /* تجاهل */ }

    // 3. user.storeId
    if (user?.storeId) return user.storeId;

    // 4. استعلام قاعدة البيانات من جدول المتاجر
    if (user?.id) {
      const { data: storeRows } = await supabase
        .from('stores')
        .select('id')
        .or(
          [
            `owner_id.eq.${user.id}`,
            `"ownerId".eq.${user.id}`,
          ].join(',')
        )
        .limit(1);
      if (storeRows && storeRows[0]) return storeRows[0].id;
    }

    return null;
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);
    try {
      const storeId = await resolveStoreId();
      if (!storeId) {
        toast({ title: "خطأ", description: "لم يتم العثور على متجر مرتبط بحسابك", variant: "destructive" });
        return;
      }

      // رفع الصور الجديدة (التي لديها file) إلى Supabase Storage
      const newFiles = imageItems.filter((i: ImageItem) => i.file).map((i: ImageItem) => i.file!);
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const { urls, errors } = await uploadMultipleProductImagesForStore(newFiles, storeId);
        if (errors.length > 0) throw new Error(errors[0]);
        uploadedUrls = urls;
      }

      // بناء القائمة النهائية للصور
      const finalUrls: string[] = [];
      let uploadIdx = 0;
      for (const item of imageItems) {
        if (item.file) {
          // صورة جديدة — استخدم الرابط المرفوع
          if (uploadedUrls[uploadIdx]) finalUrls.push(uploadedUrls[uploadIdx]);
          uploadIdx++;
        } else if (item.url) {
          // صورة سابقة — احتفظ بها
          finalUrls.push(item.url);
        }
      }

      const primaryImageUrl = finalUrls[0] || undefined;
      const extraImages = finalUrls.slice(1);

      const discountPercent = discountEnabled && data.discountPercent && data.discountPercent > 0
        ? data.discountPercent
        : 0;

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: data.name,
          description: data.description,
          price: data.price,
          discountPercent,
          imageUrl: primaryImageUrl ?? undefined,
          images: extraImages,
          sectionId: data.sectionId,
          sku: data.sku,
          stock: data.stock,
        });
        toast({ title: "✓ تم تحديث المنتج بنجاح" });
      } else {
        const created = await createProduct({
          name: data.name,
          description: data.description,
          price: data.price,
          discountPercent,
          sectionId: data.sectionId,
          sku: data.sku,
          stock: data.stock,
          imageUrl: primaryImageUrl,
          images: extraImages.length > 0 ? extraImages : undefined,
          storeId,
        });
        if (!created) throw new Error("فشل إضافة المنتج");
        toast({ title: "✓ تمت إضافة المنتج بنجاح" });
      }

      // مسح الـ cache في sessionStorage لإجبار لوحة التحكم على إعادة جلب البيانات الحديثة
      if (user?.id) {
        sessionStorage.removeItem(`products_${user.id}`);
        sessionStorage.removeItem(`store_${user.id}`);
        sessionStorage.removeItem(`sections_${user.id}`);
      }

      setTimeout(() => router.push("/dashboard/store?tab=products"), 800);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "فشل حفظ المنتج",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div style={{ top: 'var(--header-h, 56px)' }} className="sticky z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton href="/dashboard/store?tab=products" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {editingProduct
                  ? "حدّث تفاصيل المنتج الخاص بك"
                  : "أضف منتجاً جديداً إلى متجرك"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {pageLoading ? (
          <div
            className="flex flex-col items-center justify-center py-20"}}
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-600 font-medium">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div}}}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">
                        اسم المنتج
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: هاتف X1 برو"
                          {...field}
                          className="h-11 text-base rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SKU */}
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">
                        الكود / SKU
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: SKU-001"
                          {...field}
                          className="h-11 text-base rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">
                        الوصف
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="وصف تفصيلي للمنتج"
                          {...field}
                          className="text-base resize-none h-28 rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="text-xs text-slate-400 mt-2 text-left">
                        {field.value?.length || 0} / 500
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price and Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-900">
                          السعر (د.ع)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                            className="h-11 text-base rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-900">
                          الكمية المتاحة
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            min={0}
                            {...field}
                            className="h-11 text-base rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Discount */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Toggle header */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !discountEnabled;
                      setDiscountEnabled(next);
                      if (!next) form.setValue("discountPercent", 0);
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-semibold text-slate-800">إضافة خصم</span>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${discountEnabled ? "bg-rose-500" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${discountEnabled ? "right-0.5" : "left-0.5"}`} />
                    </div>
                  </button>

                  {/* Discount body */}
                  {discountEnabled && (
                    <div}}}}
                      className="p-4 space-y-4 border-t border-slate-200 bg-white"
                    >
                      <FormField
                        control={form.control}
                        name="discountPercent"
                        render={({ field }) => {
                          const percent = Number(field.value ?? 0);
                          const price = Number(form.watch("price") ?? 0);
                          const discountedPrice = price > 0 && percent > 0
                            ? Math.round(price * (1 - percent / 100))
                            : null;
                          return (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700">
                                نسبة الخصم
                              </FormLabel>
                              <div className="space-y-3">
                                {/* Slider */}
                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min={1}
                                    max={99}
                                    value={percent || 1}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    disabled={isLoading}
                                    className="flex-1 h-2 accent-rose-500 cursor-pointer"
                                  />
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 min-w-[70px]">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={99}
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        const v = Math.min(99, Math.max(1, Number(e.target.value)));
                                        field.onChange(v);
                                      }}
                                      disabled={isLoading}
                                      className="border-0 bg-transparent p-0 h-auto text-sm font-bold text-rose-600 w-10 focus-visible:ring-0"
                                    />
                                    <span className="text-sm font-bold text-rose-500">%</span>
                                  </div>
                                </div>

                                {/* Quick presets */}
                                <div className="flex flex-wrap gap-2">
                                  {[10, 15, 20, 25, 30, 50].map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => field.onChange(p)}
                                      disabled={isLoading}
                                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                        percent === p
                                          ? "bg-rose-500 text-white border-rose-500"
                                          : "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600"
                                      }`}
                                    >
                                      {p}%
                                    </button>
                                  ))}
                                </div>

                                {/* Price preview */}
                                {discountedPrice !== null && price > 0 && (
                                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3">
                                    <div className="flex-1">
                                      <p className="text-xs text-slate-400 mb-0.5">السعر الأصلي</p>
                                      <p className="text-sm font-medium text-slate-500 line-through">
                                        {price.toLocaleString()} د.ع
                                      </p>
                                    </div>
                                    <div className="text-slate-300 font-bold">←</div>
                                    <div className="flex-1 text-left">
                                      <p className="text-xs text-rose-400 mb-0.5">السعر بعد الخصم</p>
                                      <p className="text-base font-bold text-rose-600">
                                        {discountedPrice.toLocaleString()} د.ع
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Section */}
                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">
                        القسم
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 text-base rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="اختر قسمًا" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sections.length === 0 && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          ⚠️ أضف قسمًا أولاً قبل إضافة المنتج
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* صور المنتج — متعددة حتى 5 */}
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-900">
                    صور المنتج
                    <span className="text-xs font-normal text-slate-400 mr-2">
                      (حتى 5 صور — الأولى هي الرئيسية)
                    </span>
                  </p>
                  <ProductImageUploader
                    value={imageItems}
                    onChange={setImageItems}
                    disabled={isLoading}
                    maxImages={5}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-8 sticky bottom-0 bg-gradient-to-t from-white via-white to-white/90 backdrop-blur-sm -mx-4 px-4 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/store?tab=products")}
                    className="flex-1 h-11 text-base rounded-lg border-slate-200"
                    disabled={isLoading}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || sections.length === 0}
                    className="flex-1 h-11 text-base rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                  >
                    {isLoading ? (
                      <div
                        className="flex items-center gap-2"}}
                      >
                        <div}}
                        >
                          <Loader2 className="w-5 h-5" />
                        </div>
                        <span>جاري الحفظ...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>حفظ المنتج</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">جاري التحضير...</p>
        </div>
      </div>
    }>
      <AddProductPageContent />
    </Suspense>
  );
}
