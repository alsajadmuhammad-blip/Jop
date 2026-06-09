"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Image from "next/image";
import type { Product, Section } from "@/lib/types";
import { productFormSchema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { fetchStoreSections, fetchProductsByStore, createProduct, updateProduct } from "@/services/supabase-db";
import { uploadProductImageForStore } from "@/services/supabase-storage";

type ProductFormValues = z.infer<typeof productFormSchema>;

function AddProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const productId = searchParams.get("id");
  const [sections, setSections] = useState<Section[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      sku: "",
      stock: 0,
      imageUrl: "",
      sectionId: "",
    },
  });

  // Load sections and product data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.storeId) {
        toast({ title: "خطأ", description: "لم يتم العثور على معرف المتجر", variant: "destructive" });
        router.push("/dashboard/store");
        return;
      }

      try {
        const sectionsData = await fetchStoreSections(user.storeId);
        setSections(sectionsData);

        if (productId) {
          const productsData = await fetchProductsByStore(user.storeId);
          const product = productsData.find((p) => p.id === productId);
          if (product) {
            setEditingProduct(product);
            form.reset({
              name: product.name,
              description: product.description,
              price: product.price,
              sku: product.sku || "",
              stock: product.stock || 0,
              imageUrl: product.imageUrl,
              sectionId: product.sectionId || "",
            });
            setImagePreview(product.imageUrl || null);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({ title: "خطأ", description: "فشل تحميل البيانات", variant: "destructive" });
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [user, productId, form, router, toast]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!user?.storeId) {
      toast({ title: "خطأ", description: "لم يتم العثور على معرف المتجر", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = data.imageUrl;

      // Upload image if a new file is selected
      if (imageFile) {
        const uploadResult = await uploadProductImageForStore(imageFile, user.storeId);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "فشل رفع صورة المنتج");
        }
        imageUrl = uploadResult.url || imageUrl;
      }

      if (editingProduct) {
        // Update existing product
        const updated = await updateProduct(editingProduct.id, {
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: imageUrl || editingProduct.imageUrl,
          sectionId: data.sectionId,
          sku: data.sku,
          stock: data.stock,
        });

        if (!updated) throw new Error("فشل تحديث المنتج");
        toast({ title: "✓ تم تحديث المنتج بنجاح" });
      } else {
        // Create new product
        const created = await createProduct({
          name: data.name,
          description: data.description,
          price: data.price,
          sectionId: data.sectionId,
          sku: data.sku,
          stock: data.stock,
          imageUrl: imageUrl || undefined,
          storeId: user.storeId,
        });

        if (!created) throw new Error("فشل إضافة المنتج");
        toast({ title: "✓ تمت إضافة المنتج بنجاح" });
      }

      // Redirect back after 1 second
      setTimeout(() => {
        router.push("/dashboard/store?tab=products");
      }, 800);
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
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
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
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-600 font-medium">جاري تحميل البيانات...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
                        defaultValue={field.value}
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

                {/* Product Image */}
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">
                        صورة المنتج
                      </FormLabel>
                      <AnimatePresence>
                        {imagePreview && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full rounded-xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-slate-50 to-slate-100"
                          >
                            <div className="relative aspect-square">
                              <Image
                                src={imagePreview}
                                alt="معاينة المنتج"
                                fill
                                className="object-cover"
                              />
                            </div>
                            {!isLoading && (
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview(null);
                                  setImageFile(null);
                                  form.setValue("imageUrl", "");
                                }}
                                className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 transition"
                              >
                                ✕
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <FormControl>
                        <div>
                          <Label
                            htmlFor="product-image-upload"
                            className="w-full inline-block cursor-pointer"
                          >
                            <motion.div
                              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
                              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
                              className="relative group inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl text-base font-semibold border-2 border-dashed border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 h-20 px-6 w-full transition-all duration-200"
                              style={{
                                pointerEvents: isLoading ? "none" : "auto",
                                opacity: isLoading ? 0.6 : 1,
                              }}
                            >
                              <Upload className="w-5 h-5 text-primary" />
                              <span className="text-primary">
                                {imagePreview ? "تغيير الصورة" : "رفع صورة المنتج"}
                              </span>
                            </motion.div>
                          </Label>
                          <Input
                            id="product-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                        <span>جاري الحفظ...</span>
                      </motion.div>
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
          </motion.div>
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
