
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Product, Category } from "@/lib/types";
import { getCategories } from "@/services/data";
import { productFormSchema } from "@/lib/validations";

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, "id" | "storeId">) => void;
  product?: Product;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductFormDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: "",
    },
  });

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    }
    fetchCategories();
  }, []);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      if (product) {
        form.reset({
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
        });
        setImagePreview(product.imageUrl || null);
      } else {
        form.reset({
          name: "",
          description: "",
          price: 0,
          imageUrl: "",
          categoryId: "",
        });
        setImagePreview(null);
      }
    }
  }, [product, form, isOpen]);

  // Handle image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    onSave(data as Omit<Product, "id" | "storeId">);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[380px] w-full bg-white rounded-2xl shadow-lg max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            {product ? "تعديل المنتج" : "إضافة منتج جديد"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {product
              ? "قم بتحديث تفاصيل المنتج الخاص بك هنا."
              : "أضف منتجًا جديدًا إلى متجرك."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 min-h-0 overflow-y-auto px-1"
          >
            <motion.div
              className="space-y-4 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المنتج</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: هاتف X1 برو" {...field} />
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
                    <div className="flex items-center justify-between">
                      <FormLabel>الوصف</FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="وصف تفصيلي للمنتج ومميزاته"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-400 mt-1 text-left">
                      {field.value?.length || 0} / 500 حرف
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (د.ع)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1,250,000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر فئة المنتج" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Product Image */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صورة المنتج</FormLabel>
                    {imagePreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full relative aspect-square rounded-xl overflow-hidden border"
                      >
                        <Image
                          src={imagePreview}
                          alt="معاينة المنتج"
                          fill
                          className="object-cover"
                        />
                      </motion.div>
                    )}
                    <FormControl>
                      <div>
                        <Label
                          htmlFor="product-image-upload"
                          className="w-full inline-block cursor-pointer"
                        >
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium border bg-gray-50 hover:bg-gray-100 h-10 px-4 w-full transition"
                          >
                            <Upload className="ml-2 h-4 w-4" />
                            <span>
                              {imagePreview ? "تغيير الصورة" : "رفع صورة"}
                            </span>
                          </motion.div>
                        </Label>
                        <Input
                          id="product-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Buttons */}
            <DialogFooter className="sticky bottom-0 bg-white border-t pt-3 pb-2 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-[48%]"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-[48%] bg-primary text-white hover:bg-primary/90"
              >
                {form.formState.isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
