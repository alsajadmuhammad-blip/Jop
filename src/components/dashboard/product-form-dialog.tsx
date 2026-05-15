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
  onSave: (data: Omit<Product, "id" | "storeId"> & { imageFile?: File | null }) => void;
  product?: Product;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductFormDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
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

  useEffect(() => {
    async function fetchCategories() {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    }
    fetchCategories();
  }, []);

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

  const onSubmit = (data: ProductFormValues) => {
    onSave({ ...data, imageFile });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] w-[95vw] mx-auto bg-white rounded-2xl shadow-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-4 pr-2 -mr-2">
              <motion.div
                className="space-y-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">اسم المنتج</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: هاتف X1 برو" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">الوصف</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="وصف تفصيلي للمنتج"
                          {...field}
                          className="text-sm resize-none h-20"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-400 mt-1 text-left">
                        {field.value?.length || 0} / 500
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">السعر (د.ع)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                            className="text-sm"
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
                        <FormLabel className="text-sm">الفئة</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="اختر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-sm">
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

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">صورة المنتج</FormLabel>
                      {imagePreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full relative aspect-square rounded-lg overflow-hidden border"
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
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium border bg-gray-50 hover:bg-gray-100 h-9 px-3 w-full transition"
                            >
                              <Upload className="ml-1 h-3 w-3" />
                              <span>
                                {imagePreview ? "تغيير" : "رفع صورة"}
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
            </div>

            <div className="flex gap-2 pt-3 border-t mt-auto flex-shrink-0 px-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 text-sm"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1 text-sm"
              >
                {form.formState.isSubmitting ? "جاري..." : "حفظ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
